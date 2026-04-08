"""
Document Processing Pipeline (Background Task)

Runs as a FastAPI BackgroundTask after file upload:
1. Update status to 'processing'
2. Parse file text (PDF / DOCX / TXT)
3. Chunk text with RecursiveCharacterTextSplitter
4. Embed all chunks via Google embedding-001
5. Upsert vectors into Pinecone
6. Update status to 'ready' (or 'failed' on error)
"""

import io
import logging
from typing import Optional

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings
from app.services.embeddings import embed_chunks
from app.services.vector_store import upsert_vectors
from app.services.supabase import update_document_status

logger = logging.getLogger(__name__)


# ── File Parsers ───────────────────────────────────────────────────────────────


def parse_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using PyPDF2."""
    from PyPDF2 import PdfReader

    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n\n".join(text_parts)


def parse_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file using python-docx."""
    from docx import Document

    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
    return "\n\n".join(paragraphs)


def parse_txt(file_bytes: bytes) -> str:
    """Extract text from a plain text file."""
    return file_bytes.decode("utf-8", errors="replace")


def parse_file(file_bytes: bytes, file_type: str) -> str:
    """
    Route to the correct parser based on file type.

    Args:
        file_bytes: Raw file content
        file_type: One of 'pdf', 'docx', 'txt'

    Returns:
        Extracted text string
    """
    parsers = {
        "pdf": parse_pdf,
        "docx": parse_docx,
        "txt": parse_txt,
    }
    parser = parsers.get(file_type)
    if parser is None:
        raise ValueError(f"Unsupported file type: {file_type}")
    return parser(file_bytes)


# ── Text Chunking ──────────────────────────────────────────────────────────────


def chunk_text(text: str, chunk_size: Optional[int] = None, chunk_overlap: Optional[int] = None) -> list[str]:
    """
    Split text into overlapping chunks using LangChain's RecursiveCharacterTextSplitter.

    Args:
        text: Full document text
        chunk_size: Max characters per chunk (default from settings)
        chunk_overlap: Overlap between consecutive chunks (default from settings)

    Returns:
        List of text chunks
    """
    settings = get_settings()
    size = chunk_size or settings.chunk_size
    overlap = chunk_overlap or settings.chunk_overlap

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=size,
        chunk_overlap=overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text)


# ── Background Processing Pipeline ────────────────────────────────────────────


async def process_document(
    document_id: str,
    file_bytes: bytes,
    file_type: str,
) -> None:
    """
    Full document processing pipeline. Meant to run as a BackgroundTask.

    Steps:
        1. Mark status as 'processing'
        2. Parse → chunk → embed → upsert
        3. Mark status as 'ready' with chunk count
        4. On any error, mark status as 'failed'
    """
    try:
        # Step 1: Mark as processing
        await update_document_status(document_id, "processing")
        logger.info(f"[{document_id}] Starting document processing")

        # Step 2: Parse file text
        text = parse_file(file_bytes, file_type)
        if not text.strip():
            raise ValueError("Parsed document text is empty")
        logger.info(f"[{document_id}] Parsed {len(text)} characters")

        # Step 3: Chunk text
        chunks = chunk_text(text)
        if not chunks:
            raise ValueError("Text chunking produced zero chunks")
        logger.info(f"[{document_id}] Created {len(chunks)} chunks")

        # Step 4: Embed all chunks
        embeddings = await embed_chunks(chunks)
        logger.info(f"[{document_id}] Generated {len(embeddings)} embeddings")

        # Step 5: Upsert vectors into Pinecone
        upserted_count = await upsert_vectors(document_id, chunks, embeddings)
        logger.info(f"[{document_id}] Upserted {upserted_count} vectors to Pinecone")

        # Step 6: Mark as ready
        await update_document_status(document_id, "ready", chunk_count=len(chunks))
        logger.info(f"[{document_id}] ✅ Document processing complete")

    except Exception as e:
        logger.error(f"[{document_id}] ❌ Document processing failed: {e}", exc_info=True)
        try:
            await update_document_status(document_id, "failed")
        except Exception:
            logger.error(f"[{document_id}] Failed to update status to 'failed'")
