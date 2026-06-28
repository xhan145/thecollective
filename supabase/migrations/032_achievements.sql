-- 032_achievements.sql
-- Achievement badges: definitions + per-user unlock state + count-based evaluator.
-- Recognition-only (xp/trust_reward default 0, unused in MVP). Additive.
-- No client write policy on user_achievements: only the SECURITY-DEFINER evaluator
-- (+ service role) writes unlocks, so badges cannot be forged.

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  category text not null,
  stage text not null default 'Started',
  rarity text not null default 'Common',
  icon text,
  unlock_rule jsonb not null default '{}',
  xp int not null default 0,
  trust_reward int not null default 0,
  is_hidden boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);
create index if not exists user_achievements_user_idx on public.user_achievements(user_id);

alter table public.profiles add column if not exists selected_badges text[] not null default '{}';

-- RLS: definitions readable by all signed-in users; unlock state readable own only.
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists achievements_read on public.achievements;
create policy achievements_read on public.achievements for select to authenticated using (true);

drop policy if exists user_achievements_read on public.user_achievements;
create policy user_achievements_read on public.user_achievements for select to authenticated using (user_id = auth.uid());
-- (no insert/update/delete policies -> clients cannot forge unlocks)

-- Seed Phase-1 badges (idempotent on slug).
insert into public.achievements (slug, name, description, category, stage, rarity, unlock_rule) values
  ('direction_chosen','Direction Chosen','You chose a growth direction to practice.','Direction','Started','Common','{"type":"flag","metric":"has_direction"}'),
  ('first_practice','First Practice','You completed your first practice rep.','Practice','Started','Common','{"type":"count","metric":"practice_count","gte":1}'),
  ('practice_builder','Practice Builder','You completed 10 practice reps.','Practice','Practicing','Common','{"type":"count","metric":"practice_count","gte":10}'),
  ('real_reps','Real Reps','You completed 25 practice reps.','Practice','Practicing','Uncommon','{"type":"count","metric":"practice_count","gte":25}'),
  ('strong_foundation','Strong Foundation','You completed 50 practice reps.','Practice','Identity','Rare','{"type":"count","metric":"practice_count","gte":50}'),
  ('first_proof','First Proof','You submitted your first proof.','Proof','Started','Common','{"type":"count","metric":"proof_count","gte":1}'),
  ('proof_builder','Proof Builder','You submitted 10 proofs.','Proof','Practicing','Uncommon','{"type":"count","metric":"proof_count","gte":10}'),
  ('proof_library','Proof Library','You submitted 50 proofs into your archive.','Proof','Identity','Rare','{"type":"count","metric":"proof_count","gte":50}'),
  ('first_feedback_given','First Feedback Given','You gave feedback to another member.','Feedback','Started','Common','{"type":"count","metric":"feedback_given_count","gte":1}'),
  ('first_feedback_received','First Feedback Received','You received feedback on a proof.','Feedback','Started','Common','{"type":"count","metric":"feedback_received_count","gte":1}'),
  ('trust_started','Trust Started','You earned your first trust through real practice.','Trust','Trusted','Common','{"type":"count","metric":"trust_score","gte":1}'),
  ('trusted_contributor','Trusted Contributor','You reached Contributor through repeated useful help.','Contribution','Identity','Epic','{"type":"count","metric":"trust_score","gte":200}')
on conflict (slug) do nothing;

-- Evaluator: unlock any satisfied, not-yet-earned active badge for the caller. Idempotent.
create or replace function public.evaluate_achievements()
returns text[] language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_prof record;
  v_new text[] := '{}';
  r record;
  v_metric_val int;
  v_ok boolean;
begin
  if v_uid is null then return v_new; end if;
  select practice_count, proof_count, feedback_given_count, feedback_received_count, trust_score, current_direction_id
    into v_prof from public.profiles where id = v_uid;
  if not found then return v_new; end if;
  for r in
    select a.* from public.achievements a
    where a.is_active and not a.is_hidden
      and not exists (select 1 from public.user_achievements ua where ua.user_id = v_uid and ua.achievement_id = a.id)
  loop
    v_ok := false;
    if r.unlock_rule->>'type' = 'flag' and r.unlock_rule->>'metric' = 'has_direction' then
      v_ok := v_prof.current_direction_id is not null;
    elsif r.unlock_rule->>'type' = 'count' then
      v_metric_val := case r.unlock_rule->>'metric'
        when 'practice_count' then coalesce(v_prof.practice_count, 0)
        when 'proof_count' then coalesce(v_prof.proof_count, 0)
        when 'feedback_given_count' then coalesce(v_prof.feedback_given_count, 0)
        when 'feedback_received_count' then coalesce(v_prof.feedback_received_count, 0)
        when 'trust_score' then coalesce(v_prof.trust_score, 0)
        else 0 end;
      v_ok := v_metric_val >= coalesce((r.unlock_rule->>'gte')::int, 2147483647);
    end if;
    if v_ok then
      insert into public.user_achievements (user_id, achievement_id) values (v_uid, r.id) on conflict do nothing;
      insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
        values (v_uid, v_uid, 'achievement_unlocked', 'Badge earned', r.name, 'achievement', r.id);
      v_new := array_append(v_new, r.slug);
    end if;
  end loop;
  return v_new;
end;
$$;

revoke all on function public.evaluate_achievements() from public, anon;
grant execute on function public.evaluate_achievements() to authenticated;
