# Robust AI Layer (real OpenAI behind existing agents) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the canned `mockAiService` brain with real OpenAI GPT-4o-mini calls behind the 5 existing agents — server-side, persona-aware, schema- and brand-validated, with graceful fallback to the mock on any failure or missing key.

**Architecture:** A single server-only runner (`lib/ai/openai.ts`) calls GPT-4o-mini with JSON output and zod-validates it. The orchestrator's 5 `run*` functions try the runner + `assertBrandSafe`, and fall back to `mockAiService.<feature>` on any error. The client and `AiService` contract are unchanged; only the server-side agents become real. No key ⇒ mock everywhere (identical to today).

**Tech Stack:** Next.js App Router + TypeScript, `openai` SDK, zod (already used by agents), `npx tsx` for a runnable pure check (no jest/vitest in repo).

## Global Constraints

- Provider/model: **OpenAI `gpt-4o-mini`** via the `openai` SDK; `COLLECTIVE_AI_MODEL` overrides (default `gpt-4o-mini`); `COLLECTIVE_AI_MAX_TOKENS` default `512`; request timeout default `15000` ms.
- **Server-only secret:** `OPENAI_API_KEY` is read only inside `lib/ai/*` (reached via the route). NEVER `NEXT_PUBLIC_`, never imported by client code, never sent to the browser.
- **Defense in depth:** keep the deterministic regex input pre-gate (`reviewTextSafety`) unchanged; validate every real output against the agent zod schema AND `assertBrandSafe`; ANY failure (no key / network / timeout / parse / schema / policy) → `mockAiService.<sameFeature>`.
- **No-key parity:** with `OPENAI_API_KEY` unset, behavior is identical to today (mock).
- Beginner-safe vocabulary only; NO scores/streaks/leaderboards/likes/followers/ranking/clout in any code or copy.
- No cross-user data in prompts; persona is best-effort (omit absent fields).
- `COLLECTIVE_PANEL`/demo-panel else-branch stays mock. `runSafetyReview` unchanged. Keep existing `logAgentRun`/`logUserInteraction` calls.
- Additive: do not change the `AiService` interface or client call sites' signatures (only pass extra optional persona fields).
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (Git Bash). **Start on branch `ai-real-model` off `main`.**

## File Structure

- `lib/ai/outputPolicy.ts` — **create.** `FORBIDDEN` list + `assertBrandSafe(parts: string[])`. Pure.
- `lib/ai/persona.ts` — **create.** `buildPersonaBlock(ctx: AiUserContext): string`. Pure.
- `lib/ai/openai.ts` — **create, server-only.** `runAgent<T>(args): Promise<T>` + pure helper `parseAgentJson<T>(raw, schema)`.
- `scripts/check-ai-output-policy.ts` — **create.** Runnable assertions for `assertBrandSafe`, `buildPersonaBlock`, and a schema-reject case.
- `lib/aiTypes.ts` — **modify.** Extend `AiUserContext` with persona fields.
- `lib/ai/collective-orchestrator.ts` — **modify.** Wire the 5 `run*` to `runAgent` + `assertBrandSafe` + mock fallback; add per-agent prompt-builders and AiResponse shapers.
- `lib/aiService.ts` — **modify.** `isMockAiMode()` keys off `OPENAI_API_KEY`.
- `app/practice/page.tsx`, `app/proof/new/[promptId]/page.tsx`, `app/proof/[id]/feedback/page.tsx`, `app/proof/[id]/page.tsx` — **modify.** Pass persona fields from `currentUser` into the `userContext` they already build.
- `.env.example` — **create.** Document env. `docs/BETA_QA.md` — **modify.** AI section.

## Reference (verified current shapes)

