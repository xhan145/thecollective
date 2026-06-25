# Content Mastery System — Integration Design

**Date:** 2026-06-25
**Status:** Approved (brainstorm) → ready for implementation plan
**Scope:** Full integration of the Content Mastery System into the live `collective-web` app — schema, seed, read layer, UI, progression, trust, AI prep/reflection, and feed tags — in one spec.

## 1. Background & goal

We authored a Phase-1 **Content Mastery System** (`content/collective_content_mastery_seed.v1.json`): **6 directions × 4 skills × 5 mastery levels = 120 levels**, each carrying a practice prompt, proof requirement, structured feedback rubric, AI prep/reflection prompts, trust signal, and a `does_not_count_as_mastery` guard.

The goal is to make this the **content backbone** of `collective-web`, powering Discover, Direction detail, Practice, Proof, Feedback, Trust, AI prep/reflection, feed ranking, and user progression.

### Fixed level ladder
1. Try it · 2. Repeat it · 3. Explain it · 4. Apply it · 5. Help someone else with it

### Key decisions (from brainstorm)
- **Greenfield content:** no meaningful production user data; we can reseed freely. No backward-compat data migration needed.
- **One comprehensive spec** covering all layers.
- **Progression:** sequential ladder; a level is complete when its **proof is submitted** (beginner-safe, no quality gate, no waiting on peers). Submitting proof unlocks the next level. L5 unlocks after L4.
- **Architecture A — enrich `practices`:** add a `skills` table; each level becomes a `practices` row carrying `skill_id`, `level_number`, and the rich mastery fields, addressed by a stable slug `prompt_id`. Reuses all existing proof/completion/trust/AI machinery.

## 2. Existing system (as discovered)

- Content lives in `directions` + `practices` (migration 013/017): currently **3 directions, flat practices, no skills/levels.**
- The whole app addresses content by **free-text string ids**: `proofs.prompt_id`/`direction_id` (text), `practice_completions(user_id, prompt_id)`, `practice_tips.prompt_id`, `ai_interactions.prompt_id`. There are **no FKs** from these to content — addressing is by string.
- `contentRepository.loadContent()` maps `directions`+`practices` → app `Direction`/`PracticePrompt` types, with a `lib/betaData.ts` in-app fallback when the tables are empty/unreachable. Route is `/practice/[promptId]`.
- **Trust** (023/027): event-based `trust_events(type, points, label, source_id)`, capped 3/type/day. Types & points: `proof`=5, `practice`=5, plus `peer-feedback`, `helpful`, `accepted-contribution`. RPCs: `record_proof_trust(proof_id)`, `record_practice_trust(prompt_id text)`, `record_feedback_trust(feedback_id)`. Pillars: practice = practice+proof; feedback = peer-feedback+helpful; contribution = accepted-contribution.
- **Feedback** (015): `feedback(proof_id, author_id, recipient_id, body, tone, helpful)` — freeform, attached to a proof.

This string-keyed, event-based design means the rich model integrates **additively**: each level becomes an addressable practice with a stable `prompt_id`, and existing systems keep working untouched.

## 3. Data model

### 3.1 New migration `030_content_mastery.sql` (additive)

**`skills` table** (the missing tier between directions and practices):
```sql
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.directions(id) on delete cascade,
  slug text not null,                 -- e.g. 'speaking-clearly'
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (direction_id, slug)
);
create index if not exists skills_direction_idx on public.skills(direction_id);

alter table public.skills enable row level security;
drop policy if exists "skills_read_active" on public.skills;
create policy "skills_read_active" on public.skills
  for select to anon, authenticated using (is_active = true);
```

**Extend `practices` (each row = one level):**
```sql
alter table public.practices
  add column if not exists skill_id uuid references public.skills(id) on delete cascade,
  add column if not exists slug text,                    -- stable prompt_id, see 3.2
  add column if not exists level_number integer,         -- 1..5
  add column if not exists level_name text,              -- 'Try it' .. 'Help someone else with it'
  add column if not exists mastery_goal text,
  add column if not exists proof_type text check (proof_type in ('text','image','video','audio','mixed')),
  add column if not exists feedback_rubric jsonb,        -- {clarity, effort, usefulness, next_step}
  add column if not exists ai_prep_prompt text,
  add column if not exists ai_reflection_prompt text,
  add column if not exists next_step text,
  add column if not exists trust_signal text,
  add column if not exists does_not_count_as_mastery text,
  add column if not exists safety_note text,
  add column if not exists difficulty text,
  add column if not exists feed_tags text[] not null default '{}';

create unique index if not exists practices_slug_uidx on public.practices(slug);
create unique index if not exists practices_skill_level_uidx on public.practices(skill_id, level_number);
```

