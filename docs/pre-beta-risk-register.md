# Collective — Pre-Beta Risk Register

**Date:** 2026-07-07 · **Branch:** `docs/pre-beta-audit`

Consolidated, deduped, ranked most-severe first. Each entry carries: Severity · Area · Finding · User impact · Technical impact · Security/privacy impact · Recommended resolution · Dependency · Complexity · Beta-blocking. Criticals R1/R2 were re-verified by hand against the live database.

**Counts:** 2 Critical · 9 High · 9 Medium · 4 Low. **Beta-blocking: 11** (R1–R11).

---

### R1 · CRITICAL · Authorization / feed visibility — **BETA-BLOCKING**
- **Finding:** `submitProof` hardcodes `visibility: "private"` on every real proof (`AppStateProvider.tsx:598`); no visibility picker exists; the cross-member SELECT policy returns non-owner rows only when `visibility='cohort'` (`039:170`, `011`, `038`), which only demo rows use.
- **User impact:** A second real user can never see a first user's proof → the peer-feedback step (beta success #10) is impossible on real data; the loop only "works" on demo content.
- **Technical impact:** The entire feedback/queue/notification chain is unreachable for real proofs; safety enforcement on the feed is moot because nothing real is on it.
- **Security/privacy impact:** None negative (fails closed / over-hidden), but it masks whether visibility controls actually work.
- **Resolution:** Introduce a canonical visibility vocabulary (`private | selected_reviewers | beta_community`), add a visibility picker to the proof flow defaulting to the user's `proof_visibility_default`, map RLS to the canonical values (replace `='cohort'`), and backfill. Pure-test the mapping.
- **Dependency:** Touches proofs RLS (038/039) + `Proof.visibility` type + submit flow + user_settings default (034). **Do not** weaken block/moderation gates while doing it.
- **Complexity:** M · **Beta-blocking: YES**

### R2 · CRITICAL · Storage security — **BETA-BLOCKING**
- **Finding:** Bucket `collective-proof-media` is `public: true` (verified via `storage.buckets`) and media is served with `getPublicUrl` (`betaRepository.ts:228`); paths are only `userId/proofId/timestamp-filename`.
- **User impact:** A member who submits a "private" image proof has that image anon-readable by anyone with (or who guesses/enumerates) the URL — a direct violation of "private progress is legitimate progress" and "never required to publish."
- **Technical impact:** Once R1 is fixed and real media flows, this exposure becomes live; the private-bucket signed-URL hook (`useSignedMediaUrl.ts`) already exists but is unused for proof media.
- **Security/privacy impact:** Cross-user private-content disclosure; no per-user authorization on media.
- **Resolution:** Create/convert to a **private** bucket; upload with non-guessable keys; serve via short-TTL signed URLs gated by the same visibility/authorization as the proof row; migrate existing objects. **STOP-and-document** (storage-ownership change) — plan in Package 7; do not flip in the audit.
- **Dependency:** Bucket migration + `betaRepository` media accessors + attachment RLS.
- **Complexity:** M · **Beta-blocking: YES**

### R3 · HIGH · Feedback integrity — **BETA-BLOCKING**
- **Finding:** No guard against self-feedback (`author_id = recipient_id`) on client, server, or DB; a crafted request to `/proof/<ownId>/feedback` mints peer-feedback trust.
- **User impact:** Users can inflate their own trust; undermines "earned trust, not paid trust."
- **Technical impact:** Feeds the trust ledger and notification fan-out with self-authored rows.
- **Security/privacy impact:** Trust minting / integrity failure.
- **Resolution:** `CHECK (author_id <> recipient_id)` on `feedback` + a client guard in `addFeedback` + recheck at submit.
- **Dependency:** none. **Complexity:** S · **Beta-blocking: YES**

### R4 · HIGH · Feedback integrity — **BETA-BLOCKING**
- **Finding:** No `UNIQUE(author_id, proof_id)` on `feedback`; each duplicate row earns fresh trust and fires a notification.
- **User impact:** Trust farming + notification spam for the recipient.
- **Technical impact:** Duplicate ledger events; violates the brief's "no duplicate feedback."
- **Security/privacy impact:** Trust minting.
- **Resolution:** `UNIQUE(author_id, proof_id)` partial index (exclude soft-deleted) + client "already gave feedback" state + server recheck.
- **Dependency:** pairs with R3 in one migration. **Complexity:** S · **Beta-blocking: YES**

