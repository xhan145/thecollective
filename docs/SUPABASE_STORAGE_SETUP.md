# Supabase Storage Setup

V9 plans for private proof media uploads without requiring Supabase during demo mode.

## Bucket

Create a private Supabase Storage bucket named:

```text
proof-media
```

Do not make proof uploads public by default. Proof can include sensitive voice, video, screenshots, documents, or links.

## Database Storage Pattern

Store only storage paths and metadata in the database. Do not store public URLs. Use signed URLs for temporary viewing later.

Recommended metadata table:

```sql
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
```

For the image/video proof MVP, also see `supabase/media_proof_mvp.sql`. It adds prototype-ready tables for:

- `proof_submissions`
- `feedback`
- `trust_events`

## Policy Notes

- Keep the bucket private.
- Enforce RLS on proof submissions and proof_media.
- Use signed URLs for temporary viewing by the proof owner, selected reviewers, path members, or admins.
- Add storage policies after the auth model is finalized.
- Add moderation before making media visible beyond private or selected-reviewer scopes.
