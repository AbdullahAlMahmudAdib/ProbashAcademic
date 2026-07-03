-- ProbashAcademic Database Schema
-- PostgreSQL 17

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Profiles (Clerk auth + extended profile fields)
CREATE TABLE profiles (
  id               TEXT PRIMARY KEY,
  full_name        TEXT,
  role             TEXT NOT NULL DEFAULT 'student',
  cgpa             DOUBLE PRECISION,
  work_experience  TEXT,
  target_degree    TEXT,
  preferred_countries TEXT,
  goals_notes      TEXT,
  bsc_major        TEXT,
  university       TEXT,
  graduation_year  INTEGER,
  research_interests TEXT,
  published_papers TEXT,
  ielts_score      TEXT,
  gre_gmat_score   TEXT,
  internships      TEXT,
  portfolio_url    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scholarships
CREATE TABLE scholarships (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  country          TEXT NOT NULL,
  degree_level     TEXT NOT NULL,
  funding_type     TEXT NOT NULL,
  deadline         TEXT,
  official_url     TEXT,
  raw_description  TEXT,
  status           TEXT NOT NULL DEFAULT 'draft',
  slug             TEXT UNIQUE,
  is_live          BOOLEAN NOT NULL DEFAULT TRUE,
  opening_note     TEXT,
  tags             TEXT[] DEFAULT '{}',
  thumbnail_url    TEXT,
  competitiveness  TEXT,
  is_flagship      BOOLEAN NOT NULL DEFAULT FALSE,
  created_by       TEXT REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scholarships_status ON scholarships(status);
CREATE INDEX idx_scholarships_slug ON scholarships(slug);

-- Bookmarks
CREATE TABLE user_bookmarks (
  user_id         TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scholarship_id  INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, scholarship_id)
);

-- Chat Sessions
CREATE TABLE chat_sessions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  anon_key  TEXT,
  title     TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);

-- Chat Messages
CREATE TABLE chat_messages (
  id         SERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);

-- Guides
CREATE TABLE guides (
  slug            TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,
  tags            TEXT[] DEFAULT '{}',
  intro           TEXT NOT NULL,
  content         TEXT,
  faqs            JSONB DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  cover_image_url TEXT,
  is_pinned       BOOLEAN DEFAULT FALSE,
  writer_name     TEXT,
  writer_designation TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document Vault
CREATE TABLE user_documents (
  id                SERIAL PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename          TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'other',
  file_size         INTEGER NOT NULL,
  mime_type         TEXT NOT NULL,
  r2_key            TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE user_tasks (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  due_date        TEXT,
  status          TEXT NOT NULL DEFAULT 'Planned',
  notes           TEXT,
  scholarship_id  INTEGER REFERENCES scholarships(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompt Cache
CREATE TABLE prompt_cache (
  cache_key    TEXT PRIMARY KEY,
  model        TEXT NOT NULL,
  user_message TEXT NOT NULL,
  response     TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  hit_count    INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector embeddings for RAG
CREATE TABLE scholarship_chunks (
  id              SERIAL PRIMARY KEY,
  scholarship_id  INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  chunk_index     INTEGER NOT NULL,
  content         TEXT NOT NULL,
  embedding       vector(768),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scholarship_chunks_embedding
  ON scholarship_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- RAG similarity search function
CREATE OR REPLACE FUNCTION match_scholarship_docs(
  query_embedding vector(768),
  match_threshold DOUBLE PRECISION DEFAULT 0.7,
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (content TEXT, similarity DOUBLE PRECISION)
LANGUAGE sql STABLE AS $$
  SELECT sc.content, 1 - (sc.embedding <=> query_embedding) AS similarity
  FROM scholarship_chunks sc
  WHERE 1 - (sc.embedding <=> query_embedding) > match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Cache hit counter
CREATE OR REPLACE FUNCTION bump_prompt_cache_hit(cache_key_in TEXT)
RETURNS VOID LANGUAGE sql AS $$
  UPDATE prompt_cache SET hit_count = hit_count + 1 WHERE cache_key = cache_key_in;
$$;

-- Seed admin user (replace user_xxx with your Clerk user ID after first signup)
-- INSERT INTO profiles (id, full_name, role) VALUES ('user_xxx', 'Admin', 'admin');
