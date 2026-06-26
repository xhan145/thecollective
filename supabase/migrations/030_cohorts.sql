-- 030_cohorts.sql — focused practice groups (additive). After 029.
-- Server-enforced: all membership/role writes via SECURITY DEFINER RPCs; tables deny client writes.

-- 1) Tables.
create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  direction_id text,
  visibility text not null check (visibility in ('public','request','invite')),
  accent text,
  owner_id uuid references public.profiles(id) on delete set null,
  is_demo boolean not null default false,
  demo_cohort text,
  demo_seed_id text,
  created_at timestamptz not null default now()
);
create index if not exists cohorts_direction_idx on public.cohorts(direction_id);
create unique index if not exists cohorts_demo_seed_uidx on public.cohorts(demo_seed_id) where demo_seed_id is not null;

create table if not exists public.cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','member')) default 'member',
  joined_at timestamptz not null default now(),
  unique (cohort_id, user_id)
);
create index if not exists cohort_members_cohort_idx on public.cohort_members(cohort_id);
create index if not exists cohort_members_user_idx on public.cohort_members(user_id);

create table if not exists public.cohort_join_requests (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending','approved','declined')) default 'pending',
  created_at timestamptz not null default now(),
  unique (cohort_id, user_id)
);

create table if not exists public.cohort_invites (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  code text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2) Helper: is the caller a member / owner of a cohort.
create or replace function public._is_cohort_member(p_cohort uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.cohort_members where cohort_id = p_cohort and user_id = p_uid);
$$;
create or replace function public._is_cohort_owner(p_cohort uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.cohort_members where cohort_id = p_cohort and user_id = p_uid and role = 'owner');
$$;

-- 3) RLS (reads scoped; all writes denied to clients -> RPC/service only).
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.cohort_join_requests enable row level security;
alter table public.cohort_invites enable row level security;

drop policy if exists cohorts_read on public.cohorts;
create policy cohorts_read on public.cohorts for select to authenticated
  using (visibility in ('public','request') or public._is_cohort_member(id, auth.uid()));

drop policy if exists cohort_members_read on public.cohort_members;
create policy cohort_members_read on public.cohort_members for select to authenticated
  using (public._is_cohort_member(cohort_id, auth.uid()));

drop policy if exists cohort_requests_read on public.cohort_join_requests;
create policy cohort_requests_read on public.cohort_join_requests for select to authenticated
  using (user_id = auth.uid() or public._is_cohort_owner(cohort_id, auth.uid()));

drop policy if exists cohort_invites_read on public.cohort_invites;
create policy cohort_invites_read on public.cohort_invites for select to authenticated
  using (public._is_cohort_owner(cohort_id, auth.uid()));
-- (no insert/update/delete policies -> clients cannot write; SECURITY DEFINER RPCs + service role only)

