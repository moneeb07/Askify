-- Askify: Add status tracking to documents table
-- Run this after 001_create_documents_table.sql

-- Add processing status column
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'ready', 'failed'));

-- Add updated_at timestamp
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Allow anonymous updates for the MVP (no auth required)
CREATE POLICY "Allow public update" ON documents
    FOR UPDATE USING (true);

-- Index for fast status lookups
CREATE INDEX IF NOT EXISTS documents_status_idx ON documents (status);
