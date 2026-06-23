# Collective AI Lab v0 Handoff

## Repo shape detected

- Framework: Next.js App Router with React 19 and TypeScript.
- Supabase client: `lib/supabase/client.ts` for browser anon access.
- Supabase repositories: `lib/supabase/betaRepository.ts` and `lib/supabase/contentRepository.ts`.
- Server Supabase helper added: `lib/supabase/server.ts` for service-role-only AI Lab logging.
- Migration folder: `supabase/migrations`.
- Storage usage: `collective-proof-media` bucket through existing proof attachment helpers.
- Existing AI route: `app/api/ai/collective/route.ts`.
- Existing AI service: `lib/aiService.ts` with mock mode, remote endpoint mode, and current helpers.
- Existing logging tables: `ai_interactions` and `ai_user_feedback` already existed in migration `010`.
- Product areas already present: proof submission, peer feedback, trust events, feed ranking, demo seed data, app feedback review, admin page, notifications, saved items, useful marks, and learn-from connections.

## Files added

- `lib/ai/agents/practice-coach.ts`
- `lib/ai/agents/reflection-helper.ts`
- `lib/ai/agents/feedback-coach.ts`
- `lib/ai/agents/safety-reviewer.ts`
- `lib/ai/agents/summary-composer.ts`
- `lib/ai/safety.ts`
- `lib/ai/collective-orchestrator.ts`
- `lib/supabase/server.ts`
- `supabase/migrations/021_ai_lab_v0.sql`
- `scripts/ai/evaluate-golden.ts`
- `scripts/ai/ingest-public-datasets.ts`
- `ai/golden/*.jsonl`
- `docs/CLAUDE_AI_LAB_HANDOFF.md`

## Files changed

- `lib/aiTypes.ts`
- `lib/aiService.ts`
- `app/api/ai/collective/route.ts`
- `app/practice/page.tsx`
- `app/proof/new/[promptId]/page.tsx`
- `app/proof/[id]/page.tsx`
- `app/proof/[id]/feedback/page.tsx`
- `app/feed/page.tsx`
- `components/beta/ProofComponents.tsx`
- `lib/feedAlgorithm.ts`
- `lib/betaData.ts`
- `lib/supabase/betaRepository.ts`
- `scripts/seed-demo-data.ts`
- `.env.example`
- `package.json`

## Existing systems extended

- Extended the existing `AiService` instead of replacing it.
- Extended the existing `/api/ai/collective` route instead of creating a new route.
- Kept existing mock mode as the default fallback.
- Kept `ai_interactions` and `ai_user_feedback` as the user-facing AI tables.
- Reused the existing demo proof/feed system instead of creating parallel demo persona/activity tables.

## AI route behavior

The route now supports both request shapes:

```json
{ "action": "generate_practice", "input": {} }
```

and the older feature shape:

```json
{ "feature": "PRACTICE_PREP", "input": {} }
```

New action responses return:

```json
{
  "ok": true,
  "action": "generate_practice",
  "result": {},
  "safety": { "status": "ok", "needs_human_review": false }
}
```

Old feature callers still receive the bare `AiResponse` object.

## Mock mode

Mock mode still works without any paid AI key. `lib/aiService.ts` remains the client-facing service. The orchestrator uses deterministic mock helpers, runs safety first, and does not expose chain-of-thought or unsafe debug output.

## Supabase logging

- `ai_agent_runs` stores internal agent steps when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present on the server.
- `ai_interactions` remains the user-facing log. Server-side logging skips non-UUID demo users to avoid failed foreign keys.
- Service-role access is isolated to `lib/supabase/server.ts`; do not import that file into client components.

## Demo activity labels

- Demo proofs are labeled `Example`.
- Feed fallback shows real proofs first.
- Demo examples only fill the feed when real proof count is below 8.
- Demo trust events now use `points = 0`.
- Demo proof cards do not expose `Useful`, `Learn from`, peer-note, or feedback actions.

## Eval commands

```bash
npm run ai:evaluate
```

This loads `ai/golden/*.jsonl`, uses mock mode by default, runs simple rubric checks, prints totals, and writes to `ai_eval_runs` only when server Supabase credentials exist.

```bash
npm run ai:ingest -- --source oasst1 --sample ./sample.jsonl --limit 20
npm run ai:ingest -- --source oasst1 --sample ./sample.jsonl --limit 20 --write
```

The ingestion script does not download large datasets. It normalizes local samples only. `approved_for_eval` defaults to `true`; `approved_for_training` defaults to `false`.

## What Claude should work on next

- Add a real model provider behind `collective-orchestrator.ts` after choosing the production model and prompt storage plan.
- Add an admin-only screen for reviewing `ai_golden_examples`, `ai_dataset_examples`, and `ai_eval_runs`.
- Add migration/application docs for applying `021_ai_lab_v0.sql` in Supabase.
- Consider generated TypeScript database types once the schema stabilizes.

## What not to overwrite

- Do not create a second AI route or AI service.
- Do not recreate `ai_interactions` or `ai_user_feedback`.
- Do not add demo activity that looks like real member activity.
- Do not give demo content trust points or ranking boosts.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Do not make AI assign trust, confidence, worth, skill, identity, or contribution.
