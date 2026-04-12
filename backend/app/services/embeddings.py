"""
Google Generative AI Embeddings Service
Generates vector embeddings for document chunks and queries
using Google's free embedding-001 model.
"""

from app.config import get_embeddings


async def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text chunks in batches.

    Uses GoogleGenerativeAIEmbeddings (models/embedding-001).
    Output dimension: 768.

    Args:
        chunks: List of text strings to embed

    Returns:
        List of embedding vectors (one per chunk)
    """
    embeddings_client = get_embeddings()
    
    all_embeddings = []
    batch_size = 10  # Google API can easily timeout on large payloads; batching fixes this
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        batch_embeddings = embeddings_client.embed_documents(batch)
        all_embeddings.extend(batch_embeddings)
        
    return all_embeddings


async def embed_query(query: str) -> list[float]:
    """
    Generate an embedding for a single search query.

    Args:
        query: The user's question

    Returns:
        Embedding vector (768-dim)
    """
    embeddings_client = get_embeddings()
    return embeddings_client.embed_query(query)
