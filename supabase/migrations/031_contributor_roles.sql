-- 031_contributor_roles.sql
-- Contributor roles: mentor opt-in visibility + service-only cohort "guide" role.
-- Additive. No client write policies added; only the SECURITY-DEFINER RPC writes role='guide',
-- and only the user's own mentor_opt_in is client-writable (existing own-row profile update).

-- 1) Mentor visibility opt-in (the user's own preference).
alter table public.profiles add column if not exists mentor_opt_in boolean not null default false;

-- 2) Allow a third, service-only membership role: 'guide'.
alter table public.cohort_members drop constraint if exists cohort_members_role_check;
alter table public.cohort_members
  add constraint cohort_members_role_check check (role in ('owner','member','guide'));

-- 3) Owner-only RPC to designate/undesignate a guide. Guide is service-only:
--    it grants NO moderation power (approve/decline/remove all check owner).
create or replace function public.set_cohort_guide(p_cohort_id uuid, p_user_id uuid, p_is_guide boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public._is_cohort_owner(p_cohort_id, auth.uid()) then
    raise exception 'not your cohort';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot change your own role';
  end if;
  if not exists (
    select 1 from public.cohort_members
    where cohort_id = p_cohort_id and user_id = p_user_id and role <> 'owner'
  ) then
    raise exception 'not a member of this cohort';
  end if;
  if p_is_guide then
    if coalesce((select trust_score from public.profiles where id = p_user_id), 0) < 100 then
      raise exception 'guides must be Helpful or above';
    end if;
    update public.cohort_members set role = 'guide'
      where cohort_id = p_cohort_id and user_id = p_user_id and role <> 'owner';
  else
    update public.cohort_members set role = 'member'
      where cohort_id = p_cohort_id and user_id = p_user_id and role = 'guide';
  end if;
end;
$$;

revoke all on function public.set_cohort_guide(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_cohort_guide(uuid, uuid, boolean) to authenticated;
