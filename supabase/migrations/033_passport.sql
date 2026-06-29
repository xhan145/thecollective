-- 033_passport.sql — Passport screen data model (additive; never edits 010–032).
-- Adds passport profile fields, the guided introduction (profile_details),
-- and pinned proofs. Reuses existing trust counts + selected_badges (no
-- profile_stats / user_badges duplication). RLS is read-own + write-own with
-- WITH CHECK on every write path (no client can write another user's row).

-- 1) Passport fields on profiles (bio/goal_text/selected_badges already exist).
alter table public.profiles add column if not exists headline text;
alter table public.profiles add column if not exists current_focus_skill text;
alter table public.profiles add column if not exists introduction_summary text;
alter table public.profiles add column if not exists open_to_introductions boolean not null default true;

-- 2) Guided introduction — one row per user (the "I'm here to practice" card).
create table if not exists public.profile_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  here_to_practice text,
  currently_working_on text,
  wants_feedback_on text,
  can_help_with text,
  looking_for text[] not null default '{}',
  introduction_visibility text not null default 'members' check (introduction_visibility in ('private','members','public')),
  allow_same_direction_only boolean not null default false,
  allow_trusted_only boolean not null default false,
  is_demo boolean not null default false,
  demo_seed_id text,
  updated_at timestamptz not null default now()
);
create unique index if not exists profile_details_demo_seed_uidx on public.profile_details(demo_seed_id) where demo_seed_id is not null;

-- 3) Pinned proofs — a small ordered set a user highlights on their passport.
create table if not exists public.pinned_proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  proof_id uuid not null,
  display_order int not null default 0,
  is_demo boolean not null default false,
  demo_seed_id text,
  created_at timestamptz not null default now(),
  unique (user_id, proof_id)
);
create index if not exists pinned_proofs_user_idx on public.pinned_proofs(user_id, display_order);
create unique index if not exists pinned_proofs_demo_seed_uidx on public.pinned_proofs(demo_seed_id) where demo_seed_id is not null;

-- RLS: read-own + write-own (WITH CHECK closes the trust-mint-style hole).
alter table public.profile_details enable row level security;
alter table public.pinned_proofs enable row level security;

drop policy if exists profile_details_select_own on public.profile_details;
create policy profile_details_select_own on public.profile_details
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists profile_details_insert_own on public.profile_details;
create policy profile_details_insert_own on public.profile_details
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists profile_details_update_own on public.profile_details;
create policy profile_details_update_own on public.profile_details
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists pinned_proofs_select_own on public.pinned_proofs;
create policy pinned_proofs_select_own on public.pinned_proofs
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists pinned_proofs_insert_own on public.pinned_proofs;
create policy pinned_proofs_insert_own on public.pinned_proofs
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists pinned_proofs_delete_own on public.pinned_proofs;
create policy pinned_proofs_delete_own on public.pinned_proofs
  for delete to authenticated using (auth.uid() = user_id);
