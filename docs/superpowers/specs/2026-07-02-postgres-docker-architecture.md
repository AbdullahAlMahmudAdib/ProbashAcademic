# PostgreSQL + pgvector Docker Architecture Spec

## Goal
Set up an optimized, local Docker-based PostgreSQL 18 instance with `pgvector` enabled and persistence, mimicking the production Neon schema and optimized index mappings.

## 1. Docker Compose Configuration

Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:18-alpine
    container_name: bp-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres_password}
      POSTGRES_DB: ${DB_NAME:-baireporbo}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - bp-postgres-data:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d
    command:
      - "postgres"
      - "-c"
      - "shared_buffers=256MB"
      - "-c"
      - "work_mem=16MB"
      - "-c"
      - "maintenance_work_mem=64MB"
      - "-c"
      - "random_page_cost=1.1"
      - "-c"
      - "effective_cache_size=768MB"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  bp-postgres-data:
    driver: local
```

## 2. Optimized Database Schema (DDL)

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id                  TEXT PRIMARY KEY,
  role                TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  full_name           TEXT,
  cgpa                NUMERIC(4,2),
  work_experience     TEXT,
  target_degree       TEXT,
  preferred_countries TEXT,
  goals_notes         TEXT,
  bsc_major           TEXT,
  university          TEXT,
  graduation_year     INTEGER,
  research_interests  TEXT,
  published_papers    TEXT,
  ielts_score         TEXT,
  gre_gmat_score      TEXT,
  internships         TEXT,
  portfolio_url       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scholarships (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by            TEXT,
  title                 TEXT NOT NULL,
  country               TEXT NOT NULL,
  degree_level          TEXT,
  funding_type          TEXT,
  deadline              TEXT,
  official_url          TEXT,
  raw_description       TEXT,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  thumbnail_url         TEXT,
  is_flagship           BOOLEAN NOT NULL DEFAULT FALSE,
  ai_summary            TEXT,
  eligibility_summary   TEXT,
  competitiveness       TEXT,
  tips                  TEXT,
  tags                  JSONB DEFAULT '[]'::jsonb,
  thumbnail_prompt      TEXT,
  is_live               BOOLEAN NOT NULL DEFAULT true,
  opening_note          TEXT,
  slug                  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scholarships_slug ON scholarships (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scholarships_is_live ON scholarships (is_live);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON scholarships (deadline);

CREATE TABLE IF NOT EXISTS "ScholarshipDoc" (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id  UUID REFERENCES scholarships(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  embedding       VECTOR(1024),
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scholarship_doc_embedding_hnsw
  ON "ScholarshipDoc" USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  anon_key   TEXT,
  title      TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_anon_key ON chat_sessions(anon_key);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id_created ON chat_messages(session_id, created_at ASC);

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, scholarship_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);

CREATE TABLE IF NOT EXISTS user_tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  due_date       TEXT,
  status         TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Now','Soon','Planned','Done')),
  scholarship_id UUID REFERENCES scholarships(id) ON DELETE SET NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id_due ON user_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_user_tasks_scholarship_id ON user_tasks(scholarship_id);

CREATE TABLE IF NOT EXISTS user_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename          TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'other',
  file_size         INTEGER NOT NULL,
  mime_type         TEXT NOT NULL,
  r2_key            TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);

CREATE TABLE IF NOT EXISTS guides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'Scholarships',
  tags            JSONB DEFAULT '[]'::jsonb,
  intro           TEXT NOT NULL DEFAULT '',
  content         TEXT,
  faqs            JSONB NOT NULL DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  cover_image_url TEXT,
  published_at    TIMESTAMPTZ,
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  writer_name        TEXT DEFAULT NULL,
  writer_designation TEXT DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_slug ON guides (slug);

CREATE TABLE IF NOT EXISTS prompt_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key    TEXT NOT NULL UNIQUE,
  model        TEXT NOT NULL,
  user_message TEXT NOT NULL,
  response     TEXT NOT NULL,
  hit_count    INTEGER NOT NULL DEFAULT 0,
  last_hit_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_cache_key ON prompt_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_prompt_cache_expires ON prompt_cache(expires_at);
```
