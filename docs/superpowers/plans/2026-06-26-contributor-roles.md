# Contributor Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formalize Collective's earned capability gates into one tier-keyed capability ladder (`lib/roles.ts`) and add lighter-service abilities at the upper tiers (mentor visibility, cohort guide, welcome-newcomers, Steward).

**Architecture:** Capabilities derive purely from `trust_score` → Trust V2 tier (earned, never settable). A pure `lib/roles.ts` is the single source of truth; existing feedback/host-cohort gates are refactored to read from it with identical thresholds. Two new persisted bits (a `profiles.mentor_opt_in` column and a `'guide'` value in `cohort_members.role` written only by an owner-only SECURITY-DEFINER RPC); everything else derives. No moderation powers to members.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind; Supabase (Postgres, RLS, SECURITY-DEFINER RPCs); verification via `npx tsx scripts/check-*.ts` + `npm run typecheck` + `npm run build`.

**Spec:** `docs/superpowers/specs/2026-06-26-contributor-roles-design.md`

## Global Constraints

- Additive only. Never edit applied migrations 010–030; new migration is `031_contributor_roles.sql`.
- Capabilities derive from tier; nothing client-settable except the user's own `mentor_opt_in`. No client write policy grants the `'guide'` role — only the `set_cohort_guide` SECURITY-DEFINER RPC writes it.
- SECURITY-DEFINER helpers stay revoked from `public`/`anon`/`authenticated`; action RPCs granted to `authenticated` only, revoked from `public`/`anon`.
- **No behavior change to existing gates:** `give_feedback` stays at Reliable (`trust_score ≥ 50` / `levelRank ≥ 2`); `host_cohort` stays at Reliable; knowledge tips stay completion-gated; contribute stays behavior-gated.
- Lighter service only — **content moderation stays admin-only**; guides cannot approve/decline/remove (those RPCs check owner).
- Anti-clout: no counts, no leaderboards, no ranking in any role surface. Roles framed as service. Guide & mentor are opt-in + reversible; no shame copy. Steward = a quiet stamp, not a number.
- Tier names unchanged: New `<20` · Practicing `≥20` · Reliable `≥50` · Helpful `≥100` · Contributor `≥200`.
- Demo/no-Supabase mode degrades gracefully (no crash; new actions return `{ error }`, mentor/newcomer lists empty).

---

## File Structure

- **Create** `lib/roles.ts` — pure capability model (source of truth).
- **Create** `scripts/check-roles.ts` — pure check.
- **Modify** `app/feed/page.tsx`, `app/cohorts/[id]/page.tsx`, `lib/cohorts/access.ts` — read gates from `lib/roles.ts` (same thresholds).
- **Create** `supabase/migrations/031_contributor_roles.sql` — `mentor_opt_in` column, `'guide'` role, `set_cohort_guide` RPC.
- **Modify** `lib/betaTypes.ts` (`UserProfile.mentorOptIn`), `lib/cohorts/types.ts` (`CohortRole` += `'guide'`), `lib/supabase/betaRepository.ts` (`mapProfile`, `updateProfile`), `lib/supabase/cohortsRepository.ts` (`setCohortGuide`), `components/beta/AppStateProvider.tsx` (`updateProfile` fields, `setCohortGuideAction`).
- **Create** `components/beta/HelpWithCard.tsx` — profile "what you can help with" card + Steward stamp.
- **Modify** `app/profile/page.tsx` (card + mentor toggle), `app/directions/page.tsx` (mentor strip + welcome-newcomers), `app/cohorts/[id]/page.tsx` (guide UI), `docs/BETA_QA.md` (Contributor roles section).

---

## Task 1: Capability model + refactor existing gates

**Files:**
- Create: `lib/roles.ts`
- Create: `scripts/check-roles.ts`
- Modify: `app/feed/page.tsx:17`, `app/cohorts/[id]/page.tsx:128`, `lib/cohorts/access.ts`