**Column mapping (seed field → practices column):**
| Seed field | Column |
|---|---|
| `practice_prompt` | `instructions` |
| `proof_requirement` | `proof_prompt` |
| `mastery_goal` | `mastery_goal`, also → `description` |
| `estimated_minutes` | `estimated_minutes` |
| _(composed)_ | `title` = `"<skill_name> — <level_name>"` (e.g. "Speaking Clearly — Try it") |
| everything else | the new columns above |

**Title uniqueness constraint:** the `practices` table already has `unique (direction_id, title)` (migration 013). Because `level_name` ("Try it" …) repeats once per skill within a direction, `title` **must** be composed as `"<skill_name> — <level_name>"`, which is unique across a direction's 20 levels and satisfies the existing constraint without altering it. `level_name` and `skill` remain available separately as their own columns for display.

**Feedback rubric capture (small additive change):**
```sql
alter table public.feedback
  add column if not exists rubric jsonb;   -- optional structured {clarity,effort,usefulness,next_step}; freeform body still primary
```

**Feed tags on proofs (denormalized for ranking):**
```sql
alter table public.proofs
  add column if not exists tags text[] not null default '{}';  -- copied from the level's feed_tags at submission
```

### 3.2 Stable slug addressing

The app's `promptId` switches from the practice **uuid** to the level **`slug`** (e.g. `confident-communication.speaking-clearly.1`). `mapPractice` returns `id = row.slug`. Effects:
- `proofs.prompt_id`, `practice_completions.prompt_id`, `practice_tips.prompt_id`, `ai_interactions.prompt_id` all carry the legible slug.
- `/practice/[promptId]` URLs become human-readable and seed-stable.
- Greenfield → no existing references to migrate.

### 3.3 Direction reconciliation

Upsert the 6 seed directions: keep `confident-communication`; introduce `momentum-building`, `self-reflection`, `asking-better-questions`, `giving-useful-feedback`, `showing-proof-of-progress`. Set old `momentum`, `clearer-thinking` and their flat practices to `is_active = false` (non-destructive).

### 3.4 Seeding from one source of truth

`scripts/seed-content-mastery.ts` reads `content/collective_content_mastery_seed.v1.json` and idempotently upserts directions → skills → levels via the Supabase **service** client. Re-running reconciles content (upsert on `directions.slug`, `skills (direction_id, slug)`, `practices.slug`). The JSON stays canonical; we do **not** hand-write 120 SQL rows. The script also regenerates the `lib/betaData.ts` fallback from the same JSON.

## 4. Progression, completion & trust

- **Complete = proof submitted.** A level is complete when a `practice_completions(user_id, slug)` row exists. This already happens in the existing submit flow (`recordCompletion` upsert + `record_practice_trust`; proof submit + `record_proof_trust`). No new completion machinery.
- **Unlock rule (sequential):** level N unlocked iff `N == 1` OR completion exists for level `N-1` of the same skill. Computed from the already-loaded completion set, exposed as a per-skill progress helper `{ level, status: locked | available | complete }`. L5 unlocks after L4 by the same rule.
- **Server-side gate (defense in depth):** an RPC/endpoint that records a completion or accepts a proof for level N first verifies the `(user, level N-1)` completion exists; otherwise rejects. The ladder cannot be skipped via the API, not just the UI.
- **Trust reuses existing pillars (no new point types):**
  - Any level complete → `record_practice_trust(slug)` (+ `record_proof_trust` on the proof). Practice pillar.
  - L5's proof is feedback to another member → also `record_feedback_trust`. Feedback pillar.
  - The level's `trust_signal` string becomes the `trust_events.label` via an optional label param on the RPC. Daily caps unchanged.
