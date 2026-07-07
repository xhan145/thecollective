-- 040_reports.sql — member reporting of proofs + feedback with tiered
-- enforcement. Additive. After 039.
--
-- Tiered (server-side, in submit_report): a SEVERE reason from a CREDIBLE
-- reporter (spam_signal < 40) hides the content immediately (moderation_status
-- -> pending/reported); a MILD reason only hides once >= 3 DISTINCT reporters
-- flag the same content. All reports queue for admin review. Reporters also
-- feed the author's spam_signal (up to +75), which crosses the 70 auto-hold.

-- 1) Reports table.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('proof','feedback')),
  target_id uuid not null,
  reason text not null check (reason in ('harassment','unsafe','sexual_or_violent','spam','low_quality','off_topic','other')),
  severity text not null check (severity in ('severe','mild')),
  detail text check (detail is null or char_length(detail) <= 500),
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index if not exists reports_open_target_idx on public.reports(target_type, target_id) where status = 'open';
create index if not exists reports_status_idx on public.reports(status, created_at desc);

-- 2) RLS: reports are created ONLY through submit_report (definer). No direct
--    client insert, no client select (admin reads via service role).
alter table public.reports enable row level security;
drop policy if exists reports_no_client_insert on public.reports;
create policy reports_no_client_insert on public.reports for insert to authenticated with check (false);

-- 3) Recompute (re-declared from 039; ONLY addition = the reporters term in
--    v_spam). Self-heal still releases spam-caused holds only.
create or replace function public._recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_practice int; v_feedback int; v_consist int; v_contrib int;
  v_weeks int; v_over_cap int; v_fb_given int; v_fb_helpful int; v_spam int; v_reporters int;
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
  select count(distinct r.reporter_id) into v_reporters
    from public.reports r
    where r.status = 'open' and r.created_at >= now() - interval '30 days'
      and (
        (r.target_type = 'proof' and r.target_id in (select id from public.proofs where user_id = p_uid))
        or (r.target_type = 'feedback' and r.target_id in (select id from public.feedback where author_id = p_uid))
      );
  v_spam := least(100,
    v_over_cap * 5
    + (case when v_fb_given >= 5 and v_fb_helpful::numeric / nullif(v_fb_given,0) < 0.2 then 40 else 0 end)
    + least(coalesce(v_reporters,0), 5) * 15);
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
  if v_spam < 40 then
    update public.proofs        set moderation_status = 'clear', moderation_reason = null, held = false
      where user_id   = p_uid and moderation_status = 'pending' and moderation_reason = 'spam' and not removed;
    update public.practice_tips set moderation_status = 'clear', moderation_reason = null, held = false
      where author_id = p_uid and moderation_status = 'pending' and moderation_reason = 'spam' and not removed;
    update public.feedback      set moderation_status = 'clear', moderation_reason = null, held = false
      where author_id = p_uid and moderation_status = 'pending' and moderation_reason = 'spam' and not removed;
  end if;
end;
$$;

-- 4) submit_report: the only path to create a report. Applies tiered hide +
--    feeds the author's spam_signal. Callable by any authenticated member.
create or replace function public.submit_report(p_target_type text, p_target_id uuid, p_reason text, p_detail text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_reporter uuid := auth.uid();
  v_author uuid;
  v_severity text;
  v_credible boolean;
  v_distinct int;
  v_hide boolean := false;
begin
  if v_reporter is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_target_type not in ('proof','feedback') then raise exception 'BAD_TARGET_TYPE'; end if;
  if p_reason not in ('harassment','unsafe','sexual_or_violent','spam','low_quality','off_topic','other') then raise exception 'BAD_REASON'; end if;

  if p_target_type = 'proof' then
    select user_id into v_author from public.proofs where id = p_target_id;
  else
    select author_id into v_author from public.feedback where id = p_target_id;
  end if;
  if v_author is null then raise exception 'TARGET_NOT_FOUND'; end if;
  if v_author = v_reporter then raise exception 'CANNOT_REPORT_OWN'; end if;

  v_severity := case when p_reason in ('harassment','unsafe','sexual_or_violent') then 'severe' else 'mild' end;

  insert into public.reports (reporter_id, target_type, target_id, reason, severity, detail)
  values (v_reporter, p_target_type, p_target_id, p_reason, v_severity, nullif(btrim(coalesce(p_detail,'')), ''))
  on conflict (reporter_id, target_type, target_id) do nothing;

  v_credible := coalesce((select spam_signal from public.profiles where id = v_reporter), 0) < 40;
  select count(distinct reporter_id) into v_distinct
    from public.reports where target_type = p_target_type and target_id = p_target_id and status = 'open';

  if (v_severity = 'severe' and v_credible) or (v_severity = 'mild' and v_distinct >= 3) then
    perform public.hold_content(p_target_type, p_target_id, 'reported');
    v_hide := true;
  end if;

  perform public._recompute_profile_counts(v_author);

  return jsonb_build_object('status', case when v_hide then 'hidden' else 'queued' end, 'hidden', v_hide);
end;
$$;

-- 5) Grants: members may submit a report; recompute stays server-only.
revoke all on function public.submit_report(text, uuid, text, text) from public, anon;
grant execute on function public.submit_report(text, uuid, text, text) to authenticated;
revoke all on function public._recompute_profile_counts(uuid) from public, anon, authenticated;
