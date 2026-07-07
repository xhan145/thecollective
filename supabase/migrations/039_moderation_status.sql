-- 039_moderation_status.sql — cut the 029 held/removed booleans over to a
-- moderation_status enum (+ moderation_reason), and CLOSE THE CRITICAL RLS
-- HOLE: admin-removed / spam-held proofs, feedback, and tips were still
-- readable by any authenticated member querying directly (enforcement lived
-- only in client-side .or() filters). Additive. After 038.
--
-- moderation_status: clear (visible) | limited (visible, downranked) |
--   pending (hidden, awaiting review) | removed (hidden, hard-removed).
-- moderation_reason: spam | reported | admin | null — lets the spam self-heal
--   release ONLY spam-caused holds and never un-hide reported/admin holds.
-- held/removed are kept mirrored for any un-migrated reader (belt-and-suspenders).

-- 1) Columns.
alter table public.proofs        add column if not exists moderation_status text not null default 'clear';
alter table public.proofs        add column if not exists moderation_reason text;
alter table public.feedback      add column if not exists moderation_status text not null default 'clear';
alter table public.feedback      add column if not exists moderation_reason text;
alter table public.practice_tips add column if not exists moderation_status text not null default 'clear';
alter table public.practice_tips add column if not exists moderation_reason text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'proofs_moderation_status_chk') then
    alter table public.proofs add constraint proofs_moderation_status_chk check (moderation_status in ('clear','limited','pending','removed'));
    alter table public.proofs add constraint proofs_moderation_reason_chk check (moderation_reason is null or moderation_reason in ('spam','reported','admin'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'feedback_moderation_status_chk') then
    alter table public.feedback add constraint feedback_moderation_status_chk check (moderation_status in ('clear','limited','pending','removed'));
    alter table public.feedback add constraint feedback_moderation_reason_chk check (moderation_reason is null or moderation_reason in ('spam','reported','admin'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'practice_tips_moderation_status_chk') then
    alter table public.practice_tips add constraint practice_tips_moderation_status_chk check (moderation_status in ('clear','limited','pending','removed'));
    alter table public.practice_tips add constraint practice_tips_moderation_reason_chk check (moderation_reason is null or moderation_reason in ('spam','reported','admin'));
  end if;
end$$;

-- 2) Backfill from existing held/removed (removed wins).
update public.proofs        set moderation_status = case when removed then 'removed' when held then 'pending' else 'clear' end,
                                 moderation_reason = case when removed then 'admin' when held then 'spam' else null end
                             where moderation_status = 'clear' and (held or removed);
update public.feedback      set moderation_status = case when removed then 'removed' when held then 'pending' else 'clear' end,
                                 moderation_reason = case when removed then 'admin' when held then 'spam' else null end
                             where moderation_status = 'clear' and (held or removed);
update public.practice_tips set moderation_status = case when removed then 'removed' when held then 'pending' else 'clear' end,
                                 moderation_reason = case when removed then 'admin' when held then 'spam' else null end
                             where moderation_status = 'clear' and (held or removed);

-- 3) Indexes (non-clear rows are rare).
create index if not exists proofs_modstatus_idx        on public.proofs(user_id)   where moderation_status <> 'clear';
create index if not exists feedback_modstatus_idx      on public.feedback(author_id) where moderation_status <> 'clear';
create index if not exists practice_tips_modstatus_idx on public.practice_tips(author_id) where moderation_status <> 'clear';

-- 4) BEFORE-INSERT triggers: stamp pending/spam (+ mirror held) when the
--    author is already spam-quarantined (>= 70). Server-only.
create or replace function public._stamp_held_proof()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce((select spam_signal from public.profiles where id = new.user_id), 0) >= 70 then
    new.moderation_status := 'pending';
    new.moderation_reason := 'spam';
    new.held := true;
  end if;
  return new;
end;
$$;
create or replace function public._stamp_held_by_author()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if coalesce((select spam_signal from public.profiles where id = new.author_id), 0) >= 70 then
    new.moderation_status := 'pending';
    new.moderation_reason := 'spam';
    new.held := true;
  end if;
  return new;
end;
$$;

-- 5) Recompute (re-declared from 029; self-heal now keys off reason='spam'
--    so report/admin holds are never auto-released). 040 re-declares this
--    again to add the reports term.
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
  -- Self-heal: behavior normalized -> release ONLY spam-caused holds.
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

