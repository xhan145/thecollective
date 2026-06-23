# Personalized Onboarding → Tailored Practice & Proof (design)

Date: 2026-06-21
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind + Supabase)

## Problem

Practice and proof feel "standard and generalized": there are ~10 fixed prompts
shown to everyone, loosely bucketed by direction, and proof is a generic "What did
you practice?" capture. Onboarding learns only one thing about a person (a
direction). A test user / partner reaction: it doesn't feel like *theirs*, and
onboarding isn't "proper." Goal: a richer onboarding that learns enough about a
person to make their practice and proof feel personal — **deterministically, no AI**.

## Scope

**In (this spec):**
1. **Richer onboarding** that captures 5 things about the person.
2. **Expanded, tagged practice library** (~30 practices: 2 per direction × 3 levels × 5 directions), each with a tailored proof prompt.
3. **Deterministic personalization** — a pure selection function that turns the onboarding answers into the practices a person sees + the order, and the "Your next step" on Home.
4. **Personalized proof** — the proof screen uses the practice's own proof prompt and weaves in the person's goal; a personalized Home greeting line.

**Out (separate future specs — explicitly deferred):**
- AI-generated/AI-selected practices (mechanisms "B"/"C").
- "People sharing knowledge" feature (member-shared tips/guides).
- Making the AI support layer robust (currently mock/disabled).
- The visual restyle of the practice/proof screens (that's redesign Slice 2). This
  spec touches those screens only as needed for the new fields/prompt + reuses the
  Slice-1 design components already in place.

## Decisions (locked during brainstorm)

- **Mechanism A — deterministic personalization.** Reliable, ships now, and is the
  data foundation any later AI approach would need.
- **Onboarding captures 5 fields:** direction (exists) · goal (free text, one line,
  optional) · starting point (*starter / building / comfortable*, no score) ·
  why-now context (tappable chips) · cadence (*a few minutes a day / a couple times
  a week*).
- **Each practice is tagged:** `level` · `contextTags[]` · a tailored `proofPrompt`.
- **Selection:** filter by direction → prefer the person's level (fall back to
  adjacent levels so they never run dry) → boost practices whose `contextTags`
  overlap the person's answers → drop completed → top result = Home "Your next step".
- **Personalized proof + greeting:** proof screen shows `practice.proofPrompt` and
  weaves the goal text; Home greeting references the goal.
- **Library size:** ~30 practices (2 per direction × level), expandable later.

## Data model (additive)

> Supabase MCP is currently disconnected — the migration is authored here and applied
> once it reconnects. Local demo (`betaData`) personalization works without it.

**Migration `025_personalization.sql` (additive; after 024):**
- `profiles`: add `goal_text text`, `starting_level text` (check in
  `'starter','building','comfortable'`), `context_tags text[] not null default '{}'`,
  `cadence text`.
- `practices`: add `level text not null default 'starter'`,
  `context_tags text[] not null default '{}'`, `proof_prompt text`.
- Reseed/`update` the `practices` rows with the expanded tagged content + proof
  prompts (idempotent upserts keyed by the existing practice id/slug).

**Types (`lib/betaTypes.ts`):**
- `PracticePrompt` += `level?: PracticeLevel` (`"starter"|"building"|"comfortable"`),
  `contextTags?: string[]`, `proofPrompt?: string`.
- `UserProfile` += `goalText?: string | null`, `startingLevel?: PracticeLevel | null`,
  `contextTags?: string[]`, `cadence?: string | null`.
- New `PracticeLevel` union + a `CONTEXT_TAGS` constant (the chip taxonomy, shared by
  onboarding + practice tagging).

## Context-tag taxonomy (shared source of truth)

A small fixed set used by both onboarding chips and practice `contextTags` (so
overlap-matching is meaningful), e.g.:
`speaking_up_at_work` · `upcoming_situation` · `personal_growth` · `rebuilding_habit`
· `relationships` · `clearer_thinking`. (Finalize the exact 5–6 in implementation;
they must be identical strings on both sides.)

## Selection logic

`lib/personalization.ts` (pure, unit-testable):
```
getPersonalizedPractices(user, prompts): PracticePrompt[]
```
- `pool = prompts.filter(p => p.directionId === user.currentDirectionId)` (fallback to
  all prompts if no direction).
