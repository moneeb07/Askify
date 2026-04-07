"""
Chat Router
Handles chat messages and agentic RAG conversations.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    document_id: str
    message: str
    conversation_history: list[dict] = []


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict] = []
    agent_steps: list[str] = []


@router.post("/", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest):
    """
    Send a message to chat with an uploaded document.

    Agent flow (to be implemented):
    1. Receive user query
    2. Agent decides search strategy
    3. Retrieve relevant chunks from Pinecone
    4. Agent may do multiple retrieval passes
    5. Synthesize answer with Gemini
    6. Return answer with source references
    """
    return ChatResponse(
        answer="Chat endpoint is a stub. Implementation coming in Phase 2.",
        sources=[],
        agent_steps=[
            "receive_query",
            "plan_search",
            "retrieve_chunks",
            "synthesize_answer",
        ],
    )
