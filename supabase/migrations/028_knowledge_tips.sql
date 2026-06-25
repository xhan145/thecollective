-- 028_knowledge_tips.sql — practice-anchored knowledge tips (additive). After 027.
-- Tips earn Contribution trust (tip-submit +1 capped, useful-tip +6 once via trigger).

-- 1) Tables.
create table if not exists public.practice_tips (
  id uuid primary key default gen_random_uuid(),
  prompt_id text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 280 and char_length(btrim(body)) > 0),
  is_demo boolean not null default false,
  demo_cohort text,
  demo_seed_id text,
  created_at timestamptz not null default now()
);
create index if not exists practice_tips_prompt_idx on public.practice_tips(prompt_id, created_at desc);
create unique index if not exists practice_tips_demo_seed_uidx on public.practice_tips(demo_seed_id) where demo_seed_id is not null;

create table if not exists public.tip_reports (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid not null references public.practice_tips(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists tip_reports_tip_idx on public.tip_reports(tip_id);

-- 2) RLS.
alter table public.practice_tips enable row level security;
drop policy if exists practice_tips_read on public.practice_tips;
create policy practice_tips_read on public.practice_tips for select to authenticated using (true);
drop policy if exists practice_tips_no_client_insert on public.practice_tips;
create policy practice_tips_no_client_insert on public.practice_tips for insert to authenticated with check (false);
drop policy if exists practice_tips_own_update on public.practice_tips;
create policy practice_tips_own_update on public.practice_tips for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists practice_tips_own_delete on public.practice_tips;
create policy practice_tips_own_delete on public.practice_tips for delete to authenticated using (author_id = auth.uid());

alter table public.tip_reports enable row level security;
drop policy if exists tip_reports_insert_own on public.tip_reports;
create policy tip_reports_insert_own on public.tip_reports for insert to authenticated with check (reporter_id = auth.uid());
-- (no client select policy: admin reads via service role)

-- 3) Allow useful_marks on tips (extend the check; keep unique(user_id,target_id)).
alter table public.useful_marks drop constraint if exists useful_marks_target_type_check;
alter table public.useful_marks add constraint useful_marks_target_type_check check (target_type in ('proof','tip'));

-- 4) Trust point values for tips.
create or replace function public._trust_points(p_type text)
returns integer language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case p_type
    when 'proof' then 5
    when 'practice' then 5
    when 'peer-feedback' then 1
    when 'helpful' then 6
    when 'accepted-contribution' then 15
    when 'tip-submit' then 1
    when 'useful-tip' then 6
    else 0
  end;
$$;

-- 5) Recompute (re-declared from 027 with Contribution extended to include tip trust).
create or replace function public._recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_practice int; v_feedback int; v_consist int; v_contrib int;
  v_weeks int; v_over_cap int; v_fb_given int; v_fb_helpful int; v_spam int;
begin
  select coalesce(sum(points),0) into v_practice from public.trust_events where user_id = p_uid and type in ('practice','proof');
  select coalesce(sum(points),0) into v_feedback from public.trust_events where user_id = p_uid and type in ('peer-feedback','helpful');
  select coalesce(sum(points),0) into v_contrib  from public.trust_events where user_id = p_uid and type in ('accepted-contribution','tip-submit','useful-tip');
  select count(distinct date_trunc('week', created_at)) into v_weeks
    from public.trust_events where user_id = p_uid and created_at >= now() - interval '8 weeks';
  v_consist := least(coalesce(v_weeks,0), 8) * 4;

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

-- 6) submit_tip: author-gated insert + capped submit credit. Returns the new tip id.
create or replace function public.submit_tip(p_prompt_id text, p_body text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if char_length(btrim(p_body)) = 0 or char_length(p_body) > 280 then raise exception 'invalid tip body'; end if;
  if not exists (
    select 1 from public.practice_completions where user_id = auth.uid() and prompt_id = p_prompt_id
    union all
    select 1 from public.proofs where user_id = auth.uid() and prompt_id = p_prompt_id
  ) then raise exception 'complete the practice before sharing a tip'; end if;
  insert into public.practice_tips (prompt_id, author_id, body) values (p_prompt_id, auth.uid(), p_body) returning id into v_id;
  perform public._insert_trust_capped(auth.uid(), 'tip-submit', 'Shared a tip', v_id::text, 5);
  perform public._recompute_profile_counts(auth.uid());
  return v_id;
end;
$$;

-- 7) Trigger: marked-useful credits the tip author once (idempotent; not self).
create or replace function public._credit_useful_tip()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_author uuid;
begin
  if new.target_type <> 'tip' then return new; end if;
  select author_id into v_author from public.practice_tips where id = new.target_id;
  if v_author is not null and v_author is distinct from new.user_id then
    perform public._insert_trust(v_author, 'useful-tip', 'A tip you shared was useful', new.target_id::text);
    perform public._recompute_profile_counts(v_author);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_credit_useful_tip on public.useful_marks;
create trigger trg_credit_useful_tip after insert on public.useful_marks
  for each row execute function public._credit_useful_tip();

-- 8) Service-role helper: capped tip-submit credit for a given uid (used by the API route,
--    which runs as service role and has no auth.uid()). Unreachable by clients.
create or replace function public.record_tip_submit_trust(p_tip_id uuid, p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._insert_trust_capped(p_uid, 'tip-submit', 'Shared a tip', p_tip_id::text, 5);
  perform public._recompute_profile_counts(p_uid);
end;
$$;

-- 9) Grants: new helpers unreachable by clients; submit_tip callable by members.
revoke all on function public._credit_useful_tip() from public, anon, authenticated;
revoke all on function public.record_tip_submit_trust(uuid, uuid) from public, anon, authenticated;
revoke all on function public.submit_tip(text, text) from public, anon;
grant execute on function public.submit_tip(text, text) to authenticated;
