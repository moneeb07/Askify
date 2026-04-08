"""
Askify — Pydantic Request / Response Models
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Documents ──────────────────────────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    document_id: str
    status: str = "pending"


class DocumentStatusResponse(BaseModel):
    document_id: str
    status: str


class DocumentMetadataResponse(BaseModel):
    id: str
    name: str
    size: Optional[int] = None
    chunk_count: int = 0
    created_at: str
    status: str


class DocumentDeleteResponse(BaseModel):
    deleted: bool


# ── Chat ───────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., description="Either 'user' or 'assistant'")
    content: str


class ChatAskRequest(BaseModel):
    document_id: str
    question: str
    history: list[ChatMessage] = []


class ChatSuggestRequest(BaseModel):
    document_id: str


class ChatSuggestResponse(BaseModel):
    suggestions: list[str]


# ── Agent ──────────────────────────────────────────────────────────────────────

class AgentRunRequest(BaseModel):
    document_id: str
    question: str
    history: list[ChatMessage] = []


class AgentSearchRequest(BaseModel):
    query: str
    document_id: str


class AgentSearchResponse(BaseModel):
    chunks: list[dict]


class AgentSummarizeRequest(BaseModel):
    document_id: str


class AgentSummarizeResponse(BaseModel):
    summary: dict
