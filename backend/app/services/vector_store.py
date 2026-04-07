"""
Pinecone Vector Store Service
Handles storing and querying document chunk embeddings.
"""

from pinecone import Pinecone
from app.config import get_settings

_client: Pinecone | None = None


def get_pinecone() -> Pinecone:
    """Get or create a Pinecone client (singleton)."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = Pinecone(api_key=settings.pinecone_api_key)
    return _client


async def upsert_vectors(
    document_id: str,
    chunks: list[str],
    embeddings: list[list[float]],
) -> bool:
    """
    Store document chunk embeddings in Pinecone (stub).

    Args:
        document_id: Unique identifier for the document
        chunks: List of text chunks
        embeddings: Corresponding embedding vectors

    Returns:
        True on success
    """
    # TODO: Implement in Phase 2
    # vectors = [
    #     {
    #         "id": f"{document_id}_{i}",
    #         "values": embedding,
    #         "metadata": {"document_id": document_id, "chunk_text": chunk, "chunk_index": i},
    #     }
    #     for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    # ]
    # index = get_pinecone().Index(settings.pinecone_index_name)
    # index.upsert(vectors=vectors)
    return True


async def query_vectors(
    document_id: str,
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    """
    Query Pinecone for the most relevant chunks for a given embedding (stub).

    Returns:
        List of matches with chunk text and score
    """
    # TODO: Implement in Phase 2
    return []


async def delete_document_vectors(document_id: str) -> bool:
    """Delete all vectors for a document from Pinecone (stub)."""
    # TODO: Implement in Phase 2
    return True
