-- 050_feedback_applications.sql — the "Apply" evidence link for the Progress
-- Constellation. Additive. After 041 (numbers 042–049 are reserved by the
-- open core-loop / auth-onboarding packages).
--
-- A feedback_application records that a member took feedback they RECEIVED
-- and used it: planned → practiced (used in a follow-up practice) →
-- demonstrated (shown in a later proof). It is member-owned evidence, never
-- a trust writer (no points here — trust stays RPC-only per 023/027), and
-- node positions / presentation state are deliberately NOT stored: the
-- member's evidence remains the single source of truth.
--
-- Rollback: drop table public.feedback_applications; (policies drop with it).

-- 1) Table.
create table if not exists public.feedback_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  related_practice_completion_id uuid references public.practice_completions(id) on delete set null,
  related_proof_id uuid references public.proofs(id) on delete set null,
  reflection text,
  status text not null default 'planned'
    check (status in ('planned','practiced','demonstrated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One application per piece of feedback: "apply it" is a decision, not a feed.
  unique (user_id, feedback_id)
);

create index if not exists feedback_applications_user_idx
  on public.feedback_applications(user_id);
create index if not exists feedback_applications_feedback_idx
  on public.feedback_applications(feedback_id);

-- 2) RLS — strictly owner-scoped. The constellation is private by default;
--    there is no cohort read path on purpose.
alter table public.feedback_applications enable row level security;

drop policy if exists "feedback_applications_select_own" on public.feedback_applications;
create policy "feedback_applications_select_own" on public.feedback_applications
  for select to authenticated
  using (auth.uid() = user_id);

-- Insert integrity, all in WITH CHECK:
--   * row is owned by the caller;
--   * the feedback being applied was RECEIVED by the caller (recipient_id),
--     so you cannot mint "applied" evidence from feedback that isn't yours
--     to apply;
--   * optional related proof / practice completion must also belong to the
--     caller (no pointing your application at someone else's work).
drop policy if exists "feedback_applications_insert_own" on public.feedback_applications;
create policy "feedback_applications_insert_own" on public.feedback_applications
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feedback f
      where f.id = feedback_id and f.recipient_id = auth.uid()
    )
    and (
      related_proof_id is null
      or exists (
        select 1 from public.proofs p
        where p.id = related_proof_id and p.user_id = auth.uid()
      )
    )
    and (
      related_practice_completion_id is null
      or exists (
        select 1 from public.practice_completions pc
        where pc.id = related_practice_completion_id and pc.user_id = auth.uid()
      )
    )
  );

-- Update keeps the same integrity so related_* can't be re-pointed at
-- foreign rows after insert, and the row can't be re-owned.
drop policy if exists "feedback_applications_update_own" on public.feedback_applications;
create policy "feedback_applications_update_own" on public.feedback_applications
  for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.feedback f
      where f.id = feedback_id and f.recipient_id = auth.uid()
    )
    and (
      related_proof_id is null
      or exists (
        select 1 from public.proofs p
        where p.id = related_proof_id and p.user_id = auth.uid()
      )
    )
    and (
      related_practice_completion_id is null
      or exists (
        select 1 from public.practice_completions pc
        where pc.id = related_practice_completion_id and pc.user_id = auth.uid()
      )
    )
  );

drop policy if exists "feedback_applications_delete_own" on public.feedback_applications;
create policy "feedback_applications_delete_own" on public.feedback_applications
  for delete to authenticated
  using (auth.uid() = user_id);

-- 3) Column-level write grants (036 pattern): identity/link columns are
--    insert-only; a member may update only the fields the app legitimately
--    edits (status progression, reflection, related evidence links).
revoke insert, update on public.feedback_applications from authenticated, anon;

grant insert (
  user_id, feedback_id, related_practice_completion_id, related_proof_id,
  reflection, status
) on public.feedback_applications to authenticated;

grant update (
  status, reflection, related_practice_completion_id, related_proof_id,
  updated_at
) on public.feedback_applications to authenticated;
