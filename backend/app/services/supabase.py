"""
Supabase Client Service
Handles document metadata storage and file storage.
"""

from supabase import create_client, Client
from app.config import get_settings

_client: Client | None = None


def get_supabase() -> Client:
    """Get or create a Supabase client (singleton)."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


async def save_document_metadata(
    document_id: str,
    filename: str,
    file_url: str,
    file_type: str,
    chunk_count: int,
) -> dict:
    """Save document metadata to Supabase DB (stub)."""
    # TODO: Implement in Phase 2
    return {
        "id": document_id,
        "filename": filename,
        "file_url": file_url,
        "file_type": file_type,
        "chunk_count": chunk_count,
    }


async def get_document_metadata(document_id: str) -> dict | None:
    """Retrieve document metadata from Supabase DB (stub)."""
    # TODO: Implement in Phase 2
    return None


async def delete_document_metadata(document_id: str) -> bool:
    """Delete document metadata from Supabase DB (stub)."""
    # TODO: Implement in Phase 2
    return False


async def upload_file_to_storage(
    bucket: str,
    path: str,
    file_bytes: bytes,
    content_type: str,
) -> str:
    """Upload a file to Supabase Storage and return its public URL (stub)."""
    # TODO: Implement in Phase 2
    return f"https://placeholder.supabase.co/storage/v1/object/public/{bucket}/{path}"