- `AiResponse` = `{ id, feature, title, summary, bullets: string[], suggestedNextStep, caution?, structured: { kind, data }, createdAt }`.
- Agent zod outputs: practice-coach `{title,summary,steps[],focus,encouragement,nextSmallStep}`; reflection-helper `{validation,whatYouPracticed,nextSmallStep}`; feedback-coach `{whatWorked,suggestion,encouragement}`; summary-composer `{title,summary,bullets[max3],suggestedNextStep}`.
- `structured.kind` values used by mock: `practicePrep`, `proofPrep`, `reflectionHelp`, `feedbackCoach`, `feedbackSummary`, `safetyReview`, `summary`.
- Orchestrator `run*` today call `mockAiService.*` then `logAgentRun(agentName, input, output, status, startedAt, options)`. `SpecialistInput = { direction?, context?, prompt?, proof?, reflectionText?, draftFeedback?, feedbackList? }`. `fallbackUserContext`, `fallbackProof`, `makeAiId`, `now` exist in the file.
- `collectiveAiSystemPrompt` (lib/collectiveAiPolicy.ts) is the brand policy string; its "Forbidden language" section is the source for `FORBIDDEN`.

---

### Task 1: Output brand policy + runnable check (pure)

**Files:** Create `lib/ai/outputPolicy.ts`, `scripts/check-ai-output-policy.ts`

**Interfaces:**
- Produces: `FORBIDDEN: RegExp[]`, `assertBrandSafe(parts: string[]): void` (throws `Error` on a forbidden hit).

- [ ] **Step 1: Create the branch**
```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b ai-real-model
```

- [ ] **Step 2: Create `lib/ai/outputPolicy.ts`**
```ts
// Mirrors the "Forbidden language" + anti-clout rules in lib/collectiveAiPolicy.ts.
// Used to validate REAL model output before it can reach a user; a hit forces a
// fallback to the safe mock response.
export const FORBIDDEN: RegExp[] = [
  /\byou are bad at\b/i,
  /\byou (are|seem) (clearly )?(insecure|worthless|stupid|a failure)\b/i,
  /\bthis proves you are\b/i,
  /\bconfidence score\b/i,
  /\b(trust|skill|worth)\s+score\b/i,
  /\byou failed\b/i,
  /\byou should dominate\b/i,
  /\bmake you elite\b/i,
  /\bleaderboard\b/i,
  /\bfollowers?\b/i,
  /\blikes\b/i,
  /\bgo viral\b/i,
  /\bclout\b/i,
];

/** Throw if any rendered, user-facing string trips the brand policy. */
export function assertBrandSafe(parts: Array<string | undefined | null>): void {
  const text = parts.filter(Boolean).join("\n");
  for (const re of FORBIDDEN) {
    if (re.test(text)) throw new Error(`brand policy violation: ${re}`);
  }
}
```

- [ ] **Step 3: Create `scripts/check-ai-output-policy.ts`** (also covers Tasks 2 & 3 pure helpers as they land — start with policy assertions)
```ts
import assert from "node:assert";
import { assertBrandSafe } from "../lib/ai/outputPolicy";

// passes clean, beginner-safe copy
assertBrandSafe(["One small next step is to say one clear thing.", "You practiced something real."]);

// throws on forbidden phrases
for (const bad of ["Your confidence score is 42", "Climb the leaderboard", "This proves you are insecure", "get more followers"]) {
  let threw = false;
  try { assertBrandSafe([bad]); } catch { threw = true; }
  assert.ok(threw, `expected brand violation for: ${bad}`);
}

console.log("ai-output-policy checks passed");
```

- [ ] **Step 4: Run the check**
```bash
npx tsx scripts/check-ai-output-policy.ts
```
Expected: `ai-output-policy checks passed`.

- [ ] **Step 5: Typecheck + commit**
```bash
npm run typecheck
git add lib/ai/outputPolicy.ts scripts/check-ai-output-policy.ts
git commit -m "feat(ai): brand-safe output policy + runnable check"
```

---

### Task 2: Persona block + AiUserContext extension (pure)

**Files:** Modify `lib/aiTypes.ts`; Create `lib/ai/persona.ts`; Modify `scripts/check-ai-output-policy.ts`