-- 6) Admin moderation RPCs (service-role only). Set status+reason and mirror
--    the legacy held/removed booleans.
create or replace function public.clear_content(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kind = 'proof' then update public.proofs set moderation_status='clear', moderation_reason=null, held=false, removed=false where id = p_id;
  elsif p_kind = 'tip' then update public.practice_tips set moderation_status='clear', moderation_reason=null, held=false, removed=false where id = p_id;
  elsif p_kind = 'feedback' then update public.feedback set moderation_status='clear', moderation_reason=null, held=false, removed=false where id = p_id;
  else raise exception 'bad kind'; end if;
end;
$$;
create or replace function public.remove_content(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kind = 'proof' then update public.proofs set moderation_status='removed', moderation_reason='admin', held=true, removed=true where id = p_id;
  elsif p_kind = 'tip' then update public.practice_tips set moderation_status='removed', moderation_reason='admin', held=true, removed=true where id = p_id;
  elsif p_kind = 'feedback' then update public.feedback set moderation_status='removed', moderation_reason='admin', held=true, removed=true where id = p_id;
  else raise exception 'bad kind'; end if;
end;
$$;
create or replace function public.limit_content(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kind = 'proof' then update public.proofs set moderation_status='limited', moderation_reason='admin', held=false, removed=false where id = p_id;
  elsif p_kind = 'tip' then update public.practice_tips set moderation_status='limited', moderation_reason='admin', held=false, removed=false where id = p_id;
  elsif p_kind = 'feedback' then update public.feedback set moderation_status='limited', moderation_reason='admin', held=false, removed=false where id = p_id;
  else raise exception 'bad kind'; end if;
end;
$$;
create or replace function public.hold_content(p_kind text, p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_reason not in ('spam','reported','admin') then raise exception 'bad reason'; end if;
  if p_kind = 'proof' then update public.proofs set moderation_status='pending', moderation_reason=p_reason, held=true where id = p_id and moderation_status not in ('removed');
  elsif p_kind = 'tip' then update public.practice_tips set moderation_status='pending', moderation_reason=p_reason, held=true where id = p_id and moderation_status not in ('removed');
  elsif p_kind = 'feedback' then update public.feedback set moderation_status='pending', moderation_reason=p_reason, held=true where id = p_id and moderation_status not in ('removed');
  else raise exception 'bad kind'; end if;
end;
$$;

-- 7) CRITICAL: tighten SELECT policies so pending/removed content is hidden at
--    the SECURITY layer (own author still sees their own; limited stays visible).
drop policy if exists "proofs_read_cohort_or_own" on public.proofs;
create policy "proofs_read_cohort_or_own" on public.proofs
  for select to authenticated
  using (
    auth.uid() = user_id
    or (
      visibility = 'cohort'
      and moderation_status not in ('pending','removed')
      and not exists (
        select 1 from public.blocked_users b
         where (b.blocker_id = proofs.user_id and b.blocked_id = auth.uid())
            or (b.blocker_id = auth.uid() and b.blocked_id = proofs.user_id)
      )
    )
  );

-- Feedback: the giver (author_id) always sees their own; the recipient and the
-- cohort see it only when not pending/removed (so a harmed beginner does not
-- re-see hidden harmful feedback).
drop policy if exists "feedback_read_involved_or_cohort" on public.feedback;
create policy "feedback_read_involved_or_cohort" on public.feedback
  for select to authenticated
  using (
    auth.uid() = author_id
    or (
      moderation_status not in ('pending','removed')
      and (
        auth.uid() = recipient_id
        or exists (
          select 1 from public.proofs p
          where p.id = feedback.proof_id and p.visibility = 'cohort'
        )
      )
    )
  );

drop policy if exists practice_tips_read on public.practice_tips;
create policy practice_tips_read on public.practice_tips
  for select to authenticated
  using (author_id = auth.uid() or moderation_status not in ('pending','removed'));

-- 8) Grants: triggers + moderation RPCs unreachable by clients.
revoke all on function public._stamp_held_proof() from public, anon, authenticated;
revoke all on function public._stamp_held_by_author() from public, anon, authenticated;
revoke all on function public._recompute_profile_counts(uuid) from public, anon, authenticated;
revoke all on function public.clear_content(text, uuid) from public, anon, authenticated;
revoke all on function public.remove_content(text, uuid) from public, anon, authenticated;
revoke all on function public.limit_content(text, uuid) from public, anon, authenticated;
revoke all on function public.hold_content(text, uuid, text) from public, anon, authenticated;
