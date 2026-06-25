-- 029_spam_enforcement.sql — reversible content quarantine (additive). After 028.
-- held is stamped server-side at insert from the author's current spam_signal (>=70);
-- _recompute releases (held=false) when spam<40 on non-removed rows; admins clear/remove.

-- 1) Columns.
alter table public.proofs        add column if not exists held boolean not null default false;
alter table public.proofs        add column if not exists removed boolean not null default false;
alter table public.practice_tips add column if not exists held boolean not null default false;
alter table public.practice_tips add column if not exists removed boolean not null default false;
alter table public.feedback      add column if not exists held boolean not null default false;
alter table public.feedback      add column if not exists removed boolean not null default false;
create index if not exists proofs_held_idx        on public.proofs(user_id)   where held;
create index if not exists practice_tips_held_idx on public.practice_tips(author_id) where held;
create index if not exists feedback_held_idx      on public.feedback(author_id) where held;

-- 2) BEFORE-INSERT triggers: stamp held from author's current signal (>= 70). Server-only.
create or replace function public._stamp_held_proof()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.held := coalesce((select spam_signal from public.profiles where id = new.user_id), 0) >= 70;
  return new;
end;
$$;
create or replace function public._stamp_held_by_author()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.held := coalesce((select spam_signal from public.profiles where id = new.author_id), 0) >= 70;
  return new;
end;
$$;
drop trigger if exists trg_stamp_held on public.proofs;
create trigger trg_stamp_held before insert on public.proofs
  for each row execute function public._stamp_held_proof();
drop trigger if exists trg_stamp_held on public.practice_tips;
create trigger trg_stamp_held before insert on public.practice_tips
  for each row execute function public._stamp_held_by_author();
drop trigger if exists trg_stamp_held on public.feedback;
create trigger trg_stamp_held before insert on public.feedback
  for each row execute function public._stamp_held_by_author();

-- 3) Recompute (re-declared from 028; ONLY addition = the self-heal block at the end).
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

  -- Self-heal: behavior normalized -> release non-removed held content for this author.
  if v_spam < 40 then
    update public.proofs        set held = false where user_id   = p_uid and held and not removed;
    update public.practice_tips set held = false where author_id = p_uid and held and not removed;
    update public.feedback      set held = false where author_id = p_uid and held and not removed;
  end if;
end;
$$;

-- 4) Admin moderation RPCs (service-role only).
create or replace function public.clear_content(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kind = 'proof' then update public.proofs set held = false, removed = false where id = p_id;
  elsif p_kind = 'tip' then update public.practice_tips set held = false, removed = false where id = p_id;
  elsif p_kind = 'feedback' then update public.feedback set held = false, removed = false where id = p_id;
  else raise exception 'bad kind'; end if;
end;
$$;
create or replace function public.remove_content(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kind = 'proof' then update public.proofs set held = true, removed = true where id = p_id;
  elsif p_kind = 'tip' then update public.practice_tips set held = true, removed = true where id = p_id;
  elsif p_kind = 'feedback' then update public.feedback set held = true, removed = true where id = p_id;
  else raise exception 'bad kind'; end if;
end;
$$;

-- 5) Grants: triggers + admin RPCs unreachable by clients.
revoke all on function public._stamp_held_proof() from public, anon, authenticated;
revoke all on function public._stamp_held_by_author() from public, anon, authenticated;
revoke all on function public.clear_content(text, uuid) from public, anon, authenticated;
revoke all on function public.remove_content(text, uuid) from public, anon, authenticated;
