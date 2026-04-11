"""
Askify Backend Configuration
Loads environment variables via Pydantic BaseSettings.
Initializes singleton clients for Gemini, Embeddings, and Pinecone.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from pinecone import Pinecone


class Settings(BaseSettings):
    # ── Supabase ──
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # ── Pinecone ──
    pinecone_api_key: str = ""
    pinecone_index_name: str = "askify-docs"

    # ── Gemini ──
    gemini_api_key: str = ""
    groq_api_key: str = ""

    # ── App Config ──
    cors_origins: str = "http://localhost:3000"
    upload_max_size_mb: int = 10
    chunk_size: int = 500
    chunk_overlap: int = 50

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# ── Singleton Clients ──────────────────────────────────────────────────────────

_embeddings = None
_llm = None
_pinecone_client = None
_pinecone_index = None


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    global _embeddings
    if _embeddings is None:
        settings = get_settings()
        _embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.gemini_api_key,
        )
    return _embeddings


def get_llm() -> ChatGroq:
    """Get or create Groq LLM client (singleton)."""
    global _llm
    if _llm is None:
        settings = get_settings()
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            streaming=True,
            api_key=settings.groq_api_key,
        )
    return _llm


def get_pinecone_index():
    """Get or create Pinecone index connection (singleton)."""
    global _pinecone_client, _pinecone_index
    if _pinecone_index is None:
        settings = get_settings()
        _pinecone_client = Pinecone(api_key=settings.pinecone_api_key)
        _pinecone_index = _pinecone_client.Index(settings.pinecone_index_name)
    return _pinecone_index
