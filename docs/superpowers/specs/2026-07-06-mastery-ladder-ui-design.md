# Mastery Ladder UI — Design (Content-Mastery Tasks B+C)

**Date:** 2026-07-06 · **Status:** designed → awaiting review
**Parent:** 2026-06-25 Content Mastery System integration design (approved; Phase-1 schema/seed + Task-A read layer shipped)

## Problem
The 120 live mastery levels load into the app (Task A) but no screen uses them:
`/practice` renders ~120 flat cards across 6 direction sections, levels have no
lock/progress presentation, the proof screen ignores every mastery field, and six
hardcoded starter links point at fallback id `conf-s1`, which does not exist in
live content.

## Decision
The skill ladder lives on **/practice** (no new routes, no nav change — the
Passport/Settings brainstorm locked "rename only" navigation, and DirectionCards
already point here). `/directions/[slug]` detail pages are a possible phase 2,
not built now.

## 1. Pure progress module — `lib/mastery.ts` (+ `scripts/check-mastery.ts`)
No React, fully unit-checked (mirrors `check-customization.ts` pattern):
- `levelStatus(prompt, completedIds, prompts)` → `complete | available | locked`.
  Rule (parent spec §4): level 1 always unlocked; level N unlocked iff level N−1
  of the same skill is complete. Prompts without mastery fields (fallback/demo
  content) are always `available`.
- `skillProgress(skill, prompts, completedIds)` → `{ done, total, levels: [{id, levelName, status}] }`.
- `directionProgress(direction, skills, prompts, completedIds)` → `{ done, total }` (the N/20).
- `nextMasteryStep(user, snapshot)` → lowest unlocked, incomplete level in the
  user's current direction; falls back to any direction, then to the legacy
  `getNextPractice` for fallback content.
- `resolveStarterPromptId(snapshot, user)` → the slug the floating "Submit proof"
  actions should target; never returns a dead id.

## 2. /practice rebuild — the mastery browser
- **Your next step** hero (HeroCard, reuses Home pattern) → `/proof/new/<slug>`.
- Per-direction sections: title + `N/20` Badge.
- `SkillLadderRow` (new, `components/beta/MasteryComponents.tsx`): skill name,
  ladder dots (● complete ○ open), done/total; taps to expand.
- `LevelRow`: status icon (✓ / open ring / lock), `level_name`, one-line
  `mastery_goal`, `estimated_minutes` + `difficulty` chip; available → CTA to
  `/proof/new/<slug>`; locked → not clickable, gentle hint
  “Finish ‘<previous level_name>’ first” (path, never shame).
- Personalized “For you” block is replaced by the deterministic next step (above).
- **Fallback mode:** if `snapshot.skills` is empty (demo/local seed), keep the
  current flat per-direction listing — demo mode must not break.
- Depth/pixel styling per the shipped elevation scale (`Card`, `.elev-*`).

## 3. Proof screen mastery surfacing — `/proof/new/[promptId]`
When the prompt carries mastery fields:
- Header chip: skill name + “Level N · <level_name>”.
- `mastery_goal` panel above the prompt.
- **Proof-type constraint:** the level's `proof_type` is preselected and visually
  primary; `mixed` → all types. Text stays available as a beginner-safe fallback
  with hint copy (“Audio works best here — text is fine if that's easier today.”).
  Rationale: the parent spec constrains by proof_type; Collective's beginner-safety
  principle keeps a written escape hatch. Non-matching media types are hidden.
- “What doesn't count” note (`does_not_count_as_mastery`) + `safety_note` when present.
- Success state: shows the level's `next_step` and, if the submission unlocked the
  next level, a CTA to it.
- **Client lock guard:** navigating to a locked level redirects to `/practice`
  with a calm notice. (Server-side gate is Task D, unchanged.)

## 4. Starter-link resolution
Replace all six hardcoded `/proof/new/conf-s1` targets (AppShell FAB + desktop
sidebar, feed empty-state CTA, passport empty-state link, `/proof/new/page.tsx`
redirect, `[promptId]` default) with `resolveStarterPromptId`.

## Out of scope (unchanged from parent spec)
Task D: server-side unlock RPC gate, `trust_signal` labels on trust events,
`proofs.tags` denormalization / level-matched feed, feedback-rubric scaffolding.
Phase 2: `/directions/[slug]` detail pages. Content edits to the seed.

## Verification
1. `scripts/check-mastery.ts` — lock rule (L1 open; N needs N−1; fallback always
   open), skill/direction counts, next-step determinism, starter-id never dead.
2. typecheck + build green.
3. Preview QA: ladder states render; locked row hint; proof-type filter on an
   audio level + text fallback; starter FAB lands on a real live level; demo
   mode still renders the flat fallback.