**Interfaces:**
- Consumes: `AiUserContext`.
- Produces: `AiUserContext` += `goalText?`, `startingLevel?`, `contextTags?`, `directionTitle?`; `buildPersonaBlock(ctx: AiUserContext): string`.

- [ ] **Step 1: Extend `AiUserContext`** in `lib/aiTypes.ts`:
```ts
export type AiUserContext = {
  userId: string;
  displayName: string;
  cohortId: string;
  trustLevelLabel?: string;
  // Personalization signals (best-effort; omitted when absent).
  goalText?: string | null;
  startingLevel?: string | null;
  contextTags?: string[];
  directionTitle?: string | null;
};
```

- [ ] **Step 2: Create `lib/ai/persona.ts`**
```ts
import type { AiUserContext } from "../aiTypes";

/**
 * A short, prompt-injectable description of who this member is, built only from
 * their own onboarding signals. Returns "" when nothing is known (signup before
 * onboarding) so prompts stay clean. Never includes other users' data.
 */
export function buildPersonaBlock(ctx: AiUserContext): string {
  const lines: string[] = [];
  if (ctx.directionTitle) lines.push(`Direction: ${ctx.directionTitle}`);
  if (ctx.startingLevel) lines.push(`Starting level: ${ctx.startingLevel}`);
  if (ctx.goalText) lines.push(`Their goal (their words): ${ctx.goalText}`);
  if (ctx.contextTags && ctx.contextTags.length) lines.push(`Why now: ${ctx.contextTags.join(", ")}`);
  if (!lines.length) return "";
  return `About this member (tailor to them; do not quote this block back):\n${lines.join("\n")}`;
}
```

- [ ] **Step 3: Add persona assertions** to `scripts/check-ai-output-policy.ts` (append before the final `console.log`):
```ts
import { buildPersonaBlock } from "../lib/ai/persona";

assert.equal(buildPersonaBlock({ userId: "u", displayName: "A", cohortId: "c" }), "", "empty persona when no signals");
const block = buildPersonaBlock({ userId: "u", displayName: "A", cohortId: "c", goalText: "Speak up in meetings", startingLevel: "building", directionTitle: "Confidence", contextTags: ["speaking_up_at_work"] });
assert.ok(block.includes("Speak up in meetings") && block.includes("Confidence") && block.includes("building"), "persona reflects signals");
```

- [ ] **Step 4: Run + typecheck + commit**
```bash
npx tsx scripts/check-ai-output-policy.ts
npm run typecheck
git add lib/aiTypes.ts lib/ai/persona.ts scripts/check-ai-output-policy.ts
git commit -m "feat(ai): persona context fields + buildPersonaBlock"
```
Expected: `ai-output-policy checks passed`; typecheck clean.

---

### Task 3: OpenAI runner (server-only)

**Files:** Create `lib/ai/openai.ts`; Modify `scripts/check-ai-output-policy.ts`

**Interfaces:**
- Consumes: `buildPersonaBlock` (Task 2), `collectiveAiSystemPrompt`, an agent's zod `outputSchema`, `AiUserContext`.
- Produces:
  - `parseAgentJson<T>(raw: string, schema: ZodType<T>): T` (pure; throws on bad JSON or schema miss).
  - `runAgent<T>(args: { agentSystemPrompt: string; userPrompt: string; schema: ZodType<T>; jsonHint: string; persona: AiUserContext }): Promise<T>` (server-only; throws on missing key / network / timeout / parse / schema).

- [ ] **Step 1: Add the `openai` dependency**
```bash
npm install openai
```
Expected: `openai` added to `package.json` dependencies.

