"""
Document Upload & Management Router
Handles file uploads, parsing, chunking, and indexing.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document (PDF, DOCX, TXT) for processing.

    Steps (to be implemented):
    1. Validate file type and size
    2. Upload file to Supabase Storage
    3. Parse document text
    4. Chunk text into segments
    5. Generate embeddings via Voyage AI
    6. Store vectors in Pinecone
    7. Save metadata to Supabase DB
    """
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, DOCX, TXT",
        )

    return {
        "message": "Document upload endpoint (stub)",
        "filename": file.filename,
        "content_type": file.content_type,
        "status": "not_implemented",
    }


@router.get("/{document_id}")
async def get_document(document_id: str):
    """Get document metadata by ID."""
    return {
        "message": "Document retrieval endpoint (stub)",
        "document_id": document_id,
        "status": "not_implemented",
    }


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its vectors."""
    return {
        "message": "Document deletion endpoint (stub)",
        "document_id": document_id,
        "status": "not_implemented",
    }