**Interfaces:**
- Consumes: `trustLevelForPoints` from `lib/betaTrust.ts`; `TrustSummary` from `lib/betaTypes.ts`.
- Produces: `Capability`, `TierLabel`, `TIER_CAPABILITIES`, `tierForProfile`, `capabilitiesForTier`, `hasCapability(profile, cap)`, `nextTierUnlocks(tier)`, `HELP_SUMMARY`.

- [ ] **Step 1: Write the failing check** — create `scripts/check-roles.ts`:

```ts
import {
  hasCapability,
  capabilitiesForTier,
  nextTierUnlocks,
  TIER_CAPABILITIES,
  HELP_SUMMARY,
} from "../lib/roles";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
const p = (trustScore: number) => ({ trustScore });

// give_feedback + host_cohort gate at Reliable (>=50), unchanged from today
assert(!hasCapability(p(49), "give_feedback"), "49 should not give_feedback");
assert(hasCapability(p(50), "give_feedback"), "50 should give_feedback");
assert(!hasCapability(p(49), "host_cohort"), "49 should not host_cohort");
assert(hasCapability(p(50), "host_cohort"), "50 should host_cohort");

// mentor_visibility + cohort_guide gate at Helpful (>=100)
assert(!hasCapability(p(99), "mentor_visibility"), "99 should not mentor_visibility");
assert(hasCapability(p(100), "mentor_visibility"), "100 should mentor_visibility");
assert(hasCapability(p(100), "cohort_guide"), "100 should cohort_guide");

// welcome_newcomers + steward gate at Contributor (>=200)
assert(!hasCapability(p(199), "welcome_newcomers"), "199 should not welcome_newcomers");
assert(hasCapability(p(200), "welcome_newcomers"), "200 should welcome_newcomers");
assert(hasCapability(p(200), "steward"), "200 should steward");

// null/undefined profile => no capabilities
assert(!hasCapability(null, "give_feedback"), "null => no capability");

// cumulative + monotonic: each tier includes all lower-tier capabilities
const order = ["New", "Practicing", "Reliable", "Helpful", "Contributor"] as const;
for (let i = 1; i < order.length; i++) {
  const lower = capabilitiesForTier(order[i - 1]);
  const higher = capabilitiesForTier(order[i]);
  assert(lower.every((c) => higher.includes(c)), `${order[i]} must include all of ${order[i - 1]}`);
}
assert(capabilitiesForTier("Contributor").length === 6, "Contributor has all 6 capabilities");
assert(capabilitiesForTier("Practicing").length === 0, "Practicing has 0 tier-gated capabilities");

// nextTierUnlocks skips tiers that unlock nothing (Practicing) and ends at Contributor
assert(nextTierUnlocks("New")?.tier === "Reliable", "New -> Reliable next");
assert(nextTierUnlocks("Reliable")?.tier === "Helpful", "Reliable -> Helpful next");
assert(nextTierUnlocks("Contributor") === null, "Contributor has no next");

// every tier has a help summary string
assert(order.every((t) => typeof HELP_SUMMARY[t] === "string" && HELP_SUMMARY[t].length > 0), "HELP_SUMMARY complete");

console.log("roles checks passed");
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx scripts/check-roles.ts`
Expected: FAIL — `Cannot find module '../lib/roles'`.

- [ ] **Step 3: Implement `lib/roles.ts`**

