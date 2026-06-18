-- Collective AI Lab v0. Additive, server/admin-only AI Lab foundation.
-- Existing user-facing ai_interactions and ai_user_feedback tables were created
-- in 010_collective_beta_schema.sql and are intentionally not recreated here.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'ai_dataset_use'
  ) then
    create type public.ai_dataset_use as enum (
      'eval_only',
      'safety_eval',
      'prompt_context',
      'sft_candidate',
      'preference_candidate',
      'blocked'
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'ai_example_status'
  ) then
    create type public.ai_example_status as enum (
      'raw',
      'cleaned',
      'reviewed',
      'approved',
      'rejected'
    );
  end if;
end $$;

create table if not exists public.ai_agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  related_proof_id uuid references public.proofs(id) on delete set null,
  related_feedback_id uuid references public.feedback(id) on delete set null,
  agent_name text not null,
  model_name text,
  input jsonb not null,
  output jsonb not null,
  safety_status text default 'ok',
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_eval_runs (
  id uuid primary key default gen_random_uuid(),
  eval_name text not null,
  model_name text not null,
  prompt_version text not null,
  score numeric,
  results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_dataset_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text unique not null,
  display_name text not null,
  source_url text,
  license_name text,
  intended_use public.ai_dataset_use not null default 'eval_only',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_dataset_examples (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.ai_dataset_sources(id) on delete cascade,
  external_id text,
  category text not null,
  input_text text,
  output_text text,
  rejected_output_text text,
  label jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status public.ai_example_status not null default 'raw',
  approved_for_training boolean not null default false,
  approved_for_eval boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_golden_examples (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null,
  user_input text not null,
  ideal_output text not null,
  bad_output text,
  rubric jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}'::text[],
  status public.ai_example_status not null default 'reviewed',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_agent_runs_user_idx on public.ai_agent_runs(user_id);
create index if not exists ai_agent_runs_created_idx on public.ai_agent_runs(created_at desc);
create index if not exists ai_eval_runs_created_idx on public.ai_eval_runs(created_at desc);
create index if not exists ai_dataset_examples_source_idx on public.ai_dataset_examples(source_id);
create index if not exists ai_dataset_examples_status_idx on public.ai_dataset_examples(status);
create index if not exists ai_golden_examples_feature_idx on public.ai_golden_examples(feature_key);
create unique index if not exists ai_dataset_examples_external_uidx
  on public.ai_dataset_examples(source_id, external_id)
  where external_id is not null;

alter table public.ai_agent_runs enable row level security;
alter table public.ai_eval_runs enable row level security;
alter table public.ai_dataset_sources enable row level security;
alter table public.ai_dataset_examples enable row level security;
alter table public.ai_golden_examples enable row level security;

-- No anon/authenticated policies are added. These AI Lab tables are intended
-- for service-role/admin server access only. Existing demo content lives in
-- profiles/proofs/feedback with is_demo metadata, so this migration does not
-- add parallel demo_personas or demo_activity tables.

insert into public.ai_dataset_sources (source_key, display_name, source_url, license_name, intended_use)
values
  ('oasst1', 'OpenAssistant OASST1', 'https://huggingface.co/datasets/OpenAssistant/oasst1', 'Apache-2.0', 'eval_only'::public.ai_dataset_use),
  ('hh_rlhf', 'Anthropic HH-RLHF', 'https://huggingface.co/datasets/Anthropic/hh-rlhf', 'MIT', 'preference_candidate'::public.ai_dataset_use),
  ('ultrafeedback', 'UltraFeedback', 'https://huggingface.co/datasets/openbmb/UltraFeedback', 'MIT', 'preference_candidate'::public.ai_dataset_use),
  ('prosocial_dialog', 'ProsocialDialog', 'https://huggingface.co/datasets/allenai/prosocial-dialog', 'Check dataset card before commercial use', 'safety_eval'::public.ai_dataset_use),
  ('civil_comments', 'Civil Comments / Jigsaw', 'https://www.tensorflow.org/datasets/catalog/civil_comments', 'Check dataset terms before commercial use', 'safety_eval'::public.ai_dataset_use)
on conflict (source_key) do nothing;
