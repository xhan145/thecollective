# Collective — Pre-Beta Build Plan

**Date:** 2026-07-07 · **Branch of record:** `docs/pre-beta-audit` (this doc set)

Sequenced to reach the release gate with the **smallest safe set of changes**. Each package = its own branch/PR, its own tests + manual QA, and a handoff (the 15-point template). Nothing merges to `main` directly. The order is adjusted from the brief so the **beta-blocking core-loop fix (R1) comes first** — the loop must survive on real data before anything else matters.

**Working rules for every package:** strict typing, no unsafe casts, validate client + server, enforce authz at server + DB (RLS), deterministic additive migrations, indexes on feed/queue/notification/moderation queries, no cascade that destroys moderation evidence, redact secrets/proof/feedback text from logs, no production data in tests, no fake metrics/social activity, no package marked complete without test + QA evidence.

---

## Package 0 — Core-loop unblock (NEW, highest priority)
*Closes the two Criticals + the highest-severity integrity/data holes so the real loop works. Small, mostly additive.*

- **P0.1 Visibility taxonomy (R1):** canonical `private | selected_reviewers | beta_community`; visibility picker in the proof flow defaulting to `user_settings.proof_visibility_default`; remap proofs/feedback SELECT RLS from `='cohort'` to the canonical values; backfill existing rows; pure-test the mapping.
- **P0.2 Private media (R2):** **STOP-and-document first** (storage-ownership change). Then: private bucket, non-guessable keys, short-TTL signed URLs authorized by the proof's visibility, migrate objects. Server-side upload path.
- **P0.3 Feedback integrity (R3/R4):** migration adding `CHECK(author_id<>recipient_id)` + `UNIQUE(author_id,proof_id)` (partial, excl. soft-deleted) on `feedback`; client guards + submit-time recheck.
- **P0.4 Demo-off (R5):** invert `NEXT_PUBLIC_DEMO_SEED` / `NEXT_PUBLIC_INCLUDE_DEMO_CONTENT` to require `==='true'`; set false in Vercel beta env; drop the demo-community load fallback for authed real users.
- **Acceptance:** two real accounts complete proof → visible-to-peer → structured feedback → notification on real data; no `is_demo` rows in a real session; self/duplicate feedback rejected at the DB; private image proof not anon-readable (signed URL only). **Negative tests for all four.**

## Package 1 — Development safety
- Regenerate `.env.example` from a `process.env` grep (R10); delete dead flags (R20 optional-remove).
- Add `eslint` + `eslint-config-next` + `lint` script; add `vitest`. **Split checks:** a `checks` script runs only the PURE `check-*.ts`; a separate `checks:live` runs the Supabase-dependent ones (`check-content-mastery`, `content:verify`) which need `SUPABASE_*` env — only `checks` (+ lint/typecheck/build) goes into required PR CI (no service-role secret / live DB in default CI). Add security/negative tests (below).
- Minimal GitHub Actions CI: install → `typecheck` → `lint` → `build` → `checks`; PR template; gitleaks secret scan (R22).
- Document canonical migration apply order + a re-apply idempotency check (R23); move loose `supabase/*.sql` out.
- **Acceptance:** CI green on a PR; `.env.example` lets a fresh operator boot the app gated; secret scan runs.

## Package 2 — Canonical data model reconciliation *(inspect-first, minimal)*
- Do **not** create parallel duplicates. Document the name map (canonical ↔ real) in-repo. Add only the genuinely missing tables the beta needs: `proof_drafts` (P6), `moderation_actions` (P10), a `selected_reviewers` table + RLS (needed so the `selected_reviewers` visibility from Package 0 can actually grant scoped access — until it lands, that value fails closed to owner-only; built with the feedback flow in P8), and a thin `feature_flags` kill-switch (optional). Everything else stays as-is with a documented alias.
- **Acceptance:** a single source-of-truth model doc; no duplicate concepts introduced; migrations validate.

## Package 3 — Authorization & storage security *(mostly folded into P0)*
- Finish what P0 starts: block-check via SECURITY DEFINER helper both directions (R12); attachment-ownership RLS; confirm owner-only drafts/notifications/reports; soft-delete that retains moderation evidence.
- **Add negative tests:** cross-user draft read/write, cross-user progress, cross-user notification, attachment ownership, self-feedback, duplicate feedback, deleted-proof access, blocked-relationship access, unauthorized admin action, unsafe redirect. (Journeys C & D.)
- **Acceptance:** every negative test fails access as expected in CI.

## Package 4 — Authentication & onboarding
- Password reset (R6): `resetPasswordForEmail` → `/auth/reset` → set-new-password; rate-limit.
- Account deletion (R9): self-serve → server route anonymizes/removes owned rows while retaining moderation evidence → `auth.admin.deleteUser`; document retention.
- Safe redirects (whitelist internal `/…`, reject `//`); Google button gated by flag (R20); expired-session + duplicate-account handling verified.
- **Atomic invite redemption** (R27): a SECURITY DEFINER RPC doing `update … set use_count = use_count + 1 where id = $1 and use_count < max_uses returning`, granting access only when a row is returned.
- **Gate AI off by default** (R29): `isAiEnabled()` requires `=== "true"` + a configured endpoint before rendering AI cards — also closes the AI-text-logging exposure (R28).
- Onboarding: persist/resume; final action opens the **recommended starter practice** (`resolveStarterPromptId`), not `/home`. Sequence: promise → direction → comfort → default proof privacy → recommended practice.
- **Acceptance:** a new user registers, onboards <2 min, lands in a real practice; forgot-password recovers; deletion erases + retains evidence.

