-- Collective Web Beta — row-level security.
-- Closed-beta posture: authenticated members form one trusted cohort.

alter table public.profiles enable row level security;
alter table public.proofs enable row level security;
alter table public.proof_attachments enable row level security;
alter table public.feedback enable row level security;
alter table public.trust_events enable row level security;
alter table public.practice_completions enable row level security;
alter table public.app_feedback enable row level security;
alter table public.ai_interactions enable row level security;
alter table public.ai_user_feedback enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_read_authenticated" on public.profiles;
create policy "profiles_read_authenticated" on public.profiles
  for select to authenticated using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- ---------- proofs ----------
-- Members can read cohort proofs (the feed); always read your own.
drop policy if exists "proofs_read_cohort_or_own" on public.proofs;
create policy "proofs_read_cohort_or_own" on public.proofs
  for select to authenticated
  using (visibility = 'cohort' or auth.uid() = user_id);
drop policy if exists "proofs_insert_own" on public.proofs;
create policy "proofs_insert_own" on public.proofs
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "proofs_update_own" on public.proofs;
create policy "proofs_update_own" on public.proofs
  for update to authenticated using (auth.uid() = user_id);
drop policy if exists "proofs_delete_own" on public.proofs;
create policy "proofs_delete_own" on public.proofs
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- proof_attachments ----------
drop policy if exists "attachments_read_with_proof" on public.proof_attachments;
create policy "attachments_read_with_proof" on public.proof_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.proofs p
      where p.id = proof_attachments.proof_id
        and (p.visibility = 'cohort' or p.user_id = auth.uid())
    )
  );
drop policy if exists "attachments_insert_own_proof" on public.proof_attachments;
create policy "attachments_insert_own_proof" on public.proof_attachments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.proofs p
      where p.id = proof_id and p.user_id = auth.uid()
    )
  );

-- ---------- feedback ----------
drop policy if exists "feedback_insert_as_author" on public.feedback;
create policy "feedback_insert_as_author" on public.feedback
  for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "feedback_read_involved_or_cohort" on public.feedback;
create policy "feedback_read_involved_or_cohort" on public.feedback
  for select to authenticated
  using (
    auth.uid() = author_id
    or auth.uid() = recipient_id
    or exists (
      select 1 from public.proofs p
      where p.id = feedback.proof_id and p.visibility = 'cohort'
    )
  );
-- Recipients may mark feedback helpful.
drop policy if exists "feedback_update_as_recipient" on public.feedback;
create policy "feedback_update_as_recipient" on public.feedback
  for update to authenticated using (auth.uid() = recipient_id);

-- ---------- trust_events ----------
-- Insert/read your own. (Cross-user "helpful" credit is recorded under the
-- giver's id by the recipient's client; allow insert for authenticated and
-- keep reads scoped to the owner.)
drop policy if exists "trust_events_insert_authenticated" on public.trust_events;
create policy "trust_events_insert_authenticated" on public.trust_events
  for insert to authenticated with check (true);
drop policy if exists "trust_events_read_own" on public.trust_events;
create policy "trust_events_read_own" on public.trust_events
  for select to authenticated using (auth.uid() = user_id);

-- ---------- practice_completions ----------
drop policy if exists "completions_insert_own" on public.practice_completions;
create policy "completions_insert_own" on public.practice_completions
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "completions_read_own" on public.practice_completions;
create policy "completions_read_own" on public.practice_completions
  for select to authenticated using (auth.uid() = user_id);

-- ---------- app_feedback ----------
drop policy if exists "app_feedback_insert_own" on public.app_feedback;
create policy "app_feedback_insert_own" on public.app_feedback
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "app_feedback_read_own" on public.app_feedback;
create policy "app_feedback_read_own" on public.app_feedback
  for select to authenticated using (auth.uid() = user_id);

-- ---------- ai_interactions ----------
drop policy if exists "ai_interactions_insert_own" on public.ai_interactions;
create policy "ai_interactions_insert_own" on public.ai_interactions
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "ai_interactions_read_own" on public.ai_interactions;
create policy "ai_interactions_read_own" on public.ai_interactions
  for select to authenticated using (auth.uid() = user_id);

-- ---------- ai_user_feedback ----------
drop policy if exists "ai_user_feedback_insert_own" on public.ai_user_feedback;
create policy "ai_user_feedback_insert_own" on public.ai_user_feedback
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "ai_user_feedback_read_own" on public.ai_user_feedback;
create policy "ai_user_feedback_read_own" on public.ai_user_feedback
  for select to authenticated using (auth.uid() = user_id);

-- ---------- auto-create a profile when an auth user is created ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, initials)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'Member'),
    upper(left(coalesce(split_part(new.email, '@', 1), 'M'), 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
