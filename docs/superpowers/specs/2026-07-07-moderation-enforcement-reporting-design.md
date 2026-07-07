# Moderation Enforcement + Reporting — Design

**Date:** 2026-07-07
**Status:** Approved (autonomous execution authorized)
**Source:** Collective Progress Algorithm — Red-Team Engineering Spec (§8 penalties, §15 red-team, §16 safety), reconciled against the shipped codebase.

## Goal

Close the one **critical** live exposure the codebase audit surfaced — admin-removed / spam-held proofs and feedback are still readable by any authenticated member querying the tables directly, because moderation is enforced only in client-side `.or()` filters — and give members a calm, beginner-safe way to **report** harmful proofs and feedback, with **tiered** automatic consequences and a real **admin review queue**.

Everything is additive and reuses the 027–029 trust/spam pipeline. The one structural change is cutting the `held`/`removed` booleans over to a `moderation_status` enum (with a `moderation_reason` companion), per the chosen approach B.

## Locked decisions

1. **`moderation_status` enum** (`clear | limited | pending | removed`) as the content moderation state, plus a **`moderation_reason`** (`spam | reported | admin | null`) so the existing spam self-heal only ever releases spam-caused holds and never silently un-hides reported content.
2. **Tiered enforcement:** a **severe**-reason report from a **credible** reporter reduces exposure immediately (→ `pending`, hidden from the community, reversible) at 1 report; a **mild**-reason report only queues until **≥3 distinct** reporters flag the same content, then hides it. All reports land in the admin queue. Every auto-hide is reversible on dismiss. The author's `spam_signal` is also bumped by distinct reporters (feeding the existing ≥70 auto-hold).
3. **Targets:** `proof` and `feedback`. Member-level "report this person", the account-action ladder (restrict/suspend), and appeals are **deferred**.

## Non-goals (deferred, documented)

- Member-level reporting + account suspension/restriction ladder.
- Appeals workflow.
- Feed A/B experimentation on moderation.
- The other three red-team sub-projects (feed instrumentation, anti-gaming ledger hardening, feed diversity/freshness).

## Architecture

### Content states

| `moderation_status` | Visible in community feed? | Set by | `moderation_reason` |
|---|---|---|---|
| `clear` (default) | yes | default; admin `clear_content` | null |
| `limited` | yes, but **downranked** | admin `limit_content` | `admin` |
| `pending` | **no** (hidden pending review) | spam auto-hold (≥70); severe report; mild ≥3 reporters | `spam` / `reported` |
| `removed` | **no** (hard removed) | admin `remove_content` | `admin` |

The row's **own author always sees their content** regardless of status. Service-role paths (seeds/admin) bypass RLS.

`held`/`removed` booleans are kept **mirrored** by the trigger and RPCs (belt-and-suspenders for any reader not migrated), but `moderation_status` is the source of truth that RLS and the client filters read going forward.

### Migration `039_moderation_status.sql` (additive cutover)

1. Add to `proofs`, `feedback`, `practice_tips`:
   - `moderation_status text not null default 'clear' check (moderation_status in ('clear','limited','pending','removed'))`
   - `moderation_reason text check (moderation_reason is null or moderation_reason in ('spam','reported','admin'))`
2. **Backfill:** `removed=true → 'removed'/'admin'`; `held=true and not removed → 'pending'/'spam'`; else `'clear'/null`.
3. Partial indexes on `(author) where moderation_status <> 'clear'`.
4. **Rewrite BEFORE INSERT triggers** (`_stamp_held_proof`, `_stamp_held_by_author`): when author `spam_signal >= 70`, set `moderation_status='pending', moderation_reason='spam', held=true`; else leave defaults. (Mirror `held` for safety.)
5. **Rewrite `_recompute_profile_counts`:**
   - Add `v_reporters` = `count(distinct reporter_id)` across the author's `proof`+`feedback` reports with `status='open'` in the last 30 days.
   - `v_spam := least(100, v_over_cap*5 + <existing harsh-feedback 40 term> + least(v_reporters,5)*15)` (reports contribute up to +75; ~5 distinct reporters crosses the 70 auto-hold).
   - **Self-heal:** where `moderation_status='pending' AND moderation_reason='spam' AND v_spam < 40` → set `'clear'/null, held=false`. Rows with reason `reported`/`admin` are **never** auto-released.
6. **Rewrite / add admin RPCs** (all `security definer`, `revoke all from public, anon, authenticated`):
   - `clear_content(kind,id)` → `clear/null, held=false, removed=false`.
   - `remove_content(kind,id)` → `removed/admin, held=true, removed=true`.
   - `limit_content(kind,id)` → `limited/admin, held=false, removed=false`.
   - `hold_content(kind,id,reason)` → `pending/<reason>, held=true`.
7. **CRITICAL RLS fix** — proofs, feedback, tips SELECT policies gain `AND moderation_status not in ('pending','removed')` in the non-owner branch (owner branch unchanged so authors still see their own):
   - proofs (038): `auth.uid()=user_id OR (visibility='cohort' AND <not blocked> AND moderation_status not in ('pending','removed'))`.
   - feedback (011): add the same non-owner gate.
   - practice_tips (028): add the same gate.

### Migration `040_reports.sql`