### R5 · HIGH · Mocked/demo data leak — **BETA-BLOCKING**
- **Finding:** `NEXT_PUBLIC_DEMO_SEED` and `NEXT_PUBLIC_INCLUDE_DEMO_CONTENT` both default **ON** (`!== 'false'`); `AppStateProvider` also falls back to the demo community on load failure.
- **User impact:** Beta users see fabricated members/proofs presented as real activity — a "fake social activity" violation and a trust-eroding first impression.
- **Technical impact:** `is_demo` rows interleave with real content in feed/queue.
- **Security/privacy impact:** Fabricated-activity integrity issue.
- **Resolution:** Invert both defaults to require `=== 'true'`; set them `false` in the Vercel beta env; remove the demo-community load fallback for authed real users.
- **Dependency:** none (config + small code). **Complexity:** S · **Beta-blocking: YES**

### R6 · HIGH · Auth / account recovery — **BETA-BLOCKING**
- **Finding:** No forgot-password flow; change-password requires an active session.
- **User impact:** A member who forgets their password is permanently locked out with no self-serve recovery — fails beta success #1 (register/authenticate without team help) for returning users.
- **Technical impact:** No `resetPasswordForEmail` + callback route.
- **Security/privacy impact:** Support burden; risk of insecure ad-hoc resets.
- **Resolution:** Add `supabase.auth.resetPasswordForEmail` → `/auth/reset` callback → set-new-password; rate-limit; calm copy.
- **Dependency:** Supabase email templates. **Complexity:** M · **Beta-blocking: YES**

### R7 · HIGH · UI robustness — **BETA-BLOCKING**
- **Finding:** No React error boundary (`error.tsx` / `global-error.tsx`); all screens are client components mapping over live Supabase data.
- **User impact:** Any render throw white-screens the app with no recovery — a likely P1 during a beta.
- **Technical impact:** Unhandled client exceptions bubble to a blank page.
- **Security/privacy impact:** Risk of leaking a raw stack in dev; none in prod but total loss of function.
- **Resolution:** Add brand-styled `app/error.tsx` + `app/global-error.tsx` with a reset action, mirroring `not-found.tsx`.
- **Dependency:** none. **Complexity:** S · **Beta-blocking: YES**

### R8 · HIGH · Duplicated / mocked routes — **BETA-BLOCKING**
- **Finding:** A parallel legacy dark theme (`components/AppShell`, `components/ui/*`, `globals.css` 41–253) is URL-reachable at `/dashboard`, `/paths`, and ~6 others, several serving hardcoded stats.
- **User impact:** A beta user who lands on a legacy route sees a different design and fake numbers — confusing and off-brand.
- **Technical impact:** Two UI stacks + dead libs increase surface area and bug risk.
- **Security/privacy impact:** Mocked metrics could be mistaken for real trust display.
- **Resolution:** Remove or redirect the legacy routes to their beta equivalents; delete the legacy component/lib scaffold once unreferenced.
- **Dependency:** confirm no beta route imports them first. **Complexity:** M · **Beta-blocking: YES**

### R9 · HIGH · Auth / privacy — **BETA-BLOCKING**
- **Finding:** No account-deletion / erasure path; the only deletion is a developer running a service-role script.
- **User impact:** A member cannot delete their account or data — a privacy-expectation and (region-dependent) compliance gap for a public beta.
- **Technical impact:** No cascade/anonymization strategy that preserves moderation evidence.
- **Security/privacy impact:** Right-to-erasure gap.
- **Resolution:** Self-serve delete → server route that anonymizes/removes owned rows while **retaining moderation evidence** (soft-delete + redact), then `auth.admin.deleteUser`. Document retention.
- **Dependency:** interacts with moderation retention (R21). **Complexity:** L · **Beta-blocking: YES**

### R10 · HIGH · Env / configuration — **BETA-BLOCKING**
- **Finding:** `.env.example` documents 8 vars; the app reads ~20, omitting `NEXT_PUBLIC_REQUIRE_INVITE_CODE` (invite gate) and `ADMIN_EMAILS` (admin authz).
- **User impact:** An operator standing up the beta from `.env.example` can ship it ungated or with no admin.
- **Technical impact:** Config drift; setup failures.
- **Security/privacy impact:** Two security controls are undocumented.
- **Resolution:** Regenerate `.env.example` from a `process.env` grep; group server-only vs `NEXT_PUBLIC_`; note which gate the beta; delete dead flags.
- **Dependency:** none. **Complexity:** S · **Beta-blocking: YES**

### R11 · HIGH · Notifications / transparency — **BETA-BLOCKING**
- **Finding:** Moderation actions (hide/remove/limit, report resolution) emit no notification; content silently disappears.
- **User impact:** An author whose proof is hidden gets no explanation — feels arbitrary, undermines beginner safety and trust in moderation.
- **Technical impact:** No moderation→notification path.
- **Security/privacy impact:** Transparency/fairness gap; weak audit trail.
- **Resolution:** Emit a `moderation` notification (calm, reasoned) on hide/remove/restore from the moderation RPCs/route; pairs with the audit trail (R21).
- **Dependency:** R21 (actor/reason capture). **Complexity:** M · **Beta-blocking: YES**

---

