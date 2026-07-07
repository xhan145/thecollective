# Moderation Enforcement + Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Author is executing inline autonomously.

**Goal:** Close the critical "removed/held content still readable via direct query" RLS hole and let members report harmful proofs & feedback, with tiered auto-enforcement and an admin review queue.

**Architecture:** Additive cutover of the 029 `held`/`removed` booleans to a `moderation_status` enum (+ `moderation_reason`) that RLS SELECT policies enforce; a server-only `reports` table + `submit_report` RPC applies tiered consequences (severe hides at 1 credible reporter, mild at ≥3 distinct) and feeds the author's `spam_signal`; report UI on proof/feedback; an admin queue extends the existing moderation route.

**Tech Stack:** Next.js App Router + TypeScript strict, Supabase Postgres (RLS + SECURITY DEFINER RPCs), applied via Supabase MCP to prod project `qfzguujtjloskyxcdbon`.

## Global Constraints

- Additive migrations only; never edit an applied migration. Next numbers: `039`, `040`.
- Every SECURITY DEFINER function: `revoke all ... from public, anon, authenticated` (except `submit_report`, which is `grant execute to authenticated`).
- Clients may NEVER set `moderation_status`/`moderation_reason` or insert into `reports` directly (RLS `with check (false)`); all writes go through RPCs.
- `moderation_status ∈ ('clear','limited','pending','removed')`; `moderation_reason ∈ ('spam','reported','admin', null)`.
- Spam self-heal releases ONLY `moderation_status='pending' AND moderation_reason='spam'`; never `reported`/`admin`.
- Own author always sees their own content; feedback recipient must NOT see `pending`/`removed` feedback (protect the harmed beginner); giver (author_id) always sees own.
- Severe reasons: `harassment`, `unsafe`, `sexual_or_violent`. Mild: `spam`, `low_quality`, `off_topic`, `other`. Mild threshold = **3 distinct reporters**. Credible reporter = `spam_signal < 40`.
- Beginner-safe, no clout: reports private, no public counts, calm copy. `.env.local` UTF-8 no BOM. Demo rows untouched (`is_demo`).
- Verify before claiming: typecheck 0, build 0, migrations applied + idempotent, RLS proven by direct query.

---

## File Structure

- `supabase/migrations/039_moderation_status.sql` — enum cutover + trigger/recompute/RPC rewrite + CRITICAL RLS fix.
- `supabase/migrations/040_reports.sql` — `reports` table + `submit_report` RPC + reports term in recompute.
- `lib/moderation.ts` — pure: reason→severity map, `REPORT_REASONS`, mild-threshold + credible predicates (testable).
- `scripts/check-moderation.ts` — pure-function assertions.
- `lib/supabase/reportsRepository.ts` — `submitReport` client wrapper.
- `lib/betaTypes.ts` — `Proof.moderationStatus?`, `Feedback.moderationStatus?`, `ReportReason`.
- `lib/supabase/betaRepository.ts` — mappers carry `moderation_status`; SELECT filters updated.
- `components/beta/ReportSheet.tsx` — reason picker sheet.
- `components/beta/ProofComponents.tsx` — Report affordance on ProofDetail + feedback notes.
- `components/beta/AppStateProvider.tsx` — `reportContent` method.
- `app/api/admin/moderation/route.ts` — GET reports list + POST `limit` action + report-status updates.
- `app/admin/reports/page.tsx` — admin review queue.
- `lib/feed/rankProofFeed.ts` — downrank `limited`.

---

## Task 1: Migration 039 — moderation_status cutover + CRITICAL RLS fix

**Files:** Create `supabase/migrations/039_moderation_status.sql`; apply via MCP.

- [ ] **Step 1: Write the migration.** Columns + backfill + indexes on proofs/feedback/practice_tips; rewrite `_stamp_held_proof`/`_stamp_held_by_author` to stamp `moderation_status='pending', moderation_reason='spam', held=true` when `spam_signal>=70`; rewrite `_recompute_profile_counts` self-heal to `where moderation_status='pending' and moderation_reason='spam' and v_spam<40 → clear` (mirror `held=false`); rewrite `clear_content`/`remove_content` and add `limit_content`/`hold_content(kind,id,reason)` to set status+reason+mirror held/removed; tighten SELECT policies:
  - proofs (from 038): non-owner branch gains `and moderation_status not in ('pending','removed')`.
  - feedback (from 011): `using (auth.uid()=author_id OR ((auth.uid()=recipient_id OR exists(cohort proof)) AND moderation_status not in ('pending','removed')))`.
  - practice_tips (from 028): `using (author_id = auth.uid() OR moderation_status not in ('pending','removed'))`.
  - `revoke all` on every redefined function.
