-- Collective — demo population metadata (second-tier demo layer). Additive.
-- Run after 010–015. Safe to re-run. Every demo row carries is_demo=true and
-- demo_cohort='second-tier-demo-v1' so it is identifiable and cleanly removable.

-- ---------- profiles ----------
alter table public.profiles add column if not exists is_demo boolean not null default false;
alter table public.profiles add column if not exists demo_persona text;
alter table public.profiles add column if not exists demo_sort_order integer not null default 0;
alter table public.profiles add column if not exists demo_cohort text;
alter table public.profiles add column if not exists demo_avatar_seed text;

-- ---------- proofs ----------
alter table public.proofs add column if not exists is_demo boolean not null default false;
alter table public.proofs add column if not exists demo_seed_id text;
alter table public.proofs add column if not exists thumbnail_url text;
alter table public.proofs add column if not exists media_kind text;
alter table public.proofs add column if not exists demo_quality text;

-- ---------- practice_completions (this app's practice log) ----------
alter table public.practice_completions add column if not exists is_demo boolean not null default false;
alter table public.practice_completions add column if not exists demo_seed_id text;

-- ---------- feedback ----------
alter table public.feedback add column if not exists is_demo boolean not null default false;
alter table public.feedback add column if not exists demo_seed_id text;

-- ---------- trust_events ----------
alter table public.trust_events add column if not exists is_demo boolean not null default false;
alter table public.trust_events add column if not exists demo_seed_id text;

-- ---------- app_feedback ----------
alter table public.app_feedback add column if not exists is_demo boolean not null default false;

-- ---------- indexes ----------
create index if not exists profiles_is_demo_idx on public.profiles(is_demo);
create index if not exists profiles_demo_cohort_idx on public.profiles(demo_cohort);
create index if not exists profiles_current_direction_idx on public.profiles(current_direction_id);
create index if not exists proofs_is_demo_idx on public.proofs(is_demo);
create index if not exists proofs_direction_idx on public.proofs(direction_id);
create index if not exists proofs_visibility_idx on public.proofs(visibility);
create index if not exists proofs_demo_seed_idx on public.proofs(demo_seed_id);
create index if not exists practice_completions_is_demo_idx on public.practice_completions(is_demo);
create index if not exists feedback_is_demo_idx on public.feedback(is_demo);
create index if not exists feedback_proof_idx2 on public.feedback(proof_id);
create index if not exists trust_events_is_demo_idx on public.trust_events(is_demo);

-- Demo proofs are visible to the cohort feed by default.
-- (No RLS change needed: existing "proofs_read_cohort_or_own" already covers
--  visibility = 'cohort'.)
