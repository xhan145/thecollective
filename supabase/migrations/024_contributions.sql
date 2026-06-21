-- 024_contributions.sql — Phase B: the Contribute step (additive).
-- Run AFTER 010–023. Idempotent. Builds on Phase A trust helpers.

-- 1) proofs: open-for-contributions flag + focus.
alter table public.proofs add column if not exists open_for_contributions boolean not null default false;
alter table public.proofs add column if not exists contribution_focus text;

-- 2) contributions table.
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references public.proofs(id) on delete cascade,
  contributor_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  observation text not null,
  next_step text not null,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  is_demo boolean not null default false,
  demo_seed_id text,
  unique (proof_id, contributor_id),
  check (contributor_id <> owner_id)
);
create index if not exists contributions_proof_idx on public.contributions(proof_id);
create index if not exists contributions_contributor_idx on public.contributions(contributor_id);
create index if not exists contributions_owner_idx on public.contributions(owner_id);
create unique index if not exists contributions_demo_seed_uidx on public.contributions(demo_seed_id) where demo_seed_id is not null;

-- 3) RLS: read by participants; NO client insert/update (RPC-only).
alter table public.contributions enable row level security;
drop policy if exists "contributions_read_participant" on public.contributions;
create policy "contributions_read_participant" on public.contributions
  for select to authenticated
  using (auth.uid() = contributor_id or auth.uid() = owner_id);
-- (no insert/update/delete policies: submission + acceptance go through SECURITY DEFINER RPCs;
--  service role bypasses RLS for demo seeding.)

-- 4) extend _recompute_profile_counts to populate contribution_count (additive).
create or replace function public._recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.profiles p set
    practice_count = (select count(*) from public.practice_completions where user_id = p_uid),
    proof_count = (select count(*) from public.proofs where user_id = p_uid),
    feedback_given_count = (select count(*) from public.feedback where author_id = p_uid),
    feedback_received_count = (select count(*) from public.feedback where recipient_id = p_uid),
    contribution_count = (select count(*) from public.contributions where contributor_id = p_uid and status = 'accepted'),
    trust_score = (select coalesce(sum(points), 0) from public.trust_events where user_id = p_uid),
    updated_at = now()
  where p.id = p_uid;
end;
$$;

-- 5) submit_contribution: server-gated by G1; insert pending.
create or replace function public.submit_contribution(p_proof_id uuid, p_observation text, p_next_step text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_open boolean; v_id uuid;
begin
  if coalesce(trim(p_observation),'') = '' or coalesce(trim(p_next_step),'') = '' then
    raise exception 'observation and next step are required';
  end if;
  -- G1: must have been through the loop once.
  if (select count(*) from public.proofs where user_id = auth.uid()) < 1
     or (select count(*) from public.feedback where author_id = auth.uid()) < 1 then
    raise exception 'not eligible to contribute yet';
  end if;
  select user_id, open_for_contributions into v_owner, v_open from public.proofs where id = p_proof_id;
  if v_owner is null then raise exception 'proof not found'; end if;
  if not v_open then raise exception 'proof is not open for contributions'; end if;
  if v_owner = auth.uid() then raise exception 'cannot contribute to your own proof'; end if;
  if exists (select 1 from public.contributions where proof_id = p_proof_id and contributor_id = auth.uid()) then
    raise exception 'you already contributed to this proof';
  end if;
  insert into public.contributions (proof_id, contributor_id, owner_id, observation, next_step)
  values (p_proof_id, auth.uid(), v_owner, trim(p_observation), trim(p_next_step))
  returning id into v_id;
  return v_id;
end;
$$;

-- 6) record_contribution_trust: owner-validated accept -> credit contributor (+15).
create or replace function public.record_contribution_trust(p_contribution_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_contrib uuid; v_status text; v_proof uuid; v_actor text;
begin
  select owner_id, contributor_id, status, proof_id
    into v_owner, v_contrib, v_status, v_proof
    from public.contributions where id = p_contribution_id;
  -- NULL-safe owner check: `<>` against a NULL auth.uid() yields NULL (fails open),
  -- so use `is distinct from` so a missing/anon caller is always rejected.
  if v_owner is null or v_owner is distinct from auth.uid() then
    raise exception 'only the proof owner can accept';
  end if;
  if v_status <> 'pending' then return; end if; -- idempotent: already accepted
  update public.contributions set status = 'accepted', accepted_at = now() where id = p_contribution_id;
  perform public._insert_trust(v_contrib, 'accepted-contribution', 'Contribution accepted', p_contribution_id::text);
  perform public._recompute_profile_counts(v_contrib);
  -- notify the contributor (cross-user write; safe because owner-validated).
  select display_name into v_actor from public.profiles where id = v_owner;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
  values (v_contrib, v_owner, 'contribution_accepted',
          coalesce(v_actor,'A member') || ' accepted your contribution', null, 'proof', v_proof);
end;
$$;

-- 7) notify the proof owner on a new contribution.
create or replace function public.notify_on_contribution()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_name text;
begin
  if new.is_demo or new.contributor_id = new.owner_id then return new; end if;
  select display_name into actor_name from public.profiles where id = new.contributor_id;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
  values (new.owner_id, new.contributor_id, 'contribution',
          coalesce(actor_name,'A member') || ' contributed to your proof', new.observation, 'proof', new.proof_id);
  return new;
end;
$$;
drop trigger if exists trg_notify_on_contribution on public.contributions;
create trigger trg_notify_on_contribution after insert on public.contributions
  for each row execute function public.notify_on_contribution();

-- 8) grants.
revoke all on function public.submit_contribution(uuid, text, text) from public, anon;
revoke all on function public.record_contribution_trust(uuid) from public, anon;
grant execute on function public.submit_contribution(uuid, text, text) to authenticated;
grant execute on function public.record_contribution_trust(uuid) to authenticated;