```ts
import { trustLevelForPoints } from "./betaTrust";
import type { TrustSummary } from "./betaTypes";

/** The five Trust V2 tiers, lowest to highest. */
export type TierLabel = TrustSummary["levelLabel"];

/** Tier-gated capabilities. (Knowledge tips + contribute are NOT here — they keep
 *  their existing completion/behavior gates, by design.) */
export type Capability =
  | "give_feedback"
  | "host_cohort"
  | "mentor_visibility"
  | "cohort_guide"
  | "welcome_newcomers"
  | "steward";

const TIER_ORDER: TierLabel[] = ["New", "Practicing", "Reliable", "Helpful", "Contributor"];

/** Capabilities introduced AT each tier (not cumulative). */
const UNLOCKED_AT: Record<TierLabel, Capability[]> = {
  New: [],
  Practicing: [],
  Reliable: ["give_feedback", "host_cohort"],
  Helpful: ["mentor_visibility", "cohort_guide"],
  Contributor: ["welcome_newcomers", "steward"],
};

/** Cumulative capabilities available at each tier (includes all lower tiers). */
export const TIER_CAPABILITIES: Record<TierLabel, Capability[]> = (() => {
  const acc: Capability[] = [];
  const out = {} as Record<TierLabel, Capability[]>;
  for (const tier of TIER_ORDER) {
    acc.push(...UNLOCKED_AT[tier]);
    out[tier] = [...acc];
  }
  return out;
})();

export function tierForProfile(
  profile: { trustScore?: number | null } | null | undefined,
): TierLabel {
  return trustLevelForPoints(profile?.trustScore ?? 0);
}

export function capabilitiesForTier(tier: TierLabel): Capability[] {
  return TIER_CAPABILITIES[tier];
}

/** Earned, never settable: derives from trust_score -> tier. */
export function hasCapability(
  profile: { trustScore?: number | null } | null | undefined,
  cap: Capability,
): boolean {
  if (!profile) return false;
  return capabilitiesForTier(tierForProfile(profile)).includes(cap);
}

/** The next tier that unlocks at least one new capability, or null at the top. */
export function nextTierUnlocks(
  tier: TierLabel,
): { tier: TierLabel; capabilities: Capability[] } | null {
  const i = TIER_ORDER.indexOf(tier);
  for (let j = i + 1; j < TIER_ORDER.length; j++) {
    if (UNLOCKED_AT[TIER_ORDER[j]].length > 0) {
      return { tier: TIER_ORDER[j], capabilities: UNLOCKED_AT[TIER_ORDER[j]] };
    }
  }
  return null;
}

/** One-line "what you can help with" per tier (service framing, no clout). */
export const HELP_SUMMARY: Record<TierLabel, string> = {
  New: "Practice, post proof, and mark what's useful to you.",
  Practicing: "Add tips on practices you've done, and contribute to open proofs.",
  Reliable: "Give feedback and host your own cohort.",
  Helpful: "Be listed as someone to learn from, and help guide a cohort.",
  Contributor: "Welcome newcomers in your direction — you're a Steward here.",
};
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx tsx scripts/check-roles.ts`
Expected: PASS — prints `roles checks passed`.

- [ ] **Step 5: Refactor `app/feed/page.tsx`** — replace the feedback gate (currently line 17 `const canGiveFeedback = viewer ? levelRank(viewer) >= 2 : false;`):

```tsx
// add import near the other lib imports:
import { hasCapability } from "@/lib/roles";
// replace the gate line:
const canGiveFeedback = hasCapability(viewer, "give_feedback");
```
Remove the now-unused `levelRank` import from this file **only if** it is no longer referenced elsewhere in the file (grep first; the feed maps `relation`/`authorRank` via `rankFeed`, which is internal — `levelRank` is likely unused here after this change).

- [ ] **Step 6: Refactor `app/cohorts/[id]/page.tsx`** — replace line 128 (`const canGiveFeedback = currentUser ? levelRank(currentUser) >= 2 : false;`):

```tsx
import { hasCapability } from "@/lib/roles";
const canGiveFeedback = hasCapability(currentUser, "give_feedback");
```
Keep the existing `levelRank` import only if still used elsewhere in the file; otherwise remove it.

- [ ] **Step 7: Refactor `lib/cohorts/access.ts`** — express `canCreateCohort` via the capability model (same threshold):

```ts
import { hasCapability } from "@/lib/roles";

/** Reliable+ may create cohorts. Mirrors the SQL create_cohort gate (trust_score >= 50). */
export function canCreateCohort(
  profile: { trustScore?: number | null } | null | undefined,
): boolean {
  return hasCapability(profile, "host_cohort");
}
```

- [ ] **Step 8: Verify no behavior change + types**

