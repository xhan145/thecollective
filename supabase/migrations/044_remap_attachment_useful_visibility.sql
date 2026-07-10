-- 044_remap_attachment_useful_visibility.sql — Package 0 follow-up. Additive.
-- Adversarial review of 042 found the cohort->beta_community remap was
-- incomplete: two SELECT policies still gated cross-member reads on the now-
-- dead literal visibility='cohort' (042 backfilled every row off 'cohort' and
-- forbids it via CHECK), so after 042 they collapsed to owner-only:
--   * proof_attachments (011) -> peers couldn't load a beta_community proof's
--     attachment row, so its image never displayed (breaks image proof).
--   * useful_marks (019) -> peer useful-mark ranking signal silently lost.
-- Remap both to 'beta_community' and, while here, make them block- and
-- moderation-aware so they exactly mirror the proofs SELECT gate (038/039/042).

drop policy if exists "attachments_read_with_proof" on public.proof_attachments;
create policy "attachments_read_with_proof" on public.proof_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.proofs p
      where p.id = proof_attachments.proof_id
        and (
          p.user_id = auth.uid()
          or (
            p.visibility = 'beta_community'
            and p.moderation_status not in ('pending','removed')
            and not exists (
              select 1 from public.blocked_users b
               where (b.blocker_id = p.user_id and b.blocked_id = auth.uid())
                  or (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
            )
          )
        )
    )
  );

drop policy if exists "useful_marks_read_cohort_or_own" on public.useful_marks;
create policy "useful_marks_read_cohort_or_own" on public.useful_marks
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.proofs p
      where p.id = useful_marks.target_id
        and (
          p.user_id = auth.uid()
          or (
            p.visibility = 'beta_community'
            and p.moderation_status not in ('pending','removed')
            and not exists (
              select 1 from public.blocked_users b
               where (b.blocker_id = p.user_id and b.blocked_id = auth.uid())
                  or (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
            )
          )
        )
    )
  );
