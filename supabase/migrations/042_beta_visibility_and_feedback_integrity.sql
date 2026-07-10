-- 042_beta_visibility_and_feedback_integrity.sql — Package 0 (core-loop unblock).
-- Additive. After 041.
--
-- R1: canonical proof visibility. Real proofs were all written 'private' while
--   the cross-member SELECT policy only opened 'cohort' (demo rows) -> real
--   proofs were invisible and the peer-feedback step could not happen on real
--   data. Canonical vocabulary: private | selected_reviewers | beta_community.
--   'cohort' is backfilled to 'beta_community'; RLS is remapped. selected_
--   reviewers is a reserved value that stays owner-only (fail-closed) until the
--   reviewer table ships (Package 8).
-- R3/R4: feedback integrity — no self-feedback, no duplicate feedback.

-- 1) Canonicalize proof visibility.
update public.proofs set visibility = 'beta_community' where visibility = 'cohort';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'proofs_visibility_chk') then
    alter table public.proofs
      add constraint proofs_visibility_chk
      check (visibility in ('private','selected_reviewers','beta_community'));
  end if;
end$$;

-- 2) Remap the proofs SELECT policy (from 038/039): 'cohort' -> 'beta_community'.
--    Own proofs always visible; others only when beta_community + not blocked +
--    not pending/removed.
drop policy if exists "proofs_read_cohort_or_own" on public.proofs;
create policy "proofs_read_cohort_or_own" on public.proofs
  for select to authenticated
  using (
    auth.uid() = user_id
    or (
      visibility = 'beta_community'
      and moderation_status not in ('pending','removed')
      and not exists (
        select 1 from public.blocked_users b
         where (b.blocker_id = proofs.user_id and b.blocked_id = auth.uid())
            or (b.blocker_id = auth.uid() and b.blocked_id = proofs.user_id)
      )
    )
  );

-- 3) Remap the feedback SELECT policy (from 039): the cohort-visible branch now
--    reads beta_community. Giver always sees own; recipient + community only
--    when not pending/removed.
drop policy if exists "feedback_read_involved_or_cohort" on public.feedback;
create policy "feedback_read_involved_or_cohort" on public.feedback
  for select to authenticated
  using (
    auth.uid() = author_id
    or (
      moderation_status not in ('pending','removed')
      and (
        auth.uid() = recipient_id
        or exists (
          select 1 from public.proofs p
          where p.id = feedback.proof_id and p.visibility = 'beta_community'
        )
      )
    )
  );

-- 4) Feedback integrity. First remove any existing self-feedback (invalid rows
--    that self-minted trust), then constrain. Recompute affected authors.
do $$
declare r record;
begin
  for r in select distinct recipient_id from public.feedback where author_id = recipient_id loop
    delete from public.feedback where author_id = recipient_id and recipient_id = r.recipient_id;
    perform public._recompute_profile_counts(r.recipient_id);
  end loop;
end$$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'feedback_no_self_chk') then
    alter table public.feedback add constraint feedback_no_self_chk check (author_id <> recipient_id);
  end if;
end$$;

-- Collapse any pre-existing duplicates (keep earliest) so the unique index
-- can be created on databases that allowed dupes (no-op where none exist).
delete from public.feedback f using public.feedback g
 where f.author_id = g.author_id and f.proof_id = g.proof_id and f.ctid > g.ctid;

-- One feedback per author per proof (no duplicate-feedback trust farming).
create unique index if not exists feedback_author_proof_uidx
  on public.feedback (author_id, proof_id);
