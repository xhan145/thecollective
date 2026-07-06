-- 035_mastery_gate.sql — Content-Mastery Task D (server side). Additive.
-- A) Sequential-unlock gate: reject completions/proofs for level N unless
--    level N−1 of the same skill is complete. Defense in depth behind the
--    client guard (PR #18). Service-role writes (seeds/admin) and demo rows
--    bypass; fallback prompt ids (no matching practices.slug) pass through.
-- B) proofs.tags: denormalize the level's feed_tags at insert (spec §6.2).
-- C) record_practice_trust: the level's trust_signal becomes the trust event
--    label (spec §4); caps and behavior otherwise unchanged from 027.

-- A) The gate ---------------------------------------------------------------
create or replace function public.enforce_mastery_unlock()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_level int; v_skill uuid;
begin
  -- No signed-in user = service-role path (seeds, admin tooling): allow.
  if auth.uid() is null then return NEW; end if;
  -- Demo rows are never gated (both tables carry is_demo since 016).
  if coalesce((to_jsonb(NEW) ->> 'is_demo')::boolean, false) then return NEW; end if;

  select p.level_number, p.skill_id into v_level, v_skill
    from public.practices p
   where p.slug = NEW.prompt_id and p.is_active;

  -- Not a mastery level (fallback/legacy id) or level 1: always allowed.
  if v_level is null or v_skill is null or v_level <= 1 then return NEW; end if;

  if exists (
    select 1
      from public.practice_completions pc
      join public.practices prev on prev.slug = pc.prompt_id
     where pc.user_id = NEW.user_id
       and prev.skill_id = v_skill
       and prev.level_number = v_level - 1
  ) then
    return NEW;
  end if;

  raise exception 'LEVEL_LOCKED: finish the previous level of this skill first';
end;
$$;

drop trigger if exists mastery_gate_completions on public.practice_completions;
create trigger mastery_gate_completions
  before insert on public.practice_completions
  for each row execute function public.enforce_mastery_unlock();

drop trigger if exists mastery_gate_proofs on public.proofs;
create trigger mastery_gate_proofs
  before insert on public.proofs
  for each row execute function public.enforce_mastery_unlock();

-- B) Feed-tag denormalization ------------------------------------------------
create or replace function public.stamp_proof_tags()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if NEW.tags is null or array_length(NEW.tags, 1) is null then
    select coalesce(p.feed_tags, '{}') into NEW.tags
      from public.practices p where p.slug = NEW.prompt_id;
    NEW.tags := coalesce(NEW.tags, '{}');
  end if;
  return NEW;
end;
$$;

drop trigger if exists proof_tags_stamp on public.proofs;
create trigger proof_tags_stamp
  before insert on public.proofs
  for each row execute function public.stamp_proof_tags();

-- C) trust_signal as the trust-event label ----------------------------------
create or replace function public.record_practice_trust(p_prompt_id text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_label text;
begin
  if not exists (select 1 from public.practice_completions where user_id = auth.uid() and prompt_id = p_prompt_id) then
    raise exception 'no completion for this practice';
  end if;
  select p.trust_signal into v_label
    from public.practices p where p.slug = p_prompt_id and p.trust_signal is not null;
  perform public._insert_trust_capped(auth.uid(), 'practice', coalesce(v_label, 'Completed a practice'), p_prompt_id, 3);
  perform public._recompute_profile_counts(auth.uid());
end;
$$;

-- Trigger helpers must be unreachable as RPCs.
revoke all on function public.enforce_mastery_unlock() from public, anon, authenticated;
revoke all on function public.stamp_proof_tags() from public, anon, authenticated;
