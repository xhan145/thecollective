-- 037_privacy_enforcement.sql — make the privacy backend (034) real. Additive.
-- A) Members can read each other's guided introductions when the owner's
--    visibility allows it — never across a block (either direction).
-- B) Introduction requests are server-guarded: no self-requests, no requests
--    across a block, receiver must be open to introductions.
-- C) Notifications: receiver notified on a new request; sender notified when
--    the receiver accepts.

-- A) Visibility-aware introduction reads (ORs with the read-own policy).
drop policy if exists profile_details_select_members on public.profile_details;
create policy profile_details_select_members on public.profile_details
  for select to authenticated
  using (
    introduction_visibility in ('members', 'public')
    and not exists (
      select 1 from public.blocked_users b
       where (b.blocker_id = profile_details.user_id and b.blocked_id = auth.uid())
          or (b.blocker_id = auth.uid() and b.blocked_id = profile_details.user_id)
    )
  );

-- B) Guarded request creation (replaces the 034 sender-only check).
drop policy if exists intro_requests_insert_sender on public.introduction_requests;
create policy intro_requests_insert_sender on public.introduction_requests
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and sender_id <> receiver_id
    and not exists (
      select 1 from public.blocked_users b
       where (b.blocker_id = receiver_id and b.blocked_id = sender_id)
          or (b.blocker_id = sender_id and b.blocked_id = receiver_id)
    )
    and exists (
      select 1 from public.profiles p
       where p.id = receiver_id and p.open_to_introductions = true
    )
  );

-- C) Notifications for the request lifecycle.
create or replace function public.notify_on_intro_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_name text;
begin
  if tg_op = 'INSERT' then
    select display_name into actor_name from public.profiles where id = new.sender_id;
    insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
    values (new.receiver_id, new.sender_id, 'introduction',
            coalesce(actor_name, 'A member') || ' asked for an introduction',
            left(new.message, 140), 'introduction', new.id);
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status = 'pending' then
    select display_name into actor_name from public.profiles where id = new.receiver_id;
    insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
    values (new.sender_id, new.receiver_id, 'introduction',
            coalesce(actor_name, 'A member') || ' accepted your introduction',
            'You can now send them a note.', 'introduction', new.id);
  end if;
  return new;
end; $$;

drop trigger if exists intro_request_notify on public.introduction_requests;
create trigger intro_request_notify
  after insert or update on public.introduction_requests
  for each row execute function public.notify_on_intro_request();

revoke all on function public.notify_on_intro_request() from public, anon, authenticated;