- [ ] **Step 2: Create `lib/ai/openai.ts`**
```ts
import "server-only";
import OpenAI from "openai";
import type { ZodType } from "zod";
import { collectiveAiSystemPrompt } from "../collectiveAiPolicy";
import { buildPersonaBlock } from "./persona";
import type { AiUserContext } from "../aiTypes";

function model() {
  return process.env.COLLECTIVE_AI_MODEL || "gpt-4o-mini";
}
function maxTokens() {
  return Number(process.env.COLLECTIVE_AI_MAX_TOKENS || 512);
}
function timeoutMs() {
  return Number(process.env.COLLECTIVE_AI_TIMEOUT_MS || 15000);
}

/** Pure: parse + validate model JSON. Throws on bad JSON or schema mismatch. */
export function parseAgentJson<T>(raw: string, schema: ZodType<T>): T {
  const parsed = JSON.parse(raw) as unknown;
  return schema.parse(parsed);
}

/**
 * Server-only. Run one agent against OpenAI and return validated typed output.
 * Throws on missing key, network/timeout, non-JSON, or schema mismatch — callers
 * (the orchestrator) translate any throw into the safe mock fallback.
 */
export async function runAgent<T>(args: {
  agentSystemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
  jsonHint: string;
  persona: AiUserContext;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const client = new OpenAI({ apiKey });

  const persona = buildPersonaBlock(args.persona);
  const system = [collectiveAiSystemPrompt, args.agentSystemPrompt, persona]
    .filter(Boolean)
    .join("\n\n");
  const user = `${args.userPrompt}\n\nReturn ONLY a JSON object with these keys: ${args.jsonHint}`;

  const completion = await client.chat.completions.create(
    {
      model: model(),
      max_tokens: maxTokens(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    { timeout: timeoutMs() },
  );

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("empty model response");
  return parseAgentJson(raw, args.schema);
}
```

- [ ] **Step 3: Add a `parseAgentJson` assertion** to `scripts/check-ai-output-policy.ts` (append before the final `console.log`):
```ts
import { z } from "zod";
import { parseAgentJson } from "../lib/ai/openai";
```
> NOTE: importing `lib/ai/openai.ts` pulls in `server-only`, which throws outside a Next server build. To keep the check runnable under `tsx`, do NOT import `openai.ts` here. Instead test the parse contract against a local copy of the same logic:
```ts
const sampleSchema = z.object({ a: z.string(), b: z.number() });
let bad = false;
try { sampleSchema.parse(JSON.parse('{"a":"x"}')); } catch { bad = true; }
assert.ok(bad, "schema rejects malformed output");
assert.deepEqual(sampleSchema.parse(JSON.parse('{"a":"x","b":2}')), { a: "x", b: 2 }, "schema accepts valid output");
```
(Do not add the `parseAgentJson`/`openai` import — only the zod assertions above. This proves the schema-validation contract `runAgent` relies on without importing the server-only module.)

- [ ] **Step 4: Run + typecheck + commit**
```bash
npx tsx scripts/check-ai-output-policy.ts
npm run typecheck
git add package.json package-lock.json lib/ai/openai.ts scripts/check-ai-output-policy.ts
git commit -m "feat(ai): server-only OpenAI runAgent (gpt-4o-mini, json, zod-validated)"
```
Expected: `ai-output-policy checks passed`; typecheck clean.

---

### Task 4: Wire orchestrator to the real runner (mock fallback)

**Files:** Modify `lib/ai/collective-orchestrator.ts`

**Interfaces:**
- Consumes: `runAgent` (Task 3), `assertBrandSafe` (Task 1), agent modules' `systemPrompt`/`outputSchema`, `mockAiService`.
- Produces: the 5 `run*` now return real output when possible; identical mock `AiResponse` on any failure.

- [ ] **Step 1: Add imports** at the top of `lib/ai/collective-orchestrator.ts`:
```ts
import { runAgent } from "./openai";
import { assertBrandSafe } from "./outputPolicy";
```

