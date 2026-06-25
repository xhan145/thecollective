# Knowledge Tips — practice-anchored knowledge sharing (design)

Date: 2026-06-24
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind + Supabase)

## Problem

The product is built around knowledge transfer, but today you only learn from other
members' *proofs* (evidence of their own practice). There's no way to deliberately **share
what helped** — a teaching artifact distinct from "here's proof I practiced." This is the
parked "people sharing knowledge" ask. We add lightweight, practice-anchored **tips**: a
short "what helped me" note a member can attach to a practice they've done, so the next
learner sees credible, in-context advice. Stays anti-clout, beginner-safe, earned-not-farmed.

## Decisions (locked during brainstorm)

- **Unit:** a lightweight **text tip** (≤280 chars) attached to one practice. Text-only for v1.
- **Author gate:** you can tip a practice **only if you've completed it** (earned credibility;
  beginner-inclusive — no trust-tier wall).
- **Trust fit:** tips earn under **Contribution**, usefulness-gated — submit `+1` (daily-capped),
  marked-useful `+6` once (mirrors Trust V2 feedback-on-helpful; can't be farmed).
- **Discovery:** a "Tips from people who've done this" section **on the practice screen**,
  ranked by author level × usefulness. (Feed/library are later.)
- **Safety:** layered — deterministic regex pre-gate **+** AI moderation on submit, plus a
  Report action → admin review.
- Additive migration; 010–027 untouched; all trust writes via RPC/trigger (no client minting).

## Data model — migration `028_knowledge_tips.sql` (additive; after 027)

- **`practice_tips`**: `id uuid pk`, `prompt_id text not null` (the practice), `author_id uuid not null references profiles(id) on delete cascade`, `body text not null check (char_length(body) <= 280)`, `is_demo boolean not null default false`, `demo_cohort text`, `demo_seed_id text`, `created_at timestamptz not null default now()`. Index `(prompt_id, created_at desc)`; partial unique on `demo_seed_id`.
- **RLS:** enable. Read: any authenticated member (`using (true)` for authenticated — tips are for all learners). Insert: **denied to clients** (`with check (false)`) — only the `submit_tip` SECURITY-DEFINER RPC (which enforces the author gate) and service role write. Update/delete: own (`author_id = auth.uid()`).
- **`tip_reports`**: `id uuid pk`, `tip_id uuid references practice_tips(id) on delete cascade`, `reporter_id uuid references profiles(id)`, `reason text`, `created_at timestamptz default now()`. RLS: insert own report (`reporter_id = auth.uid()`); read none for clients (admin reads via service role).
- Extend `useful_marks.target_type` check to allow `'tip'` (currently `'proof'`-only): drop+recreate the check constraint to `in ('proof','tip')`.

## Trust integration (extends V2; migration 028)

- Two new trust event types so submit and usefulness are separate, farm-resistant signals:
  `_trust_points` += `when 'tip-submit' then 1` and `when 'useful-tip' then 6`.
- New SECURITY-DEFINER RPC `submit_tip(p_prompt_id text, p_body text) returns uuid`:
  validates the author completed the practice (`exists` in `practice_completions` for
  `auth.uid()` + `p_prompt_id`, OR a submitted proof), inserts the tip, then credits the author a
  capped submit point via `_insert_trust_capped(auth.uid(), 'tip-submit', 'Shared a tip', tip_id::text, 5)`
  (so the submit reward is `+1`, capped 5/day). The marked-useful reward (`useful-tip` `+6`,
  once) is credited by the trigger below. The V2 recompute folds **both** `tip-submit` and
  `useful-tip` into the **Contribution** dimension.
- **Marked-useful credit via trigger:** an `after insert on useful_marks` trigger, when
  `new.target_type = 'tip'`, credits the tip's author one-time `useful-tip` (idempotent via the
  `(user_id,type,source_id)` unique index, `source_id = tip_id`) and recomputes the author. A
  guard prevents marking your own tip useful (the `useful_marks` insert path checks
  `target user <> author`). The trigger runs as definer → clients still cannot mint trust.
- Update the V2 Contribution computation in `_recompute_profile_counts` to:
  `contribution_trust = Σ points where type in ('accepted-contribution','tip-submit','useful-tip')`.
- Helpers/RPCs revoked from `public, anon, authenticated`; `submit_tip` granted to `authenticated`.

## API & safety pipeline — `app/api/tips/route.ts` (`runtime = "nodejs"`)

`POST { promptId, body }`:
1. `getAuthedUser(req)` → 401 if none.
2. Author gate (service client): completion/proof exists for `(user, promptId)` → else 403.
3. **Regex pre-gate (A):** `coachSafetyPrecheck(body)` (reuse `lib/coach/coachPolicy`); not ok →
   400 with the calm redirect message, no insert.
