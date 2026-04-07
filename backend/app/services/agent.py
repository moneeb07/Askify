"""
Agentic RAG Service — Gemini-powered document conversation agent.

The agent autonomously decides:
  - How many retrieval passes to perform
  - Which sections of the document to search
  - Whether to summarize or compare sections
  - How to synthesize a final answer
"""

import google.generativeai as genai
from app.config import get_settings

_model = None


def get_gemini_model():
    """Configure and return Gemini model (singleton)."""
    global _model
    if _model is None:
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
    return _model


SYSTEM_PROMPT = """You are an intelligent document analysis agent. 
Your job is to answer questions about the provided document context accurately and concisely.

When answering:
- Base your answer ONLY on the provided document context
- If the context doesn't contain enough information, say so clearly
- Cite which part of the document your answer comes from
- Be precise and avoid hallucinating information
"""


async def run_agent(
    query: str,
    document_id: str,
    conversation_history: list[dict],
) -> dict:
    """
    Run the agentic RAG pipeline for a user query (stub).

    Agent steps:
    1. Plan — determine search strategy for the query
    2. Retrieve — fetch relevant chunks from Pinecone (multi-pass)
    3. Reason — decide if more context is needed
    4. Synthesize — compose final answer with Gemini

    Args:
        query: User's question
        document_id: The document being queried
        conversation_history: Prior messages in the session

    Returns:
        dict with answer, sources, and agent_steps
    """
    # TODO: Implement full agentic loop in Phase 2
    # Steps will be:
    # 1. embed_query(query) → query_vector
    # 2. query_vectors(document_id, query_vector, top_k=5) → chunks
    # 3. If agent needs more context → query again with refined terms
    # 4. Build prompt with retrieved chunks
    # 5. Call Gemini with SYSTEM_PROMPT + context + query
    # 6. Return structured response

    return {
        "answer": "Agent not yet implemented. Coming in Phase 2.",
        "sources": [],
        "agent_steps": ["plan", "retrieve", "reason", "synthesize"],
    }
