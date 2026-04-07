"""
Voyage AI Embeddings Service
Generates vector embeddings for document chunks and queries.
"""

import voyageai
from app.config import get_settings

_client: voyageai.Client | None = None


def get_voyage_client() -> voyageai.Client:
    """Get or create a Voyage AI client (singleton)."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = voyageai.Client(api_key=settings.voyage_api_key)
    return _client


async def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text chunks (stub).

    Args:
        chunks: List of text strings to embed

    Returns:
        List of embedding vectors (one per chunk)
    """
    # TODO: Implement in Phase 2
    # client = get_voyage_client()
    # result = client.embed(chunks, model="voyage-large-2", input_type="document")
    # return result.embeddings
    return [[] for _ in chunks]


async def embed_query(query: str) -> list[float]:
    """
    Generate an embedding for a single search query (stub).

    Args:
        query: The user's question

    Returns:
        Embedding vector
    """
    # TODO: Implement in Phase 2
    # client = get_voyage_client()
    # result = client.embed([query], model="voyage-large-2", input_type="query")
    # return result.embeddings[0]
    return []
