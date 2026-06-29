# Content Mastery — Plan 1: Schema & Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the database content backbone for the Content Mastery System — a `skills` table, level-enriched `practices`, and an idempotent seed loaded from the canonical JSON — so the DB holds exactly 6 directions, 24 skills, and 120 levels.

**Architecture:** Additive migration on the existing `directions`/`practices` model (Architecture A from the spec). A new `skills` tier sits between directions and practices; each of the 120 levels becomes a `practices` row carrying `skill_id`, `level_number`, and the rich mastery fields, addressed by a stable slug `prompt_id` like `confident-communication.speaking-clearly.1`. A `tsx` seed script reads the canonical JSON and upserts directions → skills → levels, then deactivates content not in the seed (greenfield reconciliation). All existing proof/completion/trust machinery keeps working untouched because it keys on the string `prompt_id`.

**Tech Stack:** Next.js (App Router), TypeScript, Supabase (Postgres + RLS), `@supabase/supabase-js` 2.105.4, `tsx`, `dotenv`. Migrations are plain `.sql` files in `supabase/migrations/`.

## Global Constraints

- Content lives in one source of truth: `content/collective_content_mastery_seed.v1.json`. Never hand-author the 120 rows in SQL.
- Exactly **6 directions × 4 skills × 5 levels = 120 levels**. Level numbers are 1–5 with fixed names: `Try it`, `Repeat it`, `Explain it`, `Apply it`, `Help someone else with it`.
- `proof_type` ∈ `{text, image, video, audio, mixed}`.
- Stable slug `prompt_id` format: `<direction_slug>.<skill_slug>.<level_number>`.
- `practices.title` MUST be composed as `"<skill_name> — <level_name>"` to satisfy the existing `unique (direction_id, title)` constraint (level names repeat per skill within a direction).
- Greenfield: reseed freely; reconciliation deactivates (never deletes) content not in the seed.
- Beginner-safe copy only. Never introduce the words: viral, followers, likes, influencer, leaderboard, crush it, dominate, elite, or shame-based streak language.
- Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is server-only; never `NEXT_PUBLIC`. Seed scripts must refuse to write without it.

## File Structure

- `content/collective_content_mastery_seed.v1.json` — **Create.** Canonical content vendored into the repo (copied from the authored artifact).
- `scripts/check-content-seed.ts` — **Create.** Offline validator: asserts the JSON's shape and 6/24/120 counts. No DB needed.
- `supabase/migrations/030_content_mastery.sql` — **Create.** Structural migration: `skills` table + RLS, new `practices` columns + indexes, `feedback.rubric`, `proofs.tags`.
- `scripts/seed-content-mastery.ts` — **Create.** Idempotent seed + reconciliation from the JSON.
- `scripts/check-content-mastery.ts` — **Create.** Integration check: queries the DB and asserts the seeded state.
- `package.json` — **Modify.** Add `content:check`, `content:seed`, `content:seed:dry`, `content:verify` scripts.

---

### Task 1: Vendor the canonical seed JSON + offline validator

**Files:**
- Create: `content/collective_content_mastery_seed.v1.json`
- Create: `scripts/check-content-seed.ts`
- Modify: `package.json` (add `content:check` script)

**Interfaces:**
- Consumes: nothing.
- Produces: the canonical seed file at `content/collective_content_mastery_seed.v1.json` and an `npm run content:check` command that exits non-zero on a malformed seed. Later tasks read this exact path.

- [ ] **Step 1: Write the failing test (the validator)**

Create `scripts/check-content-seed.ts`:

```ts
/**
 * Offline validator for the Content Mastery seed JSON.
 * Asserts structure + 6/24/120 counts and required fields. No DB required.
 * Run: npm run content:check
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROOF_TYPES = new Set(["text", "image", "video", "audio", "mixed"]);
const LEVEL_NAMES = ["Try it", "Repeat it", "Explain it", "Apply it", "Help someone else with it"];

type Level = {
  level_number: number; level_name: string; mastery_goal: string;
  practice_prompt: string; proof_requirement: string; proof_type: string;
  feedback_rubric: { clarity: string; effort: string; usefulness: string; next_step: string };
  ai_prep_prompt: string; ai_reflection_prompt: string; next_step: string;
  trust_signal: string; estimated_minutes: number; difficulty: string;
  safety_note: string; does_not_count_as_mastery: string; feed_tags: string[];
};
type Skill = { skill_slug: string; skill_name: string; description: string; levels: Level[] };
type Direction = { direction_slug: string; direction_name: string; description: string; skills: Skill[] };
type Seed = { version: string; directions: Direction[] };

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

const path = resolve(process.cwd(), "content/collective_content_mastery_seed.v1.json");
const seed = JSON.parse(readFileSync(path, "utf8")) as Seed;

let skills = 0;
let levels = 0;
const slugs = new Set<string>();

if (seed.directions.length !== 6) fail(`expected 6 directions, got ${seed.directions.length}`);

for (const d of seed.directions) {
  if (!d.direction_slug || !d.direction_name) fail(`direction missing slug/name`);
  if (d.skills.length !== 4) fail(`direction ${d.direction_slug}: expected 4 skills, got ${d.skills.length}`);
  for (const s of d.skills) {
    skills++;
    if (!s.skill_slug || !s.skill_name) fail(`skill missing slug/name in ${d.direction_slug}`);
    if (s.levels.length !== 5) fail(`skill ${s.skill_slug}: expected 5 levels, got ${s.levels.length}`);
    s.levels.forEach((lv, i) => {
      levels++;
      const where = `${d.direction_slug}.${s.skill_slug}.${lv.level_number}`;
      if (lv.level_number !== i + 1) fail(`${where}: level_number should be ${i + 1}`);
      if (lv.level_name !== LEVEL_NAMES[i]) fail(`${where}: level_name should be "${LEVEL_NAMES[i]}"`);
      if (!PROOF_TYPES.has(lv.proof_type)) fail(`${where}: bad proof_type "${lv.proof_type}"`);
      for (const f of ["mastery_goal", "practice_prompt", "proof_requirement", "ai_prep_prompt", "ai_reflection_prompt", "next_step", "trust_signal", "safety_note", "does_not_count_as_mastery"] as const) {
        if (!lv[f] || String(lv[f]).trim() === "") fail(`${where}: empty ${f}`);
      }
      for (const r of ["clarity", "effort", "usefulness", "next_step"] as const) {
        if (!lv.feedback_rubric?.[r]) fail(`${where}: missing feedback_rubric.${r}`);
      }
      if (typeof lv.estimated_minutes !== "number" || lv.estimated_minutes < 2 || lv.estimated_minutes > 15) {
        fail(`${where}: estimated_minutes must be 2..15, got ${lv.estimated_minutes}`);
      }
      const slug = `${d.direction_slug}.${s.skill_slug}.${lv.level_number}`;
      if (slugs.has(slug)) fail(`duplicate slug ${slug}`);
      slugs.add(slug);
    });
  }
}

if (skills !== 24) fail(`expected 24 skills, got ${skills}`);
if (levels !== 120) fail(`expected 120 levels, got ${levels}`);

console.log(`OK: ${seed.directions.length} directions, ${skills} skills, ${levels} levels (version ${seed.version})`);
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"`:

```json
"content:check": "tsx scripts/check-content-seed.ts",
```

- [ ] **Step 3: Run the validator to verify it fails (no seed file yet)**

Run: `npm run content:check`
Expected: FAIL — throws `ENOENT` because `content/collective_content_mastery_seed.v1.json` does not exist yet.

- [ ] **Step 4: Vendor the canonical seed into the repo**

Copy the authored artifact into the repo (it currently lives outside it):

```bash
mkdir -p content
cp ~/content/collective_content_mastery_seed.v1.json content/collective_content_mastery_seed.v1.json
```

(If `~/content/collective_content_mastery_seed.v1.json` is unavailable, regenerate it from the source of truth used in `content/collective_content_mastery_table.v1.md` — but the JSON is the canonical artifact and should be copied as-is.)

- [ ] **Step 5: Run the validator to verify it passes**