### R12 · HIGH · Blocking / RLS
- **Finding:** The cross-user block check inlines a subquery over `blocked_users` (RLS `using (auth.uid()=blocker_id)`); in the owner→viewer direction the subquery can run with the querying user's RLS and shadow the row, weakening enforcement.
- **User impact:** A blocked user may still see the blocker's content in edge cases.
- **Technical impact:** RLS-within-RLS visibility subtlety.
- **Security/privacy impact:** Block bypass.
- **Resolution:** Move the block check into a SECURITY DEFINER helper (or a policy that reads `blocked_users` as definer) so both directions are enforced; add a negative test.
- **Dependency:** proofs RLS (038). **Complexity:** M · **Beta-blocking:** No (verify before invite).

### R13 · HIGH · Feedback ranking / queue
- **Finding:** The live `rankFeed` omits every dominant brief term (`feedback_need`, `recency`, `comfort_match`, `reviewer_eligibility`, `seen`/`reviewed` penalties) and does not surface zero-feedback proofs first; the contribute queue exclusions are incomplete.
- **User impact:** New/unanswered proofs are not routed to reviewers → the "feedback within 48h" success metric is unlikely.
- **Technical impact:** No pure ranked-queue function; risk of infinite-scroll patterns.
- **Security/privacy impact:** none.
- **Resolution:** Implement the brief's `score` as a pure, unit-tested function outside UI; deterministic pagination; apply all queue exclusions. (Package 8.)
- **Dependency:** R1 (needs visible real proofs). **Complexity:** M · **Beta-blocking:** No (loop can run pre-ranking; needed for quality).

### R14 · HIGH · Drafts / data loss
- **Finding:** No `proof_drafts` table/autosave/resume/discard; the composer keeps reflection text in local `useState` only.
- **User impact:** Navigating away or refreshing loses in-progress proof text — a common, frustrating loss.
- **Technical impact:** No persistence layer for drafts.
- **Security/privacy impact:** none.
- **Resolution:** `proof_drafts` (owner-only RLS, one active per user+practice) + autosave + resume + idempotent draft→proof. (Package 6.)
- **Dependency:** none. **Complexity:** M · **Beta-blocking:** No (nice-to-have for the gate; strongly recommended).

### R15 · MEDIUM · Accessibility / contrast
- **Finding:** White 14px on `#F2A900/#FFB000` gold ≈ 2:1 (fails AA); `#9B958B` microcopy ≈ 2.7:1 carries real info; 40px header targets.
- **User impact:** Low-vision users can't read primary CTAs/microcopy; fails the "keyboard/contrast core loop" gate.
- **Technical impact:** Token-level fix.
- **Security/privacy impact:** none.
- **Resolution:** Darken CTA gold or use dark ink on gold; switch informational `#9B958B`→`#6E6E6E`; bump icon targets to ≥44px. Preserve tokens that already pass. (Package 12.)
- **Dependency:** none. **Complexity:** S · **Beta-blocking:** No (gate item — fix before invite).

### R16 · MEDIUM · Process / testing
- **Finding:** No test framework, no CI; 14/16 `check-*.ts` assert-scripts run only manually.
- **User impact:** Indirect — regressions ship silently during rapid beta iteration.
- **Technical impact:** No regression net on trust, RLS-dependent repos, invite/admin gating.
- **Security/privacy impact:** Security regressions (admin/invite/visibility) would be silent.
- **Resolution:** Add `vitest` + a `checks` script running all `check-*.ts`; add a minimal GitHub Actions CI (typecheck + build + checks) + PR template. (Package 1.)
- **Dependency:** none. **Complexity:** M · **Beta-blocking:** No (process; the E2E journeys ARE part of the gate).

### R17 · MEDIUM · Duplicated models
- **Finding:** Three trust systems (`lib/trust.ts`, `lib/betaTrust.ts`, `lib/trust/trustV2.ts`) with divergent tiers/weights.
- **User impact:** Inconsistent trust labels across surfaces.
- **Technical impact:** Ambiguity about the source of truth; maintenance hazard.
- **Security/privacy impact:** none.
- **Resolution:** Designate `trustV2` (DB-backed) canonical; delete/redirect the other two; keep trust display flag-off for beta anyway.
- **Dependency:** confirm call sites. **Complexity:** M · **Beta-blocking:** No.

### R18 · MEDIUM · Analytics / operational visibility
- **Finding:** `beta_events` is write-only; the admin route computes none of the required funnel/coverage/return metrics.
- **User impact:** Indirect — the team is blind to activation/feedback-coverage/return during beta.
- **Technical impact:** Metrics must be derived from `beta_events`; some source events don't fire yet.
- **Security/privacy impact:** none (text already excluded).
- **Resolution:** Add the missing typed events, then compute the admin beta metrics from `beta_events` (funnel, 48h coverage, usefulness, D1/D7, medians). (Package 11.)
- **Dependency:** event taxonomy completion. **Complexity:** L · **Beta-blocking:** No (needed to *evaluate* the beta).

