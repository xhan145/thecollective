-- 023_trust_integrity.sql — Phase A: server-side trust integrity (additive).
-- Run AFTER 010–022. Idempotent / safe to re-run.
-- Makes trust earned-not-mintable (no direct client inserts) and keeps every
-- affected user's profile counters drift-free, via SECURITY DEFINER RPCs.

-- 1) De-dupe trust_events on (user_id, type, source_id), keeping the earliest row,
--    so the unique constraint can be created cleanly over existing/seed data.
delete from public.trust_events t
using public.trust_events d
where t.user_id = d.user_id
  and t.type = d.type
  and t.source_id is not distinct from d.source_id
  and t.source_id is not null
  and t.ctid > d.ctid;

-- 2) Unique index backs idempotent inserts (on conflict do nothing).
create unique index if not exists trust_events_user_type_source_uidx
  on public.trust_events (user_id, type, source_id)
  where source_id is not null;

-- 3) Lock down: deny ALL direct client inserts. Only SECURITY DEFINER functions
--    (run as owner) and the service role may write trust_events.
drop policy if exists "trust_events_insert_authenticated" on public.trust_events;
drop policy if exists "trust_events_insert_denied" on public.trust_events;
create policy "trust_events_insert_denied" on public.trust_events
  for insert to authenticated with check (false);

-- 4) Point values — single server-side source (unchanged from app TRUST_POINTS).
create or replace function public._trust_points(p_type text)
returns integer language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case p_type
    when 'proof' then 5
    when 'practice' then 5
    when 'peer-feedback' then 3
    when 'helpful' then 7
    when 'accepted-contribution' then 15
    else 0
  end;
$$;

-- 5) Recompute one user's counters from source tables (drift-free, self-healing).
create or replace function public._recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.profiles p set
    practice_count = (select count(*) from public.practice_completions where user_id = p_uid),
    proof_count = (select count(*) from public.proofs where user_id = p_uid),
    feedback_given_count = (select count(*) from public.feedback where author_id = p_uid),
    feedback_received_count = (select count(*) from public.feedback where recipient_id = p_uid),
    trust_score = (select coalesce(sum(points), 0) from public.trust_events where user_id = p_uid),
    updated_at = now()
  where p.id = p_uid;
end;
$$;

-- Self-repair wrapper: a member may recompute ONLY their own counts.
-- (Admin/cross-user repair runs via the service role, which bypasses this.)
create or replace function public.recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_uid is distinct from auth.uid() then
    raise exception 'can only recompute your own counts';
  end if;
  perform public._recompute_profile_counts(p_uid);
end;
$$;

-- 6) Internal trust insert (idempotent) used by the action RPCs.
create or replace function public._insert_trust(p_uid uuid, p_type text, p_label text, p_source_id text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.trust_events (user_id, type, points, label, source_id)
  values (p_uid, p_type, public._trust_points(p_type), p_label, p_source_id)
  on conflict (user_id, type, source_id) where source_id is not null do nothing;
end;
$$;

-- 7) Action RPCs — each validates ownership/relationship, credits, recomputes.

create or replace function public.record_proof_trust(p_proof_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  select user_id into v_owner from public.proofs where id = p_proof_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not your proof';
  end if;
  perform public._insert_trust(auth.uid(), 'proof', 'Submitted proof from practice', p_proof_id::text);
  perform public._recompute_profile_counts(auth.uid());
end;
$$;

-- prompt_id is TEXT (practice_completions.prompt_id) and may be a non-uuid slug
-- when content falls back to the seed; the param must be text, not uuid.
drop function if exists public.record_practice_trust(uuid);
create or replace function public.record_practice_trust(p_prompt_id text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.practice_completions where user_id = auth.uid() and prompt_id = p_prompt_id) then
    raise exception 'no completion for this practice';
  end if;
  perform public._insert_trust(auth.uid(), 'practice', 'Completed a practice', p_prompt_id);
  perform public._recompute_profile_counts(auth.uid());
end;
$$;

create or replace function public.record_feedback_trust(p_feedback_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_author uuid; v_recipient uuid;
begin
  select author_id, recipient_id into v_author, v_recipient from public.feedback where id = p_feedback_id;
  if v_author is null or v_author <> auth.uid() then
    raise exception 'not your feedback';
  end if;
  perform public._insert_trust(auth.uid(), 'peer-feedback', 'Gave useful feedback', p_feedback_id::text);
  perform public._recompute_profile_counts(auth.uid());      -- giver: feedback_given_count + trust
  if v_recipient is not null then
    perform public._recompute_profile_counts(v_recipient);   -- receiver: feedback_received_count
  end if;
end;
$$;

create or replace function public.mark_feedback_helpful(p_feedback_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_author uuid; v_recipient uuid;
begin
  select author_id, recipient_id into v_author, v_recipient from public.feedback where id = p_feedback_id;
  if v_recipient is null or v_recipient <> auth.uid() then
    raise exception 'only the recipient can mark feedback helpful';
  end if;
  update public.feedback set helpful = true where id = p_feedback_id;
  perform public._insert_trust(v_author, 'helpful', 'Feedback marked helpful', p_feedback_id::text);
  perform public._recompute_profile_counts(v_author);
end;
$$;

-- 8) Grants. Internal helpers must be UNREACHABLE by clients — in Supabase,
--    anon/authenticated hold DIRECT execute grants on public functions, so
--    `revoke from public` is not enough; revoke from anon + authenticated too.
--    (The SECURITY DEFINER action RPCs still call them as the function owner.)
revoke all on function public._trust_points(text) from public, anon, authenticated;
revoke all on function public._recompute_profile_counts(uuid) from public, anon, authenticated;
revoke all on function public._insert_trust(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.recompute_profile_counts(uuid) from public, anon;
revoke all on function public.record_proof_trust(uuid) from public, anon;
revoke all on function public.record_practice_trust(text) from public, anon;
revoke all on function public.record_feedback_trust(uuid) from public, anon;
revoke all on function public.mark_feedback_helpful(uuid) from public, anon;
grant execute on function public.recompute_profile_counts(uuid) to authenticated;
grant execute on function public.record_proof_trust(uuid) to authenticated;
grant execute on function public.record_practice_trust(text) to authenticated;
grant execute on function public.record_feedback_trust(uuid) to authenticated;
grant execute on function public.mark_feedback_helpful(uuid) to authenticated;
