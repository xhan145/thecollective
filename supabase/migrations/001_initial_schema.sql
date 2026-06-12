-- SIGNAL//FLOW MVP initial schema
-- Run in Supabase SQL Editor before using the app with real credentials.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key,
  email text,
  role text not null default 'scout' check (role in ('artist', 'scout', 'admin')),
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.artist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  artist_name text not null,
  bio text,
  location text,
  genres text[] not null default '{}',
  links jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.scout_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  favorite_genres text[] not null default '{}',
  favorite_moods text[] not null default '{}',
  scout_level text not null default 'Flowfinder',
  flowfinder_score int not null default 0,
  backed_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  title text not null,
  description text,
  genre_tags text[] not null default '{}',
  mood_tags text[] not null default '{}',
  audio_url text not null,
  artwork_url text,
  duration_seconds int,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  discovery_stage text not null default 'uploaded' check (discovery_stage in ('uploaded', 'first_50', 'first_250', 'rising')),
  rights_confirmed boolean not null default false,
  rejection_reason text,
  created_at timestamptz not null default now()
);
create index if not exists tracks_artist_idx on public.tracks(artist_id);
create index if not exists tracks_status_idx on public.tracks(status);
create index if not exists tracks_discovery_stage_idx on public.tracks(discovery_stage);

create table if not exists public.track_analysis (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null unique references public.tracks(id) on delete cascade,
  bpm int,
  key text,
  energy int not null default 60 check (energy between 0 and 100),
  mood_summary text not null,
  genre_summary text not null,
  sonic_description text not null,
  similar_currents text[] not null default '{}',
  strongest_moment text not null,
  mix_notes text not null,
  promo_angle text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.listen_events (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  seconds_played int not null default 0,
  completed boolean not null default false,
  skipped boolean not null default false,
  saved boolean not null default false,
  backed boolean not null default false,
  commented boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists listen_events_track_idx on public.listen_events(track_id);
create index if not exists listen_events_user_idx on public.listen_events(user_id);

create table if not exists public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, track_id)
);
create index if not exists saves_user_idx on public.saves(user_id);

create table if not exists public.backs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  listener_number int not null,
  artist_followers_at_backing int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, track_id)
);
create index if not exists backs_user_idx on public.backs(user_id);
create index if not exists backs_track_idx on public.backs(track_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_track_idx on public.comments(track_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports(status);

create table if not exists public.recommendation_batches (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reason text,
  shown boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists recommendation_batches_user_idx on public.recommendation_batches(user_id);

-- Future upgrade: a scheduled function can graduate first_50 tracks into
-- first_250 or rising after the first listener summary is reviewed.
