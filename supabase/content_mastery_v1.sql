-- Collective Content Mastery Table v1.
create extension if not exists "pgcrypto";

create table if not exists public.content_directions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.content_skills (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid references public.content_directions(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  unique(direction_id, slug)
);

create table if not exists public.content_mastery_levels (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references public.content_skills(id) on delete cascade,
  level_number int not null,
  level_name text not null,
  mastery_goal text not null,
  practice_prompt text not null,
  proof_requirement text not null,
  proof_type text not null,
  ai_prep_prompt text,
  ai_reflection_prompt text,
  next_step text,
  feed_tags text[] default '{}',
  trust_signal text,
  estimated_minutes int,
  difficulty text,
  safety_note text,
  does_not_count_as_mastery text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  unique(skill_id, level_number)
);

create table if not exists public.content_feedback_rubrics (
  id uuid primary key default gen_random_uuid(),
  mastery_level_id uuid references public.content_mastery_levels(id) on delete cascade,
  clarity text,
  effort text,
  usefulness text,
  next_step text,
  created_at timestamptz default now(),
  unique(mastery_level_id)
);

create table if not exists public.user_mastery_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  direction_id uuid references public.content_directions(id),
  skill_id uuid references public.content_skills(id),
  mastery_level_id uuid references public.content_mastery_levels(id),
  status text not null default 'not_started',
  completed_practice_count int not null default 0,
  submitted_proof_count int not null default 0,
  useful_feedback_count int not null default 0,
  helped_someone_count int not null default 0,
  last_practiced_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, mastery_level_id)
);

create table if not exists public.proof_mastery_assessments (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null,
  mastery_level_id uuid references public.content_mastery_levels(id),
  reviewer_id uuid references auth.users(id) on delete set null,
  clarity_score int,
  effort_score int,
  usefulness_score int,
  next_step_note text,
  is_useful_feedback boolean default false,
  created_at timestamptz default now()
);

alter table public.content_directions enable row level security;
alter table public.content_skills enable row level security;
alter table public.content_mastery_levels enable row level security;
alter table public.content_feedback_rubrics enable row level security;
alter table public.user_mastery_progress enable row level security;
alter table public.proof_mastery_assessments enable row level security;

create policy if not exists "read active content directions" on public.content_directions for select using (is_active = true);
create policy if not exists "read active content skills" on public.content_skills for select using (is_active = true);
create policy if not exists "read active content mastery levels" on public.content_mastery_levels for select using (is_active = true);
create policy if not exists "read content feedback rubrics" on public.content_feedback_rubrics for select using (true);

create policy if not exists "read own mastery progress" on public.user_mastery_progress for select using (auth.uid() = user_id);
create policy if not exists "insert own mastery progress" on public.user_mastery_progress for insert with check (auth.uid() = user_id);
create policy if not exists "update own mastery progress" on public.user_mastery_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "read own proof mastery assessments" on public.proof_mastery_assessments for select using (auth.uid() = reviewer_id);
create policy if not exists "insert own proof mastery assessments" on public.proof_mastery_assessments for insert with check (auth.uid() = reviewer_id);

create index if not exists content_skills_direction_idx on public.content_skills(direction_id, sort_order);
create index if not exists content_mastery_levels_skill_idx on public.content_mastery_levels(skill_id, level_number);
create index if not exists user_mastery_progress_user_idx on public.user_mastery_progress(user_id, status);
create index if not exists proof_mastery_assessments_proof_idx on public.proof_mastery_assessments(proof_id);

