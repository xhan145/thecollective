-- Collective Web Beta — profile fields for closed beta (additive).
-- Run after 013. Safe to re-run.

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists current_direction_id uuid;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists trust_score integer not null default 0;
alter table public.profiles add column if not exists practice_count integer not null default 0;
alter table public.profiles add column if not exists proof_count integer not null default 0;
alter table public.profiles add column if not exists feedback_given_count integer not null default 0;
alter table public.profiles add column if not exists feedback_received_count integer not null default 0;
alter table public.profiles add column if not exists contribution_count integer not null default 0;

-- Unique username (partial: ignore NULLs so existing rows are fine).
create unique index if not exists profiles_username_key
  on public.profiles (lower(username)) where username is not null;

-- Recreate the new-user trigger to also seed a unique-ish username + onboarding flag.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  candidate text;
  suffix int := 0;
begin
  base_name := coalesce(nullif(split_part(new.email, '@', 1), ''), 'member');
  candidate := base_name;
  -- ensure username uniqueness with a numeric suffix
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    suffix := suffix + 1;
    candidate := base_name || suffix::text;
  end loop;

  insert into public.profiles (id, display_name, initials, username, onboarding_completed)
  values (
    new.id,
    base_name,
    upper(left(base_name, 2)),
    candidate,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
