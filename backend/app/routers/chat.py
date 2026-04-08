"""
Chat Router
Handles simple RAG chat (ask) and question suggestions.
Uses Server-Sent Events (SSE) for streaming responses.
"""

import json
import logging

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.models import ChatAskRequest, ChatSuggestRequest, ChatSuggestResponse
from app.services.chat_service import ask_with_rag, suggest_questions
from app.services.supabase import get_document_metadata

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/ask")
async def chat_ask(request: ChatAskRequest):
    """
    Ask a question about an uploaded document.

    Uses simple RAG pipeline:
      question → embed → Pinecone top 5 → Gemini → streamed answer

    Returns: Server-Sent Events stream with:
      - event: token  → {"content": "..."} for each token
      - event: sources → {"content": [...]} with source chunks
      - event: done → signals end of stream
    """
    # Verify document exists and is ready
    doc = await get_document_metadata(request.document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("status") != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document is not ready for chat. Current status: {doc.get('status')}",
        )

    async def event_generator():
        try:
            history = [msg.model_dump() for msg in request.history]
            async for event in ask_with_rag(
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
            logger.error(f"Chat stream error: {e}", exc_info=True)
            yield {
                "event": "error",
                "data": json.dumps({"detail": str(e)}),
            }

    return EventSourceResponse(event_generator())


@router.post("/suggest", response_model=ChatSuggestResponse)
async def chat_suggest(request: ChatSuggestRequest):
    """
    Generate 3-4 opening questions based on the document content.

    Called when a document finishes processing to populate suggestion pills.
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

    try:
        suggestions = await suggest_questions(request.document_id)
        return ChatSuggestResponse(suggestions=suggestions)
    except Exception as e:
        logger.error(f"Suggest failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")
