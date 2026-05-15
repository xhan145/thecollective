-- V8 multimodal proof media metadata.
-- Create a private Supabase Storage bucket named proof-media before enabling real uploads.

create table if not exists public.proof_media (
  id uuid primary key default gen_random_uuid(),
  proof_submission_id uuid references public.proof_submissions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  bucket text not null default 'proof-media',
  storage_path text not null,
  file_name text,
  file_type text,
  file_size bigint,
  media_kind text,
  thumbnail_url text,
  duration_seconds integer,
  created_at timestamptz default now()
);

alter table public.proof_media enable row level security;

-- Keep policies conservative until the full reviewer/path visibility model is implemented.
create policy if not exists "own proof media"
on public.proof_media
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
