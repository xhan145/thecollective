-- Collective Web Beta — live Supabase schema (user-generated data only).
-- Static content (directions, prompts, cohorts) stays seeded in the app,
-- so existing prompt/direction ids and routes keep working.
-- Run in: Supabase Dashboard -> SQL Editor.

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Member',
  initials text not null default 'M',
  role text not null default 'member',
  cohort_id text not null default 'founding-circle',
  direction_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- proofs ----------
create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id text not null,
  direction_id text not null,
  title text not null,
  body text not null,
  media_type text not null default 'text',
  status text not null default 'submitted',
  visibility text not null default 'private',
  created_at timestamptz not null default now()
);
create index if not exists proofs_user_idx on public.proofs(user_id);
create index if not exists proofs_created_idx on public.proofs(created_at desc);

-- ---------- proof_attachments ----------
create table if not exists public.proof_attachments (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references public.proofs(id) on delete cascade,
  media_type text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  storage_path text,
  created_at timestamptz not null default now()
);
create index if not exists proof_attachments_proof_idx on public.proof_attachments(proof_id);

-- ---------- feedback ----------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references public.proofs(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  tone text not null default 'kind',
  helpful boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists feedback_proof_idx on public.feedback(proof_id);
create index if not exists feedback_recipient_idx on public.feedback(recipient_id);

-- ---------- trust_events ----------
create table if not exists public.trust_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  points int not null default 0,
  label text not null,
  source_id text,
  created_at timestamptz not null default now()
);
create index if not exists trust_events_user_idx on public.trust_events(user_id);

-- ---------- practice_completions ----------
create table if not exists public.practice_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, prompt_id)
);
create index if not exists practice_completions_user_idx on public.practice_completions(user_id);

-- ---------- app_feedback ----------
create table if not exists public.app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  body text not null,
  route text,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- ai_interactions ----------
create table if not exists public.ai_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  cohort_id text,
  feature text not null,
  source_type text,
  source_id text,
  prompt_id text,
  proof_id uuid references public.proofs(id) on delete set null,
  input_summary text,
  output jsonb,
  created_at timestamptz not null default now()
);

-- ---------- ai_user_feedback ----------
create table if not exists public.ai_user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_display_name text,
  cohort_id text,
  ai_interaction_id uuid references public.ai_interactions(id) on delete set null,
  feature text not null,
  helpfulness text not null,
  issue_type text,
  comment text,
  created_at timestamptz not null default now()
);
