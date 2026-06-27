# Contributor Roles — Design Spec

**Date:** 2026-06-26
**Status:** Approved (brainstorm)
**Feature branch:** `contributor-roles`

## Summary

Contributor roles formalize Collective's scattered, earned capability gates into **one coherent capability ladder keyed to the existing Trust V2 tiers**, and add a small set of genuinely-new *service* abilities at the upper tiers. A role is not a new piece of state to manage or a badge to collect — it is simply **what your earned trust lets you help with**. Capabilities derive from `trust_score` → tier, so they are earned, never minted, and impossible to forge.

This is the second of the two decomposed specs from the cohorts brainstorm ("cohorts + contributor roles"). It layers on Trust V2 and Cohorts; it ships no moderation powers to members.

## Decisions (from brainstorm)

- **Purpose:** formalize earned responsibilities into a named ladder layered on Trust V2 (not a separate grant system, not mentorship-only).
- **Structure:** a thin capability layer keyed to the tiers — one source of truth (`trust_score` → tier → capabilities). Acting on a capability is always **opt-in**.
- **Scope:** **lighter service only.** Content moderation stays admin-only. Roles amplify contribution; they never grant power over people.
- **Naming:** reuse the existing Trust V2 tier names (New / Practicing / Reliable / Helpful / Contributor) as the role identity; attach a capability set + a "what you can help with" line to each. No new vocabulary.
- **Persistence:** minimal (Approach A) — one new profile column + one cohort role value + one RPC. Everything else derives from existing data.

## Trust V2 tiers (existing, unchanged)

`trust_score` → tier (`lib/betaTrust.ts`): New `<20` · Practicing `≥20` · Reliable `≥50` · Helpful `≥100` · Contributor `≥200`. `levelRank` 0–4.

## The capability ladder

Cumulative and additive; all opt-in to act. Surfaced under each tier's existing name.

