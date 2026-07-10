-- 046_account_deletion.sql — Package 4 (R9). Additive. After 045.
-- Self-serve account deletion as a SAFE SOFT-DELETE: anonymize the profile
-- (scrub PII, stamp deleted_at, revoke beta access), delete the member's solo
-- personal data + their non-moderated ('clear') content, and RETAIN moderation
-- evidence + audit (reports, trust_events, and any content under moderation:
-- pending/removed). The auth user is NOT hard-deleted (that would cascade via
-- profiles and destroy retained evidence); the delete route bans re-login.
-- Proof-media storage objects are orphaned (bucket is private, 043) and swept
-- by the abandoned-upload cleanup planned in Package 7.

alter table public.profiles add column if not exists deleted_at timestamptz;

create or replace function public.delete_own_account(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_user_id is null then return false; end if;

  -- Solo personal data (no evidence value).
  delete from public.notifications      where user_id = p_user_id;
  delete from public.saved_items        where user_id = p_user_id;
  delete from public.useful_marks       where user_id = p_user_id;
  delete from public.member_connections where learner_id = p_user_id or teacher_id = p_user_id;
  delete from public.contributions      where contributor_id = p_user_id;

  -- Own content, but keep anything under moderation as evidence.
  delete from public.practice_tips where author_id = p_user_id and moderation_status = 'clear';
  delete from public.feedback      where author_id = p_user_id and moderation_status = 'clear';
  delete from public.proofs        where user_id   = p_user_id and moderation_status = 'clear';
  -- (proofs cascade proof_attachments + feedback on those proofs; pending/removed
  --  proofs/feedback/tips are retained with the now-anonymized author.)

  -- Anonymize the profile (retain the row so FK + evidence linkage survive).
  update public.profiles set
    display_name = 'Former member',
    initials = '—',
    username = null, bio = null, avatar_url = null,
    headline = null, current_focus_skill = null, introduction_summary = null,
    goal_text = null, open_to_introductions = false, mentor_opt_in = false,
    beta_access = false,
    deleted_at = now(),
    updated_at = now()
  where id = p_user_id;

  return true;
end;
$$;

-- Service-only: the /api/account/delete route (which authenticates the user)
-- calls this with the service key + the user's own id, then bans re-login.
revoke all on function public.delete_own_account(uuid) from public, anon, authenticated;
