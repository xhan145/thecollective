-- 051_intro_clip_current_only.sql — harden intro-clip reads (adversarial review). Additive. After 050.
--
-- Two minor findings from review:
--  (1) The 050 storage read policy is folder-scoped: it authorizes ANY object
--      under {uid}/intro/, not just the profile's CURRENT intro_clip_path. So a
--      replaced/removed clip whose best-effort delete silently failed stays
--      readable/listable by authorized members. Fix: also require the object to
--      be the profile's current intro_clip_path, making orphans truly unreadable.
--  (2) can_view_intro_clip returned TRUE for a null auth.uid() (anon-safety
--      rested only on the `to authenticated` clause + anon revoke). Add an
--      explicit auth.uid() is not null guard for defense in depth.

-- Owner's currently-referenced clip only.
create or replace function public.is_current_intro_clip(p_owner uuid, p_name text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.profiles
     where id = p_owner and intro_clip_path = p_name
  );
$$;
revoke all on function public.is_current_intro_clip(uuid, text) from public, anon;
grant execute on function public.is_current_intro_clip(uuid, text) to authenticated;

-- Recreate the visibility helper with an explicit non-null uid guard.
create or replace function public.can_view_intro_clip(p_owner uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select
    p_owner is not null
    and (
      coalesce(auth.uid() = p_owner, false)
      or (
        auth.uid() is not null
        and exists (
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

-- Read: authorized viewer AND the object is the owner's current clip (orphans
-- become unreadable the moment the profile stops pointing at them).
drop policy if exists "intro_clip_read_visible" on storage.objects;
create policy "intro_clip_read_visible" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'collective-intro-clips'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.can_view_intro_clip(((storage.foldername(name))[1])::uuid)
    and public.is_current_intro_clip(((storage.foldername(name))[1])::uuid, name)
  );
