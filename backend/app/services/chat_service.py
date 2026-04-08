"""
Chat Service — Simple RAG Pipeline

Linear pipeline (no agent loop):
  User question → embed → Pinecone retrieves top 5 chunks
  → chunks + history → Gemini prompt → streamed answer

Uses LangChain's ChatGoogleGenerativeAI for the LLM calls.
"""

import logging
from typing import AsyncGenerator

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.config import get_llm
from app.services.embeddings import embed_query
from app.services.vector_store import query_vectors, fetch_top_chunks

logger = logging.getLogger(__name__)


# ── System Prompt ──────────────────────────────────────────────────────────────

RAG_SYSTEM_PROMPT = """You are an intelligent document analysis assistant called Askify.
Your job is to answer questions about the provided document context accurately and concisely.

Rules:
- Base your answer ONLY on the provided document context below.
- If the context doesn't contain enough information to answer, say so clearly.
- Cite which part of the document your answer comes from when possible.
- Be precise, structured, and avoid hallucinating information.
- If the user asks something unrelated to the document, politely redirect them.

Document Context:
{context}
"""

SUGGEST_PROMPT = """Based on the following document excerpts, generate exactly 4 interesting and 
diverse opening questions that a user might want to ask about this document. 
The questions should cover different aspects of the document content.
Return ONLY a JSON array of strings, nothing else.

Document excerpts:
{context}

Example output format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?"]
"""


# ── RAG Ask (Streaming) ───────────────────────────────────────────────────────


async def ask_with_rag(
    document_id: str,
    question: str,
    history: list[dict],
) -> AsyncGenerator[dict, None]:
    """
    Run the simple RAG pipeline and stream the response.

    Yields dicts with:
      - {"type": "token", "content": "..."} for each streamed token
      - {"type": "sources", "content": [...]} as the final event with source chunks

    Args:
        document_id: The document to query
        question: User's question
        history: List of {"role": "...", "content": "..."} dicts
    """
    # Step 1: Embed the question
    query_embedding = await embed_query(question)

    # Step 2: Retrieve top 5 relevant chunks from Pinecone
    chunks = await query_vectors(document_id, query_embedding, top_k=5)
    context_text = "\n\n---\n\n".join(
        f"[Chunk {c['chunk_index']}] (relevance: {c['score']:.2f})\n{c['text']}"
        for c in chunks
    )

    # Step 3: Build message list with history
    messages = [SystemMessage(content=RAG_SYSTEM_PROMPT.format(context=context_text))]

    for msg in history:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    # Add the current question
    messages.append(HumanMessage(content=question))

    # Step 4: Stream response from Gemini
    llm = get_llm()
    async for chunk in llm.astream(messages):
        if chunk.content:
            yield {"type": "token", "content": chunk.content}

    # Step 5: Emit source references
    sources = [
        {
            "text": c["text"],
            "score": round(c["score"], 3),
            "chunk_index": c["chunk_index"],
        }
        for c in chunks
    ]
    yield {"type": "sources", "content": sources}


# ── Suggest Questions ──────────────────────────────────────────────────────────


async def suggest_questions(document_id: str) -> list[str]:
    """
    Generate 3-4 opening questions based on the document content.

    Fetches top chunks from Pinecone and asks Gemini to suggest questions.
    """
    import json

    # Fetch top chunks from the document
    chunks = await fetch_top_chunks(document_id, top_k=10)
    if not chunks:
        return ["What is this document about?"]

    context_text = "\n\n".join(c["text"] for c in chunks)

    llm = get_llm()
    messages = [HumanMessage(content=SUGGEST_PROMPT.format(context=context_text))]

    response = await llm.ainvoke(messages)

    # Parse the JSON array from the response
    try:
        response_text = response.content.strip()
        # Handle cases where model wraps in ```json ... ```
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            response_text = response_text.rsplit("```", 1)[0]
        suggestions = json.loads(response_text)
        if isinstance(suggestions, list):
            return suggestions[:4]
    except (json.JSONDecodeError, IndexError):
        logger.warning(f"Failed to parse suggestion response: {response.content}")

    return ["What is this document about?", "Summarize the key points.", "What are the main conclusions?"]
