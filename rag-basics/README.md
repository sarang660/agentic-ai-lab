# rag-basics

The smallest possible RAG (Retrieval-Augmented Generation) demo — chunks a local doc, embeds each chunk with Gemini, stores them in Postgres + pgvector, retrieves the closest chunks for a query, and generates an answer grounded in that context.

This isn't about the doc. It's about the RAG loop: chunk → embed → store → embed query → vector search (`<=>`) → inject top chunks into prompt → generate. That retrieve-then-generate pattern is the core of RAG.

## What it does

- Reads `documents/company-policy.txt`, splits into 20-word chunks.
- Embeds each chunk with `gemini-embedding-2` (768 dims) and stores in `document_chunks` (`source`, `content`, `embedding::vector`).
- For the hardcoded query `How long does an enterprise customer have to request a refund?` it embeds the query, runs `embedding <=> query::vector` in pgvector, prints top 5 results with cosine similarity, and asks Gemini (`gemini-3.6-flash`) to answer using only the best chunk.

## Setup

```bash
npm install
cp .env.example .env
```

Then open `.env` and add your Gemini API key (get one at https://aistudio.google.com/app/apikey). `DATABASE_URL` / `PG*` vars already match `docker-compose.yml` for local dev:

```
GEMINI_API_KEY=your-key-here
DATABASE_URL=postgresql://rag_basics:rag_basics@localhost:5436/rag_basics
```

Start Postgres + pgvector (requires Docker):

```bash
docker compose up -d
```

The DB is created from `db/init/001_init_pgvector.sql` (`CREATE EXTENSION vector`) on first start. Port `5436` is used to avoid clashing with other local Postgres instances.

## Run it

```bash
npx tsx src/index.ts
```

Re-running is idempotent — it deletes previous chunks for `./documents/company-policy.txt` before re-inserting.

Stop the DB when done:

```bash
docker compose down        # keep data
docker compose down -v     # also delete data volume
```

## Files

- `src/index.ts` — chunking (`chunkText`), embedding (`createEmbedding`), pgvector helpers (`toVectorLiteral`, `storeChunk`, `findSimilarChunks`), and the full ingest → retrieve → generate flow.
- `src/db.ts` — `pg` Pool (`DATABASE_URL`) and `query()` helper.
- `documents/company-policy.txt` — source doc for the demo.
- `docker-compose.yml` — `pgvector/pgvector:pg17` service on `5436:5432`.
- `db/init/001_init_pgvector.sql` — enables `vector` extension.