Run: `npx tsx scripts/check-cohorts.ts` → Expected: `cohorts checks passed` (canCreateCohort band 49→false/50→true unchanged).
Run: `npm run typecheck` → Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add lib/roles.ts scripts/check-roles.ts app/feed/page.tsx "app/cohorts/[id]/page.tsx" lib/cohorts/access.ts
git commit -m "feat(roles): capability model keyed to trust tiers + centralize existing gates"
```

---

## Task 2: Migration 031 — mentor opt-in + cohort guide role + RPC

**Files:**
- Create: `supabase/migrations/031_contributor_roles.sql`

**Interfaces:**
- Produces (DB): `profiles.mentor_opt_in boolean`; `cohort_members.role` accepts `'guide'`; RPC `set_cohort_guide(p_cohort_id uuid, p_user_id uuid, p_is_guide boolean) returns void`.
- Consumes: existing `public._is_cohort_owner(uuid, uuid)` helper from migration 030.

- [ ] **Step 1: Confirm the live constraint name**

Use Supabase MCP `execute_sql`:
```sql
select conname from pg_constraint
where conrelid = 'public.cohort_members'::regclass and contype = 'c';
```
Expected: a row `cohort_members_role_check` (the inline check from 030). If the name differs, use the actual name in Step 2's `drop constraint`.

- [ ] **Step 2: Write `supabase/migrations/031_contributor_roles.sql`**

```sql
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
```

- [ ] **Step 3: Apply to prod via MCP**

Apply with Supabase MCP `apply_migration` (name `contributor_roles`, the SQL above). Then re-apply once to confirm idempotency (the `add column if not exists` + `drop constraint if exists` + `create or replace` make it safe; `add constraint` will error on the second run only if the constraint already exists — so guard Step 2's add with a drop-first, which it has). If the second apply errors on the constraint, that confirms it applied — acceptable; do not edit the file.

- [ ] **Step 4: Verify schema + security**

Run via MCP `execute_sql`:
```sql
select column_name from information_schema.columns
where table_schema='public' and table_name='profiles' and column_name='mentor_opt_in';
select pg_get_constraintdef(oid) from pg_constraint where conname='cohort_members_role_check';
select has_function_privilege('authenticated','public.set_cohort_guide(uuid,uuid,boolean)','execute') as auth_can,
       has_function_privilege('anon','public.set_cohort_guide(uuid,uuid,boolean)','execute') as anon_can;
```
Expected: `mentor_opt_in` present; constraint def includes `'guide'`; `auth_can = true`, `anon_can = false`.
Then MCP `get_advisors(security)` → Expected: no new ERROR-level findings (the `authenticated_security_definer_function_executable` WARN on `set_cohort_guide` is by-design, same as the cohorts RPCs).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/031_contributor_roles.sql
git commit -m "feat(db): mentor_opt_in + service-only cohort guide role + set_cohort_guide RPC (031)"
```

---

## Task 3: Types + repository + provider wiring

**Files:**
- Modify: `lib/betaTypes.ts` (`UserProfile`), `lib/cohorts/types.ts` (`CohortRole`)
- Modify: `lib/supabase/betaRepository.ts` (`mapProfile`, `updateProfile`)
- Modify: `lib/supabase/cohortsRepository.ts` (add `setCohortGuide`)
- Modify: `components/beta/AppStateProvider.tsx` (`updateProfile` fields, `setCohortGuideAction`)

**Interfaces:**
- Consumes: migration 031 RPC `set_cohort_guide`; `getSupabaseClient` (cohortsRepository pattern).
- Produces: `UserProfile.mentorOptIn?: boolean`; `CohortRole` includes `'guide'`; repo `setCohortGuide(client, cohortId, userId, isGuide): Promise<{ error: string | null }>`; provider `updateProfile({ ..., mentorOptIn? })` and `setCohortGuideAction(cohortId, userId, isGuide): Promise<{ error: string | null }>`.

- [ ] **Step 1: Extend `UserProfile`** in `lib/betaTypes.ts` — add after `trustScore?: number;`:

```ts
  mentorOptIn?: boolean;
```

- [ ] **Step 2: Map it** in `lib/supabase/betaRepository.ts` `mapProfile` (add alongside the other fields, near `trustScore`):

