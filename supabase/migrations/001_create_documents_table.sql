-- Askify: Documents Table
-- Stores metadata for uploaded documents

CREATE TABLE IF NOT EXISTS documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename    TEXT NOT NULL,
    file_url    TEXT NOT NULL,
    file_type   TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt')),
    chunk_count INTEGER NOT NULL DEFAULT 0,
    file_size   INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by created_at
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads for the MVP (no auth required)
CREATE POLICY "Allow public read" ON documents
    FOR SELECT USING (true);

-- Allow anonymous inserts for the MVP
CREATE POLICY "Allow public insert" ON documents
    FOR INSERT WITH CHECK (true);

-- Allow anonymous deletes for the MVP
CREATE POLICY "Allow public delete" ON documents
    FOR DELETE USING (true);