### R19 · MEDIUM · Attachment validation
- **Finding:** Client-only MIME-prefix + size validation (browser-supplied `file.type`), no extension/magic-byte or server re-validation, over a public bucket.
- **User impact:** Malformed/misrepresented files can be stored.
- **Technical impact:** No server-side gate.
- **Security/privacy impact:** Content-type spoofing on a public bucket.
- **Resolution:** Server-side re-validate MIME + extension + magic bytes on upload; enforce size/count; pairs with R2. (Package 7.)
- **Dependency:** R2 (private bucket + server upload path). **Complexity:** M · **Beta-blocking:** No.

### R20 · MEDIUM · Auth / feature exposure
- **Finding:** The "Continue with Google" button always renders when Supabase is enabled; the documented `NEXT_PUBLIC_GOOGLE_ENABLED` flag is never read.
- **User impact:** If Google OAuth isn't configured, users hit a dead sign-in path.
- **Technical impact:** Flag/behavior mismatch.
- **Security/privacy impact:** False sense that a provider is hidden.
- **Resolution:** Gate the button on `NEXT_PUBLIC_GOOGLE_ENABLED` (default off) OR remove the flag and only show when configured. (Package 4.)
- **Dependency:** none. **Complexity:** S · **Beta-blocking:** No.

### R21 · MEDIUM · Moderation auditability
- **Finding:** No `moderation_actions` audit table; remove/limit/clear RPCs hardcode `reason='admin'` with no actor/timestamp/notes; report resolution only flips a status.
- **User impact:** Indirect — no defensible record of moderation decisions.
- **Technical impact:** Weak audit trail; blocks moderation-decision notifications (R11) and appeals.
- **Security/privacy impact:** Governance/audit gap.
- **Resolution:** `moderation_actions` (actor, target, action, reason, notes, ts); write from the admin RPCs; power R11 + admin history. (Package 10.)
- **Dependency:** pairs with R11. **Complexity:** M · **Beta-blocking:** No.

### R22 · MEDIUM · Secrets hygiene
- **Finding:** A live `service_role` JWT (bypasses all RLS) sits in plaintext in the working-tree `.env.local`; no secret-scanning guard. Currently gitignored/untracked.
- **User impact:** none directly.
- **Technical impact:** One accidental `git add -f` or misconfigured ignore leaks a full-access key.
- **Security/privacy impact:** Catastrophic if leaked (RLS bypass over all user data).
- **Resolution:** Add a pre-commit/CI secret scan (gitleaks); confirm `.env.local` ignore; rotate the key on any suspicion; never place it in `NEXT_PUBLIC_`. (Package 1.)
- **Dependency:** none. **Complexity:** S · **Beta-blocking:** No (do before opening the repo/CI).

### R23 · MEDIUM · Migrations
- **Finding:** Numbering collisions (two `030_*`, two `031_*`, missing `026`) create apply-order ambiguity for a fresh environment; ad-hoc SQL sits outside `migrations/`.
- **User impact:** none directly.
- **Technical impact:** A clean rebuild (staging/recovery) may apply in the wrong order or miss files.
- **Security/privacy impact:** An RLS migration applied out of order could transiently expose data on rebuild.
- **Resolution:** Document canonical apply order; add a migration-validation check (ordering + idempotent re-apply on a scratch DB); move loose SQL out of `supabase/`. (Package 1/2.)
- **Dependency:** none. **Complexity:** S · **Beta-blocking:** No (blocks reliable staging/rollback — do before the gate).

### R24 · LOW · Reporting scope
- **Finding:** No profile reporting (`reports.target_type` only `proof|feedback`), no account suspend/unsuspend; report categories differ from the brief (`unsafe/low_quality/off_topic` vs `hate/dangerous/personal_info`).
- **User impact:** Abusive display names/avatars/bios and repeat offenders can't be fully actioned.
- **Technical impact:** Extend `reports` target types + admin account actions.
- **Security/privacy impact:** Residual abuse vector.
- **Resolution:** Add `profile` target + a `suspended` state + reconcile categories. (Package 10.)
- **Dependency:** R21. **Complexity:** M · **Beta-blocking:** No.

---

## Beta-blocking summary (must clear before invites)

R1 visibility mismatch · R2 public media bucket · R3 self-feedback · R4 duplicate feedback · R5 demo-on · R6 password reset · R7 error boundary · R8 legacy routes · R9 account deletion · R10 env/config · R11 moderation notifications.

**Non-blocking but gate-relevant (fix before the outside-tester gate):** R12 block RLS, R13 ranked queue, R14 drafts, R15 contrast, R16 tests/CI, R22 secret scan, R23 migration order.