```ts
    mentorOptIn: row.mentor_opt_in ?? false,
```

- [ ] **Step 3: Persist it** in `lib/supabase/betaRepository.ts` `updateProfile` — extend the `fields` type and patch:

```ts
export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  fields: { displayName?: string; username?: string; bio?: string; mentorOptIn?: boolean },
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.displayName !== undefined) {
    patch.display_name = fields.displayName;
    patch.initials = fields.displayName.slice(0, 2).toUpperCase();
  }
  if (fields.username !== undefined) patch.username = fields.username;
  if (fields.bio !== undefined) patch.bio = fields.bio;
  if (fields.mentorOptIn !== undefined) patch.mentor_opt_in = fields.mentorOptIn;
  await client.from("profiles").update(patch).eq("id", userId);
}
```

- [ ] **Step 4: Extend `CohortRole`** in `lib/cohorts/types.ts`:

```ts
export type CohortRole = "owner" | "member" | "guide";
```

- [ ] **Step 5: Add `setCohortGuide`** to `lib/supabase/cohortsRepository.ts` (mirror the existing RPC callers like `removeMember`):

```ts
export async function setCohortGuide(
  client: SupabaseClient,
  cohortId: string,
  userId: string,
  isGuide: boolean,
): Promise<{ error: string | null }> {
  const { error } = await client.rpc("set_cohort_guide", {
    p_cohort_id: cohortId,
    p_user_id: userId,
    p_is_guide: isGuide,
  });
  return { error: error ? error.message : null };
}
```
(Use the same `SupabaseClient` import already present in the file.)

- [ ] **Step 6: Wire provider `updateProfile` fields** in `components/beta/AppStateProvider.tsx` — extend the context type (line ~103) and the optimistic local update so the toggle reflects immediately:

```ts
  updateProfile: (fields: { displayName?: string; username?: string; bio?: string; mentorOptIn?: boolean }) => Promise<void>;
```
In the `updateProfile` implementation (~line 482), ensure the optimistic local `currentUser` patch carries `mentorOptIn` when present (mirror how displayName/bio are applied to local state), then the existing `updateProfileRow(supabase!, uid, fields)` call already forwards it.

- [ ] **Step 7: Add `setCohortGuideAction`** to the provider — import `setCohortGuide as setCohortGuideRpc` from cohortsRepository (add to the existing cohortsRepository import block), add to the context type, and implement (mirroring the other cohort action wrappers; no `myCohorts` refresh needed — the cohort page calls `loadCohort` to refresh):

```ts
// context type:
  setCohortGuideAction: (cohortId: string, userId: string, isGuide: boolean) => Promise<CohortActionResult>;

// value:
      async setCohortGuideAction(cohortId, userId, isGuide) {
        const supabase = getSupabaseClient();
        if (!writesEnabled || !supabase) return { error: "Supabase is not configured." };
        return setCohortGuideRpc(supabase, cohortId, userId, isGuide);
      },
```
(`CohortActionResult` already exists in this file from the cohorts feature.)

- [ ] **Step 8: Verify**

Run: `npm run typecheck` → Expected: clean.
Run: `npm run build 2>&1 | tail -20` → Expected: compiles.

- [ ] **Step 9: Commit**

```bash
git add lib/betaTypes.ts lib/cohorts/types.ts lib/supabase/betaRepository.ts lib/supabase/cohortsRepository.ts components/beta/AppStateProvider.tsx
git commit -m "feat(roles): types + repo + provider wiring (mentorOptIn, setCohortGuide)"
```

---

## Task 4: Profile — "What you can help with" card + Steward stamp + mentor toggle

**Files:**
- Create: `components/beta/HelpWithCard.tsx`
- Modify: `app/profile/page.tsx`

**Interfaces:**
- Consumes: `tierForProfile`, `capabilitiesForTier`, `HELP_SUMMARY`, `nextTierUnlocks`, `hasCapability` from `lib/roles`; `useBetaApp()` (`currentUser`, `updateProfile`, `snapshot.directions`).
- Produces: `<HelpWithCard />` rendered on `/profile`.

