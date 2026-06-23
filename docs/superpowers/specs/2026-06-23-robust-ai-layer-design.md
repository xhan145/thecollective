# Robust AI Layer — real Claude behind the existing agents (design)

Date: 2026-06-23
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind + Supabase)

## Problem

The AI support layer is fully scaffolded but has a **fake brain**. `mockAiService`
(`lib/aiService.ts`) returns hardcoded, identical strings regardless of input; the
orchestrator's `run*` functions (`lib/ai/collective-orchestrator.ts`) all delegate to
that mock. No model is ever called — there is no AI SDK installed, and
`COLLECTIVE_AI_MODEL` defaults to `"collective-mock-v0"`. The structure around it is
good and worth keeping: a clean `AiService` interface, 5 agent definitions with real
system prompts + zod input/output schemas (`lib/ai/agents/*`), a strong brand policy
prompt (`lib/collectiveAiPolicy.ts`), a server route (`app/api/ai/collective/route.ts`),
and a working deterministic safety reviewer (`lib/ai/safety.ts`).

Goal: make the AI genuinely intelligent and **personalization-aware** by dropping real
Claude calls into the 5 already-written agents — server-side, schema-validated, behind
the existing safety gate — with graceful fallback to the current mock when no key is
present or anything fails.

## Decisions (locked during brainstorm)

- **Approach B:** real Claude calls behind the existing agents **+ personalization-aware**
  (feed the new onboarding signals into prompts). Not net-new AI surfaces.
- **Model / cost posture:** **Claude Haiku 4.5** for all agents (`claude-haiku-4-5`),
  short structured outputs. Key is **server-only**; missing key or any error →
  fall back to the existing mock so the UI never breaks.
- **Safety: defense in depth.** Keep the deterministic regex pre-gate on user input
  (no model call on risky input); additionally validate every real model output against
  the agent's zod schema **and** the forbidden-language policy; any failure → fallback.
- **Personalization plumbing:** inject a persona block (goal, starting level, why-now
  context tags, current direction title) sourced from `currentUser`. Best-effort —
  absent fields are omitted; signup-before-onboarding still works.

## Scope

**In:**
1. One real model runner (`lib/ai/anthropic.ts`, server-only) for the 5 user-facing
   agents.
2. Output brand/schema validation (`lib/ai/outputPolicy.ts`).
3. Orchestrator wiring: real call → validate → fallback to mock on any failure.
4. Persona plumbing: extend `AiUserContext` + pass new fields from the 4 client surfaces.
5. Mode flag keyed off `ANTHROPIC_API_KEY`; add `@anthropic-ai/sdk`; docs/env.

**Out (later brainstorms):**
- AI-generated practices on the fly; AI feed/discovery; conversational coach.
- Streaming UI; prompt caching; persistent AI-cost analytics (existing agent logging
  stays as-is, no-op without DB).
- `COLLECTIVE_PANEL` stays mock — it is product-review demo content by design.

## Architecture & data flow (server-side)

```
UI tap (AiSupportCard) → POST /api/ai/collective → orchestrator.run<Agent>()
  1. Safety pre-gate: reviewTextSafety(regex on input)
       → risky / needs_human_review? return safe redirect, NO model call.
  2. runAgent(agent, input, persona):
       messages = [ collectiveAiSystemPrompt + agent.systemPrompt + persona block ]
       call Claude Haiku 4.5 (anthropic SDK), request JSON, maxTokens + timeout caps
       JSON.parse → validate against agent.outputSchema (zod)
       assertBrandSafe(rendered strings) against forbidden-language policy
  3. on ANY failure (no key / network / timeout / parse / schema / policy):
       return mockAiService.<sameFeature>(...)   // identical to today
  4. shape into AiResponse (downstream contract unchanged)
```

**Mode selection:** `isMockAiMode()` returns true when there is no `ANTHROPIC_API_KEY`.
No key (local default, CI, preview) → behavior is identical to today. Add the key →
the same calls become real. **No UI changes** — the client already calls these features.

## Files

**New:**
- `lib/ai/anthropic.ts` *(server-only)* — `runAgent({ system, agent, input, persona })`:
  builds messages, calls Haiku, parses + zod-validates, throws on failure. Reads
  `ANTHROPIC_API_KEY`, `COLLECTIVE_AI_MODEL` (default `claude-haiku-4-5`),
  optional `COLLECTIVE_AI_MAX_TOKENS` (default e.g. 512) + a request timeout.
  Never imported by client code.