- [ ] **Step 2: Apply via MCP** `apply_migration(039_moderation_status)`. Expected: `{"success":true}`.
- [ ] **Step 3: Verify** with `execute_sql`: `pg_policies` for proofs/feedback/practice_tips SELECT show the `moderation_status not in` clause; backfill correct (`select moderation_status, count(*) from proofs group by 1`). Expected: policies tightened, no `pending` rows unless a held row existed.
- [ ] **Step 4: Re-apply once** — idempotent (`create ... if not exists`, `create or replace`, `drop policy if exists`). Expected: `{"success":true}` again, no error.
- [ ] **Step 5: Commit** `supabase/migrations/039_moderation_status.sql`.

## Task 2: Pure moderation helpers + check

**Files:** Create `lib/moderation.ts`, `scripts/check-moderation.ts`.

- [ ] **Step 1: Write `lib/moderation.ts`.**

```ts
export type ReportSeverity = "severe" | "mild";
export type ReportReason =
  | "harassment" | "unsafe" | "sexual_or_violent"   // severe
  | "spam" | "low_quality" | "off_topic" | "other"; // mild
export type ModerationStatus = "clear" | "limited" | "pending" | "removed";

const SEVERE: ReportReason[] = ["harassment", "unsafe", "sexual_or_violent"];
export const MILD_THRESHOLD = 3;

export function severityOf(reason: ReportReason): ReportSeverity {
  return SEVERE.includes(reason) ? "severe" : "mild";
}
export function isCredibleReporter(spamSignal: number): boolean {
  return spamSignal < 40;
}
/** Server-mirror of the RPC decision (kept pure for testing/UI hints). */
export function shouldHide(reason: ReportReason, credible: boolean, distinctReporters: number): boolean {
  if (severityOf(reason) === "severe") return credible;
  return distinctReporters >= MILD_THRESHOLD;
}
export const REPORT_REASONS: { id: ReportReason; label: string; severity: ReportSeverity; help: string }[] = [
  { id: "harassment", label: "Harassment or bullying", severity: "severe", help: "Attacks the person, not the attempt." },
  { id: "unsafe", label: "Unsafe or harmful", severity: "severe", help: "Threats, self-harm, or dangerous advice." },
  { id: "sexual_or_violent", label: "Sexual or violent", severity: "severe", help: "Explicit or graphic content." },
  { id: "spam", label: "Spam or self-promotion", severity: "mild", help: "Ads, links, or repeated noise." },
  { id: "low_quality", label: "Not a real attempt", severity: "mild", help: "No practice, proof, or effort." },
  { id: "off_topic", label: "Off-topic", severity: "mild", help: "Unrelated to the practice." },
  { id: "other", label: "Something else", severity: "mild", help: "Tell us in a note below." },
];
```

- [ ] **Step 2: Write `scripts/check-moderation.ts`** asserting: `severityOf('harassment')==='severe'`, `severityOf('spam')==='mild'`, `isCredibleReporter(39)===true`, `isCredibleReporter(40)===false`, `shouldHide('harassment',true,1)===true`, `shouldHide('harassment',false,1)===false`, `shouldHide('spam',true,2)===false`, `shouldHide('spam',true,3)===true`; `REPORT_REASONS` all 7 present, severities consistent with `severityOf`. Log `"moderation checks passed"`.
- [ ] **Step 3: Run** `npx tsx scripts/check-moderation.ts`. Expected: `moderation checks passed`.
- [ ] **Step 4: Commit.**

## Task 3: Migration 040 — reports table + submit_report RPC + recompute term

**Files:** Create `supabase/migrations/040_reports.sql`; apply via MCP.