- [ ] **Step 1: Create `components/beta/HelpWithCard.tsx`**

```tsx
"use client";

import { useBetaApp } from "./AppStateProvider";
import { Card, SectionLabel, Badge } from "./ui";
import { tierForProfile, capabilitiesForTier, HELP_SUMMARY, nextTierUnlocks, type Capability } from "@/lib/roles";

const CAP_LABEL: Record<Capability, string> = {
  give_feedback: "Give feedback",
  host_cohort: "Host a cohort",
  mentor_visibility: "Be someone to learn from",
  cohort_guide: "Guide a cohort",
  welcome_newcomers: "Welcome newcomers",
  steward: "Steward",
};

export function HelpWithCard() {
  const { currentUser } = useBetaApp();
  if (!currentUser) return null;
  const tier = tierForProfile(currentUser);
  const caps = capabilitiesForTier(tier);
  const next = nextTierUnlocks(tier);
  const isSteward = caps.includes("steward");

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <SectionLabel>What you can help with</SectionLabel>
        {isSteward && (
          <span className="rounded-full bg-[#FFF1C7] px-2.5 py-1 text-[11px] font-black text-[#7A5300]">
            ★ Steward
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-[#38322A]">{HELP_SUMMARY[tier]}</p>
      {caps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {caps.map((c) => (
            <Badge key={c} tone="muted">{CAP_LABEL[c]}</Badge>
          ))}
        </div>
      )}
      {next && (
        <p className="mt-3 text-xs text-[#6E6E6E]">
          At <span className="font-bold">{next.tier}</span>, you can also{" "}
          {next.capabilities.map((c) => CAP_LABEL[c].toLowerCase()).join(" and ")}.
        </p>
      )}
    </Card>
  );
}
```
(If `Badge`/`Card`/`SectionLabel` props differ, match their real signatures in `components/beta/ui.tsx`. Keep dark-mode-safe by using the same literal tokens other cards use.)

- [ ] **Step 2: Add the card + mentor toggle to `app/profile/page.tsx`**

Import at top:
```tsx
import { HelpWithCard } from "@/components/beta/HelpWithCard";
import { hasCapability } from "@/lib/roles";
```
Render `<HelpWithCard />` in the profile body (near the trust summary). Then add a mentor toggle, shown only when `hasCapability(currentUser, "mentor_visibility")`:

```tsx
{hasCapability(currentUser, "mentor_visibility") && (
  <Card>
    <SectionLabel>Mentoring</SectionLabel>
    <label className="mt-2 flex items-center justify-between gap-3">
      <span className="text-sm text-[#38322A]">List me as someone to learn from in my direction</span>
      <input
        type="checkbox"
        checked={!!currentUser.mentorOptIn}
        onChange={(e) => updateProfile({ mentorOptIn: e.target.checked })}
        className="h-5 w-5 accent-[#F2A900]"
        aria-label="List me as someone to learn from"
      />
    </label>
    <p className="mt-1 text-xs text-[#6E6E6E]">Optional. Turn it off anytime.</p>
  </Card>
)}
```
Ensure `updateProfile` and `currentUser` are pulled from `useBetaApp()` in this page (add to the destructure if missing).

- [ ] **Step 3: Verify**

Run: `npm run typecheck` → clean.
Run: `npm run build 2>&1 | tail -20` → compiles.

- [ ] **Step 4: Commit**

```bash
git add components/beta/HelpWithCard.tsx app/profile/page.tsx
git commit -m "feat(roles): profile 'what you can help with' card, Steward stamp, mentor toggle"
```

---

## Task 5: Directions — mentor strip + welcome-newcomers surface

**Files:**
- Modify: `app/directions/page.tsx`

**Interfaces:**
- Consumes: `useBetaApp()` (`currentUser`, `snapshot.users`, `snapshot.directions`, `sendPeerNote`, `toggleLearnFrom`/`isLearningFrom` if present), `hasCapability`, `tierForProfile` from `lib/roles`, `Avatar`.
- Produces: two calm sections on `/directions`, both anti-clout (names + one action; no counts).

