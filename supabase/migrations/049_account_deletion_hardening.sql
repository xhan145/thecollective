-- 049_account_deletion_hardening.sql — Package 4 fixes from Codex review of 048.
-- Additive. After 048.
--   * Retain a clear proof if ANY of its feedback has an open report (else the
--     proof delete cascades and destroys reported-feedback evidence).
--   * Retain a clear tip if it has ANY tip_report (tip reports live in
--     tip_reports, have no status, and were not checked at all before).
--   * Remove the deleted member from cohort membership + join requests.
--   * Lock the anonymized profile: profiles_update_own now requires
--     deleted_at is null, so a still-valid owner token cannot rewrite the
--     anonymized fields that retained evidence depends on.

create or replace function public.delete_own_account(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_user_id is null then return false; end if;

  delete from public.notifications        where user_id = p_user_id;
  delete from public.saved_items          where user_id = p_user_id;
  delete from public.useful_marks         where user_id = p_user_id;
  delete from public.member_connections   where learner_id = p_user_id or teacher_id = p_user_id;
  delete from public.contributions        where contributor_id = p_user_id;
  delete from public.conversations        where initiator_id = p_user_id or recipient_id = p_user_id;
  delete from public.messages             where sender_id = p_user_id;
  delete from public.profile_details      where user_id = p_user_id;
  delete from public.ai_interactions      where user_id = p_user_id;
  delete from public.ai_user_feedback     where user_id = p_user_id;
  delete from public.app_feedback         where user_id = p_user_id;
  delete from public.introduction_requests where sender_id = p_user_id or receiver_id = p_user_id;
  delete from public.blocked_users        where blocker_id = p_user_id;
  delete from public.beta_events          where user_id = p_user_id;
  delete from public.user_settings        where user_id = p_user_id;
  delete from public.pinned_proofs        where user_id = p_user_id;
  delete from public.practice_completions where user_id = p_user_id;
  delete from public.cohort_members       where user_id = p_user_id;
  delete from public.cohort_join_requests where user_id = p_user_id;

  -- Own content, retaining anything moderation-flagged, open-reported, or (for
  -- proofs) carrying open-reported feedback (whose evidence would cascade away).
  delete from public.practice_tips t where t.author_id = p_user_id and t.moderation_status = 'clear'
    and not exists (select 1 from public.tip_reports tr where tr.tip_id = t.id);
  delete from public.feedback f where f.author_id = p_user_id and f.moderation_status = 'clear'
    and not exists (select 1 from public.reports r where r.target_type = 'feedback' and r.target_id = f.id and r.status = 'open');
  delete from public.proofs p where p.user_id = p_user_id and p.moderation_status = 'clear'
    and not exists (select 1 from public.reports r where r.target_type = 'proof' and r.target_id = p.id and r.status = 'open')
    and not exists (
      select 1 from public.feedback f
      join public.reports r on r.target_type = 'feedback' and r.target_id = f.id and r.status = 'open'
      where f.proof_id = p.id
    );

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

revoke all on function public.delete_own_account(uuid) from public, anon, authenticated;

-- Lock the anonymized profile against client rewrites (definer RPCs bypass RLS).
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id and deleted_at is null)
  with check (auth.uid() = id and deleted_at is null);
