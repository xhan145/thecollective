-- 022_beta_access.sql — Closed Beta Readiness Pass (additive).
-- Run AFTER 010–021. Safe to re-run (idempotent guards throughout).
-- Adds: invite-only beta gate (beta_invites + profile flags) and lightweight
-- beta event logging (beta_events). Does NOT modify any applied migration.

-- ---------- profiles: beta access flags ----------
alter table public.profiles add column if not exists invite_code text;
alter table public.profiles add column if not exists beta_access boolean not null default false;
alter table public.profiles add column if not exists beta_joined_at timestamptz;

-- ---------- beta_invites ----------
-- A controlled (not high-security) beta gate. All reads/writes go through a
-- server route using the service role, so this table has RLS enabled with NO
-- client policies (locked to service role only).
create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  email text,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  status text not null default 'active' check (status in ('active','paused','used','expired')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  notes text
);

create index if not exists beta_invites_code_idx on public.beta_invites(code);
create index if not exists beta_invites_status_idx on public.beta_invites(status);
create index if not exists beta_invites_email_idx on public.beta_invites(email);

alter table public.beta_invites enable row level security;
-- No anon/authenticated policies on purpose: only the service role (server) may
-- read/redeem invites. (RLS with zero policies denies all non-service access.)

-- ---------- beta_events ----------
-- Lightweight flow logging for debugging the closed beta (not surveillance).
create table if not exists public.beta_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  route text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists beta_events_user_idx on public.beta_events(user_id);
create index if not exists beta_events_type_idx on public.beta_events(event_type);
create index if not exists beta_events_created_idx on public.beta_events(created_at desc);

alter table public.beta_events enable row level security;

drop policy if exists "beta_events_insert_own" on public.beta_events;
create policy "beta_events_insert_own" on public.beta_events
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "beta_events_read_own" on public.beta_events;
create policy "beta_events_read_own" on public.beta_events
  for select to authenticated
  using (auth.uid() = user_id);
-- Admin reads happen via the service-role admin route, which bypasses RLS.