4. **AI moderation (B):** OpenAI moderation endpoint + `assertBrandSafe(body)`; flagged → 400.
   **Graceful:** if `OPENAI_API_KEY` absent, skip this layer (regex still applied).
5. Call `submit_tip(promptId, body)` (RPC, runs the author gate again + inserts + credits) →
   return the created tip row (mapped).

`POST /api/tips/report { tipId, reason }` → insert a `tip_reports` row (or a `report_tip` RPC).
(Useful toggling reuses the existing `toggleUseful` / `useful_marks` path with `target_type:'tip'`.)

## Types / repository / provider

- `lib/tips/types.ts`: `PracticeTip = { id, promptId, authorId, body, isDemo, createdAt }`.
- `lib/supabase/tipsRepository.ts`: `mapTip`, `listTips(client, promptId)`, `submitTip(...)` (calls the route or RPC), mappers.
- `lib/tips/rankTips.ts` (pure): `rankTips(viewer, tips, authorsById, usefulCountByTip)` →
  ordered by `authorLevelRank × w + min(usefulCount,5)×w`, real before demo, own excluded,
  recency tiebreak (mirrors `rankProofFeed`).
- Provider: add `practiceTips` + `usefulCountByTip` to the snapshot; `getTipsForPractice(promptId)`,
  optimistic `submitTip`, and `toggleUseful(target_type:'tip')` reuse; mirrors proof/useful patterns.

## UI — practice screen

- "Tips from people who've done this" section: each tip = body + author name + level chip
  (reuse `levelRank` cue) + relative time + **Useful** toggle (no count) + **Report**.
- **"Share a tip"** composer (≤280-char textarea + calm helper copy) appears **only when the
  viewer has completed that practice** (gated client-side by `completedPracticeIds`/proof;
  enforced server-side by `submit_tip`). Optimistic insert on submit.
- Beginner-safe copy; no scores/counts/clout; level chip is the only status signal.

## Admin

Extend `app/api/admin/beta/route.ts` + `app/admin/beta/page.tsx` with a read-only **reported
tips** list (join `tip_reports` → `practice_tips`), alongside the existing spam-review list.

## Testing & verification

- Pure (`npx tsx scripts/check-tips.ts`): `rankTips` (author-level × useful ordering; real>demo;
  own excluded; never empty for non-empty); reuse of `coachSafetyPrecheck` on tip text; trust math
  (`tip-submit` 1, `useful-tip` 6).
- SQL (MCP `execute_sql`, post-apply): RLS — client cannot direct-insert `practice_tips`
  (insert denied); `submit_tip` rejects when no completion; the useful trigger credits the author
  once (idempotent) and not for self-marks; daily cap on `tip-submit`; `useful_marks.target_type`
  accepts `'tip'`. `get_advisors(security)` clean.
- `npm run typecheck` + `npm run build` green.

## Acceptance criteria

1. A member who completed a practice can post a ≤280-char text tip on it; non-completers cannot
   (server-enforced).
2. Tips show on the practice screen ranked by author level × usefulness; real before demo; own
   excluded; beginner-safe, no counts/clout.
3. Tips earn Contribution trust: `tip-submit` +1 (daily-capped 5), `useful-tip` +6 once
   (idempotent, not self-markable) — can't be farmed.
4. Every tip passes the regex pre-gate and (when `OPENAI_API_KEY` set) AI moderation on submit;
   tips can be reported → admin review (no auto-removal).
5. All trust writes via SECURITY-DEFINER RPC + definer trigger; clients cannot mint trust; tip
   inserts only via `submit_tip`.
6. Migration 028 additive (010–027 untouched); `get_advisors` clean; pure + typecheck + build green.

## Build slices (for the plan)

1. **Backend** — migration 028 (table + RLS + reports + useful_marks check + trust points +
   `submit_tip` + useful trigger + Contribution recompute) applied via MCP; `lib/tips/*` (types,
   pure `rankTips` + check, repository); `/api/tips` + `/api/tips/report` with layered safety.
2. **UI** — practice-screen tips section + composer + Useful/Report + provider wiring.
3. **Admin + verify** — reported-tips admin list; docs; full verification.

## Scope — out (own follow-ups)

- Media tips (text-only v1).
- Tips in the main feed; a dedicated Knowledge browse/library.
- Tip edit-history, replies/threads, tip-level notifications.
- Auto-removal/enforcement on reports (admin review only in v1).

## Known limitations / next

- `useful-tip` credits the author once on the *first* useful mark (a coarse but farm-resistant
  signal); a graded "N useful → more" model is later tuning.
- AI moderation adds a small per-submit OpenAI cost when keyed; the regex gate is the floor when
  unkeyed.
- Tips touch the V2 Contribution computation — the trust recompute body is updated in 028
  (additive, same function name/signature), keeping all existing callers working.
