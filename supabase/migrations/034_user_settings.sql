-- 034_user_settings.sql — robust settings store + privacy backend (additive).
-- user_settings holds visibility + notification + feedback + content prefs
-- (jsonb for the toggle groups so the typed schema can evolve without DDL).
-- blocked_users + introduction_requests are the privacy/safety tables.
-- All RLS is read-own/write-own with WITH CHECK.

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  settings_version int not null default 1,
  profile_visibility text not null default 'members' check (profile_visibility in ('private','members','feedback_group','public')),
  proof_visibility_default text not null default 'feedback_group' check (proof_visibility_default in ('private','feedback_group','members','public')),
  notifications jsonb not null default '{}'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  appearance jsonb not null default '{}'::jsonb,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocked_users_blocker_idx on public.blocked_users(blocker_id);

create table if not exists public.introduction_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> receiver_id)
);
create index if not exists introduction_requests_receiver_idx on public.introduction_requests(receiver_id, status);

alter table public.user_settings enable row level security;
alter table public.blocked_users enable row level security;
alter table public.introduction_requests enable row level security;

-- user_settings: fully private to the owner.
drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own on public.user_settings for select to authenticated using (auth.uid() = user_id);
drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own on public.user_settings for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own on public.user_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- blocked_users: only the blocker can see or manage their block list.
drop policy if exists blocked_users_select_own on public.blocked_users;
create policy blocked_users_select_own on public.blocked_users for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists blocked_users_insert_own on public.blocked_users;
create policy blocked_users_insert_own on public.blocked_users for insert to authenticated with check (auth.uid() = blocker_id);
drop policy if exists blocked_users_delete_own on public.blocked_users;
create policy blocked_users_delete_own on public.blocked_users for delete to authenticated using (auth.uid() = blocker_id);

-- introduction_requests: sender or receiver can read; sender creates; receiver responds.
drop policy if exists intro_requests_select_party on public.introduction_requests;
create policy intro_requests_select_party on public.introduction_requests for select to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists intro_requests_insert_sender on public.introduction_requests;
create policy intro_requests_insert_sender on public.introduction_requests for insert to authenticated with check (auth.uid() = sender_id);
drop policy if exists intro_requests_update_receiver on public.introduction_requests;
create policy intro_requests_update_receiver on public.introduction_requests for update to authenticated using (auth.uid() = receiver_id) with check (auth.uid() = receiver_id);