- [ ] **Step 2: Replace `runPracticeCoach`** with a real-call-then-fallback body. The real agent returns `{title,summary,steps,focus,encouragement,nextSmallStep}`; map it onto the mock envelope (kind `practicePrep`).
```ts
export async function runPracticeCoach(input: SpecialistInput, options?: RunOptions): Promise<AiResponse> {
  const startedAt = Date.now();
  const ctx = options?.userContext || fallbackUserContext;
  const base = await mockAiService.generatePractice({ direction: input.direction, context: input.context, prompt: input.prompt }, ctx);
  try {
    const out = await runAgent({
      agentSystemPrompt: practiceCoach.systemPrompt,
      userPrompt: `Direction: ${input.direction || input.prompt?.title || "confidence"}\nContext: ${input.context || input.prompt?.description || ""}`,
      schema: practiceCoach.outputSchema,
      jsonHint: "title, summary, steps (array of 2-4 short strings), focus, encouragement, nextSmallStep",
      persona: ctx,
    });
    assertBrandSafe([out.title, out.summary, out.focus, out.encouragement, out.nextSmallStep, ...out.steps]);
    const response: AiResponse = {
      ...base,
      title: out.title,
      summary: out.summary,
      bullets: out.steps,
      suggestedNextStep: out.nextSmallStep,
      structured: { kind: "practicePrep", data: { title: out.title, steps: out.steps, focus: out.focus, encouragement: out.encouragement } },
    };
    await logAgentRun(practiceCoach.agentName, input, response, "ok", startedAt, options);
    return response;
  } catch {
    await logAgentRun(practiceCoach.agentName, input, base, "fallback", startedAt, options);
    return base;
  }
}
```

- [ ] **Step 3: Replace `runReflectionHelper`** (agent returns `{validation,whatYouPracticed,nextSmallStep}`, kind `reflectionHelp`):
```ts
export async function runReflectionHelper(input: SpecialistInput, options?: RunOptions): Promise<AiResponse> {
  const startedAt = Date.now();
  const ctx = options?.userContext || fallbackUserContext;
  const base = await mockAiService.reflectOnProof(input.proof || null, input.reflectionText || "", input.prompt, ctx);
  try {
    const out = await runAgent({
      agentSystemPrompt: reflectionHelper.systemPrompt,
      userPrompt: `Proof: ${input.proof?.title || ""}\nReflection: ${input.reflectionText || ""}\nPractice: ${input.prompt?.title || ""}`,
      schema: reflectionHelper.outputSchema,
      jsonHint: "validation, whatYouPracticed, nextSmallStep",
      persona: ctx,
    });
    assertBrandSafe([out.validation, out.whatYouPracticed, out.nextSmallStep]);
    const response: AiResponse = {
      ...base,
      title: base.title,
      summary: out.validation,
      bullets: [out.whatYouPracticed, out.nextSmallStep],
      suggestedNextStep: out.nextSmallStep,
      structured: { kind: "reflectionHelp", data: { validation: out.validation, whatYouPracticed: out.whatYouPracticed, nextSmallStep: out.nextSmallStep } },
    };
    await logAgentRun(reflectionHelper.agentName, input, response, "ok", startedAt, options);
    return response;
  } catch {
    await logAgentRun(reflectionHelper.agentName, input, base, "fallback", startedAt, options);
    return base;
  }
}
```

- [ ] **Step 4: Replace `runFeedbackCoach`** (agent returns `{whatWorked,suggestion,encouragement}`, kind `feedbackCoach`):
```ts
export async function runFeedbackCoach(input: SpecialistInput, options?: RunOptions): Promise<AiResponse> {
  const startedAt = Date.now();
  const ctx = options?.userContext || fallbackUserContext;
  const proof = input.proof || fallbackProof;
  const base = await mockAiService.coachFeedback(proof, input.draftFeedback || "", ctx);
  try {
    const out = await runAgent({
      agentSystemPrompt: feedbackCoach.systemPrompt,
      userPrompt: `Proof: ${proof.title}\nDraft feedback: ${input.draftFeedback || ""}`,
      schema: feedbackCoach.outputSchema,
      jsonHint: "whatWorked, suggestion, encouragement",
      persona: ctx,
    });
    assertBrandSafe([out.whatWorked, out.suggestion, out.encouragement]);
    const response: AiResponse = {
      ...base,
      bullets: [`What worked: ${out.whatWorked}`, `Suggestion: ${out.suggestion}`, `Encouragement: ${out.encouragement}`],
      suggestedNextStep: out.suggestion,
      structured: { kind: "feedbackCoach", data: { whatWorked: out.whatWorked, suggestion: out.suggestion, encouragement: out.encouragement } },
    };
    await logAgentRun(feedbackCoach.agentName, input, response, "ok", startedAt, options);
    return response;
  } catch {
    await logAgentRun(feedbackCoach.agentName, input, base, "fallback", startedAt, options);
    return base;
  }
}
```

