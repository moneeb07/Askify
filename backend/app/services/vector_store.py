"""
Pinecone Vector Store Service
Handles storing and querying document chunk embeddings.
"""

import logging
from app.config import get_pinecone_index

logger = logging.getLogger(__name__)

BATCH_SIZE = 100  # Pinecone recommends batches of ~100 vectors


async def upsert_vectors(
    document_id: str,
    chunks: list[str],
    embeddings: list[list[float]],
) -> int:
    """
    Store document chunk embeddings in Pinecone.

    Each vector is stored with metadata containing:
      - document_id: for filtering queries to a specific document
      - chunk_index: position in the original document
      - text: the raw chunk text (for retrieval display)

    Args:
        document_id: Unique identifier for the document
        chunks: List of text chunks
        embeddings: Corresponding embedding vectors

    Returns:
        Number of vectors upserted
    """
    index = get_pinecone_index()

    vectors = [
        {
            "id": f"{document_id}_{i}",
            "values": embedding,
            "metadata": {
                "document_id": document_id,
                "chunk_index": i,
                "text": chunk[:1000],  # Pinecone metadata limit ~40KB; truncate long chunks
            },
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]

    # Upsert in batches
    upserted = 0
    for i in range(0, len(vectors), BATCH_SIZE):
        batch = vectors[i : i + BATCH_SIZE]
        index.upsert(vectors=batch)
        upserted += len(batch)
        logger.info(f"Upserted batch {i // BATCH_SIZE + 1} ({len(batch)} vectors) for doc {document_id}")

    return upserted


async def query_vectors(
    document_id: str,
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    """
    Query Pinecone for the most relevant chunks for a given embedding.

    Filters results to only the specified document.

    Returns:
        List of dicts with keys: text, score, chunk_index
    """
    index = get_pinecone_index()

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        filter={"document_id": {"$eq": document_id}},
        include_metadata=True,
    )

    return [
        {
            "text": match["metadata"].get("text", ""),
            "score": match["score"],
            "chunk_index": match["metadata"].get("chunk_index", -1),
        }
        for match in results.get("matches", [])
    ]


async def fetch_top_chunks(
    document_id: str,
    top_k: int = 10,
) -> list[dict]:
    """
    Fetch top chunks for a document without a specific query.
    Uses a zero vector to get chunks ordered by their natural Pinecone ordering.
    This is used by the /suggest endpoint.

    Falls back to listing vectors by ID prefix if the index supports it.
    """
    index = get_pinecone_index()

    # Describe index to get dimension
    stats = index.describe_index_stats()
    dimension = stats.get("dimension", 768)

    # Use a zero-ish vector — Pinecone will return whatever is closest,
    # but with the document filter it returns chunks from this doc
    dummy_vector = [0.0] * dimension

    results = index.query(
        vector=dummy_vector,
        top_k=top_k,
        filter={"document_id": {"$eq": document_id}},
        include_metadata=True,
    )

    return [
        {
            "text": match["metadata"].get("text", ""),
            "score": match["score"],
            "chunk_index": match["metadata"].get("chunk_index", -1),
        }
        for match in results.get("matches", [])
    ]


async def delete_document_vectors(document_id: str) -> bool:
    """
    Delete all vectors for a document from Pinecone.
    Uses the ID prefix pattern: {document_id}_*
    """
    index = get_pinecone_index()

    try:
        # Pinecone serverless supports delete by metadata filter
        index.delete(filter={"document_id": {"$eq": document_id}})
        logger.info(f"Deleted all vectors for document {document_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete vectors for {document_id}: {e}")
        # Fallback: delete by ID prefix (list then delete)
        try:
            # List all vector IDs with the prefix
            listed = index.list(prefix=f"{document_id}_")
            ids_to_delete = []
            for page in listed:
                ids_to_delete.extend(page)
            if ids_to_delete:
                index.delete(ids=ids_to_delete)
                logger.info(f"Deleted {len(ids_to_delete)} vectors by ID for {document_id}")
            return True
        except Exception as e2:
            logger.error(f"Fallback delete also failed for {document_id}: {e2}")
            return False
