-- FirstSignal Intelligence Upgrade
-- Run this once in the Supabase SQL editor (or via supabase db push).
-- Everything is idempotent — safe to re-run.

-- ============================================================
-- 1. pgvector — real semantic memory
-- ============================================================
create extension if not exists vector;

-- 384-dim embeddings from all-MiniLM-L6-v2 (computed in-process, zero API cost)
alter table memory_embeddings drop column if exists embedding;
alter table memory_embeddings add column embedding vector(384);

create index if not exists memory_embeddings_embedding_idx
  on memory_embeddings using hnsw (embedding vector_cosine_ops);

-- Cosine-similarity retrieval scoped to one customer.
-- Returns the most relevant memories for a query embedding.
create or replace function match_memories(
  p_customer_id uuid,
  query_embedding vector(384),
  match_count int default 5,
  min_similarity float default 0.25
)
returns table (
  content text,
  metadata jsonb,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    m.content,
    m.metadata,
    m.created_at,
    1 - (m.embedding <=> query_embedding) as similarity
  from memory_embeddings m
  where m.customer_id = p_customer_id
    and m.embedding is not null
    and 1 - (m.embedding <=> query_embedding) >= min_similarity
  order by m.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- 2. Per-message sentiment score — powers health trajectory
-- ============================================================
alter table messages add column if not exists sentiment_score int;

-- ============================================================
-- 3. Agent decision traces — full observability per message
-- ============================================================
create table if not exists agent_traces (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid,
  customer_id uuid,
  message text,
  steps jsonb not null,
  total_ms int,
  created_at timestamptz default now()
);

create index if not exists agent_traces_conversation_idx on agent_traces (conversation_id);
create index if not exists agent_traces_created_idx on agent_traces (created_at desc);

-- ============================================================
-- 4. Guardrail events — every allowed/blocked autonomous action
-- ============================================================
create table if not exists guardrail_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  conversation_id uuid,
  action text not null,
  verdict text not null check (verdict in ('allowed', 'blocked')),
  rule text,
  reason text,
  payload jsonb,
  created_at timestamptz default now()
);

create index if not exists guardrail_events_created_idx on guardrail_events (created_at desc);

-- ============================================================
-- 5. Resolution action ledger — enforces compensation limits
-- ============================================================
create table if not exists resolution_actions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  conversation_id uuid,
  action text not null,
  order_id text,
  amount numeric,
  discount_pct int,
  reference text,
  created_at timestamptz default now()
);

create index if not exists resolution_actions_customer_idx on resolution_actions (customer_id);
create index if not exists resolution_actions_order_idx on resolution_actions (order_id);