- [ ] **Step 5: Replace `runSummaryComposer`** (agent returns `{title,summary,bullets,suggestedNextStep}`, kind `feedbackSummary`). Keep the `input.response` short-circuit:
```ts
export async function runSummaryComposer(input: SpecialistInput & { response?: AiResponse }, options?: RunOptions): Promise<AiResponse> {
  const startedAt = Date.now();
  const ctx = options?.userContext || fallbackUserContext;
  const base = input.response || (await mockAiService.summarizeFeedback(input.proof || fallbackProof, input.feedbackList || [], ctx));
  try {
    const out = await runAgent({
      agentSystemPrompt: summaryComposer.systemPrompt,
      userPrompt: `Proof: ${input.proof?.title || ""}\nFeedback count: ${(input.feedbackList || []).length}\nNotes: ${(input.feedbackList || []).map((f) => f.body).join(" | ").slice(0, 800)}`,
      schema: summaryComposer.outputSchema,
      jsonHint: "title, summary, bullets (array of up to 3 short strings), suggestedNextStep",
      persona: ctx,
    });
    assertBrandSafe([out.title, out.summary, out.suggestedNextStep, ...out.bullets]);
    const response: AiResponse = {
      ...base,
      title: out.title,
      summary: out.summary,
      bullets: out.bullets,
      suggestedNextStep: out.suggestedNextStep,
      structured: { kind: "feedbackSummary", data: { commonTheme: out.summary, usefulSuggestion: out.bullets[0] || out.suggestedNextStep, nextPracticeStep: out.suggestedNextStep } },
    };
    await logAgentRun(summaryComposer.agentName, input, response, "ok", startedAt, options);
    return response;
  } catch {
    await logAgentRun(summaryComposer.agentName, input, base, "fallback", startedAt, options);
    return base;
  }
}
```

- [ ] **Step 6: Make the `prepare_proof` branch real** inside `runCollectivePanel`. Replace the existing `else if (input.action === "prepare_proof") { ... }` block with a call that tries the real practice-coach-style proof prep, falling back to mock. (proof-prep maps to kind `proofPrep`.)
```ts
    } else if (input.action === "prepare_proof") {
      const startedAt = Date.now();
      const baseProof = await mockAiService.prepareProof(raw.prompt, userContext);
      try {
        const out = await runAgent({
          agentSystemPrompt: practiceCoach.systemPrompt,
          userPrompt: `Help prepare safe proof for the practice: ${raw.prompt?.title || "this practice"}. Describe a small proof idea, a safe scope, a feedback request, and one next step.`,
          schema: z.object({ proofIdea: z.string(), safeScope: z.string(), feedbackRequest: z.string(), nextSmallStep: z.string() }),
          jsonHint: "proofIdea, safeScope, feedbackRequest, nextSmallStep",
          persona: userContext,
        });
        assertBrandSafe([out.proofIdea, out.safeScope, out.feedbackRequest, out.nextSmallStep]);
        response = {
          ...baseProof,
          bullets: [`Proof idea: ${out.proofIdea}`, `Safe scope: ${out.safeScope}`, `Feedback request: ${out.feedbackRequest}`],
          suggestedNextStep: out.nextSmallStep,
          structured: { kind: "proofPrep", data: { proofIdea: out.proofIdea, safeScope: out.safeScope, feedbackRequest: out.feedbackRequest, nextSmallStep: out.nextSmallStep } },
        };
        await logAgentRun(practiceCoach.agentName, raw, response, "ok", startedAt, runOptions);
      } catch {
        response = baseProof;
        await logAgentRun(practiceCoach.agentName, raw, response, "fallback", startedAt, runOptions);
      }
    } else if (input.action === "reflect_on_proof") {
```
Add `import { z } from "zod";` at the top of the file if not already present. Leave the `summarize_feedback`, `review_safety`, and the final `else` (COLLECTIVE_PANEL demo) branches unchanged (demo stays mock).

