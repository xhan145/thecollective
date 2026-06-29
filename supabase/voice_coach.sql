-- Collective voice coach support. Safe to run after the base Collective schema.
alter table public.profiles
  add column if not exists learner_name text,
  add column if not exists cohort text not null default 'second-tier-demo-v1',
  add column if not exists current_skill text not null default 'communication',
  add column if not exists current_challenge text not null default 'say-clear-thing',
  add column if not exists mastery_level text not null default 'beginner',
  add column if not exists recent_attempts jsonb not null default '[]'::jsonb;

create table if not exists public.skills (
  id text primary key,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id text primary key,
  skill_id text references public.skills(id) on delete set null,
  slug text unique,
  title text not null,
  description text not null,
  acceptance_criteria jsonb not null default '[]'::jsonb,
  hints jsonb not null default '[]'::jsonb,
  attempt_state text not null default 'ready',
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id text not null,
  outcome text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.concept_mastery (
  user_id uuid not null references public.profiles(id) on delete cascade,
  concept_id text not null,
  understood boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

alter table public.skills enable row level security;
alter table public.challenges enable row level security;
alter table public.attempts enable row level security;
alter table public.concept_mastery enable row level security;

create policy if not exists "read skills" on public.skills for select using (true);
create policy if not exists "read challenges" on public.challenges for select using (true);
create policy if not exists "own attempts" on public.attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "own concept mastery" on public.concept_mastery for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.skills (id, title, description)
values ('communication', 'Confident communication', 'Speak clearly, ask better questions, and share ideas calmly.')
on conflict (id) do nothing;

insert into public.challenges (id, skill_id, slug, title, description, acceptance_criteria, hints)
values (
  'say-clear-thing',
  'communication',
  'say-clear-thing',
  'Say one clear thing',
  'Say one idea out loud as if you were sharing it with a teammate.',
  '["Say one idea in plain language.", "Use one concrete example.", "Name one next step."]'::jsonb,
  '["Start with the simplest version of the idea.", "Add one example a teammate would recognize.", "Finish with the next useful action."]'::jsonb
)
on conflict (id) do nothing;

