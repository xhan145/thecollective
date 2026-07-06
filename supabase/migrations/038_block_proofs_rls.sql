-- 038_block_proofs_rls.sql — complete the blocking promise server-side.
-- 037 stopped requests + hid introductions across blocks; the blocker's
-- PROOFS were still readable by the blocked member (client-side filtering
-- only hid the reverse direction). Recreate the proofs select policy with a
-- block exclusion in BOTH directions. Own proofs remain always self-visible;
-- service-role paths (seeds/admin) bypass RLS as before.
drop policy if exists "proofs_read_cohort_or_own" on public.proofs;
create policy "proofs_read_cohort_or_own" on public.proofs
  for select to authenticated
  using (
    auth.uid() = user_id
    or (
      visibility = 'cohort'
      and not exists (
        select 1 from public.blocked_users b
         where (b.blocker_id = proofs.user_id and b.blocked_id = auth.uid())
            or (b.blocker_id = auth.uid() and b.blocked_id = proofs.user_id)
      )
    )
  );