1. `reports` table:
   ```
   id uuid pk, reporter_id uuid → profiles, target_type text check in ('proof','feedback'),
   target_id uuid, reason text check in (<taxonomy>), severity text check in ('severe','mild'),
   detail text check (char_length(detail) <= 500), status text not null default 'open'
     check (status in ('open','actioned','dismissed')), created_at timestamptz default now(),
   unique(reporter_id, target_type, target_id)
   ```
   Indexes: `(target_type, target_id) where status='open'`, `(status, created_at desc)`.
2. **Reason taxonomy + severity:** severe = `harassment`, `unsafe` (threats/self-harm/danger), `sexual_or_violent`; mild = `spam`, `low_quality`, `off_topic`, `other`.
3. **RLS:** enable; **no direct client insert** (`with check (false)`) — reports are created only through the RPC so enforcement stays server-side. No client select (admin reads via service role).
4. `submit_report(p_target_type, p_target_id, p_reason, p_detail)` `security definer`:
   - `reporter := auth.uid()`; raise if null.
   - Resolve target author (`proofs.user_id` / `feedback.author_id`); raise `CANNOT_REPORT_OWN` if author = reporter; raise if target missing.
   - Derive `severity` from reason.
   - Insert into `reports` `on conflict (reporter_id,target_type,target_id) do nothing` (idempotent — one report per reporter per target).
   - `credible := (reporter's spam_signal < 40)`.
   - Enforcement (only escalates from `clear`/`limited`; never overrides `removed`):
     - severe + credible → `hold_content(target, 'reported')`.
     - mild → if `count(distinct reporter_id where status='open')` on this target `>= 3` → `hold_content(target, 'reported')`.
   - `perform _recompute_profile_counts(author)` (feeds `spam_signal` from the reports term).
   - Return `jsonb {status, hidden}`.
   - `grant execute to authenticated`; revoke from public/anon.

## Data layer

- `lib/supabase/reportsRepository.ts` (new): `submitReport(client, targetType, targetId, reason, detail) → { error }` via `rpc('submit_report', …)`, with calm error translation.
- `lib/betaTypes.ts`: `Proof.moderationStatus?`, `Feedback.moderationStatus?`; `ReportReason` union + `REPORT_REASONS` list (`{ id, label, severity, help }`) for the UI.
- `lib/supabase/betaRepository.ts`: proof/feedback mappers carry `moderation_status`; the two `.or(held.eq.false,…)` bundle filters become `.or('moderation_status.not.in.(pending,removed),<owner>')` (defense-in-depth; RLS is now the real gate).

## UI

- `components/beta/ReportSheet.tsx` (new): calm bottom-sheet/modal — grouped reason radios (severe/mild with plain-language labels), optional ≤500-char detail, Submit/Cancel. Success → inline confirmation "Thanks — our team will review this." No drama, beginner-safe voice, no counts.
- Wire a subtle **Report** affordance (hidden on own content + demo):
  - `ProofDetail` — a small "Report" item in the author-row overflow.
  - Each **feedback note** in the ProofDetail feedback list — a quiet "Report" link on non-own notes.
- Provider: `reportContent(targetType, targetId, reason, detail)` → `reportsRepository.submitReport` + toast; no optimistic content mutation.

## Admin review queue

- Extend `app/api/admin/moderation/route.ts`:
  - **GET**: list `open` reports (service role) joined to a target-content snippet + author + reporter + distinct-reporter count; newest first.
  - **POST**: add actions `limit` (`limit_content`) and keep `remove`/`clear`; accept optional `reportId`; on `remove`/`limit` set related `reports.status='actioned'`, on `clear` set `'dismissed'`.
- `app/admin/reports/page.tsx` (new): admin-gated queue (reuse the `admin/beta` auth flow) listing open reports with **Dismiss / Limit / Remove** actions; replaces guessing from raw tables.

## Feed treatment of `limited`

`lib/feed/rankProofFeed.ts`: `pending`/`removed` are already excluded by RLS; apply a fixed **downrank multiplier** in `rankOne` when `proof.moderationStatus === 'limited'` so limited content stays visible but sinks.

## Verification

1. `npm run typecheck` + `npm run build`.
2. Apply `039`, `040` via Supabase MCP; re-apply once to confirm idempotency; `pg_policies` shows the tightened SELECT policies.
3. **RLS proof (the critical fix):** as a non-author, a `pending`/`removed` proof and feedback return **0 rows**; a `limited` and `clear` row still return; the author still sees their own `pending` row.
4. **RPC behavior:** self-report raises; severe+credible → target `pending`; mild single report → still visible; mild ≥3 distinct reporters → `pending`; duplicate `(reporter,target)` is a no-op; a spam-flagged reporter (`spam_signal≥40`) cannot severe-hide.
5. **Pure check** (`scripts/check-moderation.ts`): reason→severity mapping + the mild-threshold and credible-reporter predicates.
6. Adversarial whole-branch code-review (workflow) before merge; branch → PR → merge → ff worktree.

## Invariants honored

- Additive migrations only; SECURITY DEFINER functions revoked from public/anon/authenticated; report creation and all status changes are server-side only (clients cannot set `moderation_status`).
- Reversible: every auto-hide clears on admin dismiss; spam self-heal never touches report/admin holds.
- Beginner-safe, no clout: reports are private, no public counts, calm copy.
- Anti-brigading: distinct-reporter requirement, credible-reporter gate for severe-instant-hide, one report per reporter per target, full reporter identity retained for admin.
