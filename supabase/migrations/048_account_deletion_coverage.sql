-- 048_account_deletion_coverage.sql — Package 4 (R9) fix from adversarial review.
-- 046 left several PII tables behind and could destroy evidence. This re-declares
-- delete_own_account to (a) cover all personal/communication data, (b) scrub the
-- denormalized real name in ai_user_feedback, and (c) retain content that has an
-- OPEN report (not just pending/removed) so pre-threshold moderation evidence is
-- never destroyed. Retained as before: reports, trust_events, moderation-flagged
-- content, and blocks filed AGAINST the user. Additive. After 047.
create or replace function public.delete_own_account(p_user_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_user_id is null then return false; end if;

  -- Solo personal data + private communication (no evidence value).
  delete from public.notifications        where user_id = p_user_id;
  delete from public.saved_items          where user_id = p_user_id;
  delete from public.useful_marks         where user_id = p_user_id;
  delete from public.member_connections   where learner_id = p_user_id or teacher_id = p_user_id;
  delete from public.contributions        where contributor_id = p_user_id;
  delete from public.conversations        where initiator_id = p_user_id or recipient_id = p_user_id; -- cascades messages
  delete from public.messages             where sender_id = p_user_id;  -- any not caught by conversation cascade
  delete from public.profile_details      where user_id = p_user_id;
  delete from public.ai_interactions      where user_id = p_user_id;
  delete from public.ai_user_feedback     where user_id = p_user_id;    -- also drops the denormalized display name
  delete from public.app_feedback         where user_id = p_user_id;
  delete from public.introduction_requests where sender_id = p_user_id or receiver_id = p_user_id;
  delete from public.blocked_users        where blocker_id = p_user_id; -- retain blocks filed AGAINST them (evidence)
  delete from public.beta_events          where user_id = p_user_id;
  delete from public.user_settings        where user_id = p_user_id;
  delete from public.pinned_proofs        where user_id = p_user_id;
  delete from public.practice_completions where user_id = p_user_id;

  -- Own content, but retain anything moderation-flagged OR with an open report.
  delete from public.practice_tips t where t.author_id = p_user_id and t.moderation_status = 'clear'
    and not exists (select 1 from public.reports r where r.target_type = 'feedback' and r.target_id = t.id and r.status = 'open');
  delete from public.feedback f where f.author_id = p_user_id and f.moderation_status = 'clear'
    and not exists (select 1 from public.reports r where r.target_type = 'feedback' and r.target_id = f.id and r.status = 'open');
  delete from public.proofs p where p.user_id = p_user_id and p.moderation_status = 'clear'
    and not exists (select 1 from public.reports r where r.target_type = 'proof' and r.target_id = p.id and r.status = 'open');

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