- [ ] **Step 7: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add lib/ai/collective-orchestrator.ts
git commit -m "feat(ai): real OpenAI behind 5 agents with brand-safe mock fallback"
```
Expected: typecheck clean; `✓ Compiled successfully`.

---

### Task 5: Mode flag keys off OPENAI_API_KEY

**Files:** Modify `lib/aiService.ts`

**Interfaces:** `isMockAiMode()` returns true when `OPENAI_API_KEY` is absent (server). Client `getCollectiveAiService()` behavior is unchanged for the browser (it has no `OPENAI_API_KEY`, so it keeps using the route/mock).

- [ ] **Step 1: Update `isMockAiMode`** in `lib/aiService.ts`:
```ts
export function isMockAiMode() {
  const explicit = process.env.NEXT_PUBLIC_COLLECTIVE_AI_MOCK_MODE || process.env.VITE_COLLECTIVE_AI_MOCK_MODE;
  if (explicit) return explicit !== "false";
  // Real mode only when a server-side OpenAI key exists. The browser never has
  // this var, so client-side stays on mock/route — which is correct.
  return !process.env.OPENAI_API_KEY;
}
```

- [ ] **Step 2: Typecheck + commit**
```bash
npm run typecheck
git add lib/aiService.ts
git commit -m "feat(ai): real mode gated on server OPENAI_API_KEY"
```
Expected: typecheck clean.

---

### Task 6: Pass persona from client surfaces

**Files:** Modify `app/practice/page.tsx`, `app/proof/new/[promptId]/page.tsx`, `app/proof/[id]/feedback/page.tsx`, `app/proof/[id]/page.tsx`

**Interfaces:** each surface already builds an `AiUserContext` (`{ userId, displayName, cohortId, trustLevelLabel }`) when calling `aiService.*`. Add the persona fields from `currentUser` + `snapshot`.

- [ ] **Step 1: Find every userContext object** the AI calls build:
```bash
grep -rn "cohortId: currentUser" app/practice/page.tsx "app/proof/new/[promptId]/page.tsx" "app/proof/[id]/feedback/page.tsx" "app/proof/[id]/page.tsx"
```

- [ ] **Step 2: In each, add the persona fields** to the object literal that already sets `userId/displayName/cohortId`. Use this exact addition (resolve direction title from snapshot):
```ts
        goalText: currentUser?.goalText ?? null,
        startingLevel: currentUser?.startingLevel ?? null,
        contextTags: currentUser?.contextTags ?? [],
        directionTitle: snapshot.directions.find((d) => d.id === currentUser?.currentDirectionId)?.title ?? null,
```
If a surface does not already destructure `snapshot` from `useBetaApp()`, add `snapshot` to its destructure. (`app/practice/page.tsx` and `app/home` already use `snapshot`; confirm per-file.) Each surface keeps its existing `userId/displayName/cohortId/trustLevelLabel` lines.

- [ ] **Step 3: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add app/practice/page.tsx "app/proof/new/[promptId]/page.tsx" "app/proof/[id]/feedback/page.tsx" "app/proof/[id]/page.tsx"
git commit -m "feat(ai): pass persona (goal/level/context/direction) to AI calls"
```
Expected: typecheck clean; compiled.

---

### Task 7: Docs + final verification

**Files:** Create `.env.example`; Modify `docs/BETA_QA.md`

