-- Collective Passport, profile settings, privacy, and preferences.
-- Safe to run after auth is enabled. This migration avoids social/clout metrics.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  avatar_url text,
  headline text,
  current_direction_id uuid,
  current_focus_skill text,
  introduction_summary text,
  trust_level int default 0,
  profile_visibility text default 'members_only',
  open_to_introductions boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists username text unique,
  add column if not exists avatar_url text,
  add column if not exists headline text,
  add column if not exists current_direction_id uuid,
  add column if not exists current_focus_skill text,
  add column if not exists introduction_summary text,
  add column if not exists trust_level int default 0,
  add column if not exists profile_visibility text default 'members_only',
  add column if not exists open_to_introductions boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.profile_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  here_to_practice text,
  currently_working_on text,
  wants_feedback_on text,
  can_help_with text,
  looking_for text[],
  introduction_visibility text default 'limited',
  allow_same_direction_only boolean default false,
  allow_trusted_only boolean default false,
  updated_at timestamptz default now()
);

create table if not exists public.profile_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  practice_count int default 0,
  proof_count int default 0,
  feedback_received_count int default 0,
  feedback_given_count int default 0,
  feedback_applied_count int default 0,
  feedback_loop_count int default 0,
  helpful_feedback_count int default 0,
  contribution_count int default 0,
  badge_count int default 0,
  updated_at timestamptz default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  badge_id text not null,
  badge_name text not null,
  badge_category text,
  is_displayed boolean default false,
  display_order int,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

create table if not exists public.pinned_proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  proof_id uuid not null,
  display_order int default 0,
  created_at timestamptz default now(),
  unique(user_id, proof_id)
);

create table if not exists public.introduction_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  message text not null,
  status text default 'pending',
  created_at timestamptz default now(),
  responded_at timestamptz
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  proof_visibility_default text default 'feedback_group',
  feedback_style text default 'balanced',
  feedback_focus_areas text[] default array['clarity','tone','pacing'],
  feedback_from text default 'trusted_members',
  allow_anonymous_feedback boolean default false,
  content_preferences text[] default array['communication','confidence'],
  muted_content text[],
  hide_advanced_practices boolean default true,
  beginner_safe_language boolean default true,
  theme text default 'light',
  push_notifications jsonb default '{}'::jsonb,
  email_notifications jsonb default '{}'::jsonb,
  feedback_notifications jsonb default '{}'::jsonb,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz default now()
);

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id)
);

create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  category text,
  message text not null,
  screenshot_url text,
  status text default 'new',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.profile_details enable row level security;
alter table public.profile_stats enable row level security;
alter table public.user_badges enable row level security;
alter table public.pinned_proofs enable row level security;
alter table public.introduction_requests enable row level security;
alter table public.user_settings enable row level security;
alter table public.blocked_users enable row level security;
alter table public.product_feedback enable row level security;

create policy if not exists "profiles read members safe fields" on public.profiles
  for select using (profile_visibility <> 'private' or auth.uid() = id);

create policy if not exists "profiles own insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy if not exists "profiles own update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists "own profile details" on public.profile_details
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "own profile stats read" on public.profile_stats
  for select using (auth.uid() = user_id);

create policy if not exists "own badges" on public.user_badges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "own pinned proofs" on public.pinned_proofs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "own introduction requests" on public.introduction_requests
  for all using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id);

create policy if not exists "own user settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "own blocked users" on public.blocked_users
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

create policy if not exists "product feedback own insert" on public.product_feedback
  for insert with check (auth.uid() = user_id or user_id is null);

create policy if not exists "product feedback own read" on public.product_feedback
  for select using (auth.uid() = user_id);
