-- 050_intro_clips.sql — 30-second voice/video self-introduction clips. Additive.
--
-- A member records ONE short intro clip (voice or video, <=30s) shown on their
-- passport and to visitors of /member/[id]. Stored in a NEW PRIVATE bucket
-- `collective-intro-clips`; served via short-lived signed URLs.
--
-- Security model:
--   * intro_clip_* columns on profiles are SERVER-ONLY. They are deliberately
--     NOT added to the 036 client-write allowlist; clients write them only
--     through set_intro_clip / clear_intro_clip (SECURITY DEFINER).
--   * Storage read is gated by can_view_intro_clip(), which mirrors 037's
--     profile_details_select_members gate exactly (owner-always; else the
--     owner's introduction is members/public-visible AND no block either way).
--   * The clip is signed-in-members-only. 'public' intro text still means
--     members-only for the clip (it is voice/face): the read policy is
--     authenticated-only and can_view_intro_clip is revoked from anon. (051
--     additionally hardens can_view_intro_clip to return a clean false for a
--     null uid, and restricts reads to the profile's CURRENT clip object.)
--
-- CROSS-PACKAGE DEPENDENCY (documented, not silently dropped): when Package 4's
-- delete_own_account (currently an open PR, not on main) merges, it MUST also
-- (a) null the intro_clip_* columns and (b) remove the member's objects under
-- collective-intro-clips. This migration does not touch delete_own_account
-- because that function does not exist on main.

-- 1) Profile columns (server-only writable).
alter table public.profiles add column if not exists intro_clip_path text;
alter table public.profiles add column if not exists intro_clip_kind text
  check (intro_clip_kind in ('audio','video'));
alter table public.profiles add column if not exists intro_clip_duration_seconds int
  check (intro_clip_duration_seconds is null or (intro_clip_duration_seconds between 1 and 30));
alter table public.profiles add column if not exists intro_clip_updated_at timestamptz;

-- 2) Visibility helper — same gate as 037's profile_details read, plus owner.
--    Definer so the storage policy can evaluate it without recursive RLS on
--    profile_details / blocked_users.
create or replace function public.can_view_intro_clip(p_owner uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select
    p_owner is not null
    and (
      auth.uid() = p_owner
      or (
        exists (
          select 1 from public.profile_details d
           where d.user_id = p_owner
             and d.introduction_visibility in ('members','public')
        )
        and not exists (
          select 1 from public.blocked_users b
           where (b.blocker_id = p_owner   and b.blocked_id = auth.uid())
              or (b.blocker_id = auth.uid() and b.blocked_id = p_owner)
        )
      )
    );
$$;

revoke all on function public.can_view_intro_clip(uuid) from public, anon;
grant execute on function public.can_view_intro_clip(uuid) to authenticated;

-- 3) Set/replace the caller's own intro clip.
--    Validates kind, clamps duration to 1..30, requires the path to live in the
--    caller's own {uid}/... folder, and ensures a profile_details row exists so
--    the clip has a defined visibility (defaults 'members').
create or replace function public.set_intro_clip(p_path text, p_kind text, p_duration int)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_dur int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_kind is null or p_kind not in ('audio','video') then
    raise exception 'invalid clip kind';
  end if;
  if p_path is null or split_part(p_path, '/', 1) <> v_uid::text then
    raise exception 'clip path must be in your own folder';
  end if;
  v_dur := least(greatest(coalesce(p_duration, 1), 1), 30);

  insert into public.profile_details (user_id) values (v_uid)
    on conflict (user_id) do nothing;

  update public.profiles set
    intro_clip_path = p_path,
    intro_clip_kind = p_kind,
    intro_clip_duration_seconds = v_dur,
    intro_clip_updated_at = now(),
    updated_at = now()
  where id = v_uid;
end;
$$;

revoke all on function public.set_intro_clip(text, text, int) from public, anon;
grant execute on function public.set_intro_clip(text, text, int) to authenticated;

-- 4) Clear the caller's intro clip (after the object is removed client-side).
create or replace function public.clear_intro_clip()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  update public.profiles set
    intro_clip_path = null,
    intro_clip_kind = null,
    intro_clip_duration_seconds = null,
    intro_clip_updated_at = now(),
    updated_at = now()
  where id = v_uid;
end;
$$;

revoke all on function public.clear_intro_clip() from public, anon;
grant execute on function public.clear_intro_clip() to authenticated;

-- 5) Private bucket with a hard server-enforced size cap (~30s of audio/video)
--    and an audio/video-only mime allowlist.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'collective-intro-clips', 'collective-intro-clips', false,
  20971520,  -- 20 MB
  array[
    'audio/webm','audio/mp4','audio/mpeg','audio/ogg',
    'video/webm','video/mp4','video/quicktime'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 6) Storage RLS. Path convention: {uid}/intro/{timestamp}.{ext}
drop policy if exists "intro_clip_upload_own_folder" on storage.objects;
create policy "intro_clip_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'collective-intro-clips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "intro_clip_delete_own" on storage.objects;
create policy "intro_clip_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'collective-intro-clips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: authenticated only, authorized by the visibility helper. The uuid regex
-- guard avoids a cast error on any malformed object name.
drop policy if exists "intro_clip_read_visible" on storage.objects;
create policy "intro_clip_read_visible" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'collective-intro-clips'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.can_view_intro_clip(((storage.foldername(name))[1])::uuid)
  );
