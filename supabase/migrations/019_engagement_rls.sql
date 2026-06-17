-- Collective — RLS for the engagement layer. Mirrors migration 011 style.

alter table public.useful_marks enable row level security;
alter table public.saved_items enable row level security;
alter table public.member_connections enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- ---------- useful_marks ----------
drop policy if exists "useful_marks_insert_own" on public.useful_marks;
create policy "useful_marks_insert_own" on public.useful_marks
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.proofs p where p.id = target_id and p.user_id = auth.uid())
  );
drop policy if exists "useful_marks_read_cohort_or_own" on public.useful_marks;
create policy "useful_marks_read_cohort_or_own" on public.useful_marks
  for select to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.proofs p
      where p.id = useful_marks.target_id and (p.visibility = 'cohort' or p.user_id = auth.uid()))
  );
drop policy if exists "useful_marks_delete_own" on public.useful_marks;
create policy "useful_marks_delete_own" on public.useful_marks
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- saved_items (private) ----------
drop policy if exists "saved_items_insert_own" on public.saved_items;
create policy "saved_items_insert_own" on public.saved_items
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "saved_items_read_own" on public.saved_items;
create policy "saved_items_read_own" on public.saved_items
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "saved_items_delete_own" on public.saved_items;
create policy "saved_items_delete_own" on public.saved_items
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- member_connections ----------
drop policy if exists "member_connections_insert_own" on public.member_connections;
create policy "member_connections_insert_own" on public.member_connections
  for insert to authenticated with check (auth.uid() = learner_id);
drop policy if exists "member_connections_read_involved" on public.member_connections;
create policy "member_connections_read_involved" on public.member_connections
  for select to authenticated using (auth.uid() = learner_id or auth.uid() = teacher_id);
drop policy if exists "member_connections_update_own" on public.member_connections;
create policy "member_connections_update_own" on public.member_connections
  for update to authenticated using (auth.uid() = learner_id);
drop policy if exists "member_connections_delete_own" on public.member_connections;
create policy "member_connections_delete_own" on public.member_connections
  for delete to authenticated using (auth.uid() = learner_id);

-- ---------- conversations ----------
drop policy if exists "conversations_insert_as_initiator" on public.conversations;
create policy "conversations_insert_as_initiator" on public.conversations
  for insert to authenticated with check (auth.uid() = initiator_id);
drop policy if exists "conversations_read_participants" on public.conversations;
create policy "conversations_read_participants" on public.conversations
  for select to authenticated using (auth.uid() = initiator_id or auth.uid() = recipient_id);
drop policy if exists "conversations_update_participants" on public.conversations;
create policy "conversations_update_participants" on public.conversations
  for update to authenticated using (auth.uid() = initiator_id or auth.uid() = recipient_id);

-- ---------- messages ----------
drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (select 1 from public.conversations c
      where c.id = conversation_id and (c.initiator_id = auth.uid() or c.recipient_id = auth.uid()))
  );
drop policy if exists "messages_read_participant" on public.messages;
create policy "messages_read_participant" on public.messages
  for select to authenticated
  using (
    exists (select 1 from public.conversations c
      where c.id = messages.conversation_id and (c.initiator_id = auth.uid() or c.recipient_id = auth.uid()))
  );
