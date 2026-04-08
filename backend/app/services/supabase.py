"""
Supabase Client Service
Handles document metadata CRUD and file storage operations.
"""

import logging
from datetime import datetime, timezone

from supabase import create_client, Client
from app.config import get_settings

logger = logging.getLogger(__name__)

_client: Client | None = None

STORAGE_BUCKET = "documents"
TABLE_NAME = "documents"


def get_supabase() -> Client:
    """Get or create a Supabase client (singleton)."""
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError(
                "Supabase credentials not configured. "
                "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file."
            )
        try:
            _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        except Exception as e:
            raise RuntimeError(f"Failed to connect to Supabase: {e}")
    return _client


# ── File Storage ───────────────────────────────────────────────────────────────


async def upload_file_to_storage(
    document_id: str,
    filename: str,
    file_bytes: bytes,
    content_type: str,
) -> str:
    """
    Upload a file to Supabase Storage.

    Returns:
        Public URL of the uploaded file
    """
    client = get_supabase()
    # Use document_id as folder to avoid collisions
    storage_path = f"{document_id}/{filename}"

    client.storage.from_(STORAGE_BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type},
    )

    # Get public URL
    public_url = client.storage.from_(STORAGE_BUCKET).get_public_url(storage_path)
    logger.info(f"Uploaded file to storage: {storage_path}")
    return public_url


async def delete_file_from_storage(document_id: str, filename: str) -> bool:
    """Delete a file from Supabase Storage."""
    client = get_supabase()
    storage_path = f"{document_id}/{filename}"

    try:
        client.storage.from_(STORAGE_BUCKET).remove([storage_path])
        logger.info(f"Deleted file from storage: {storage_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete file from storage: {e}")
        return False


# ── Document Metadata CRUD ─────────────────────────────────────────────────────


async def insert_document(
    document_id: str,
    filename: str,
    file_url: str,
    file_type: str,
    file_size: int | None = None,
) -> dict:
    """
    Insert a new document row with status 'pending'.

    Returns:
        The inserted row as a dict
    """
    client = get_supabase()

    row = {
        "id": document_id,
        "filename": filename,
        "file_url": file_url,
        "file_type": file_type,
        "file_size": file_size,
        "status": "pending",
        "chunk_count": 0,
    }

    result = client.table(TABLE_NAME).insert(row).execute()
    logger.info(f"Inserted document row: {document_id}")
    return result.data[0] if result.data else row


async def update_document_status(
    document_id: str,
    status: str,
    chunk_count: int | None = None,
) -> dict | None:
    """
    Update the processing status of a document.

    Args:
        document_id: Document UUID
        status: One of pending | processing | ready | failed
        chunk_count: Optional updated chunk count
    """
    client = get_supabase()

    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if chunk_count is not None:
        update_data["chunk_count"] = chunk_count

    result = (
        client.table(TABLE_NAME)
        .update(update_data)
        .eq("id", document_id)
        .execute()
    )
    logger.info(f"Updated document {document_id} status to '{status}'")
    return result.data[0] if result.data else None


async def get_document_metadata(document_id: str) -> dict | None:
    """Retrieve document metadata by ID."""
    client = get_supabase()

    result = (
        client.table(TABLE_NAME)
        .select("*")
        .eq("id", document_id)
        .execute()
    )
    return result.data[0] if result.data else None


async def delete_document_metadata(document_id: str) -> bool:
    """Delete a document row from the database."""
    client = get_supabase()

    try:
        client.table(TABLE_NAME).delete().eq("id", document_id).execute()
        logger.info(f"Deleted document row: {document_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete document row {document_id}: {e}")
        return False