Run: `npm run content:check`
Expected: PASS — prints `OK: 6 directions, 24 skills, 120 levels (version 1.0.0)`

- [ ] **Step 6: Commit**

```bash
git add content/collective_content_mastery_seed.v1.json scripts/check-content-seed.ts package.json
git commit -m "feat(content): vendor content-mastery seed JSON + offline validator"
```

---

### Task 2: Migration 030 — skills table & enriched practices

**Files:**
- Create: `supabase/migrations/030_content_mastery.sql`

**Interfaces:**
- Consumes: existing `public.directions`, `public.practices`, `public.feedback`, `public.proofs` tables (migrations 010–029).
- Produces: `public.skills` table; new columns on `practices` (`skill_id, slug, level_number, level_name, mastery_goal, proof_type, feedback_rubric, ai_prep_prompt, ai_reflection_prompt, next_step, trust_signal, does_not_count_as_mastery, safety_note, difficulty, feed_tags`); `practices_slug_uidx` and `practices_skill_level_uidx` unique indexes; `feedback.rubric jsonb`; `proofs.tags text[]`. Task 3's seed script writes to all of these.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/030_content_mastery.sql`:

```sql
-- Collective — Content Mastery System schema (Architecture A).
-- Additive: run after 010-029. Adds a skills tier and enriches practices so
-- each row is a mastery level. All addressing stays string-based on prompt_id
-- (= practices.slug), so existing proofs/completions/trust/tips/AI are unaffected.

create extension if not exists "pgcrypto";

-- 1) skills: the tier between directions and practices.
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.directions(id) on delete cascade,
  slug text not null,
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

-- 2) practices: each row becomes a mastery level.
alter table public.practices
  add column if not exists skill_id uuid references public.skills(id) on delete cascade,
  add column if not exists slug text,
  add column if not exists level_number integer,
  add column if not exists level_name text,
  add column if not exists mastery_goal text,
  add column if not exists proof_type text
    check (proof_type in ('text','image','video','audio','mixed')),
  add column if not exists feedback_rubric jsonb,
  add column if not exists ai_prep_prompt text,
  add column if not exists ai_reflection_prompt text,
  add column if not exists next_step text,
  add column if not exists trust_signal text,
  add column if not exists does_not_count_as_mastery text,
  add column if not exists safety_note text,
  add column if not exists difficulty text,
  add column if not exists feed_tags text[] not null default '{}';

create unique index if not exists practices_slug_uidx
  on public.practices(slug) where slug is not null;
create unique index if not exists practices_skill_level_uidx
  on public.practices(skill_id, level_number) where skill_id is not null;

-- 3) feedback: optional structured rubric capture (freeform body stays primary).
alter table public.feedback
  add column if not exists rubric jsonb;

-- 4) proofs: denormalized feed tags copied from the level at submission.
alter table public.proofs
  add column if not exists tags text[] not null default '{}';
```

- [ ] **Step 2: Apply the migration**

Apply `030_content_mastery.sql` to the Supabase project using the project's normal path — Supabase CLI (`supabase db push`), the Supabase SQL editor (paste the file), or the connected Supabase MCP `apply_migration`. Use the same target the previous migrations (029) were applied to.

- [ ] **Step 3: Verify the schema (the test)**

Run this verification query against the database (SQL editor / `psql` / MCP `execute_sql`):

```sql
select
  (select count(*) from information_schema.tables
     where table_schema='public' and table_name='skills') as has_skills,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='practices'
       and column_name in ('skill_id','slug','level_number','level_name','mastery_goal',
         'proof_type','feedback_rubric','ai_prep_prompt','ai_reflection_prompt','next_step',
         'trust_signal','does_not_count_as_mastery','safety_note','difficulty','feed_tags')) as practice_cols,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='feedback' and column_name='rubric') as has_feedback_rubric,
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='proofs' and column_name='tags') as has_proofs_tags;
```