- [ ] **Step 1: Build pure selectors inline in the page** (keep them small; they read snapshot only):

```tsx
import { hasCapability, tierForProfile } from "@/lib/roles";
import { Avatar } from "@/components/beta/Avatar";

// inside the component, with currentUser + snapshot from useBetaApp():
const myDir = currentUser?.currentDirectionId ?? null;

// People to learn from: Helpful+ members in my direction who opted in (exclude me)
const mentors = !myDir ? [] : snapshot.users.filter((u) =>
  u.id !== currentUser?.id &&
  !!u.mentorOptIn &&
  hasCapability(u, "mentor_visibility") &&
  (u.currentDirectionId === myDir || (u.directionIds ?? []).includes(myDir))
).slice(0, 8);

// Newcomers to welcome: New-tier members in my direction (exclude me). Contributor-gated surface.
const newcomers = !myDir || !hasCapability(currentUser, "welcome_newcomers") ? [] :
  snapshot.users.filter((u) =>
    u.id !== currentUser?.id &&
    tierForProfile(u) === "New" &&
    (u.currentDirectionId === myDir || (u.directionIds ?? []).includes(myDir))
  ).slice(0, 6);
```

- [ ] **Step 2: Render the mentor strip** (only when `mentors.length > 0`):

```tsx
{mentors.length > 0 && (
  <section className="space-y-3">
    <SectionLabel>People to learn from in this direction</SectionLabel>
    <div className="space-y-2">
      {mentors.map((m) => (
        <Card key={m.id} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={m.displayName} avatarUrl={m.avatarUrl} />
            <span className="text-sm font-bold text-[#111111]">{m.displayName}</span>
          </div>
          <Button variant="quiet" onClick={() => toggleLearnFrom(m.id)}>
            {isLearningFrom(m.id) ? "Learning" : "Learn from"}
          </Button>
        </Card>
      ))}
    </div>
  </section>
)}
```
(Use the real `Avatar` prop names and the real `toggleLearnFrom`/`isLearningFrom` from `useBetaApp()`. If `Button` variant `quiet` doesn't exist, use the closest calm variant.)

- [ ] **Step 3: Render the welcome-newcomers surface** (only when `newcomers.length > 0`):

```tsx
{newcomers.length > 0 && (
  <section className="space-y-3">
    <SectionLabel>Say hi to someone new</SectionLabel>
    <p className="text-xs text-[#6E6E6E]">A short, kind note goes a long way.</p>
    <div className="space-y-2">
      {newcomers.map((n) => (
        <Card key={n.id} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={n.displayName} avatarUrl={n.avatarUrl} />
            <span className="text-sm font-bold text-[#111111]">{n.displayName}</span>
          </div>
          <Button variant="quiet" onClick={() => sendPeerNote(n.id, `Hi ${n.displayName} — welcome to Collective! Glad you're here.`)}>
            Say hi
          </Button>
        </Card>
      ))}
    </div>
  </section>
)}
```
(`sendPeerNote(recipientId, body, proofId?)` exists in the provider. Disable/replace the button text to "Sent" after click if a lightweight local state is easy; otherwise leave as a single send — keep it simple, no counts.)

- [ ] **Step 4: Verify**

Run: `npm run typecheck` → clean.
Run: `npm run build 2>&1 | tail -20` → compiles.

- [ ] **Step 5: Commit**

```bash
git add app/directions/page.tsx
git commit -m "feat(roles): mentor 'learn from' strip + Contributor welcome-newcomers on /directions"
```

---

## Task 6: Cohort guide UI + docs + final verification

**Files:**
- Modify: `app/cohorts/[id]/page.tsx`
- Modify: `docs/BETA_QA.md`

**Interfaces:**
- Consumes: `setCohortGuideAction` from `useBetaApp()`; `hasCapability` from `lib/roles`; existing `loadCohort` refresh + `members` (each with `role` and `userId`), `snapshot.users` for tier lookup.

- [ ] **Step 1: Add guide controls to the owner members list** in `app/cohorts/[id]/page.tsx`

In the owner-only members list (where "Remove" already renders per member), for each non-owner member compute eligibility and render a calm toggle. Look up the member's profile from `snapshot.users` to check Helpful+:

```tsx
import { hasCapability } from "@/lib/roles";
// from useBetaApp(): setCohortGuideAction, snapshot
// inside the members .map((m) => ...), where isThisOwner is already computed:
{!isThisOwner && (() => {
  const memberProfile = snapshot.users.find((u) => u.id === m.userId);
  const guideEligible = hasCapability(memberProfile, "cohort_guide"); // Helpful+
  const isGuide = m.role === "guide";
  if (!guideEligible && !isGuide) return null;
  return (
    <Button
      variant="quiet"
      onClick={() => doAction(() => setCohortGuideAction(cohort.id, m.userId, !isGuide))}
    >
      {isGuide ? "Remove guide" : "Make guide"}
    </Button>
  );
})()}
```
And show a quiet badge next to a guide's name (next to where "Host" shows for the owner):

```tsx
{m.role === "guide" && <Badge tone="muted">Guide</Badge>}
```
(`doAction` is the existing helper in this page that runs an action then `refresh()`/`loadCohort`. If the page named it differently, use the existing refresh wrapper.)

- [ ] **Step 2: Append a "Contributor roles" section to `docs/BETA_QA.md`**

Add (tables + checklist), covering: the capability ladder (tier → capabilities), `lib/roles.ts` as the source of truth, that existing thresholds are unchanged (feedback/host-cohort at Reliable), mentor opt-in (`profiles.mentor_opt_in`, effective at Helpful+), the service-only `guide` role + `set_cohort_guide` (owner-only, Helpful+ target, no moderation), welcome-newcomers (Contributor, derived), anti-clout guardrails, and the verify command `npx tsx scripts/check-roles.ts`.

- [ ] **Step 3: Final verification (run the full gate)**

Run: `npx tsx scripts/check-roles.ts` → Expected: `roles checks passed`.
Run: `npx tsx scripts/check-cohorts.ts` → Expected: `cohorts checks passed`.
Run: `npx tsx scripts/check-trust-v2.ts` → Expected: `trust-v2 checks passed`.
Run: `npm run typecheck` → Expected: clean.
Run: `npm run build 2>&1 | tail -30` → Expected: compiled, no errors; `/cohorts/[id]`, `/profile`, `/directions` present.

- [ ] **Step 4: Commit**

```bash
git add "app/cohorts/[id]/page.tsx" docs/BETA_QA.md
git commit -m "feat(roles): cohort guide controls + docs + final verify"
```

---

## Self-Review

**Spec coverage:**
- Capability model + centralized gates → Task 1. ✓
- Migration (mentor_opt_in, guide role, set_cohort_guide) → Task 2. ✓
- Types/repo/provider → Task 3. ✓
- Profile card + Steward + mentor toggle → Task 4. ✓
- Mentor discovery strip + welcome-newcomers → Task 5. ✓
- Cohort guide UI + docs + final verify → Task 6. ✓
- Anti-clout guardrails, moderation-admin-only, no behavior change → Global Constraints + enforced in each task. ✓

**Type consistency:** `hasCapability(profile, Capability)`, `tierForProfile`, `nextTierUnlocks`, `HELP_SUMMARY`, `TierLabel` consistent across Tasks 1/4/5/6. `setCohortGuide(client, cohortId, userId, isGuide)` (repo) ↔ `setCohortGuideAction(cohortId, userId, isGuide)` (provider) ↔ RPC `set_cohort_guide(p_cohort_id, p_user_id, p_is_guide)` consistent. `UserProfile.mentorOptIn` ↔ `mentor_opt_in` mapping consistent. `CohortRole` includes `'guide'` (Task 3) before the cohort page reads `m.role === "guide"` (Task 6).

**Placeholder scan:** No TBD/TODO; code provided for every code step; verification commands explicit. UI tasks note "match the real prop names in ui.tsx" — acceptable since exact component signatures are in the repo and the implementer reads them.
