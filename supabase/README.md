# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up (free tier)
2. Click **New Project**
3. Choose a name (e.g. `askify`), set a database password, and choose a region
4. Wait ~2 minutes for the project to provision

## 2. Get Your API Keys

In your project dashboard → **Settings → API**:

| Key | Where to paste |
|-----|----------------|
| `Project URL` | `SUPABASE_URL` in `backend/.env` |
| `anon / public` key | `SUPABASE_ANON_KEY` in `backend/.env` |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` |

> ⚠️ Never expose the `service_role` key on the frontend.

## 3. Run the Database Migration

In the Supabase dashboard → **SQL Editor**, paste and run:

```
supabase/migrations/001_create_documents_table.sql
```

Or if you have the Supabase CLI installed:
```bash
supabase db push
```

## 4. Create a Storage Bucket

1. Go to **Storage** in the Supabase dashboard
2. Click **New Bucket**
3. Name it: `documents`
4. Set to **Public** for the MVP
5. Under **Policies**, allow anonymous uploads (INSERT) and reads (SELECT)

## 5. Storage Bucket Policy (SQL)

Run this in the SQL Editor:

```sql
-- Allow public uploads to 'documents' bucket
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Allow public reads from 'documents' bucket
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');
```

## Schema Overview

```
documents
├── id          UUID (PK, auto-generated)
├── filename    TEXT (original file name)
├── file_url    TEXT (Supabase Storage URL)
├── file_type   TEXT (pdf | docx | txt)
├── chunk_count INTEGER (number of text chunks indexed)
├── file_size   INTEGER (bytes)
└── created_at  TIMESTAMPTZ (auto)
```