- [ ] **Step 1: Write the migration.** `reports` table (schema per spec, `unique(reporter_id,target_type,target_id)`, indexes); RLS enable + `with check (false)` insert + no client select; re-declare `_recompute_profile_counts` adding `v_reporters` (distinct reporters across author's proof+feedback open reports, 30d) → `v_spam := least(100, v_over_cap*5 + <harsh term> + least(v_reporters,5)*15)`; `submit_report(p_target_type,p_target_id,p_reason,p_detail)` SECURITY DEFINER (validate auth.uid, resolve+block own-report, insert on-conflict-do-nothing, derive severity, credible=spam_signal<40, severe+credible OR mild≥3 → `hold_content`, `perform _recompute_profile_counts(author)`, return jsonb). `grant execute on submit_report to authenticated`; `revoke all` from public/anon; recompute stays revoked.
- [ ] **Step 2: Apply via MCP** `apply_migration(040_reports)`. Expected: `{"success":true}`.
- [ ] **Step 3: Verify RLS + RPC** with `execute_sql` using seeded demo ids: (a) self-report raises/no-op; (b) severe from credible → target `pending`; (c) mild single → target still `clear`; (d) mild 3 distinct → `pending`; (e) duplicate `(reporter,target)` no-op. Clean up test rows.
- [ ] **Step 4: Re-apply once** — idempotent. Expected: `{"success":true}`.
- [ ] **Step 5: Commit.**

## Task 4: Types + repository + client wrapper

**Files:** Modify `lib/betaTypes.ts`, `lib/supabase/betaRepository.ts`; create `lib/supabase/reportsRepository.ts`.

- [ ] **Step 1:** `betaTypes.ts` — add `moderationStatus?: import("./moderation").ModerationStatus` to `Proof` and `Feedback`.
- [ ] **Step 2:** `betaRepository.ts` — proof mapper `moderationStatus: row.moderation_status ?? "clear"`; feedback mapper same; update the two bundle SELECT `.or(held.eq.false,…)` to `.or('moderation_status.not.in.(pending,removed),<owner col>.eq.'+userId)`.
- [ ] **Step 3:** `reportsRepository.ts` — `submitReport(client, targetType, targetId, reason, detail)` → `rpc('submit_report',{p_target_type,p_target_id,p_reason,p_detail})`; return `{ error: string|null }` with calm message on failure.
- [ ] **Step 4:** `npm run typecheck`. Expected: 0.
- [ ] **Step 5: Commit.**

## Task 5: Report UI + provider wiring

**Files:** Create `components/beta/ReportSheet.tsx`; modify `components/beta/ProofComponents.tsx`, `components/beta/AppStateProvider.tsx`.

- [ ] **Step 1:** Provider — add `reportContent(targetType: "proof"|"feedback", targetId: string, reason: ReportReason, detail: string): Promise<{error:string|null}>` calling `reportsRepository.submitReport` with the authed client; expose in context type + value.
- [ ] **Step 2:** `ReportSheet.tsx` — modal with `REPORT_REASONS` radios (grouped severe/mild), optional ≤500-char detail textarea, Submit/Cancel; on submit call `reportContent`; success → inline "Thanks — our team will review this." Props `{ targetType, targetId, onClose }`.
- [ ] **Step 3:** Wire a quiet "Report" affordance in `ProofDetail` (non-own proof) and per non-own feedback note; hidden on `proof.isDemo`/own.
- [ ] **Step 4:** `npm run typecheck` + `npm run build`. Expected: both 0.
- [ ] **Step 5: Commit.**

## Task 6: Admin review queue

**Files:** Modify `app/api/admin/moderation/route.ts`; create `app/admin/reports/page.tsx`.

- [ ] **Step 1:** route — add `GET` (service role) returning open reports joined to target snippet + author + reporter + distinct count; extend `POST` with `limit` action (`limit_content`) and, when `reportId` present, set `reports.status` (`actioned` on remove/limit, `dismissed` on clear).
- [ ] **Step 2:** `app/admin/reports/page.tsx` — admin-gated (reuse `admin/beta` auth pattern) queue with Dismiss/Limit/Remove per report.
- [ ] **Step 3:** `npm run build`. Expected: 0; `/admin/reports` routed.
- [ ] **Step 4: Commit.**

## Task 7: Feed downrank for `limited` + final review

**Files:** Modify `lib/feed/rankProofFeed.ts`.

- [ ] **Step 1:** In `rankOne`, if `proof.moderationStatus === "limited"` multiply score by `0.35` (kept visible, sinks). Extend `scripts/check-feed-ranking.ts` with a `limited`-downrank assertion.
- [ ] **Step 2:** Run `npx tsx scripts/check-feed-ranking.ts` + `check-moderation.ts`; `npm run typecheck` + `npm run build`. Expected: all pass, 0.
- [ ] **Step 3:** Adversarial whole-branch code-review (workflow). Fix Critical/Important findings.
- [ ] **Step 4: Commit; branch → PR → merge → ff worktree to main; update memory.**

---

## Self-Review

**Spec coverage:** critical RLS fix → T1; enum+reason+trigger+self-heal+RPCs → T1; reports table+submit_report+tiered+spam term → T3; severity/threshold/credible → T2; types/repo → T4; UI+provider → T5; admin queue → T6; limited downrank → T7. All spec sections mapped.

**Placeholder scan:** `<harsh term>`, `<owner col>`, `<not blocked>` are exact-copy pointers to existing 011/029/038 clauses reproduced verbatim at build time — not TODOs.

**Type consistency:** `ModerationStatus`, `ReportReason`, `ReportSeverity`, `severityOf`, `isCredibleReporter`, `shouldHide`, `REPORT_REASONS`, `submitReport`, `reportContent` names consistent across T2/T4/T5. RPC name `submit_report`, admin RPCs `clear_content`/`remove_content`/`limit_content`/`hold_content` consistent across T1/T3/T6.
