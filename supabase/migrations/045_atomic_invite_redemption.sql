-- 045_atomic_invite_redemption.sql — Package 4 (R27). Additive. After 044.
-- The redeem route read use_count, computed nextCount, then UPDATE ... set
-- use_count = <stale nextCount> where use_count < max_uses. Two concurrent
-- redeems of a multi-use invite both write the same stale value, so uses are
-- undercounted and the invite can be redeemed beyond max_uses. Fix: a single
-- atomic increment inside one UPDATE (row-locking makes concurrent increments
-- correct) in a SECURITY DEFINER, service-only RPC. Granting beta_access is
-- part of the same transaction so a claimed slot always maps to exactly one
-- granted account.
create or replace function public.redeem_beta_invite(p_code text, p_user_id uuid, p_email text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if p_user_id is null then return false; end if;
  update public.beta_invites
     set use_count = use_count + 1,
         status = case when use_count + 1 >= max_uses then 'used' else 'active' end
   where code = p_code
     and status = 'active'
     and (expires_at is null or expires_at > now())
     and use_count < max_uses
     and (email is null or lower(email) = lower(coalesce(p_email, '')))
   returning id into v_id;
  if v_id is null then return false; end if;
  update public.profiles
     set beta_access = true, invite_code = p_code, beta_joined_at = now()
   where id = p_user_id;
  return true;
end;
$$;

-- Service-only: the /api/beta/redeem-invite route (which authenticates the
-- user first) calls this with the service key. Never client-reachable.
revoke all on function public.redeem_beta_invite(text, uuid, text) from public, anon, authenticated;
