"""
Document Upload & Management Router
Handles file uploads, status polling, metadata, and deletion.
"""

import uuid
import logging

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks

from app.config import get_settings
from app.models import DocumentUploadResponse, DocumentStatusResponse, DocumentMetadataResponse, DocumentDeleteResponse
from app.services.supabase import (
    upload_file_to_storage,
    insert_document,
    get_document_metadata,
    update_document_status,
    delete_document_metadata,
    delete_file_from_storage,
)
from app.services.vector_store import delete_document_vectors
from app.services.document_processor import process_document

logger = logging.getLogger(__name__)
router = APIRouter()

# Map MIME types to our internal file type labels
MIME_TO_TYPE = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Upload a document (PDF, DOCX, TXT) for processing.

    1. Validate file type and size
    2. Upload file to Supabase Storage
    3. Insert document row with status 'pending'
    4. Trigger background processing pipeline
    5. Return document_id immediately
    """
    settings = get_settings()

    # Validate file type
    if file.content_type not in MIME_TO_TYPE:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, DOCX, TXT",
        )

    file_type = MIME_TO_TYPE[file.content_type]

    # Read file bytes
    file_bytes = await file.read()

    # Validate file size
    max_bytes = settings.upload_max_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.upload_max_size_mb}MB",
        )

    # Generate document ID
    document_id = str(uuid.uuid4())
    filename = file.filename or f"document.{file_type}"

    try:
        # Upload to Supabase Storage
        file_url = await upload_file_to_storage(
            document_id=document_id,
            filename=filename,
            file_bytes=file_bytes,
            content_type=file.content_type,
        )

        # Insert document row (status: pending)
        await insert_document(
            document_id=document_id,
            filename=filename,
            file_url=file_url,
            file_type=file_type,
            file_size=len(file_bytes),
        )

        # Trigger background processing
        background_tasks.add_task(
            process_document,
            document_id=document_id,
            file_bytes=file_bytes,
            file_type=file_type,
        )

        logger.info(f"Upload accepted for document {document_id} ({filename})")
        return DocumentUploadResponse(document_id=document_id, status="pending")

    except Exception as e:
        logger.error(f"Upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(document_id: str):
    """
    Poll document processing status.

    Returns status: pending | processing | ready | failed
    """
    doc = await get_document_metadata(document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentStatusResponse(
        document_id=document_id,
        status=doc.get("status", "pending"),
    )


@router.get("/{document_id}", response_model=DocumentMetadataResponse)
async def get_document(document_id: str):
    """Get full document metadata by ID."""
    doc = await get_document_metadata(document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentMetadataResponse(
        id=doc["id"],
        name=doc.get("filename", ""),
        size=doc.get("file_size"),
        chunk_count=doc.get("chunk_count", 0),
        created_at=str(doc.get("created_at", "")),
        status=doc.get("status", "pending"),
    )


@router.delete("/{document_id}", response_model=DocumentDeleteResponse)
async def delete_document(document_id: str):
    """
    Delete a document completely:
    1. Delete file from Supabase Storage
    2. Delete all vectors from Pinecone
    3. Delete metadata row from Postgres
    """
    doc = await get_document_metadata(document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    filename = doc.get("filename", "")

    # Delete from storage
    await delete_file_from_storage(document_id, filename)

    # Delete vectors from Pinecone
    await delete_document_vectors(document_id)

    # Delete DB row
    await delete_document_metadata(document_id)

    logger.info(f"Document {document_id} fully deleted")
    return DocumentDeleteResponse(deleted=True)