- score each: `levelScore` (exact level = +3, adjacent = +1, else 0) +
  `contextScore` (count of `contextTags` overlap with `user.contextTags`, ×2) −
  `completedPenalty` (completed → sorted last, not removed, so the list never empties).
- stable sort desc; ties by existing order.
- `getNextPractice(user, prompts, completedIds)` = first non-completed of the sorted
  pool → drives Home "Your next step".

## Onboarding flow (extends the Slice-1 onboarding)

Keep it short, calm, skippable where sensible. Steps:
1. Welcome (exists).
2. **Direction** (exists).
3. **Starting point** — 3 option rows (`starter/building/comfortable`), no scoring.
4. **Why now** — context chips (multi-select, optional).
5. **Your goal** — one optional free-text line ("What do you want to get better at?").
6. **Cadence** — 2 option rows.
7. How it works (exists) → finish.

Persist all answers in one `completeOnboarding(payload)` call (extends the existing
method) → provider snapshot + (Supabase mode) profile update. Back button preserved;
goal + context are optional so onboarding is never blocked.

## Consuming surfaces

- **Home (`app/home/page.tsx`):** "Your next step" hero uses `getNextPractice(...)`;
  greeting adds a personalized line if `goalText` is set (e.g., *"Working toward:
  {goal}"*).
- **Practice list (`app/practice/page.tsx`):** shows `getPersonalizedPractices(...)`
  order instead of the flat list.
- **Proof (`app/proof/new/[promptId]/page.tsx`):** the prompt card shows the
  practice's `proofPrompt`; the reflection helper copy weaves `goalText` when present
  (*"Toward your goal: '{goal}' — show one small example. It doesn't need to be
  perfect."*). No behavior/data-write change to proof submission itself.

## Demo / local seed

`lib/betaData.ts`: expand `seedPrompts` into the ~30 tagged practices (with
`level`/`contextTags`/`proofPrompt`); give the default demo user sample onboarding
answers (a goal, a level, a couple of context tags) so personalization is visible in
the no-account demo path.

## Brand / safety

Beginner-safe throughout: starting point has no numeric score or ranking; goal is the
user's own words; cadence is low-pressure (no streak-shame). Approved vocabulary only;
no likes/followers/leaderboards. Personalization never exposes other users' data.

## Testing & verification

- **Unit:** `getPersonalizedPractices` / `getNextPractice` are pure — test: direction
  filter, exact-vs-adjacent level scoring, context-overlap boost, completed sink, never
  returns empty. (If no test runner exists, add a minimal one for this module, or
  verify via a typed scratch assertion + preview.)
- `npm run typecheck` + `npm run build` green.
- **Visual (preview, light + dark):** complete the extended onboarding in demo →
  confirm Home "next step" + practice list reflect the answers; open proof → confirm
  the tailored proof prompt + goal weave; confirm a different set of answers yields a
  different next step.
- **DB:** when MCP reconnects, apply `025`, confirm columns + reseeded practices;
  confirm onboarding writes the profile fields.

## Acceptance criteria

1. Onboarding captures direction + starting point + context + goal + cadence and
   persists them (snapshot always; profile in Supabase mode).
2. The practice library is expanded (~30) and every practice has `level`,
   `contextTags`, and a tailored `proofPrompt`.
3. `getPersonalizedPractices`/`getNextPractice` are pure and select/order by the
   onboarding answers; the list never empties; different answers → different next step.
4. Home "Your next step" + Practice list + Proof prompt all reflect the person's
   answers; proof prompt + greeting weave the goal when present.
5. Beginner-safe (no scores/streaks/clout); approved vocabulary; no cross-user data.
6. typecheck + build green; light + dark both fine; FAB + Slice-1 design intact.
7. Migration `025` is additive (010–024 untouched), idempotent; applied when MCP is back.

## Known limitations / next

- Deterministic only — bespoke AI-generated practices/proof (B/C) is a later spec,
  enabled by these onboarding fields.
- "People sharing knowledge" and "robust AI layer" are separate queued brainstorms.
- Practice/proof **visual** restyle remains redesign Slice 2.
- Content volume: ~30 practices is a starting library; expanding per direction/level is
  ongoing content work, not a code change.