- `lib/ai/outputPolicy.ts` — `assertBrandSafe(parts: string[]): void` scans rendered
  strings for the forbidden-language list from `collectiveAiPolicy.ts`; throws on a hit.
  Pure, unit-testable.
- `scripts/check-ai-output-policy.ts` — runnable assertions: `assertBrandSafe` throws on
  forbidden phrases and passes clean copy; zod output schema rejects malformed output.

**Modified:**
- `lib/ai/collective-orchestrator.ts` — the 5 `run*` (practice coach, reflection helper,
  feedback coach, summary composer, prepare-proof) become
  `try { r = await runAgent(...); assertBrandSafe(...); return shape(r) } catch { return mockAiService.<feature>(...) }`.
  `runSafetyReview` unchanged; `COLLECTIVE_PANEL`/demo-panel path stays mock.
- `lib/aiService.ts` — `isMockAiMode()` keys off `ANTHROPIC_API_KEY` (server) presence
  instead of the external-endpoint var; client `AiService` contract unchanged.
- `lib/aiTypes.ts` — extend `AiUserContext` with optional `goalText`, `startingLevel`,
  `contextTags`, `directionTitle`.
- Client surfaces that build `userContext` and call AI features — pass the new persona
  fields from `currentUser`: `app/practice/page.tsx`, `app/proof/new/[promptId]/page.tsx`,
  `app/proof/[id]/feedback/page.tsx`, `app/proof/[id]/page.tsx` (whichever build a
  context object). Mechanical.
- `package.json` — add `@anthropic-ai/sdk`.
- `.env.example` (create if absent) + `docs/BETA_QA.md` — document `ANTHROPIC_API_KEY`
  (server-only) and `COLLECTIVE_AI_MODEL`.

## Safety (defense in depth)

1. **Input pre-gate (unchanged):** `reviewTextSafety` regex runs before any model call;
   crisis / harassment / sexual / medical-boundary / private-info → safe redirect, no spend.
2. **Output validation:** every real response must (a) parse to the agent's zod schema and
   (b) pass `assertBrandSafe`. Any miss → silent fallback to mock. The model can never
   surface off-brand or malformed output to a user.

## Personalization

Persona block injected into prompts = `goalText` + `startingLevel` + `contextTags` +
current `directionTitle`, from `currentUser` (the fields shipped in the personalization
PR). So practice prep / reflection help / feedback coach speak to this person's goal and
level. Absent fields are omitted. No cross-user data ever enters a prompt.

## Secrets / env

- `ANTHROPIC_API_KEY` — **server-only**; used only inside `lib/ai/*` reached via the
  route. Never `NEXT_PUBLIC_`, never sent to the browser.
- `COLLECTIVE_AI_MODEL` — default `claude-haiku-4-5`.
- No key → mock everywhere (today's behavior).

## Testing & verification

- **Pure:** `npx tsx scripts/check-ai-output-policy.ts` — `assertBrandSafe` catches
  forbidden phrases + accepts clean copy; schema rejects malformed output.
- `npm run typecheck` + `npm run build` green.
- **No-key path (default):** confirm every helper behaves identically to today (mock).
- **Live smoke (only if a key is set):** one real call per agent through the route;
  confirm JSON parses, schema validates, and the persona (goal/level) is reflected;
  confirm a deliberately off-brand forced output falls back to mock.
- **Manual:** tap each AI helper in practice/proof/feedback, light + dark.

## Acceptance criteria

1. With `ANTHROPIC_API_KEY` set, the 5 user-facing helpers return real, persona-aware,
   beginner-safe, schema-valid coaching via Claude Haiku 4.5 (server-side).
2. With no key, behavior is identical to today (mock) — UI never breaks.
3. Off-brand or malformed model output never reaches the user (schema + brand validation
   → fallback).
4. The input safety pre-gate still blocks risky input before any model call.
5. `ANTHROPIC_API_KEY` is server-only; no secret reaches the browser; no cross-user data
   enters prompts.
6. `COLLECTIVE_PANEL`/demo-panel stays mock; existing agent logging unchanged (no-op
   without DB).
7. typecheck + build + the output-policy check are green.

## Known limitations / next

- Deterministic regex safety + output policy is a pragmatic filter, not a model-based
  classifier (declined for cost/latency). Revisit if real usage shows gaps.
- No streaming / prompt caching / cost analytics this pass.
- AI-generated practices, AI discovery, and a conversational coach are separate future
  brainstorms — enabled by this real-model foundation + the personalization signals.
- "People sharing knowledge" remains its own queued brainstorm.
