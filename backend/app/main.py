"""
Askify Backend — Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import documents, chat

settings = get_settings()

app = FastAPI(
    title="Askify API",
    description="Intelligent document conversation API powered by agentic RAG",
    version="0.1.0",
)

# ── CORS Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


# ── Health Check ──
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "askify-api",
        "version": "0.1.0",
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Askify API",
        "docs": "/docs",
        "health": "/health",
    }
