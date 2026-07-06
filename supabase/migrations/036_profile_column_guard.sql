-- 036_profile_column_guard.sql — close the trust-mint vulnerability. Additive.
--
-- Problem (open since 011): profiles_update_own had no WITH CHECK and, more
-- importantly, whole-table INSERT/UPDATE grants let a signed-in client write
-- its own trust_score / trust components / counts / role / beta_access —
-- contradicting earn-only trust. SECURITY-DEFINER RPCs (the legitimate
-- writers) and service-role paths are unaffected by these grants.
--
-- Fix: column-level INSERT/UPDATE grants for authenticated, restricted to the
-- fields the app legitimately writes client-side (identity, onboarding
-- answers, passport intro fields, displayed badges). Everything else —
-- trust_score, practice/feedback/consistency/contribution_trust, spam_signal,
-- *_count, role, cohort_id, beta_access, invite_code, demo columns — becomes
-- server-only.

-- 1) Policy completeness: WITH CHECK so a row can't be re-owned on update.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2) Column-level write grants.
revoke insert, update on public.profiles from authenticated, anon;

grant update (
  display_name, initials, username, bio, avatar_url, mentor_opt_in,
  headline, current_focus_skill, introduction_summary, open_to_introductions,
  current_direction_id, goal_text, starting_level, context_tags, cadence,
  onboarding_completed, selected_badges, updated_at
) on public.profiles to authenticated;

-- ensureProfile's client-side fallback upsert (id + name fields) plus the
-- same benign self-describing fields.
grant insert (
  id, display_name, initials, username, bio, avatar_url,
  current_direction_id, goal_text, starting_level, context_tags, cadence,
  onboarding_completed, updated_at
) on public.profiles to authenticated;