| Tier | What you can help with (cumulative) | Enforcement |
|---|---|---|
| **New** | Practice, post proof, mark Useful, save, peer notes | always |
| **Practicing** | + post **knowledge tips** (on practices you've completed), + **contribute** to open proofs | tips = completion-gated; contribute = behavior-gated (unchanged) |
| **Reliable** | + **give feedback**, + **host a cohort** (create + invite) | tier ≥ Reliable |
| **Helpful** | + opt-in **"someone to learn from"** visibility, + can be a **cohort guide** (welcomes; no moderation) | tier ≥ Helpful |
| **Contributor** | + **welcome newcomers** in your direction, + recognized as a **Steward** (community anchor; no extra power) | tier ≥ Contributor |

### Honesty note (no behavior change)

Two capabilities are not purely tier-gated today and **stay that way**:
- **Knowledge tips** remain gated by having completed that specific practice (`app/practice/page.tsx` `canShareTip`).
- **Contribute** remains behavior-gated (`isEligibleToContribute`: has posted a proof AND given feedback).

The ladder's display copy describes these accurately rather than presenting them as tier-locked. Only the tier-gated capabilities (`give_feedback`, `host_cohort`, `mentor_visibility`, `cohort_guide`, `welcome_newcomers`, `steward`) are enforced through `lib/roles.ts`.

## Component 1 — Capability model (`lib/roles.ts`, pure)

The single source of truth for tier-gated capabilities. Pure + unit-tested; no React, no I/O.

```ts
export type Capability =
  | "give_feedback"
  | "host_cohort"
  | "mentor_visibility"
  | "cohort_guide"
  | "welcome_newcomers"
  | "steward";

// cumulative per tier (a tier includes all lower-tier capabilities)
export const TIER_CAPABILITIES: Record<TierLabel, Capability[]>;

export function hasCapability(
  profile: { trustScore?: number | null } | null | undefined,
  cap: Capability,
): boolean;                              // derives via levelRank/tier — earned, never settable

export function capabilitiesForTier(tier: TierLabel): Capability[];
export function nextTierUnlocks(tier: TierLabel): { tier: TierLabel; capabilities: Capability[] } | null;
export const HELP_SUMMARY: Record<TierLabel, string>;  // one-line "what you can help with"
```

Tier → capability floor:
- **Reliable**: `give_feedback`, `host_cohort`
- **Helpful**: + `mentor_visibility`, `cohort_guide`
- **Contributor**: + `welcome_newcomers`, `steward`

**Refactor existing call sites to read from this module with identical thresholds:**
- `app/feed/page.tsx` and `app/cohorts/[id]/page.tsx`: `canGiveFeedback` → `hasCapability(user, "give_feedback")` (currently `levelRank(user) >= 2` — same threshold).
- Cohort-create gate (`lib/cohorts/access.ts` `canCreateCohort`) aligns conceptually to `hasCapability(user, "host_cohort")` (same `levelRank >= 2` / `trust_score >= 50`). Keep the SQL `create_cohort` gate as-is (server enforcement).

No thresholds change — this is centralization, not re-homing.

## Component 2 — Data model & server (`supabase/migrations/031_contributor_roles.sql`, additive)

1. **Mentor visibility:** `alter table public.profiles add column if not exists mentor_opt_in boolean not null default false;`
   - The user's own preference, updated through the existing profile-update path (no new RPC).
   - Effective visibility = `mentor_opt_in = true` AND tier ≥ Helpful, evaluated where surfaced.

2. **Cohort guide:** extend `cohort_members.role` check from `('owner','member')` to `('owner','member','guide')` (drop + recreate the check constraint; implementer confirms the live constraint name, likely `cohort_members_role_check`).
   - RPC `set_cohort_guide(p_cohort_id uuid, p_user_id uuid, p_is_guide boolean)`:
     - `SECURITY DEFINER`, granted to `authenticated`, revoked from `public`/`anon`.
     - Caller must be the cohort **owner** (`_is_cohort_owner`).
     - Target must already be a **member** of that cohort, be **Helpful+** (`trust_score ≥ 100`), and not be the owner.
     - Sets the target's role to `'guide'` (when `p_is_guide`) or back to `'member'`.
   - Guide is **service-only by construction**: `approve_request` / `decline_request` / `remove_member` all check owner, so a guide cannot moderate.

3. **Welcome-newcomers** and **Steward:** no schema — derived from existing data + tier.

**Security:** no client write policies on the new role state — only the definer RPC writes `role='guide'`; only the user's own `mentor_opt_in` is client-writable (via the existing own-row profile update policy). Apply 031 to prod; confirm `get_advisors(security)` clean and `set_cohort_guide` grants (authenticated only).

## Component 3 — Surfaces & provider wiring (additive)

1. **Profile "What you can help with" card** (`/profile`): calm card from `lib/roles.ts` — current tier `HELP_SUMMARY` + capabilities, a gentle `nextTierUnlocks` line, and a small **Steward** milestone stamp at Contributor (5% playful-nostalgia). No numbers-as-clout.

2. **Mentor visibility** (Helpful+):
   - Toggle on `/profile`: *"List me as someone to learn from in {direction}"* — shown only when `hasCapability(user, "mentor_visibility")`; writes `mentor_opt_in` via existing `updateProfile`.
   - `/directions`: calm **"People to learn from in {direction}"** strip — Helpful+ members with `mentor_opt_in=true` sharing the viewer's direction. Reuses Avatar + Learn-from. No counts/ranking.

3. **Cohort guide** (Helpful+): on `/cohorts/[id]` owner view, members list gains "Make guide / Remove guide" for Helpful+ members → `setCohortGuideAction(cohortId, userId, isGuide)` (RPC + `loadCohort` refresh). Guides show a quiet **"Guide"** badge.

4. **Welcome newcomers** (Contributor): a Contributor-gated **"Say hi to someone new in {direction}"** surface listing recent New-tier members in the viewer's direction (respecting visibility), with a "say hi" CTA opening a peer note (reuses `sendPeerNote`). Derived — no new table.

5. **Provider/repo:** add `setCohortGuideAction` (wraps the RPC); mentor toggle rides existing `updateProfile`; newcomer/mentor lists derive from `snapshot.users` + directions via small selectors. No change to feed/trust/proof flows.

## Anti-clout guardrails (binding)

- No counts, leaderboards, or ranking in any role surface — name + one action, never "X learners."
- Roles framed as *service* ("what you can help with"), never status to flaunt. Steward = a quiet stamp, not a number.
- Guide & mentor are **opt-in and reversible**; no shame for not opting in.
- No power-over-people: guides can't moderate, mentors can't gate, "welcome" is just a friendly peer note.
- Trust stays RPC-earned; roles derive from tier; nothing client-settable except the user's own `mentor_opt_in`.

## Testing & verification

- `scripts/check-roles.ts` (pure): `TIER_CAPABILITIES` cumulative + monotonic; `hasCapability` bands (49→no / 50→yes `give_feedback`; 99→no / 100→yes `mentor_visibility`; 199→no / 200→yes `welcome_newcomers`); `nextTierUnlocks` correct; existing thresholds preserved. Prints `roles checks passed`.
- Re-run `scripts/check-cohorts.ts` + `scripts/check-trust-v2.ts` (no regression); `npm run typecheck`; `npm run build`.
- Apply migration 031 to prod; `get_advisors(security)` clean; confirm `set_cohort_guide` granted to `authenticated` only.

## Plan shape (3 slices)

1. `lib/roles.ts` + `scripts/check-roles.ts` + refactor existing gates (zero behavior change).
2. Migration 031 + `set_cohort_guide` RPC + repo/provider wiring + `mentor_opt_in`.
3. Surfaces (profile card + Steward stamp, mentor toggle + discovery strip, cohort guide UI, welcome-newcomers) + docs (`docs/BETA_QA.md` section) + final verify.

## Out of scope (future)

- Member moderation (triage queues, distributed report handling) — explicitly deferred; admin-only for now.
- A separate apply/grant role system or distinct Practitioner→Steward vocabulary layer.
- Persisted welcome-tracking / guide-activity analytics (YAGNI).
- Mentorship pairing/matching beyond opt-in "someone to learn from" visibility.
