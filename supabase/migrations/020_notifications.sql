-- Collective — notifications + the core "others get notified" loop.
-- Notifications are created by SECURITY DEFINER triggers (so a member can
-- trigger a notification for someone else without an insert policy), read by
-- the recipient only, and streamed via Supabase Realtime.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,   -- recipient
  actor_id uuid references public.profiles(id) on delete set null,          -- who caused it
  type text not null,                                                       -- proof | feedback | useful | learn_from | message
  title text not null,
  body text,
  source_type text,
  source_id uuid,
  read_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;
drop policy if exists "notifications_read_own" on public.notifications;
create policy "notifications_read_own" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (auth.uid() = user_id);
-- No INSERT policy: only the SECURITY DEFINER triggers below create rows.

-- ---------- fan-out triggers ----------

create or replace function public.notify_on_proof()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_name text;
begin
  if new.is_demo then return new; end if;
  select display_name into actor_name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
  select mc.learner_id, new.user_id, 'proof',
         coalesce(actor_name, 'A member') || ' shared new proof', new.title, 'proof', new.id
  from public.member_connections mc
  where mc.teacher_id = new.user_id and mc.status = 'active' and mc.learner_id <> new.user_id;
  return new;
end; $$;
drop trigger if exists trg_notify_on_proof on public.proofs;
create trigger trg_notify_on_proof after insert on public.proofs
  for each row execute function public.notify_on_proof();

create or replace function public.notify_on_feedback()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_name text;
begin
  if new.is_demo or new.author_id = new.recipient_id then return new; end if;
  select display_name into actor_name from public.profiles where id = new.author_id;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
  values (new.recipient_id, new.author_id, 'feedback',
          coalesce(actor_name, 'A member') || ' left feedback on your proof',
          coalesce(new.clarity_note, new.body), 'proof', new.proof_id);
  return new;
end; $$;
drop trigger if exists trg_notify_on_feedback on public.feedback;
create trigger trg_notify_on_feedback after insert on public.feedback
  for each row execute function public.notify_on_feedback();

create or replace function public.notify_on_useful()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_name text; owner_id uuid;
begin
  if new.is_demo then return new; end if;
  select user_id into owner_id from public.proofs where id = new.target_id;
  if owner_id is null or owner_id = new.user_id then return new; end if;
  select display_name into actor_name from public.profiles where id = new.user_id;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
  values (owner_id, new.user_id, 'useful',
          coalesce(actor_name, 'A member') || ' found your proof useful', null, 'proof', new.target_id);
  return new;
end; $$;
drop trigger if exists trg_notify_on_useful on public.useful_marks;
create trigger trg_notify_on_useful after insert on public.useful_marks
  for each row execute function public.notify_on_useful();

create or replace function public.notify_on_connection()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_name text;
begin
  if new.is_demo or new.status <> 'active' then return new; end if;
  select display_name into actor_name from public.profiles where id = new.learner_id;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
  values (new.teacher_id, new.learner_id, 'learn_from',
          coalesce(actor_name, 'A member') || ' is learning from you', null, 'profile', new.learner_id);
  return new;
end; $$;
drop trigger if exists trg_notify_on_connection on public.member_connections;
create trigger trg_notify_on_connection after insert on public.member_connections
  for each row execute function public.notify_on_connection();

create or replace function public.notify_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_name text; conv record; recipient uuid;
begin
  if new.is_demo then return new; end if;
  select * into conv from public.conversations where id = new.conversation_id;
  if conv is null then return new; end if;
  recipient := case when new.sender_id = conv.initiator_id then conv.recipient_id else conv.initiator_id end;
  if recipient is null or recipient = new.sender_id then return new; end if;
  select display_name into actor_name from public.profiles where id = new.sender_id;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
  values (recipient, new.sender_id, 'message',
          coalesce(actor_name, 'A member') ||
            (case when conv.kind = 'feedback_request' then ' requested feedback' else ' sent you a peer note' end),
          new.body, 'conversation', new.conversation_id);
  return new;
end; $$;
drop trigger if exists trg_notify_on_message on public.messages;
create trigger trg_notify_on_message after insert on public.messages
  for each row execute function public.notify_on_message();

-- ---------- realtime ----------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