- [ ] **Step 1: Create `.env.example`**
```bash
cat > .env.example <<'EOF'
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Supabase (server-only)
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI — SERVER ONLY. Never prefix with NEXT_PUBLIC_. When unset, the AI layer
# runs in mock mode (identical to today). When set, the 5 agents call real models.
OPENAI_API_KEY=
COLLECTIVE_AI_MODEL=gpt-4o-mini
COLLECTIVE_AI_MAX_TOKENS=512
COLLECTIVE_AI_TIMEOUT_MS=15000
EOF
```

- [ ] **Step 2: Add an AI section to `docs/BETA_QA.md`** (append):
```markdown
## AI layer (real model)
- Provider: OpenAI `gpt-4o-mini` via the `openai` SDK, server-only (`OPENAI_API_KEY`).
- No key set → mock mode (identical to today). Key set → 5 agents return real,
  persona-aware coaching; any error/parse/schema/brand failure falls back to mock.
- Safety: deterministic input pre-gate (`reviewTextSafety`) + output brand/schema
  validation (`assertBrandSafe` + zod). Off-brand/malformed output never reaches a user.
- `COLLECTIVE_PANEL`/demo panel stays mock by design.
- Verify pure layer: `npx tsx scripts/check-ai-output-policy.ts`.
```

- [ ] **Step 3: Full verification**
```bash
npx tsx scripts/check-ai-output-policy.ts
npm run typecheck
npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: `ai-output-policy checks passed`; typecheck clean; `✓ Compiled successfully`.

- [ ] **Step 4: No-key parity spot check.** Confirm `isMockAiMode()` is true without a key (the build/runtime has no `OPENAI_API_KEY` unless set), so the orchestrator returns mock envelopes — i.e., the `base` path. This is implied by Task 4's structure (every `run*` builds `base` from mock and returns it on throw; with no key, `runAgent` throws immediately). No code change — just confirm the build is green and note in the commit that default env = mock.

- [ ] **Step 5: Commit**
```bash
git add .env.example docs/BETA_QA.md
git commit -m "docs(ai): document OPENAI_API_KEY (server-only) + AI QA"
```

- [ ] **Step 6 (OPTIONAL live smoke — only if a real OPENAI_API_KEY is available in the run env):** start the dev server, tap "Create a small practice" on `/practice`, and confirm via preview console/network that `/api/ai/collective` returns a real, persona-reflecting JSON response (and that forcing an invalid output falls back). Skip if no key — the no-key mock parity + pure check are the default gates.

---

## Self-Review

**1. Spec coverage:**
- Real OpenAI runner (server-only, gpt-4o-mini, json, zod) → Task 3. ✓
- Output brand/schema validation + runnable check → Task 1 (+ schema assertion Task 3 step 3). ✓
- Persona-aware (AiUserContext + buildPersonaBlock + injected) → Tasks 2, 4, 6. ✓
- Orchestrator wiring with mock fallback; COLLECTIVE_PANEL stays mock; safety pre-gate intact → Task 4. ✓
- Mode flag keyed off OPENAI_API_KEY → Task 5. ✓
- Persona from 4 client surfaces → Task 6. ✓
- Docs/env + verify + no-key parity → Task 7. ✓
- Server-only secret, beginner-safe vocab, no cross-user data → Global Constraints + persona builder. ✓

**2. Placeholder scan:** No TBD/TODO. Every code step has complete code. The `server-only` import caveat in Task 3 Step 3 is handled explicitly (test the zod contract locally rather than importing the server module) — not a placeholder.

**3. Type consistency:** `runAgent` signature identical in Task 3 (def) and Task 4 (all call sites). `assertBrandSafe(parts[])` consistent (Task 1 def, Task 4 uses). `buildPersonaBlock(ctx)` consistent (Task 2 def, Task 3 use). `AiUserContext` persona fields (Task 2) match what Task 6 sets and Task 4 forwards via `options.userContext`. `structured.kind` values (`practicePrep`/`reflectionHelp`/`feedbackCoach`/`feedbackSummary`/`proofPrep`) match the mock's kinds. Agent output field names match the verified zod schemas.
