"""
Agent Router
Handles multi-step reasoning (Deep Analysis mode) and tool endpoints.

Routes:
  POST /run          — Run the agent loop, streams thinking + answer via SSE
  POST /tools/search — Standalone semantic search tool
  POST /tools/summarize — Standalone summarization tool
"""

import json
import logging

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.models import (
    AgentRunRequest,
    AgentSearchRequest,
    AgentSearchResponse,
    AgentSummarizeRequest,
    AgentSummarizeResponse,
)
from app.services.agent import run_agent, tool_search_document, tool_summarize_document
from app.services.supabase import get_document_metadata

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/run")
async def agent_run(request: AgentRunRequest):
    """
    Run the multi-step agent for complex questions.

    Returns: Server-Sent Events stream with:
      - event: thinking → {"content": "..."} on each tool call step
      - event: answer   → {"content": "..."} for final response tokens
      - event: done     → signals end of stream
    """
    # Verify document exists and is ready
    doc = await get_document_metadata(request.document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("status") != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document is not ready. Current status: {doc.get('status')}",
        )

    async def event_generator():
        try:
            history = [msg.model_dump() for msg in request.history]
            async for event in run_agent(
                document_id=request.document_id,
                question=request.question,
                history=history,
            ):
                yield {
                    "event": event["type"],
                    "data": json.dumps(event["content"]),
                }
            yield {"event": "done", "data": "{}"}
        except Exception as e:
            logger.error(f"Agent stream error: {e}", exc_info=True)
            yield {
                "event": "error",
                "data": json.dumps({"detail": str(e)}),
            }

    return EventSourceResponse(event_generator())


@router.post("/tools/search", response_model=AgentSearchResponse)
async def agent_search(request: AgentSearchRequest):
    """
    Semantic search tool — find relevant chunks in a document.

    Embeds the query, searches Pinecone filtered by document_id,
    returns top K chunks with text and relevance score.
    """
    doc = await get_document_metadata(request.document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        chunks = await tool_search_document(request.query, request.document_id)
        return AgentSearchResponse(chunks=chunks)
    except Exception as e:
        logger.error(f"Agent search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tools/summarize", response_model=AgentSummarizeResponse)
async def agent_summarize(request: AgentSummarizeRequest):
    """
    Summarization tool — generate a structured summary of the document.

    Fetches top chunks from Pinecone and asks Gemini to summarize with
    overview, key points, and detailed sections.
    """
    doc = await get_document_metadata(request.document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        summary = await tool_summarize_document(request.document_id)
        return AgentSummarizeResponse(summary=summary)
    except Exception as e:
        logger.error(f"Agent summarize failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
