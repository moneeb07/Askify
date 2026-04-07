# Askify

> Intelligent, agentic conversations with your documents.

Upload a PDF, Word document, or text file and ask questions about it. An AI agent powered by Gemini autonomously decides which parts to search, how many passes to make, and how to synthesize a precise answer.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| UI Components | shadcn/ui |
| Backend | FastAPI + Uvicorn (Python 3.11+) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Vector Store | Pinecone |
| Embeddings | Voyage AI |
| LLM / Agent | Google Gemini 1.5 Flash |

---

## Project Structure

```
askify/
├── frontend/          # Next.js app
│   ├── src/app/       # App Router pages
│   └── .env.local.example
├── backend/           # FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routers/   # documents.py, chat.py
│   │   └── services/  # supabase, pinecone, voyage, gemini
│   ├── requirements.txt
│   └── .env.example
└── supabase/
    ├── migrations/    # SQL schema files
    └── README.md      # Supabase setup guide
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- A free account on: [Supabase](https://supabase.com), [Pinecone](https://pinecone.io), [Voyage AI](https://voyageai.com), [Google AI Studio](https://aistudio.google.com)

---

### 1. Clone & Enter Repo

```bash
git clone https://github.com/moneeb/askify.git
cd askify
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your values
npm run dev
# → http://localhost:3000
```

---

### 3. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

---

### 4. Supabase Setup

Follow the guide in [`supabase/README.md`](./supabase/README.md):

1. Create a free Supabase project
2. Run the SQL migration in `supabase/migrations/001_create_documents_table.sql`
3. Create a storage bucket named `documents`
4. Copy your keys into `backend/.env`

---

### 5. Pinecone Setup

1. Sign up at [https://app.pinecone.io](https://app.pinecone.io) (free tier)
2. Create a new Index:
   - **Name:** `askify-docs`
   - **Dimensions:** `1024` (Voyage AI `voyage-large-2` output size)
   - **Metric:** `cosine`
3. Copy your API key into `backend/.env` as `PINECONE_API_KEY`

---

## Environment Variables

### `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### `backend/.env`
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

PINECONE_API_KEY=...
PINECONE_INDEX_NAME=askify-docs
PINECONE_ENVIRONMENT=us-east-1

VOYAGE_API_KEY=...

GEMINI_API_KEY=...

CORS_ORIGINS=http://localhost:3000
```

---

## Development Phases

- **Phase 1** ✅ — Project scaffold, infra, landing page
- **Phase 2** 🔜 — Document upload, parsing, chunking, embedding & indexing
- **Phase 3** 🔜 — Chat UI + agentic RAG pipeline
- **Phase 4** 🔜 — Polish, streaming responses, source citations
