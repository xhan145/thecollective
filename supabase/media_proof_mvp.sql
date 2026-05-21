create table if not exists public.proof_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  title text not null,
  reflection_text text not null,
  media_url text,
  media_type text not null default 'none' check (media_type in ('image', 'video', 'none')),
  media_thumbnail_url text,
  practice_area text not null,
  visibility text not null default 'private' check (visibility in ('private', 'feedback-only', 'public')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'feedback_received', 'archived')),
  ai_summary text,
  feedback_count integer not null default 0,
  trust_weight integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references public.proof_submissions(id) on delete cascade,
  reviewer_id uuid references public.profiles(id),
  feedback_text text not null,
  feedback_type text not null check (feedback_type in ('encouragement', 'suggestion', 'correction', 'question')),
  helpful_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  source_type text not null check (source_type in ('proof_submission', 'feedback_given', 'feedback_received', 'contribution')),
  source_id uuid not null,
  points integer not null default 0,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists proof_submissions_created_at_idx on public.proof_submissions (created_at desc);
create index if not exists feedback_proof_id_idx on public.feedback (proof_id);
create index if not exists trust_events_user_id_idx on public.trust_events (user_id);