-- 4) Action RPCs.
create or replace function public.create_cohort(p_name text, p_description text, p_direction_id text, p_visibility text, p_accent text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if coalesce((select trust_score from public.profiles where id = auth.uid()), 0) < 50 then
    raise exception 'reach Reliable to create a cohort';
  end if;
  if p_visibility not in ('public','request','invite') then raise exception 'bad visibility'; end if;
  if char_length(btrim(coalesce(p_name,''))) = 0 then raise exception 'name required'; end if;
  insert into public.cohorts (name, description, direction_id, visibility, accent, owner_id)
    values (btrim(p_name), nullif(btrim(coalesce(p_description,'')),''), nullif(p_direction_id,''), p_visibility, nullif(p_accent,''), auth.uid())
    returning id into v_id;
  insert into public.cohort_members (cohort_id, user_id, role) values (v_id, auth.uid(), 'owner');
  if p_visibility = 'invite' then
    insert into public.cohort_invites (cohort_id, code, created_by)
      values (v_id, encode(gen_random_bytes(6), 'hex'), auth.uid());
  end if;
  return v_id;
end;
$$;

create or replace function public.join_cohort(p_cohort_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.cohorts where id = p_cohort_id and visibility = 'public') then
    raise exception 'cohort is not open to join';
  end if;
  insert into public.cohort_members (cohort_id, user_id, role) values (p_cohort_id, auth.uid(), 'member')
    on conflict (cohort_id, user_id) do nothing;
end;
$$;

create or replace function public.request_join(p_cohort_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  if not exists (select 1 from public.cohorts where id = p_cohort_id and visibility = 'request') then
    raise exception 'cohort does not take requests';
  end if;
  insert into public.cohort_join_requests (cohort_id, user_id, status) values (p_cohort_id, auth.uid(), 'pending')
    on conflict (cohort_id, user_id) do update set status = 'pending', created_at = now();
  select user_id into v_owner from public.cohort_members where cohort_id = p_cohort_id and role = 'owner' limit 1;
  if v_owner is not null then
    insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
      values (v_owner, auth.uid(), 'cohort_request', 'New join request', 'Someone asked to join your cohort.', 'cohort', p_cohort_id);
  end if;
end;
$$;

create or replace function public.approve_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cohort uuid; v_user uuid;
begin
  select cohort_id, user_id into v_cohort, v_user from public.cohort_join_requests where id = p_request_id;
  if v_cohort is null or not public._is_cohort_owner(v_cohort, auth.uid()) then raise exception 'not your cohort'; end if;
  update public.cohort_join_requests set status = 'approved' where id = p_request_id;
  insert into public.cohort_members (cohort_id, user_id, role) values (v_cohort, v_user, 'member') on conflict do nothing;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
    values (v_user, auth.uid(), 'cohort_approved', 'You''re in', 'Your cohort request was approved.', 'cohort', v_cohort);
end;
$$;

create or replace function public.decline_request(p_request_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cohort uuid;
begin
  select cohort_id into v_cohort from public.cohort_join_requests where id = p_request_id;
  if v_cohort is null or not public._is_cohort_owner(v_cohort, auth.uid()) then raise exception 'not your cohort'; end if;
  update public.cohort_join_requests set status = 'declined' where id = p_request_id;
end;
$$;

create or replace function public.redeem_cohort_invite(p_code text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cohort uuid;
begin
  select cohort_id into v_cohort from public.cohort_invites where code = p_code;
  if v_cohort is null then raise exception 'invalid invite'; end if;
  insert into public.cohort_members (cohort_id, user_id, role) values (v_cohort, auth.uid(), 'member') on conflict do nothing;
  return v_cohort;
end;
$$;

create or replace function public.leave_cohort(p_cohort_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public._is_cohort_owner(p_cohort_id, auth.uid()) then raise exception 'owners cannot leave their cohort'; end if;
  delete from public.cohort_members where cohort_id = p_cohort_id and user_id = auth.uid();
end;
$$;

create or replace function public.remove_member(p_cohort_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public._is_cohort_owner(p_cohort_id, auth.uid()) then raise exception 'not your cohort'; end if;
  delete from public.cohort_members where cohort_id = p_cohort_id and user_id = p_user_id and role <> 'owner';
end;
$$;

-- 5) Grants: helpers + action RPCs unreachable directly except the granted actions.
revoke all on function public._is_cohort_member(uuid, uuid) from public, anon, authenticated;
revoke all on function public._is_cohort_owner(uuid, uuid) from public, anon, authenticated;
do $$ declare f text; begin
  for f in select unnest(array[
    'create_cohort(text,text,text,text,text)','join_cohort(uuid)','request_join(uuid)','approve_request(uuid)',
    'decline_request(uuid)','redeem_cohort_invite(text)','leave_cohort(uuid)','remove_member(uuid,uuid)'])
  loop execute format('revoke all on function public.%s from public, anon', f);
       execute format('grant execute on function public.%s to authenticated', f); end loop;
end $$;

-- 6) Founding-circle: seed a real cohort + backfill memberships from profiles.cohort_id.
insert into public.cohorts (id, name, description, visibility, owner_id)
  select '00000000-0000-0000-0000-0000000f0001', 'Founding Circle', 'The original closed-beta cohort.', 'public',
         (select id from public.profiles where role in ('founder','admin') order by created_at limit 1)
  where not exists (select 1 from public.cohorts where id = '00000000-0000-0000-0000-0000000f0001');
insert into public.cohort_members (cohort_id, user_id, role)
  select '00000000-0000-0000-0000-0000000f0001', p.id,
         case when p.role in ('founder','admin') then 'owner' else 'member' end
  from public.profiles p where coalesce(p.cohort_id,'founding-circle') = 'founding-circle'
  on conflict (cohort_id, user_id) do nothing;
