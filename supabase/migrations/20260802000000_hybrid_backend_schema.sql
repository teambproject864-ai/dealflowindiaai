-- Hybrid Backend Architecture Schema for Supabase (Primary Source of Truth)
-- Project Ref: vsbhpnqrjuxgacevxssq

-- Enable pgvector extension for similarity search and vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. User Profiles Table (Synced from Firebase Auth, strictly managed via backend service)
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(128) PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'agent', 'customer')),
  organization_id VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by Firebase UID
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users(firebase_uid);

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(64) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Workflows Table (Persistent AI Workflow Execution State)
CREATE TABLE IF NOT EXISTS public.workflows (
  id VARCHAR(128) PRIMARY KEY,
  organization_id VARCHAR(128) NOT NULL,
  title VARCHAR(255) NOT NULL,
  definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(64) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'failed')),
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_org_id ON public.workflows(organization_id);

-- 4. Chat Messages Table (Permanent Chat History)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id VARCHAR(128) PRIMARY KEY,
  thread_id VARCHAR(128) NOT NULL,
  sender_id VARCHAR(128) NOT NULL,
  role VARCHAR(64) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_key VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON public.chat_messages(thread_id, created_at ASC);

-- 5. Knowledge Base Table (Documents & pgvector embeddings)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id VARCHAR(128) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IVFFlat index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON public.knowledge_base 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 6. Agent States Table (AI Agent Runtime Context & Steps)
CREATE TABLE IF NOT EXISTS public.agent_states (
  id VARCHAR(128) PRIMARY KEY,
  agent_key VARCHAR(128) NOT NULL,
  user_id VARCHAR(128) NOT NULL,
  context_memory JSONB NOT NULL DEFAULT '{}'::jsonb,
  step_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_agent_user UNIQUE (agent_key, user_id)
);

-- 7. PocketBase to Supabase Sync Dead-Letter Queue (DLQ)
CREATE TABLE IF NOT EXISTS public.sync_dead_letter_queue (
  id VARCHAR(128) PRIMARY KEY,
  collection_name VARCHAR(128) NOT NULL,
  draft_id VARCHAR(128) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- RBAC Security Policy: Allow backend service_role full access, block direct public/anon client access
CREATE POLICY service_role_full_access_users ON public.users FOR ALL TO service_role USING (true);
CREATE POLICY service_role_full_access_orgs ON public.organizations FOR ALL TO service_role USING (true);
CREATE POLICY service_role_full_access_workflows ON public.workflows FOR ALL TO service_role USING (true);
CREATE POLICY service_role_full_access_chat ON public.chat_messages FOR ALL TO service_role USING (true);
CREATE POLICY service_role_full_access_kb ON public.knowledge_base FOR ALL TO service_role USING (true);
CREATE POLICY service_role_full_access_agent_states ON public.agent_states FOR ALL TO service_role USING (true);
CREATE POLICY service_role_full_access_dlq ON public.sync_dead_letter_queue FOR ALL TO service_role USING (true);

-- Cosine Similarity Vector Search RPC Function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id VARCHAR(128),
  title VARCHAR(255),
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