Expected: one row → `has_skills=1`, `practice_cols=15`, `has_feedback_rubric=1`, `has_proofs_tags=1`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/030_content_mastery.sql
git commit -m "feat(db): migration 030 — skills table + level-enriched practices"
```

---

### Task 3: Seed + reconciliation script with DB verification

**Files:**
- Create: `scripts/seed-content-mastery.ts`
- Create: `scripts/check-content-mastery.ts`
- Modify: `package.json` (add `content:seed`, `content:seed:dry`, `content:verify`)

**Interfaces:**
- Consumes: `content/collective_content_mastery_seed.v1.json` (Task 1); the `skills` table and enriched `practices` columns (Task 2); env `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Produces: a seeded database — 6 active directions, 24 skills, 120 active level-practices keyed by slug — and an `npm run content:verify` command asserting that state. This is the foundation Plan 2 (read layer) loads from.

- [ ] **Step 1: Write the failing test (DB verifier)**

Create `scripts/check-content-mastery.ts`:

```ts
/**
 * Integration check: verifies the Content Mastery seed landed in Supabase.
 * Asserts 6 active directions, 24 skills, 120 active level-practices with
 * slug + skill_id + level_number, and that legacy directions are deactivated.
 * Run: npm run content:verify
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

async function main() {
  if (!URL || !SERVICE_KEY) fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  const db = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const activeDirs = await db.from("directions").select("slug").eq("is_active", true);
  if (activeDirs.error) fail(activeDirs.error.message);
  if (activeDirs.data!.length !== 6) fail(`expected 6 active directions, got ${activeDirs.data!.length}`);

  const skills = await db.from("skills").select("id").eq("is_active", true);
  if (skills.error) fail(skills.error.message);
  if (skills.data!.length !== 24) fail(`expected 24 skills, got ${skills.data!.length}`);

  const levels = await db.from("practices")
    .select("slug,skill_id,level_number")
    .eq("is_active", true)
    .not("slug", "is", null);
  if (levels.error) fail(levels.error.message);
  if (levels.data!.length !== 120) fail(`expected 120 active level-practices, got ${levels.data!.length}`);
  for (const p of levels.data!) {
    if (!p.skill_id) fail(`practice ${p.slug} has no skill_id`);
    if (!p.level_number || p.level_number < 1 || p.level_number > 5) fail(`practice ${p.slug} bad level_number ${p.level_number}`);
  }

  const legacy = await db.from("directions").select("slug,is_active").in("slug", ["momentum", "clearer-thinking"]);
  if (legacy.error) fail(legacy.error.message);
  for (const d of legacy.data!) {
    if (d.is_active) fail(`legacy direction ${d.slug} should be deactivated`);
  }

  console.log("OK: 6 directions, 24 skills, 120 levels seeded; legacy directions deactivated.");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Add npm scripts**

In `package.json`, add to `"scripts"`:

```json
"content:seed": "tsx scripts/seed-content-mastery.ts",
"content:seed:dry": "tsx scripts/seed-content-mastery.ts --dry-run",
"content:verify": "tsx scripts/check-content-mastery.ts",
```

- [ ] **Step 3: Run the verifier to confirm it fails (nothing seeded yet)**

Run: `npm run content:verify`
Expected: FAIL — `expected 6 active directions, got 3` (only the legacy `confident-communication`, `momentum`, `clearer-thinking` exist).

- [ ] **Step 4: Write the seed + reconciliation script**

Create `scripts/seed-content-mastery.ts`:

```ts
/**
 * Collective — Content Mastery seed.
 * Idempotently upserts directions -> skills -> levels (as practices) from the
 * canonical JSON, then deactivates content not in the seed (greenfield
 * reconciliation). Addressing is stable: practices.slug = prompt_id.
 *
 * Usage:
 *   npm run content:seed:dry   # plan only, no writes, no key required
 *   npm run content:seed       # writes (needs SUPABASE_SERVICE_ROLE_KEY)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnv({ path: ".env.local" });
loadEnv();

const DRY = process.argv.slice(2).includes("--dry-run");
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

type Level = {
  level_number: number; level_name: string; mastery_goal: string;
  practice_prompt: string; proof_requirement: string; proof_type: string;
  feedback_rubric: Record<string, string>;
  ai_prep_prompt: string; ai_reflection_prompt: string; next_step: string;
  trust_signal: string; estimated_minutes: number; difficulty: string;
  safety_note: string; does_not_count_as_mastery: string; feed_tags: string[];
};
type Skill = { skill_slug: string; skill_name: string; description: string; levels: Level[] };
type Direction = { direction_slug: string; direction_name: string; description: string; skills: Skill[] };
type Seed = { directions: Direction[] };

function admin(): SupabaseClient {
  if (!URL || !SERVICE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Service role key is required for writes.");
  }
  return createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const path = resolve(process.cwd(), "content/collective_content_mastery_seed.v1.json");
  const seed = JSON.parse(readFileSync(path, "utf8")) as Seed;

  const dirCount = seed.directions.length;
  const skillCount = seed.directions.reduce((n, d) => n + d.skills.length, 0);
  const levelCount = seed.directions.reduce((n, d) => n + d.skills.reduce((m, s) => m + s.levels.length, 0), 0);
  console.log(`Plan: ${dirCount} directions, ${skillCount} skills, ${levelCount} levels`);
  if (DRY) { console.log("Dry run — no writes."); return; }

  const db = admin();
  const dirSlugs: string[] = [];
  const levelSlugs: string[] = [];

  for (let di = 0; di < seed.directions.length; di++) {
    const d = seed.directions[di];
    dirSlugs.push(d.direction_slug);

    const dir = await db.from("directions").upsert(
      { slug: d.direction_slug, title: d.direction_name, description: d.description, is_active: true, sort_order: di },
      { onConflict: "slug" }
    ).select("id").single();
    if (dir.error) throw dir.error;
    const directionId = dir.data!.id as string;

    for (let si = 0; si < d.skills.length; si++) {
      const s = d.skills[si];
      const sk = await db.from("skills").upsert(
        { direction_id: directionId, slug: s.skill_slug, name: s.skill_name, description: s.description, is_active: true, sort_order: si },
        { onConflict: "direction_id,slug" }
      ).select("id").single();
      if (sk.error) throw sk.error;
      const skillId = sk.data!.id as string;

      for (const lv of s.levels) {
        const slug = `${d.direction_slug}.${s.skill_slug}.${lv.level_number}`;
        levelSlugs.push(slug);
        const pr = await db.from("practices").upsert(
          {
            direction_id: directionId,
            skill_id: skillId,
            slug,
            title: `${s.skill_name} — ${lv.level_name}`,
            description: lv.mastery_goal,
            instructions: lv.practice_prompt,
            proof_prompt: lv.proof_requirement,
            estimated_minutes: lv.estimated_minutes,
            level_number: lv.level_number,
            level_name: lv.level_name,
            mastery_goal: lv.mastery_goal,
            proof_type: lv.proof_type,
            feedback_rubric: lv.feedback_rubric,
            ai_prep_prompt: lv.ai_prep_prompt,
            ai_reflection_prompt: lv.ai_reflection_prompt,
            next_step: lv.next_step,
            trust_signal: lv.trust_signal,
            does_not_count_as_mastery: lv.does_not_count_as_mastery,
            safety_note: lv.safety_note,
            difficulty: lv.difficulty,
            feed_tags: lv.feed_tags,
            is_active: true,
          },
          { onConflict: "slug" }
        );
        if (pr.error) throw pr.error;
      }
    }
  }

  // Reconcile: deactivate directions not in the seed.
  const inList = `(${dirSlugs.map((s) => `"${s}"`).join(",")})`;
  const dDeact = await db.from("directions").update({ is_active: false }).not("slug", "in", inList);
  if (dDeact.error) throw dDeact.error;

  // Reconcile: deactivate practices not in the seed (legacy flat practices have slug = null).
  const all = await db.from("practices").select("id,slug");
  if (all.error) throw all.error;
  const keep = new Set(levelSlugs);
  const stale = (all.data ?? []).filter((p) => !p.slug || !keep.has(p.slug)).map((p) => p.id);
  if (stale.length) {
    const pDeact = await db.from("practices").update({ is_active: false }).in("id", stale);
    if (pDeact.error) throw pDeact.error;
  }

  console.log(`Seeded ${dirSlugs.length} directions, ${skillCount} skills, ${levelSlugs.length} levels. Deactivated ${stale.length} stale practices.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 5: Dry-run the seed (no writes)**

Run: `npm run content:seed:dry`
Expected: prints `Plan: 6 directions, 24 skills, 120 levels` then `Dry run — no writes.`

- [ ] **Step 6: Run the seed**

Run: `npm run content:seed`
Expected: prints `Seeded 6 directions, 24 skills, 120 levels. Deactivated N stale practices.` (N ≥ 9 — the legacy flat practices).

- [ ] **Step 7: Run the verifier to confirm it passes**

Run: `npm run content:verify`
Expected: PASS — `OK: 6 directions, 24 skills, 120 levels seeded; legacy directions deactivated.`

- [ ] **Step 8: Re-run the seed to prove idempotency**

Run: `npm run content:seed && npm run content:verify`
Expected: both succeed; counts unchanged (still 6/24/120) — no duplicates created.

- [ ] **Step 9: Commit**

```bash
git add scripts/seed-content-mastery.ts scripts/check-content-mastery.ts package.json
git commit -m "feat(content): idempotent content-mastery seed + reconciliation + DB verify"
```

---

## Execution Note (migration 031)

During execution, the seed failed with Postgres `42P10` because the slug unique index in Task 2 was created **partial** (`... where slug is not null`), and the seed's `upsert({ onConflict: "slug" })` goes through PostgREST, which cannot express a partial index's predicate for `ON CONFLICT` inference. Fix: a follow-up migration `supabase/migrations/031_content_mastery_slug_index_fix.sql` drops the partial index and recreates `practices_slug_uidx` as a **full** unique index on `slug` (a full unique index on a nullable column still allows the legacy NULL-slug rows, since NULLs are distinct). After 031, the seed and verify pass. On a fresh database, apply `030` then `031`.

## Self-Review

**Spec coverage (Plan 1 portion):** §3.1 skills table ✓ (Task 2). §3.1 practices columns ✓ (Task 2). §3.1 feedback.rubric + proofs.tags ✓ (Task 2). §3.2 stable slug addressing ✓ (Task 3 composes `<dir>.<skill>.<level>`). §3.3 direction reconciliation ✓ (Task 3 deactivates non-seed directions). §3.4 seed from one source of truth ✓ (Tasks 1+3). Title-uniqueness constraint ✓ (Task 3 composes `"<skill_name> — <level_name>"`). Read layer, betaData regeneration, progression/unlock, trust, AI, feed — intentionally **deferred to Plans 2–4** (they depend on `betaTypes` changes and runtime wiring).

**Placeholder scan:** No TBD/TODO; every code step contains complete, runnable code; every run step states expected output. ✓

**Type consistency:** `slug` format identical in seed script and verifier (`<dir>.<skill>.<level>`). The `Level`/`Skill`/`Direction` types match the JSON shape used by both `check-content-seed.ts` and `seed-content-mastery.ts`. Column names in the migration exactly match the keys written by the seed (`mastery_goal`, `proof_type`, `feedback_rubric`, `ai_prep_prompt`, `ai_reflection_prompt`, `next_step`, `trust_signal`, `does_not_count_as_mastery`, `safety_note`, `difficulty`, `feed_tags`). ✓

## Next plans (not in this document)
- **Plan 2 — Read layer & skill-ladder UI:** extend `contentRepository`/`betaTypes`, add `Skill` type, regenerate `betaData.ts` fallback, Discover progress, skill ladder with lock state, level-aware practice page.
- **Plan 3 — Progression, server gate & trust mapping:** completion/unlock helper, server-side out-of-order gate, `trust_signal` → event label.
- **Plan 4 — Feedback rubric, AI prep/reflection & feed tags:** rubric-scaffolded composer + `feedback.rubric`, AI surface seeding with write-wall, `proofs.tags` denormalization + level-matched ranking.
