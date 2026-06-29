-- Collective — Content Mastery System schema (Architecture A).
-- Additive: run after 010-029. Adds a skills tier and enriches practices so
-- each row is a mastery level. All addressing stays string-based on prompt_id
-- (= practices.slug), so existing proofs/completions/trust/tips/AI are unaffected.

create extension if not exists "pgcrypto";

-- 1) skills: the tier between directions and practices.
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.directions(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (direction_id, slug)
);
create index if not exists skills_direction_idx on public.skills(direction_id);

alter table public.skills enable row level security;
drop policy if exists "skills_read_active" on public.skills;
create policy "skills_read_active" on public.skills
  for select to anon, authenticated using (is_active = true);

-- 2) practices: each row becomes a mastery level.
alter table public.practices
  add column if not exists skill_id uuid references public.skills(id) on delete cascade,
  add column if not exists slug text,
  add column if not exists level_number integer,
  add column if not exists level_name text,
  add column if not exists mastery_goal text,
  add column if not exists proof_type text
    check (proof_type in ('text','image','video','audio','mixed')),
  add column if not exists feedback_rubric jsonb,
  add column if not exists ai_prep_prompt text,
  add column if not exists ai_reflection_prompt text,
  add column if not exists next_step text,
  add column if not exists trust_signal text,
  add column if not exists does_not_count_as_mastery text,
  add column if not exists safety_note text,
  add column if not exists difficulty text,
  add column if not exists feed_tags text[] not null default '{}';

create unique index if not exists practices_slug_uidx
  on public.practices(slug) where slug is not null;
create unique index if not exists practices_skill_level_uidx
  on public.practices(skill_id, level_number) where skill_id is not null;

-- 3) feedback: optional structured rubric capture (freeform body stays primary).
alter table public.feedback
  add column if not exists rubric jsonb;

-- 4) proofs: denormalized feed tags copied from the level at submission.
alter table public.proofs
  add column if not exists tags text[] not null default '{}';
