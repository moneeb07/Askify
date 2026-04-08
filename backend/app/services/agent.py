"""
Agentic RAG Service — Multi-step reasoning with tool use.

The agent loop:
  1. Send query + tools to Gemini
  2. If Gemini requests a tool call → execute tool → feed result back
  3. Repeat until Gemini provides a final answer
  4. Stream 'thinking' events for each tool step, 'answer' events for the final response.

Tools:
  - search_document(query, document_id) — semantic search via Pinecone
  - summarize_document(document_id) — fetch top chunks and summarize
  - compare_sections(query_a, query_b, document_id) — retrieve two chunk sets for comparison
"""

import json
import logging
from typing import AsyncGenerator

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.config import get_llm
from app.services.embeddings import embed_query
from app.services.vector_store import query_vectors, fetch_top_chunks

logger = logging.getLogger(__name__)

MAX_AGENT_STEPS = 8  # Safety limit to prevent infinite loops

AGENT_SYSTEM_PROMPT = """You are an advanced document analysis agent called Askify.
You have access to tools to search and analyze documents. Use them to provide thorough, accurate answers.

Available tools:
1. search_document(query, document_id) — Performs semantic search on the document. Use when you need to find specific information.
2. summarize_document(document_id) — Gets an overview of the entire document. Use when asked for summaries or overviews.
3. compare_sections(query_a, query_b, document_id) — Searches for two different topics and compares them. Use when asked to compare or contrast.

Instructions:
- You MUST use at least one tool before answering.
- Think step by step about what information you need.
- If one search doesn't give enough info, try rephrasing or searching for related terms.
- Base your answer ONLY on tool results. Never hallucinate.
- When you have enough information, provide a comprehensive answer.

To use a tool, respond with a JSON object in this exact format:
{"tool": "tool_name", "args": {"arg1": "value1", "arg2": "value2"}}

When you're ready to give your final answer, just respond normally WITHOUT any tool JSON.
"""


# ── Tool Implementations ──────────────────────────────────────────────────────


async def tool_search_document(query: str, document_id: str) -> list[dict]:
    """Semantic search: embed query → query Pinecone → return top chunks."""
    query_embedding = await embed_query(query)
    chunks = await query_vectors(document_id, query_embedding, top_k=5)
    return chunks


async def tool_summarize_document(document_id: str) -> dict:
    """Fetch top chunks and generate a summary with Gemini."""
    chunks = await fetch_top_chunks(document_id, top_k=15)
    if not chunks:
        return {"overview": "No content found.", "key_points": [], "details": ""}

    context = "\n\n".join(c["text"] for c in chunks)
    llm = get_llm()

    prompt = f"""Based on the following document excerpts, provide a structured summary.
Return a JSON object with these keys:
- "overview": A 2-3 sentence overview
- "key_points": An array of 3-5 key bullet points
- "details": A paragraph with additional important details

Document excerpts:
{context}
"""
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    try:
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)
    except (json.JSONDecodeError, IndexError):
        return {
            "overview": response.content,
            "key_points": [],
            "details": "",
        }


async def tool_compare_sections(query_a: str, query_b: str, document_id: str) -> dict:
    """Search for two topics and return both chunk sets for comparison."""
    chunks_a = await tool_search_document(query_a, document_id)
    chunks_b = await tool_search_document(query_b, document_id)
    return {
        "section_a": {"query": query_a, "chunks": chunks_a},
        "section_b": {"query": query_b, "chunks": chunks_b},
    }


TOOL_REGISTRY = {
    "search_document": tool_search_document,
    "summarize_document": tool_summarize_document,
    "compare_sections": tool_compare_sections,
}


# ── Agent Loop ─────────────────────────────────────────────────────────────────


def parse_tool_call(text: str) -> dict | None:
    """
    Try to extract a tool call JSON from the model's response.
    Returns None if no valid tool call is found.
    """
    text = text.strip()

    # Handle markdown code blocks
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                try:
                    obj = json.loads(part)
                    if "tool" in obj:
                        return obj
                except json.JSONDecodeError:
                    continue

    # Try direct JSON parse
    if text.startswith("{"):
        try:
            obj = json.loads(text)
            if "tool" in obj:
                return obj
        except json.JSONDecodeError:
            pass

    # Look for JSON embedded in text
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            obj = json.loads(text[start:end])
            if "tool" in obj:
                return obj
        except json.JSONDecodeError:
            pass

    return None


async def run_agent(
    document_id: str,
    question: str,
    history: list[dict],
) -> AsyncGenerator[dict, None]:
    """
    Run the multi-step agent loop.

    Yields SSE events:
      - {"type": "thinking", "content": "..."} — emitted on each tool call step
      - {"type": "answer", "content": "..."} — emitted for final response tokens

    Args:
        document_id: The document being queried
        question: User's question
        history: Prior conversation messages
    """
    llm = get_llm()

    # Build initial messages
    messages = [SystemMessage(content=AGENT_SYSTEM_PROMPT)]

    for msg in history:
        if msg.get("role") == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg.get("role") == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=question))

    # Agent loop
    for step in range(MAX_AGENT_STEPS):
        # Get model response (non-streaming for tool detection)
        response = await llm.ainvoke(messages)
        response_text = response.content

        # Check if the model wants to use a tool
        tool_call = parse_tool_call(response_text)

        if tool_call is None:
            # No tool call → this is the final answer, stream it
            # Re-invoke with streaming for the final answer
            async for chunk in llm.astream(messages):
                if chunk.content:
                    yield {"type": "answer", "content": chunk.content}
            return

        # Execute the tool
        tool_name = tool_call.get("tool", "")
        tool_args = tool_call.get("args", {})

        yield {
            "type": "thinking",
            "content": f"Using tool: {tool_name}({json.dumps(tool_args)})",
        }

        tool_fn = TOOL_REGISTRY.get(tool_name)
        if tool_fn is None:
            # Unknown tool — tell the model
            messages.append(AIMessage(content=response_text))
            messages.append(HumanMessage(content=f"Error: Unknown tool '{tool_name}'. Available tools: {list(TOOL_REGISTRY.keys())}"))
            continue

        try:
            # Inject document_id if not provided
            if "document_id" not in tool_args:
                tool_args["document_id"] = document_id

            result = await tool_fn(**tool_args)

            yield {
                "type": "thinking",
                "content": f"Tool '{tool_name}' returned results.",
            }

            # Feed tool result back to the model
            messages.append(AIMessage(content=response_text))
            messages.append(
                HumanMessage(
                    content=f"Tool result for {tool_name}:\n```json\n{json.dumps(result, default=str)}\n```\n\nNow use this information to continue your analysis. If you have enough information, provide your final answer. Otherwise, use another tool."
                )
            )

        except Exception as e:
            logger.error(f"Tool execution failed: {tool_name}: {e}")
            messages.append(AIMessage(content=response_text))
            messages.append(HumanMessage(content=f"Tool error: {str(e)}. Try a different approach."))

    # If we exhausted all steps, provide what we have
    yield {
        "type": "thinking",
        "content": "Reached maximum reasoning steps. Providing best answer...",
    }

    messages.append(HumanMessage(content="You've used all available reasoning steps. Please provide the best answer you can with the information gathered so far."))
    async for chunk in llm.astream(messages):
        if chunk.content:
            yield {"type": "answer", "content": chunk.content}
