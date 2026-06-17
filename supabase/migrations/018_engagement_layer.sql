-- Collective — engagement layer (additive). Useful marks, saved items,
-- learn-from connections, and tiny peer-note / feedback-request threads.
-- Approved vocabulary only; no likes/followers/leaderboards/public counts.

create extension if not exists "pgcrypto";

-- ---------- useful_marks: a reader marks a proof "Useful" (ranking signal) ----------
create table if not exists public.useful_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null default 'proof' check (target_type in ('proof')),
  target_id uuid not null,
  reason text not null default 'clear'
    check (reason in ('clear','actionable','encouraging','worth_practicing','helped_me_reflect','other')),
  is_demo boolean not null default false,
  demo_cohort text,
  demo_seed_id text,
  created_at timestamptz not null default now(),
  unique (user_id, target_id)
);
create index if not exists useful_marks_target_idx on public.useful_marks(target_id);
create index if not exists useful_marks_user_idx on public.useful_marks(user_id);
create index if not exists useful_marks_demo_idx on public.useful_marks(is_demo);
create unique index if not exists useful_marks_demo_seed_uidx
  on public.useful_marks(demo_seed_id) where demo_seed_id is not null;

-- ---------- saved_items: "Save for practice" (proof / practice / direction) ----------
create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('proof','practice','direction')),
  target_id text not null,
  is_demo boolean not null default false,
  demo_cohort text,
  demo_seed_id text,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists saved_items_user_idx on public.saved_items(user_id);
create index if not exists saved_items_demo_idx on public.saved_items(is_demo);
create unique index if not exists saved_items_demo_seed_uidx
  on public.saved_items(demo_seed_id) where demo_seed_id is not null;

-- ---------- member_connections: "Learn from" (one-directional, no counts) ----------
create table if not exists public.member_connections (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  connection_type text not null default 'learn_from' check (connection_type in ('learn_from')),
  status text not null default 'active' check (status in ('active','removed')),
  is_demo boolean not null default false,
  demo_cohort text,
  demo_seed_id text,
  created_at timestamptz not null default now(),
  unique (learner_id, teacher_id, connection_type),
  check (learner_id <> teacher_id)
);
create index if not exists member_connections_learner_idx on public.member_connections(learner_id);
create index if not exists member_connections_teacher_idx on public.member_connections(teacher_id);
create index if not exists member_connections_demo_idx on public.member_connections(is_demo);
create unique index if not exists member_connections_demo_seed_uidx
  on public.member_connections(demo_seed_id) where demo_seed_id is not null;

-- ---------- conversations + messages: tiny 1:1 peer note / feedback request ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'peer_note' check (kind in ('peer_note','feedback_request')),
  initiator_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  proof_id uuid references public.proofs(id) on delete set null,
  subject text,
  last_message_at timestamptz not null default now(),
  is_demo boolean not null default false,
  demo_cohort text,
  demo_seed_id text,
  created_at timestamptz not null default now(),
  check (initiator_id <> recipient_id)
);
create index if not exists conversations_initiator_idx on public.conversations(initiator_id);
create index if not exists conversations_recipient_idx on public.conversations(recipient_id);
create index if not exists conversations_last_msg_idx on public.conversations(last_message_at desc);
create index if not exists conversations_demo_idx on public.conversations(is_demo);
create unique index if not exists conversations_demo_seed_uidx
  on public.conversations(demo_seed_id) where demo_seed_id is not null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_demo boolean not null default false,
  demo_seed_id text,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);
create index if not exists messages_demo_idx on public.messages(is_demo);
create unique index if not exists messages_demo_seed_uidx
  on public.messages(demo_seed_id) where demo_seed_id is not null;

-- ---------- idempotency for existing demo content (re-runnable seed) ----------
create unique index if not exists proofs_demo_seed_uidx
  on public.proofs(demo_seed_id) where demo_seed_id is not null;
create unique index if not exists feedback_demo_seed_uidx
  on public.feedback(demo_seed_id) where demo_seed_id is not null;
create unique index if not exists trust_events_demo_seed_uidx
  on public.trust_events(demo_seed_id) where demo_seed_id is not null;
