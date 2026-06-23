# Personalized Onboarding → Tailored Practice & Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make practice & proof feel personal — a richer onboarding captures goal/level/context/cadence, and a pure deterministic selector turns those answers into the practices a person sees, Home's "next step", and a tailored proof prompt.

**Architecture:** Add `level`/`contextTags` to practices + onboarding fields to the profile; expand the seed library to ~30 tagged practices; a pure `lib/personalization.ts` ranks practices per person; onboarding captures the answers; Home/Practice/Proof consume the selector. Deterministic, no AI. Reuses the Slice-1 design components.

**Tech Stack:** Next.js App Router + TypeScript, Tailwind, Supabase. `npx tsx` for a runnable pure-function check (no jest/vitest in repo). No new deps.

## Global Constraints

- Deterministic only (mechanism A) — no AI calls. AI personalization, knowledge-sharing, and robust-AI are separate future specs.
- Additive only; migrations 010–024 NOT edited; new migration is `025_personalization.sql`. **Supabase MCP is currently DISCONNECTED — author `025` but DO NOT apply it; flag for application when MCP returns. The local `betaData` path must make personalization fully demoable without the DB.**
- Beginner-safe: starting point has NO numeric score/ranking; cadence has NO streak-shame; goal is the user's own words. Approved vocabulary only; NO likes/followers/leaderboards/clout.
- Reuse Slice-1 design: `OptionRow` styling, `LoopStrip`, `HeroCard`, `font-display`, gold-gradient primary. Preserve the FAB centering fix (don't touch AppShell FAB).
- `PracticeLevel = "starter" | "building" | "comfortable"`.
- `CONTEXT_TAGS` ids (identical strings on onboarding chips AND practice `contextTags`):
  `speaking_up_at_work`, `upcoming_situation`, `personal_growth`, `rebuilding_habit`, `relationships`, `clearer_thinking`.
- Direction ids (existing): `direction-confidence`, `direction-communication`, `direction-momentum`, `direction-self-trust`, `direction-contribution`.
- `goalText` and `contextTags` are OPTIONAL in onboarding (never block completion).
- Verification gates: `npm run typecheck` + `npm run build`; plus `npx tsx scripts/check-personalization.ts` for the pure module. Visual via preview (eval-based; screenshot flaky this session).
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (Git Bash). **Start on a new branch `personalized-practice` off `main`.**

## File Structure

- `lib/betaTypes.ts` — **modify.** `PracticeLevel`, `CONTEXT_TAGS` (+ `ContextTag` type), extend `PracticePrompt` (`level`, `contextTags`; `proofPrompt` already exists), extend `UserProfile` (`goalText`, `startingLevel`, `contextTags`, `cadence`).
- `lib/personalization.ts` — **create.** Pure `getPersonalizedPractices`, `getNextPractice`.
- `scripts/check-personalization.ts` — **create.** Runnable assertions for the pure module.
- `lib/betaData.ts` — **modify.** Replace `seedPrompts` with ~30 tagged practices; give the demo user sample onboarding answers.
- `lib/supabase/betaRepository.ts` — **modify.** `mapProfile` reads new columns; `updateOnboarding` persists the new fields.
- `components/beta/AppStateProvider.tsx` — **modify.** `completeOnboarding(payload)` persists the new fields to snapshot + profile; expose `onboardingPayload` type.
- `app/onboarding/page.tsx` — **modify.** Add starting-point / why-now / goal / cadence steps.
- `app/home/page.tsx` — **modify.** Use `getNextPractice`; goal greeting line.
- `app/practice/page.tsx` — **modify.** Personalized order via `getPersonalizedPractices`.
- `app/proof/new/[promptId]/page.tsx` — **modify.** Use `prompt.proofPrompt`; weave goal.
- `supabase/migrations/025_personalization.sql` — **create (author only; not applied).**

## Reference (current shapes)

- `PracticePrompt` already has optional `proofPrompt`. Add only `level` + `contextTags`.
- `completeOnboarding(directionId: string)` (provider) → calls `updateOnboarding(client, uid, directionId)`. Both get an extended payload.
- `updateOnboarding(client, userId, directionId)` updates `current_direction_id`, `onboarding_completed`, `updated_at`.
- Practice page currently renders `snapshot.prompts.filter(directionId===...)` per direction; Home + Practice compute `nextPrompt` as first non-completed of a flat list.
- `mapProfile` maps snake→camel; add the 4 new fields.

---

### Task 1: Types + taxonomy

**Files:** Modify `lib/betaTypes.ts`

**Interfaces:**
- Produces: `PracticeLevel`, `ContextTag`, `CONTEXT_TAGS` (array of `{id: ContextTag; label: string}`); `PracticePrompt.level?`, `PracticePrompt.contextTags?`; `UserProfile.goalText?`, `.startingLevel?`, `.contextTags?`, `.cadence?`.

- [ ] **Step 1: Create the branch**
```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b personalized-practice
```

- [ ] **Step 2: Add the taxonomy + level type** near the top of `lib/betaTypes.ts` (after the existing `ProofMediaType`/union types):
```ts
export type PracticeLevel = "starter" | "building" | "comfortable";

export type ContextTag =
  | "speaking_up_at_work"
  | "upcoming_situation"
  | "personal_growth"
  | "rebuilding_habit"
  | "relationships"
  | "clearer_thinking";

export const CONTEXT_TAGS: { id: ContextTag; label: string }[] = [
  { id: "speaking_up_at_work", label: "Speaking up at work" },
  { id: "upcoming_situation", label: "A specific upcoming situation" },
  { id: "personal_growth", label: "Personal growth" },
  { id: "rebuilding_habit", label: "Rebuilding a habit" },
  { id: "relationships", label: "Relationships & connection" },
  { id: "clearer_thinking", label: "Clearer thinking & decisions" },
];
```

- [ ] **Step 3: Extend `PracticePrompt`** — add two fields (keep existing `proofPrompt?`):
```ts
  instructions?: string;
  proofPrompt?: string;
  level?: PracticeLevel;
  contextTags?: ContextTag[];
};
```

- [ ] **Step 4: Extend `UserProfile`** — add the onboarding fields (after `contributionCount?`):
```ts
  // Personalized onboarding answers.
  goalText?: string | null;
  startingLevel?: PracticeLevel | null;
  contextTags?: ContextTag[];
  cadence?: string | null;
```

- [ ] **Step 5: Typecheck + commit**
```bash
npm run typecheck
git add lib/betaTypes.ts
git commit -m "feat(types): practice level/contextTags + onboarding profile fields + CONTEXT_TAGS taxonomy"
```
Expected: typecheck clean.

---

### Task 2: Pure personalization module + runnable check

**Files:** Create `lib/personalization.ts`, `scripts/check-personalization.ts`

**Interfaces:**
- Consumes: `PracticePrompt`, `UserProfile`, `PracticeLevel` (Task 1).
- Produces:
  - `getPersonalizedPractices(user: Pick<UserProfile,"currentDirectionId"|"startingLevel"|"contextTags">, prompts: PracticePrompt[]): PracticePrompt[]`
  - `getNextPractice(user, prompts, completedIds: string[]): PracticePrompt | undefined`

- [ ] **Step 1: Create `lib/personalization.ts`**
```ts
import type { PracticeLevel, PracticePrompt, UserProfile } from "./betaTypes";

const LEVEL_ORDER: PracticeLevel[] = ["starter", "building", "comfortable"];

type PersonaInput = Pick<UserProfile, "currentDirectionId" | "startingLevel" | "contextTags">;

function levelScore(practice: PracticePrompt, level: PracticeLevel | null | undefined): number {
  if (!practice.level || !level) return 0;
  if (practice.level === level) return 3;
  const d = Math.abs(LEVEL_ORDER.indexOf(practice.level) - LEVEL_ORDER.indexOf(level));
  return d === 1 ? 1 : 0;
}

function contextScore(practice: PracticePrompt, tags: PersonaInput["contextTags"]): number {
  if (!practice.contextTags?.length || !tags?.length) return 0;
  return practice.contextTags.filter((t) => tags.includes(t)).length * 2;
}

/** Rank a direction's practices for a person (most relevant first). Never empties. */
export function getPersonalizedPractices(user: PersonaInput, prompts: PracticePrompt[]): PracticePrompt[] {
  const pool = user.currentDirectionId
    ? prompts.filter((p) => p.directionId === user.currentDirectionId)
    : prompts.slice();
  const ranked = (pool.length ? pool : prompts.slice());
  return ranked
    .map((p, i) => ({ p, i, s: levelScore(p, user.startingLevel) + contextScore(p, user.contextTags) }))
    .sort((a, b) => (b.s - a.s) || (a.i - b.i))
    .map((x) => x.p);
}

/** The single next practice for "Your next step" — first non-completed of the ranked list. */
export function getNextPractice(
  user: PersonaInput,
  prompts: PracticePrompt[],
  completedIds: string[],
): PracticePrompt | undefined {
  const ranked = getPersonalizedPractices(user, prompts);
  return ranked.find((p) => !completedIds.includes(p.id)) || ranked[0];
}
```

- [ ] **Step 2: Create `scripts/check-personalization.ts`** (runnable assertions)
```ts
import assert from "node:assert";
import { getNextPractice, getPersonalizedPractices } from "../lib/personalization";
import type { PracticePrompt } from "../lib/betaTypes";

const P = (id: string, directionId: string, level: any, contextTags: any[] = []): PracticePrompt => ({
  id, directionId, title: id, description: "", prompt: "", type: "reflection", estimatedMinutes: 5,
  beginnerSafe: true, level, contextTags,
});
const prompts: PracticePrompt[] = [
  P("c-start-1", "direction-confidence", "starter", ["speaking_up_at_work"]),
  P("c-build-1", "direction-confidence", "building", ["personal_growth"]),
  P("c-comf-1", "direction-confidence", "comfortable", []),
  P("m-start-1", "direction-momentum", "starter", []),
];

// direction filter
const conf = getPersonalizedPractices({ currentDirectionId: "direction-confidence", startingLevel: "starter", contextTags: [] }, prompts);
assert.ok(conf.every((p) => p.directionId === "direction-confidence"), "direction filter");

// exact level ranks above others; context overlap boosts
const ranked = getPersonalizedPractices({ currentDirectionId: "direction-confidence", startingLevel: "starter", contextTags: ["speaking_up_at_work"] }, prompts);
assert.equal(ranked[0].id, "c-start-1", "exact level + context wins");

// never empties (unknown direction falls back)
const fb = getPersonalizedPractices({ currentDirectionId: "nope", startingLevel: "starter", contextTags: [] }, prompts);
assert.ok(fb.length > 0, "never empty");

// next skips completed
const next = getNextPractice({ currentDirectionId: "direction-confidence", startingLevel: "starter", contextTags: [] }, prompts, ["c-start-1"]);
assert.ok(next && next.id !== "c-start-1", "skips completed");

console.log("personalization checks passed");
```

- [ ] **Step 3: Run the check**
```bash
npx tsx scripts/check-personalization.ts
```
Expected: `personalization checks passed` (exit 0).

- [ ] **Step 4: Typecheck + commit**
```bash
npm run typecheck
git add lib/personalization.ts scripts/check-personalization.ts
git commit -m "feat: pure personalization selector + runnable checks"
```
Expected: typecheck clean.

---

### Task 3: Expanded tagged practice library (demo seed)

**Files:** Modify `lib/betaData.ts`

**Interfaces:**
- Consumes: `PracticeLevel`, `ContextTag` (Task 1).
- Produces: `seedPrompts` with ~30 entries, each having `level`, `contextTags`, `proofPrompt`; demo user with sample onboarding answers.

- [ ] **Step 1: Replace the `seedPrompts` array** in `lib/betaData.ts` with the tagged library below (keep the `seedDirections` above it unchanged). Each entry maps to an existing direction id; ids are new and stable.

```ts
export const seedPrompts: PracticePrompt[] = [
  // direction-confidence
  { id: "conf-s1", directionId: "direction-confidence", title: "Say one clear thing", description: "Share a single idea in plain language.", prompt: "Say or write one idea as if to a teammate — no softening.", type: "voice-note", estimatedMinutes: 5, beginnerSafe: true, level: "starter", contextTags: ["speaking_up_at_work"], proofPrompt: "Capture the one clear thing you said. What felt different about not softening it?" },
  { id: "conf-s2", directionId: "direction-confidence", title: "Name one preference", description: "State a preference without apologizing.", prompt: "Write one sentence naming what you prefer and why.", type: "reflection", estimatedMinutes: 4, beginnerSafe: true, level: "starter", contextTags: ["personal_growth"], proofPrompt: "Show the preference you named. Where did you notice the urge to apologize?" },
  { id: "conf-b1", directionId: "direction-confidence", title: "Ask for what you need", description: "Make one small, direct ask.", prompt: "Make one clear request today and note the response.", type: "proof", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["speaking_up_at_work", "relationships"], proofPrompt: "What did you ask for, and how did it land? Keep it factual, not self-judging." },
  { id: "conf-b2", directionId: "direction-confidence", title: "Hold a pause", description: "Let a silence sit before answering.", prompt: "In one conversation, pause two seconds before responding.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "building", contextTags: ["upcoming_situation"], proofPrompt: "Describe the moment you paused. What changed when you didn't rush?" },
  { id: "conf-c1", directionId: "direction-confidence", title: "Disagree kindly", description: "Voice a different view, calmly.", prompt: "Share one respectful disagreement and your reason.", type: "proof", estimatedMinutes: 7, beginnerSafe: true, level: "comfortable", contextTags: ["speaking_up_at_work"], proofPrompt: "What did you disagree with, and how did you keep it kind and clear?" },
  { id: "conf-c2", directionId: "direction-confidence", title: "Own a decision out loud", description: "State a choice you're making and why.", prompt: "Tell someone a decision you've made, with one reason.", type: "conversation", estimatedMinutes: 6, beginnerSafe: true, level: "comfortable", contextTags: ["upcoming_situation", "clearer_thinking"], proofPrompt: "Show the decision you owned. What made it easier (or harder) to say plainly?" },

  // direction-communication
  { id: "comm-s1", directionId: "direction-communication", title: "Ask one useful question", description: "Trade proving for curiosity.", prompt: "Ask one question that helps a teammate move forward.", type: "conversation", estimatedMinutes: 5, beginnerSafe: true, level: "starter", contextTags: ["speaking_up_at_work"], proofPrompt: "Share the question you asked. What did it open up?" },
  { id: "comm-s2", directionId: "direction-communication", title: "Rewrite a rambly message", description: "Cut to two clear lines.", prompt: "Take a draft and trim it to two clear sentences.", type: "reflection", estimatedMinutes: 4, beginnerSafe: true, level: "starter", contextTags: ["clearer_thinking"], proofPrompt: "Show before/after. What did you cut, and what got clearer?" },
  { id: "comm-b1", directionId: "direction-communication", title: "Explain it in three sentences", description: "Point, example, next step.", prompt: "Explain one idea in exactly three sentences.", type: "proof", estimatedMinutes: 7, beginnerSafe: true, level: "building", contextTags: ["clearer_thinking", "personal_growth"], proofPrompt: "Share your three sentences. Did the structure make it land?" },
  { id: "comm-b2", directionId: "direction-communication", title: "Reflect back what you heard", description: "Confirm before responding.", prompt: "In one chat, summarize the other person before replying.", type: "conversation", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["relationships"], proofPrompt: "What did you reflect back, and how did the conversation shift?" },
  { id: "comm-c1", directionId: "direction-communication", title: "Give a hard update simply", description: "Bad news, no padding, with a next step.", prompt: "Deliver one difficult update plainly + one next step.", type: "proof", estimatedMinutes: 8, beginnerSafe: true, level: "comfortable", contextTags: ["speaking_up_at_work", "upcoming_situation"], proofPrompt: "Show how you said the hard thing clearly and kindly. What was the next step you offered?" },
  { id: "comm-c2", directionId: "direction-communication", title: "Lead with the outcome", description: "Headline first, detail after.", prompt: "Send one message that states the outcome in line one.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "comfortable", contextTags: ["clearer_thinking"], proofPrompt: "Share the opening line. Did leading with the outcome help the reader?" },

  // direction-momentum
  { id: "mom-s1", directionId: "direction-momentum", title: "One five-minute step", description: "Make progress small enough to begin.", prompt: "Do one useful five-minute action and capture proof.", type: "proof", estimatedMinutes: 5, beginnerSafe: true, level: "starter", contextTags: ["rebuilding_habit"], proofPrompt: "Show the small thing you finished. What made starting easier?" },
  { id: "mom-s2", directionId: "direction-momentum", title: "Close one open loop", description: "Finish one lingering item.", prompt: "Complete one thing that's been sitting too long.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true, level: "starter", contextTags: ["personal_growth"], proofPrompt: "What loop did you close? How did finishing it feel?" },
  { id: "mom-b1", directionId: "direction-momentum", title: "Restart small after a miss", description: "The smallest version counts.", prompt: "After a gap, do the tiniest version of your habit.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "building", contextTags: ["rebuilding_habit"], proofPrompt: "Show your restart. What was the smallest version that still counted?" },
  { id: "mom-b2", directionId: "direction-momentum", title: "Protect one focused block", description: "Guard 15 minutes from distraction.", prompt: "Take 15 distraction-free minutes on one task.", type: "proof", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["clearer_thinking"], proofPrompt: "What did you protect the time for, and what got done?" },
  { id: "mom-c1", directionId: "direction-momentum", title: "Ship something unfinished", description: "Progress over polish.", prompt: "Share one thing before it feels perfect.", type: "proof", estimatedMinutes: 7, beginnerSafe: true, level: "comfortable", contextTags: ["upcoming_situation"], proofPrompt: "Show what you shipped early. What did 'good enough' unlock?" },
  { id: "mom-c2", directionId: "direction-momentum", title: "Set one honest deadline", description: "A date you'll actually keep.", prompt: "Commit to one realistic deadline and tell someone.", type: "conversation", estimatedMinutes: 5, beginnerSafe: true, level: "comfortable", contextTags: ["personal_growth"], proofPrompt: "What did you commit to, by when, and to whom?" },

  // direction-self-trust
  { id: "self-s1", directionId: "direction-self-trust", title: "Honest reflection", description: "Notice effort without judgment.", prompt: "Write what you tried, what changed, what's next.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true, level: "starter", contextTags: ["personal_growth"], proofPrompt: "Share your reflection. Where did you catch judgment creeping in?" },
  { id: "self-s2", directionId: "direction-self-trust", title: "Log a follow-through", description: "Proof you did what you said.", prompt: "Note one thing you said you'd do — and did.", type: "reflection", estimatedMinutes: 4, beginnerSafe: true, level: "starter", contextTags: ["rebuilding_habit"], proofPrompt: "Show the follow-through. What does it tell you about yourself?" },
  { id: "self-b1", directionId: "direction-self-trust", title: "Practice a calm boundary", description: "A clear not-yet, no apology.", prompt: "Draft one calm boundary sentence.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "building", contextTags: ["relationships"], proofPrompt: "Share the boundary you drafted. What made it feel clear and kind?" },
  { id: "self-b2", directionId: "direction-self-trust", title: "Separate fact from story", description: "What happened vs. what you assumed.", prompt: "Write the fact, then the story you added.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["clearer_thinking"], proofPrompt: "Show the fact vs. the story. What changed once you split them?" },
  { id: "self-c1", directionId: "direction-self-trust", title: "Keep a hard promise to yourself", description: "Small, but you kept it.", prompt: "Make and keep one small promise to yourself today.", type: "proof", estimatedMinutes: 6, beginnerSafe: true, level: "comfortable", contextTags: ["personal_growth", "rebuilding_habit"], proofPrompt: "What did you promise and keep? How did keeping it land?" },
  { id: "self-c2", directionId: "direction-self-trust", title: "Decide without over-checking", description: "Trust one call.", prompt: "Make one small decision without seeking reassurance.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "comfortable", contextTags: ["clearer_thinking", "upcoming_situation"], proofPrompt: "Show the call you made solo. What did trusting yourself feel like?" },

  // direction-contribution
  { id: "contrib-s1", directionId: "direction-contribution", title: "Give specific feedback", description: "Respond to the work, not the person.", prompt: "Write one thing that worked + one useful next step.", type: "reflection", estimatedMinutes: 7, beginnerSafe: true, level: "starter", contextTags: ["relationships"], proofPrompt: "Share the feedback you gave. Was it specific and kind?" },
  { id: "contrib-s2", directionId: "direction-contribution", title: "Spot the next step", description: "Help someone choose one safe action.", prompt: "Read a proof and suggest one small next step.", type: "conversation", estimatedMinutes: 7, beginnerSafe: true, level: "starter", contextTags: ["clearer_thinking"], proofPrompt: "What next step did you suggest, and why that one?" },
  { id: "contrib-b1", directionId: "direction-contribution", title: "Offer context, not control", description: "Share what helps; let them decide.", prompt: "Give one piece of useful context without taking over.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["relationships", "speaking_up_at_work"], proofPrompt: "Show the context you offered. How did you leave the choice with them?" },
  { id: "contrib-b2", directionId: "direction-contribution", title: "Ask before advising", description: "Find out what help they want.", prompt: "Ask 'what would help?' before offering a fix.", type: "conversation", estimatedMinutes: 5, beginnerSafe: true, level: "building", contextTags: ["relationships"], proofPrompt: "What did asking first change about the help you gave?" },
  { id: "contrib-c1", directionId: "direction-contribution", title: "Share what you learned", description: "Turn one lesson into help.", prompt: "Write one thing you learned that could help someone.", type: "proof", estimatedMinutes: 8, beginnerSafe: true, level: "comfortable", contextTags: ["personal_growth"], proofPrompt: "Share the lesson. Who might it help, and how?" },
  { id: "contrib-c2", directionId: "direction-contribution", title: "Encourage one person", description: "Specific, earned encouragement.", prompt: "Tell one person a specific thing they did well.", type: "conversation", estimatedMinutes: 5, beginnerSafe: true, level: "comfortable", contextTags: ["relationships"], proofPrompt: "What did you notice and name for them? Keep it specific, not flattery." },
];
```

- [ ] **Step 2: Give the demo user sample onboarding answers** so personalization is visible in the no-account path. In `buildDemoUsers()` (the function that builds demo users), set the FIRST user (`user-alex`, index 0) to include onboarding answers. Add to the index-0 user object (only): `currentDirectionId: "direction-confidence", startingLevel: "building", contextTags: ["speaking_up_at_work"], goalText: "Speak up in meetings without overthinking", cadence: "a few minutes a day"`. (Other demo users can stay as-is.)

If `buildDemoUsers` maps uniformly, change it to spread per-index overrides for index 0, e.g.:
```ts
    ...(i === 0 ? { currentDirectionId: "direction-confidence", startingLevel: "building" as const, contextTags: ["speaking_up_at_work" as const], goalText: "Speak up in meetings without overthinking", cadence: "a few minutes a day" } : {}),
```

- [ ] **Step 3: Update completed-practice demo ids** — the `seedSnapshot.completedPracticeIds` currently lists old prompt ids (`say-clear-thing`, etc.) that no longer exist. Replace with new ids that exist, e.g. `["conf-s1", "comm-s1"]` (so "completed" demo state still references real practices).

- [ ] **Step 4: Fix any other references to removed prompt ids** in `lib/betaData.ts` (the proof generator / app-feedback routes may reference old `promptId`s like `say-clear-thing`). Run:
```bash
grep -n "say-clear-thing\|ask-useful-question\|five-minute-step\|honest-reflection\|name-one-preference\|explain-idea-simply\|close-one-loop\|practice-boundary\|give-specific-feedback\|spot-next-step" lib/betaData.ts
```
For each hit, swap to a new id from the same direction (e.g. `say-clear-thing`→`conf-s1`, `ask-useful-question`→`comm-s1`, `five-minute-step`→`mom-s1`, `honest-reflection`→`self-s1`, `give-specific-feedback`→`contrib-s1`, `spot-next-step`→`contrib-s2`, `explain-idea-simply`→`comm-b1`, `close-one-loop`→`mom-s2`, `name-one-preference`→`conf-s2`, `practice-boundary`→`self-b1`).

- [ ] **Step 5: Typecheck + commit**
```bash
npm run typecheck
git add lib/betaData.ts
git commit -m "feat(content): ~30 tagged practices + demo onboarding answers"
```
Expected: typecheck clean (no references to removed prompt ids).

---

### Task 4: Provider + repository wiring (persist onboarding answers)

**Files:** Modify `lib/supabase/betaRepository.ts`, `components/beta/AppStateProvider.tsx`

**Interfaces:**
- Consumes: Task 1 types.
- Produces: `OnboardingPayload` type; `completeOnboarding(payload: OnboardingPayload)`; `updateOnboarding(client, userId, payload)` writes the 5 fields; `mapProfile` reads them.

- [ ] **Step 1: `mapProfile`** — add the new fields (after `contributionCount`):
```ts
    goalText: row.goal_text ?? null,
    startingLevel: row.starting_level ?? null,
    contextTags: row.context_tags ?? [],
    cadence: row.cadence ?? null,
```

- [ ] **Step 2: Extend `updateOnboarding`** in `lib/supabase/betaRepository.ts`:
```ts
export async function updateOnboarding(
  client: SupabaseClient,
  userId: string,
  payload: { directionId: string | null; goalText?: string | null; startingLevel?: string | null; contextTags?: string[]; cadence?: string | null },
): Promise<void> {
  await client
    .from("profiles")
    .update({
      current_direction_id: payload.directionId,
      goal_text: payload.goalText ?? null,
      starting_level: payload.startingLevel ?? null,
      context_tags: payload.contextTags ?? [],
      cadence: payload.cadence ?? null,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
```

- [ ] **Step 3: Extend `completeOnboarding` in the provider** (`components/beta/AppStateProvider.tsx`). Add an exported payload type near the top:
```ts
export type OnboardingPayload = {
  directionId: string;
  goalText?: string;
  startingLevel?: import("@/lib/betaTypes").PracticeLevel;
  contextTags?: import("@/lib/betaTypes").ContextTag[];
  cadence?: string;
};
```
Change the context type signature `completeOnboarding: (directionId: string) => Promise<void>;` to `completeOnboarding: (payload: OnboardingPayload) => Promise<void>;`. Replace the method body:
```ts
      async completeOnboarding(payload) {
        setSnapshot((current) => {
          if (!current.currentUserId) return current;
          return {
            ...current,
            users: current.users.map((u) =>
              u.id === current.currentUserId
                ? {
                    ...u,
                    currentDirectionId: payload.directionId,
                    onboardingCompleted: true,
                    directionIds: [payload.directionId],
                    goalText: payload.goalText ?? null,
                    startingLevel: payload.startingLevel ?? null,
                    contextTags: payload.contextTags ?? [],
                    cadence: payload.cadence ?? null,
                  }
                : u
            ),
          };
        });
        const uid = authUid();
        if (writesEnabled && uid) {
          await updateOnboarding(supabase!, uid, {
            directionId: payload.directionId,
            goalText: payload.goalText,
            startingLevel: payload.startingLevel,
            contextTags: payload.contextTags,
            cadence: payload.cadence,
          }).catch(() => {});
          void logBetaEvent(supabase!, uid, "onboarding_completed", undefined, { directionId: payload.directionId });
        }
      },
```

- [ ] **Step 4: Typecheck + commit**
```bash
npm run typecheck
git add lib/supabase/betaRepository.ts components/beta/AppStateProvider.tsx
git commit -m "feat: persist onboarding answers (goal/level/context/cadence)"
```
Expected: typecheck clean. (The onboarding page call site updates in Task 5; if typecheck flags the old `completeOnboarding(directionId)` call, that's expected — Task 5 fixes it. To keep this task green, also do Task 5 before typechecking, OR temporarily update the call site here; prefer doing Task 5 next.)

---

### Task 5: Onboarding UI — capture the answers

**Files:** Modify `app/onboarding/page.tsx`

**Interfaces:**
- Consumes: `CONTEXT_TAGS` (Task 1), `completeOnboarding(payload)` (Task 4), `LoopStrip` (Slice 1).
- Produces: an onboarding flow that collects direction + startingLevel + contextTags + goal + cadence and calls `completeOnboarding(payload)`.

- [ ] **Step 1: Add imports + state.** In `app/onboarding/page.tsx` add to the `@/components/beta/ui` import `LoopStrip` (if not present) and import `{ CONTEXT_TAGS } from "@/lib/betaTypes"` and the `PracticeLevel`/`ContextTag` types. Add state below `directionId`:
```ts
  const [startingLevel, setStartingLevel] = useState<import("@/lib/betaTypes").PracticeLevel | null>(null);
  const [contextTags, setContextTags] = useState<import("@/lib/betaTypes").ContextTag[]>([]);
  const [goalText, setGoalText] = useState("");
  const [cadence, setCadence] = useState<string | null>(null);
```

- [ ] **Step 2: Renumber the step machine.** The flow becomes: 0 welcome → 1 direction → 2 starting point → 3 why-now → 4 goal → 5 cadence → 6 how-it-works/finish. Change the step-1 "Continue" to `setStep(2)`, and add the new step blocks. Each uses the existing card/button styling. Example blocks to insert (after the existing `step === 1` block):
```tsx
      {step === 2 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-2xl font-bold">Where are you starting?</h1>
          <p className="text-sm leading-6 text-[#6E6E6E]">No scores here — just so practices fit you.</p>
          <div className="space-y-3">
            {[["starter","Just starting"],["building","Some practice"],["comfortable","Fairly comfortable"]].map(([val,label]) => (
              <button key={val} type="button" onClick={() => setStartingLevel(val as any)}
                className={`w-full rounded-[18px] border p-4 text-left text-sm font-extrabold transition ${startingLevel===val ? "border-[#F2A900] bg-[#FFFDF8] text-[#7A5300]" : "border-[#EFE7D8] bg-[#FFFDF8] text-[#111111]"}`}>
                {label}
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={!startingLevel} onClick={() => setStep(3)}>Continue <ArrowRight size={17} /></Button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-2xl font-bold">Why now?</h1>
          <p className="text-sm leading-6 text-[#6E6E6E]">Optional — pick any that fit.</p>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_TAGS.map((tag) => {
              const on = contextTags.includes(tag.id);
              return (
                <button key={tag.id} type="button"
                  onClick={() => setContextTags((c) => on ? c.filter((x) => x !== tag.id) : [...c, tag.id])}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${on ? "border-[#F2A900] bg-[#FFF1C7] text-[#7A5300]" : "border-[#EFE7D8] bg-[#FFFDF8] text-[#6E6E6E]"}`}>
                  {tag.label}
                </button>
              );
            })}
          </div>
          <Button className="w-full" onClick={() => setStep(4)}>Continue <ArrowRight size={17} /></Button>
        </div>
      )}

      {step === 4 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-2xl font-bold">What do you want to get better at?</h1>
          <p className="text-sm leading-6 text-[#6E6E6E]">One line, in your words. Optional — you can skip.</p>
          <textarea value={goalText} onChange={(e) => setGoalText(e.target.value)} rows={3}
            placeholder="e.g. Speak up in meetings without overthinking"
            className="w-full rounded-2xl border border-[#EFE7D8] bg-white p-4 text-sm text-[#111111] outline-none focus:border-[#F2A900]" />
          <Button className="w-full" onClick={() => setStep(5)}>Continue <ArrowRight size={17} /></Button>
        </div>
      )}

      {step === 5 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-2xl font-bold">How often feels right?</h1>
          <p className="text-sm leading-6 text-[#6E6E6E]">Low pressure. Change it anytime.</p>
          <div className="space-y-3">
            {["a few minutes a day","a couple times a week"].map((c) => (
              <button key={c} type="button" onClick={() => setCadence(c)}
                className={`w-full rounded-[18px] border p-4 text-left text-sm font-extrabold transition ${cadence===c ? "border-[#F2A900] bg-[#FFFDF8] text-[#7A5300]" : "border-[#EFE7D8] bg-[#FFFDF8] text-[#111111]"}`}>
                {c.charAt(0).toUpperCase()+c.slice(1)}
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={!cadence} onClick={() => setStep(6)}>Continue <ArrowRight size={17} /></Button>
        </div>
      )}
```

- [ ] **Step 3: Move the existing "How Collective works" block to `step === 6`** and update its `finish()` to send the full payload. Change the existing `finish()` to:
```ts
  async function finish() {
    if (!directionId) return;
    setSaving(true);
    await completeOnboarding({
      directionId,
      goalText: goalText.trim() || undefined,
      startingLevel: startingLevel ?? undefined,
      contextTags: contextTags.length ? contextTags : undefined,
      cadence: cadence ?? undefined,
    });
    router.push("/home");
  }
```
(The existing step-2 "How Collective works" JSX becomes `step === 6`; its "Start practicing" button still calls `finish()`. Back behavior: the existing decrementing Back still works across the new steps. `ArrowRight` is already imported in this file.)

- [ ] **Step 4: Typecheck + commit**
```bash
npm run typecheck
git add app/onboarding/page.tsx
git commit -m "feat: onboarding captures starting point, context, goal, cadence"
```
Expected: typecheck clean (now `completeOnboarding(payload)` call site matches Task 4).

---

### Task 6: Consume personalization (Home, Practice, Proof)

**Files:** Modify `app/home/page.tsx`, `app/practice/page.tsx`, `app/proof/new/[promptId]/page.tsx`

**Interfaces:**
- Consumes: `getPersonalizedPractices`, `getNextPractice` (Task 2); `currentUser` onboarding fields.

- [ ] **Step 1: Home — personalized next step + goal greeting.** In `app/home/page.tsx`, import `import { getNextPractice } from "@/lib/personalization";`. Replace the `nextPrompt` computation:
```tsx
  const nextPrompt =
    getNextPractice(
      { currentDirectionId: currentUser?.currentDirectionId ?? null, startingLevel: currentUser?.startingLevel ?? null, contextTags: currentUser?.contextTags ?? [] },
      snapshot.prompts,
      snapshot.completedPracticeIds,
    ) || snapshot.prompts[0];
```
Add a goal line in the `PageHeader` subtitle (keep "Small steps. Real progress." as fallback):
```tsx
          subtitle={currentUser?.goalText ? `Working toward: ${currentUser.goalText}` : "Small steps. Real progress."}
```

- [ ] **Step 2: Practice — personalized order.** In `app/practice/page.tsx`, import `import { getPersonalizedPractices, getNextPractice } from "@/lib/personalization";`. Replace `nextPrompt`:
```tsx
  const persona = { currentDirectionId: currentUser?.currentDirectionId ?? null, startingLevel: currentUser?.startingLevel ?? null, contextTags: currentUser?.contextTags ?? [] };
  const nextPrompt = getNextPractice(persona, snapshot.prompts, snapshot.completedPracticeIds) || snapshot.prompts[0];
```
Replace the per-direction `.filter(...)` list with a single personalized "For you" section above the direction sections (keep the direction sections below for browsing). After the AiSupportCard block, insert:
```tsx
        <section className="space-y-3">
          <SectionLabel title="For you" />
          {getPersonalizedPractices(persona, snapshot.prompts).slice(0, 5).map((prompt) => {
            const completed = snapshot.completedPracticeIds.includes(prompt.id);
            return (
              <div key={prompt.id} className="space-y-2">
                <PracticePromptCard prompt={prompt} completed={completed} />
                {!completed && (
                  <Button className="w-full" variant="secondary" onClick={() => completePractice(prompt.id)}>
                    <CheckCircle2 size={17} /> I did this already
                  </Button>
                )}
              </div>
            );
          })}
        </section>
```
(Leave the existing `snapshot.directions.map(...)` browse sections as-is below.)

- [ ] **Step 3: Proof — tailored prompt + goal weave.** In `app/proof/new/[promptId]/page.tsx`, the prompt card currently shows `prompt?.prompt`. Change it to prefer the practice's proof prompt and weave the goal. Replace the prompt-card body text:
```tsx
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{prompt?.proofPrompt || prompt?.prompt || "Capture one small example of progress."}</p>
          {currentUser?.goalText && (
            <p className="mt-2 text-xs leading-5 text-[#7A5300]">Toward your goal: “{currentUser.goalText}” — it doesn’t need to be perfect.</p>
          )}
```
(`currentUser` is already destructured in this file. No change to submission behavior.)

- [ ] **Step 4: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add app/home/page.tsx app/practice/page.tsx "app/proof/new/[promptId]/page.tsx"
git commit -m "feat: Home/Practice/Proof consume personalized selection + goal"
```
Expected: typecheck clean; `✓ Compiled successfully`.

---

### Task 7: Migration (author-only) + verify

**Files:** Create `supabase/migrations/025_personalization.sql`; verify.

- [ ] **Step 1: Author `supabase/migrations/025_personalization.sql`** (DO NOT APPLY — MCP disconnected):
```sql
-- 025_personalization.sql — onboarding answers + practice tagging (additive).
-- Run AFTER 010–024. Idempotent. NOTE: apply when the Supabase MCP/connection is back.
alter table public.profiles add column if not exists goal_text text;
alter table public.profiles add column if not exists starting_level text check (starting_level in ('starter','building','comfortable'));
alter table public.profiles add column if not exists context_tags text[] not null default '{}';
alter table public.profiles add column if not exists cadence text;

alter table public.practices add column if not exists level text not null default 'starter';
alter table public.practices add column if not exists context_tags text[] not null default '{}';
alter table public.practices add column if not exists proof_prompt text;

-- Per-practice tagging of the live `practices` rows mirrors lib/betaData.ts seedPrompts
-- (id/slug -> level/context_tags/proof_prompt). Apply as UPDATEs when MCP is back;
-- the canonical mapping is the seedPrompts array in lib/betaData.ts.
```

- [ ] **Step 2: Re-run the pure check + build**
```bash
npx tsx scripts/check-personalization.ts
npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: `personalization checks passed`; `✓ Compiled successfully`.

- [ ] **Step 3: Visual check (demo, light + dark).** Start the preview; enter demo; walk the new onboarding (Explore demo → it lands on Home, but to see onboarding use a fresh demo state — or verify the demo user's seeded answers drive Home). Confirm via eval that Home's next step + greeting reflect the demo user's answers and Proof shows a proof-prompt:
```js
(() => { const t = document.body.innerText; return { goalGreeting: /Working toward:/.test(t) }; })()
```
Then open the next-step proof and confirm the tailored prompt/goal line render; toggle dark and confirm legibility.

- [ ] **Step 4: Commit the migration**
```bash
git add supabase/migrations/025_personalization.sql
git commit -m "chore(db): author 025_personalization migration (apply when MCP reconnects)"
```

---

## Self-Review

**1. Spec coverage:**
- Types + taxonomy (level/contextTags/proofPrompt; goal/level/context/cadence; CONTEXT_TAGS) → Task 1. ✓
- Pure selection (getPersonalizedPractices/getNextPractice) + tests → Task 2. ✓
- ~30 tagged practices + proof prompts + demo answers → Task 3. ✓
- Persist onboarding answers (snapshot + profile) → Task 4. ✓
- Onboarding captures 5 fields, beginner-safe, optional goal/context, back-able → Task 5. ✓
- Home next-step + greeting, Practice personalized order, Proof tailored prompt + goal → Task 6. ✓
- Migration 025 additive, author-only (MCP down) → Task 7. ✓
- Beginner-safe / approved vocab / Slice-1 design + FAB preserved → constraints + reuse. ✓

**2. Placeholder scan:** No TBD/TODO. Full content (30 practices) + full code in every step. The migration's per-row reseed is explicitly deferred-with-reason (MCP disconnected) and points to the canonical mapping (seedPrompts) — not a hidden placeholder.

**3. Type consistency:** `PracticeLevel`/`ContextTag`/`CONTEXT_TAGS` defined Task 1, used Tasks 2/3/5/6. `getPersonalizedPractices`/`getNextPractice` signatures identical across Task 2 (def) and Task 6 (use) — both take `{currentDirectionId, startingLevel, contextTags}`. `OnboardingPayload` defined Task 4, used Task 5. `completeOnboarding(payload)` signature changed in Task 4 and call site updated in Task 5 (noted ordering dependency). `proofPrompt` already on PracticePrompt; only `level`/`contextTags` added.
