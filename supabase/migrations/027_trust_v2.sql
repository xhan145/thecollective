-- 027_trust_v2.sql — quality-weighted 4-dimension trust (additive). After 010–026.
-- Redefines point values + recompute (so all callers, incl. contribution, get V2),
-- adds daily caps to self-triggered record RPCs, backfills every profile.

-- 1) Profile columns for the 4 dimensions + spam signal.
alter table public.profiles add column if not exists practice_trust int not null default 0;
alter table public.profiles add column if not exists feedback_trust int not null default 0;
alter table public.profiles add column if not exists consistency_trust int not null default 0;
alter table public.profiles add column if not exists contribution_trust int not null default 0;
alter table public.profiles add column if not exists spam_signal int not null default 0;

-- 2) Point values (feedback rebalanced to pay on usefulness).
create or replace function public._trust_points(p_type text)
returns integer language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case p_type
    when 'proof' then 5
    when 'practice' then 5
    when 'peer-feedback' then 1
    when 'helpful' then 6
    when 'accepted-contribution' then 15
    else 0
  end;
$$;

-- 3) Capped internal insert: full points up to a daily cap, else 0 (still recorded).
create or replace function public._insert_trust_capped(p_uid uuid, p_type text, p_label text, p_source_id text, p_daily_cap int)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_today int; v_points int;
begin
  select count(*) into v_today from public.trust_events
   where user_id = p_uid and type = p_type and points > 0 and created_at::date = current_date;
  v_points := case when v_today < p_daily_cap then public._trust_points(p_type) else 0 end;
  insert into public.trust_events (user_id, type, points, label, source_id)
  values (p_uid, p_type, v_points, p_label, p_source_id)
  on conflict (user_id, type, source_id) where source_id is not null do nothing;
end;
$$;

-- 4) V2 recompute: 4 sub-scores + consistency + spam + weighted trust_score (+ keep counts).
create or replace function public._recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_practice int; v_feedback int; v_consist int; v_contrib int;
  v_weeks int; v_over_cap int; v_fb_given int; v_fb_helpful int; v_spam int;
begin
  select coalesce(sum(points),0) into v_practice from public.trust_events where user_id = p_uid and type in ('practice','proof');
  select coalesce(sum(points),0) into v_feedback from public.trust_events where user_id = p_uid and type in ('peer-feedback','helpful');
  select coalesce(sum(points),0) into v_contrib  from public.trust_events where user_id = p_uid and type = 'accepted-contribution';
  select count(distinct date_trunc('week', created_at)) into v_weeks
    from public.trust_events where user_id = p_uid and created_at >= now() - interval '8 weeks';
  v_consist := least(coalesce(v_weeks,0), 8) * 4;

  -- spam signal (coarse, non-enforcing): capped/grinding events + low helpful-ratio feedback.
  select count(*) into v_over_cap from public.trust_events where user_id = p_uid and points = 0;
  select count(*) into v_fb_given from public.trust_events where user_id = p_uid and type = 'peer-feedback';
  select count(*) into v_fb_helpful from public.feedback where author_id = p_uid and helpful = true;
  v_spam := least(100, v_over_cap * 5 + (case when v_fb_given >= 5 and v_fb_helpful::numeric / nullif(v_fb_given,0) < 0.2 then 40 else 0 end));

  update public.profiles p set
    practice_count = (select count(*) from public.practice_completions where user_id = p_uid),
    proof_count = (select count(*) from public.proofs where user_id = p_uid),
    feedback_given_count = (select count(*) from public.feedback where author_id = p_uid),
    feedback_received_count = (select count(*) from public.feedback where recipient_id = p_uid),
    practice_trust = v_practice,
    feedback_trust = v_feedback,
    consistency_trust = v_consist,
    contribution_trust = v_contrib,
    spam_signal = coalesce(v_spam,0),
    trust_score = round(v_practice * 1 + v_feedback * 1.5 + v_consist * 1 + v_contrib * 2),
    updated_at = now()
  where p.id = p_uid;
end;
$$;

-- 5) Self-triggered record RPCs gain daily caps (bodies replaced; names/sigs unchanged).
create or replace function public.record_proof_trust(p_proof_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  select user_id into v_owner from public.proofs where id = p_proof_id;
  if v_owner is null or v_owner is distinct from auth.uid() then raise exception 'not your proof'; end if;
  perform public._insert_trust_capped(auth.uid(), 'proof', 'Submitted proof from practice', p_proof_id::text, 3);
  perform public._recompute_profile_counts(auth.uid());
end;
$$;

create or replace function public.record_practice_trust(p_prompt_id text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.practice_completions where user_id = auth.uid() and prompt_id = p_prompt_id) then
    raise exception 'no completion for this practice';
  end if;
  perform public._insert_trust_capped(auth.uid(), 'practice', 'Completed a practice', p_prompt_id, 3);
  perform public._recompute_profile_counts(auth.uid());
end;
$$;

create or replace function public.record_feedback_trust(p_feedback_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_author uuid; v_recipient uuid;
begin
  select author_id, recipient_id into v_author, v_recipient from public.feedback where id = p_feedback_id;
  if v_author is null or v_author is distinct from auth.uid() then raise exception 'not your feedback'; end if;
  perform public._insert_trust_capped(auth.uid(), 'peer-feedback', 'Gave feedback', p_feedback_id::text, 5);
  perform public._recompute_profile_counts(auth.uid());
  if v_recipient is not null then perform public._recompute_profile_counts(v_recipient); end if;
end;
$$;

-- (mark_feedback_helpful + record_contribution_trust unchanged: they credit via _insert_trust
--  with the new point values and call _recompute_profile_counts, which is now V2.)

-- 6) Grants: new helper must be unreachable by clients.
revoke all on function public._insert_trust_capped(uuid, text, text, text, int) from public, anon, authenticated;

-- 7) Backfill: recompute every profile so live tiers reflect V2 immediately.
do $$ declare r record; begin
  for r in select id from public.profiles loop
    perform public._recompute_profile_counts(r.id);
  end loop;
end $$;