## Package 5 — Practice system *(largely done — verify + polish)*
- 120 real practices already exist (≥5 directions, ≥15 polished) with idempotent slug seeds. Verify discover/direction/detail/active pages, start/resume/complete, private-reflection option, clean transition into proof, and surface the `proof_submitted`/`feedback_received` states.
- **Acceptance:** start → leave → resume → complete survives refresh; states render.

## Package 6 — Proof drafts & text proof
- `proof_drafts` (owner-only RLS, one active per user+practice) + autosave + last-saved + retry + resume + discard + conflict protection + idempotent draft→proof; failure preserves the draft (R14).
- **Acceptance:** draft survives navigation/refresh; convert is idempotent; ≥1 valid element required.

## Package 7 — Image attachments *(depends on P0.2)*
- Max 3 images; preview / reorder / remove / progress / retry / cancel; MIME + extension + magic-byte validation client **and** server (R19); size/count limits; private storage + signed URLs; abandoned-upload cleanup; attachment-ownership validation. **No audio/video** (flag-off).
- **Acceptance:** 3-image proof submits; a failed upload retries without losing text; other users cannot fetch the object.

## Package 8 — Feedback loop
- Required fields: what worked · one useful suggestion · encouragement (+ optional try-this-next); recheck eligibility on submit; queue exclusions complete (own/reviewed/blocked/deleted/hidden/inaccessible/closed/private/selected-for-unselected).
- **Ranking as a pure, unit-tested function** implementing `feedback_need*0.35 + direction_relevance*0.25 + comfort_match*0.15 + recency*0.15 + reviewer_eligibility*0.10 − seen_penalty − reviewed_penalty`, zero-feedback proofs strongest; **deterministic pagination, no infinite scroll** (R13).
- **Acceptance:** Journey B end-to-end on real data; zero-feedback proofs surface first; self/dup blocked (from P0.3).

## Package 9 — Notifications & private progress
- Add the missing notification types incl. **moderation-decision** (R11) and draft-reminder/recommended-practice; notification failure must not corrupt the originating action (already trigger-based — verify).
- Private progress shows practices/proofs/feedback/useful-given/current-direction/recent-activity/suggested-next; implement the **next-best-action priority** (resume active → finish draft → review new feedback → give feedback → start recommended).
- **Acceptance:** feedback fires a notification; progress updates; next step reflects the priority ladder.

## Package 10 — Safety & moderation *(mostly shipped — close gaps)*
- Add: hide-from-personal-view, delete-own-proof, remove-attachment, change-visibility, close-feedback-request, **profile reporting**, account suspend/unsuspend, `moderation_actions` audit trail (R21/R24), reconcile report categories to the brief.
- **Report-target visibility** (R25): `submit_report` must verify the reporter can read the target before accepting/enforcing.
- **Passport visibility** (R26): enforce `user_settings.profile_visibility` on `/member/[id]` (do not render a private member's passport to others).
- **Acceptance:** Journey E (report → admin review → hidden → user-facing state updates → audit row exists).

## Package 11 — Analytics & operational visibility
- Emit the full typed event list (add onboarding step events, `practice_resumed`, `proof_draft_created`, `feedback_queue_viewed`, `notification_opened`, D1/D7 return). Never capture proof/feedback text (already clean — keep).
- Compute the admin beta metrics **from `beta_events`** (funnel, 48h coverage, usefulness, full-loop, D1/D7, medians, auth/upload failure, reports/blocks) (R18).
- **Acceptance:** admin dashboard shows real funnel + coverage; no text in events.

## Package 12 — Hardening & release
- Error boundary (R7); complete loading/empty/partial/full-failure/retry/offline/permission-denied/expired/deleted-target states; idempotent-retry protection.
- A11y: contrast fixes (R15), keyboard core loop, focus, screen-reader labels, reduced-motion (incl. Framer), ≥44px targets, 320px→desktop.
- Remove legacy routes/theme + dead code (R8, Should-remove bucket) once unreferenced.
- Security review, performance review, storage-cleanup review, manual QA matrix, seeded **staging** env, **core-loop E2E** (Journeys A–E), rollback + incident + support docs.
- **Acceptance:** the full Release Gate (see `pre-beta-release-scope.md`) passes, incl. 3 outside testers completing the loop unaided.

---

## Dependency graph (critical path)

```
P0 (unblock)  ──►  P4 auth/onboarding ──►  P6 drafts ──►  P7 attachments ──►  P8 feedback ──►  P9 notif/progress ──►  P12 hardening/release
   │                                                   ▲
   └─► P1 dev-safety (parallel) ─► P3 authz tests ─────┘
                                   P2 model doc (parallel)
   P10 safety + P11 analytics: parallel after P0, before P12
```

**First branch to open:** `feat/core-loop-unblock` (Package 0). It is the single change that makes the real beta loop possible, and it is additive/reversible.
