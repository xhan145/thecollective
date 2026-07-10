-- 047_self_feedback_and_trust_cleanup.sql — Package 0 fix from external review.
-- Additive. After 046 (on prod; on this branch it follows 044).
--
-- (a) The 042 CHECK(author_id <> recipient_id) does NOT actually prevent
--     self-feedback: a member can feedback their OWN proof by setting
--     recipient_id to a different profile, which passes the check while
--     record_feedback_trust still credits them. Real rule: the feedback author
--     must not own the proof. Enforce with a BEFORE INSERT trigger + clean any
--     existing violations.
-- (b) Trust events minted by removed self-feedback (042 cleanup / this cleanup)
--     still summed into trust_score because _recompute derives from trust_events.
--     Delete feedback-sourced trust events whose feedback row no longer exists,
--     then recompute affected users so inflated reputations correct.

-- (a) Reject feedback where the author owns the target proof.
create or replace function public._reject_self_feedback()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.proofs p where p.id = new.proof_id and p.user_id = new.author_id) then
    raise exception 'CANNOT_FEEDBACK_OWN_PROOF';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_reject_self_feedback on public.feedback;
create trigger trg_reject_self_feedback before insert on public.feedback
  for each row execute function public._reject_self_feedback();
revoke all on function public._reject_self_feedback() from public, anon, authenticated;

-- Remove existing self-feedback (author owns the proof), retaining moderation-
-- flagged rows as evidence.
delete from public.feedback f
 where f.moderation_status = 'clear'
   and exists (select 1 from public.proofs p where p.id = f.proof_id and p.user_id = f.author_id);

-- (b) Clean orphaned feedback-sourced trust events + recompute affected users.
do $$
declare r record;
begin
  create temp table _te_affected on commit drop as
    select distinct user_id from public.trust_events
     where type in ('peer-feedback','helpful') and source_id is not null
       and not exists (select 1 from public.feedback f where f.id::text = source_id);
  delete from public.trust_events
   where type in ('peer-feedback','helpful') and source_id is not null
     and not exists (select 1 from public.feedback f where f.id::text = source_id);
  for r in select user_id from _te_affected loop
    perform public._recompute_profile_counts(r.user_id);
  end loop;
end$$;
