# Achievement Badges — Design Spec

**Date:** 2026-06-27
**Status:** Approved (brainstorm; user "approve all functions, use uupm")
**Branch:** `desktop-responsive` (worktree) → will merge to `main`
**Source:** `docs/badges/achievement-badges-dev-handoff-2026-06-27.txt`; UI informed by the `ui-ux-pro-max` skill. See memory `collective-badges-feature`.

## Goal

A calm, anti-clout **achievement-badge** system: members earn milestone recognition for real behavior (practice, proof, feedback, trust). Frame as a **progress archive**, not a trophy wall. Reuses existing signals — no new event ledger.

## Decisions (from brainstorm)

- **Approach A — count/state evaluator on existing signals.** No generic `user_events` ledger; reuse Trust-V2 per-user counts + `trust_score` (+ `beta_events` if needed).
- **Recognition-only.** Badges grant **no XP and no trust reward** (you already earned trust for the underlying action; granting more would double-count and break the earn-only-trust invariant). The `xp`/`trust_reward` columns exist but default 0 and are unused in MVP.
- **Honest Phase-1 scope (~12 badges)** that map cleanly to existing metrics. Deferred to Phase 2 (need flows/metrics we don't track): communication-category badges, proof-quality badges, sequence badges (Full Loop, Feedback Applied, Before & After), relationship badges (Beginner Helper), reflection badges.
- **No client forgery:** `user_achievements` written only by the SECURITY-DEFINER evaluator RPC (same pattern as trust/cohorts).

## Data model (migration `032_achievements.sql`, additive)

- `achievements` (definitions): `id uuid pk`, `slug text unique`, `name`, `description`, `category text`, `stage text`, `rarity text default 'Common'`, `icon text`, `unlock_rule jsonb`, `xp int default 0`, `trust_reward int default 0`, `is_hidden boolean default false`, `is_active boolean default true`, `created_at`. RLS: readable by `authenticated` (definitions are public); no client writes.
- `user_achievements`: `user_id uuid → profiles(id)`, `achievement_id uuid → achievements(id)`, `unlocked_at timestamptz default now()`, `primary key (user_id, achievement_id)`. RLS: `select` own only; **no insert/update/delete policy** (definer RPC + service only).
- Seed the Phase-1 achievements (below). `unlock_rule` shape: `{"type":"count","metric":"proof_count","gte":10}` or `{"type":"flag","metric":"has_direction"}`.

**Phase-1 seed (metric → existing profile column; verify exact names against migration 027):**
| slug | name | category | rule |
|---|---|---|---|
| direction_chosen | Direction Chosen | Direction | flag has_direction (current_direction_id not null) |
| first_practice | First Practice | Practice | practice_count ≥ 1 |
| practice_builder | Practice Builder | Practice | practice_count ≥ 10 |
| real_reps | Real Reps | Practice | practice_count ≥ 25 |
| strong_foundation | Strong Foundation | Practice | practice_count ≥ 50 |
| first_proof | First Proof | Proof | proof_count ≥ 1 |
| proof_builder | Proof Builder | Proof | proof_count ≥ 10 |
| proof_library | Proof Library | Proof | proof_count ≥ 50 |
| first_feedback_given | First Feedback Given | Feedback | feedback_given_count ≥ 1 |
| first_feedback_received | First Feedback Received | Feedback | feedback_received_count ≥ 1 |
| trust_started | Trust Started | Trust | trust_score ≥ 1 |
| trusted_contributor | Trusted Contributor | Contribution | trust_score ≥ 200 |

## Evaluator

`evaluate_achievements()` — SECURITY DEFINER, `set search_path = public, pg_temp`, granted to `authenticated`, revoked public/anon. Reads the caller's (`auth.uid()`) `profiles` row (counts + trust + current_direction_id), iterates active non-hidden count/flag achievements the user lacks, and for each satisfied rule: `insert into user_achievements (...) on conflict do nothing`, and inserts an `achievement_unlocked` notification (reuse the notifications table; `type='achievement_unlocked'`, `source_type='achievement'`, `source_id=achievement_id`). Returns the newly-unlocked slugs (text[]). Idempotent and cheap (single profile read + small loop).

**Where called:** the provider calls a thin `evaluateAchievements()` wrapper after the existing key write flows (proof submit success, feedback submit, practice completion, contribution accept) and on Badge-page mount. Failures swallowed (non-blocking). Demo mode: a pure client evaluator mirrors the same rules against the local snapshot counts so badges work without Supabase.

## Repository + provider + types

- `lib/badges/types.ts`: `Achievement`, `UserAchievement`, `BadgeCategory`, `Rarity`, and the demo evaluator `evaluateLocalBadges(profileCounts, achievements, alreadyUnlocked)` (pure).
- `lib/supabase/badgesRepository.ts`: `listAchievements(client)`, `listMyAchievements(client)`, `evaluateAchievements(client)` (rpc), `setProfileBadges(client, slugs[])` (rpc/own-profile update for the 6 selected) .
- `lib/betaTypes.ts` `BetaAppSnapshot += achievements: Achievement[]; myAchievements: UserAchievement[]`. `UserProfile += selectedBadgeSlugs?: string[]` (the up-to-6 identity picks; stored on profile via migration 032 column `selected_badges text[] default '{}'`).
- Provider: load both on bundle load; `getMyAchievements()`, `evaluateAchievements()` (post-action + on badge page), `selectBadges(slugs)` (≤6). Demo seeds a few unlocked badges.

## Surfaces (UI — Warm Proof-Based Growth + ui-ux-pro-max rules)

- **`/badges` page** (new route, add to `protectedPrefixes`): a calm grid. Header `PageHeader title="Badges" subtitle="A record of what you've practiced — not a trophy wall."`. Category **filter chips** (All, Core Loop, Practice, Proof, Feedback, Trust, Communication, Contribution) as a horizontal, wrap row of pills (active = soft-gold). Grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`. Each `BadgeCard`:
  - **Earned:** gold mark on `#FFFDF8` card, name, one-line description, a small rarity label (subtle, e.g. uppercase tracked muted text — NOT loud color). Hover lift + `whileTap` scale 0.97. Staggered entrance (`MotionList`, 30–40ms/item).
  - **Locked (not hidden):** muted **silhouette** (grayscale/low-opacity mark) + lock icon + name + one clear **next action** ("Submit 1 more proof"). Color is never the only signal (lock icon + text).
  - **Hidden + locked:** not rendered at all.
- **Unlock modal** (`BadgeUnlockModal`): appears when `evaluateAchievements()` returns new slugs. Scrim 50% black; the badge **scales/fades in from center**; one calm sentence ("You earned **First Proof** — you submitted your first proof."); a single "Nice" dismiss. NO confetti. Respects `prefers-reduced-motion` (fade only). If multiple unlock at once, show a small stack/next control.
- **Profile**: a "Badges" card showing up to **6 selected** identity badges (or the most recent earned if none selected) + a quiet "Manage" link → a picker (select ≤6). Reuses the desktop 2-col profile rail.
- **Proof detail**: a small inline `BadgeChip` row when a badge is relevant to that proof context (Phase-1: show the user's proof-milestone badges sparingly; full proof-specific badges are Phase-2).

**Accessibility/interaction (uupm):** all cards/buttons ≥44px tap area + `aria-label`; focus-visible rings; modal is dismissible (Esc/scrim/button) and traps focus; contrast ≥4.5:1; `prefers-reduced-motion` honored; light + dark both read (use `--c-*`/remapped literals).

## Anti-clout guardrails (binding)

- No leaderboards, no public badge counts, no "X of Y unlocked" as competition, no XP. Badges are private progress; each is framed by the **behavior** that earned it. Rarity is informational, not a flex. The page subtitle states it's a record, not a trophy wall.

## Verification

- `npm run typecheck` + `npm run build` clean. `npx tsx scripts/check-badges.ts` (pure): the local/rule evaluator unlocks the right Phase-1 badges at the right thresholds (e.g., proof_count 9→ not proof_builder, 10→ yes; idempotent; never unlocks twice).
- Migration 032 applied to prod; `get_advisors(security)` clean (only the by-design definer-executable WARN on `evaluate_achievements`); `user_achievements` has no client write policy.
- Demo mode: badges page renders with seeded unlocks; evaluating after a demo practice unlocks `first_practice`.
- Preview: badge grid (earned/locked/hidden), filter chips, unlock modal (no confetti, reduced-motion ok), profile picker — at mobile 390px + desktop 1280px, light + dark.

## Out of scope (Phase 2)

Communication-category, proof-quality, sequence (Full Loop/Feedback Applied/Before & After), relationship (Beginner Helper), reflection badges; the ~60-badge backlog; analytics on unlock/drop-off.