- **Derived status (no extra tables):** "skill mastered" = all 5 levels complete; "direction progress" = N/20 complete. Computed in the read layer. (Optional future milestone event on full-skill mastery — out of scope unless requested.)

## 5. Read layer & UI

### 5.1 `contentRepository` + `betaTypes` (extend, not replace)
- `loadContent()` adds a `skills` query (active, ordered) → returns `{ directions, skills, prompts }`.
- `Direction` gains `skillIds[]`. New `Skill` type `{ id, slug, name, description, directionId, levelPromptIds[] }`. `PracticePrompt` gains `skillId, levelNumber, levelName, masteryGoal, proofType, feedbackRubric, aiPrepPrompt, aiReflectionPrompt, nextStep, trustSignal, doesNotCount, safetyNote, difficulty, feedTags[]`.
- `mapPractice` returns `id = row.slug`. `betaData.ts` fallback regenerated from seed JSON.

### 5.2 Screens
- **Discover / `app/directions`:** direction cards show `N/20 levels`; opening a direction lists its 4 skills with ladder dots (●○○○○).
- **Skill ladder** (direction detail view/section): the 5 levels as a vertical ladder with lock state — complete (✓), available (open), locked (hint "Complete *Try it* first"). Each shows `mastery_goal`, `estimated_minutes`, `difficulty`, `safety_note`.
- **Practice / `app/practice/[promptId]`:** renders one level — `instructions` (practice prompt), `proof_prompt` (proof requirement) constrained by `proof_type`, AI prep entry point, and a visible **"What doesn't count"** note (`does_not_count_as_mastery`). On submit → existing proof + completion flow → next level unlocks, `next_step` shown.

### 5.3 Feedback rubric surfacing
`feedback` stays freeform; the composer is **scaffolded** with the level's `feedback_rubric` (clarity / effort / usefulness / next_step) as guiding placeholders. Structured answers, when given, are stored in the new `feedback.rubric` jsonb; freeform `body` remains primary.

## 6. AI prep/reflection & feed tags

### 6.1 AI prep/reflection (support, never authority)
Each level's `ai_prep_prompt` / `ai_reflection_prompt` seed the existing AI interaction surface, keyed by the level `slug` (consistent with `ai_interactions`/`practice_tips`). **Hard guardrail:** the AI endpoints can read content and write **only** `ai_interactions` — no write path to `practice_completions`, `proofs`, or `trust_events`. AI helps prepare and reflect; people and proof decide completion and trust.

### 6.2 Feed tags / level-matched ranking
`feed_tags` live on each level and are denormalized onto the proof (`proofs.tags`) at submission. The feed uses tags + the viewer's own level on that skill to surface **level-matched** content — slightly ahead (learn from), same level (peers), behind (help them) — matching Collective's knowledge-transfer vision. No likes/followers/popularity ranking. (Integrates with the existing feed algorithm; see `docs/FEED_ALGORITHM.md`.)

## 7. Security, errors, testing, rollout

- **RLS:** `skills` read-active mirrors `directions`; new `practices` columns inherit existing practice RLS; `feedback.rubric` follows existing feedback policies; AI write-scope restricted per 6.1.
- **Errors:** content load failure falls back to regenerated seed (existing pattern). Locked-level proof/completion rejected server-side (§4 gate).
- **Testing:**
  1. seed script idempotency — re-run yields no dupes; counts 6 directions / 24 skills / 120 levels.
  2. unlock logic — locked/available/complete transitions, L1 always open, L5 after L4.
  3. server-side gate rejects out-of-order completion.
  4. trust fires once per level within daily caps; correct labels from `trust_signal`.
  5. AI endpoints cannot mutate completion/trust.
  6. feed surfaces level-matched tags.
- **Rollout:** migration `030` + seed script + read-layer/UI changes ship together (greenfield, no phased backfill). `betaData.ts` regenerated so nothing renders empty.

## 8. Out of scope / future
- Full-skill-mastery milestone trust event (optional).
- `get_skill_progress(uid)` server RPC if client-side progress computation becomes heavy.
- Phase-2+ directions and additional skills beyond the v1 seed.

## 9. Source artifacts
- `content/collective_content_mastery_seed.v1.json` — canonical content (120 levels).
- `content/collective_content_mastery_table.v1.md` — human-readable mirror (generated from the JSON).
