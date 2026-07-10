# Collective — Pre-Beta Feature Inventory

**Date:** 2026-07-07 · **Branch:** `docs/pre-beta-audit`

Findings sorted into the eight required buckets. Items are the current build state, not aspirations. Cross-references (Rn) point at `pre-beta-risk-register.md`.

---

## ✅ Working (built, real, and safe on the happy path)

- Email signup / login / logout + session persistence & auto-refresh; Google OAuth server-side handshake.
- Idempotent profile bootstrap (`handle_new_user` trigger + `ensureProfile` fallback).
- **120 real mastery levels** across 6 directions / 24 skills, stable dot-slugs, idempotent seed (`seed-content-mastery.ts`).
- Sequential mastery ladder UI (level unlock gating, server-enforced by trigger, migration 035).
- Text-proof end-to-end (optimistic submit; text preserved if an attachment fails).
- Structured feedback capture (clarity / useful / next-step notes, migration 015).
- Realtime notifications for proof / feedback / marked-useful via SECURITY DEFINER triggers (020) + unread badge + notifications center.
- Report → tiered server-side hide (severe = 1 credible reporter, mild = 3 distinct) + `spam_signal`, column-locked (040/041).
- Admin moderation queue (dismiss / limit / remove / hold) via SECURITY DEFINER RPCs (039–041).
- Private passport progress dashboard (own-row RLS).
- Trust ledger: append-only, server-only writes, daily caps, earn-only after 036 (023/027/036).
- Pure, unit-tested `rankFeed` baseline (own-proof exclusion, demo-below-real, level-matched tags).
- Brand-accurate cream/gold token system with solid core-flow loading/empty/error/success states.

## 🟡 Partial (present but incomplete against the beta bar)

- **Onboarding** — steps exist but no persistence/resume; finishes on `/home`, not a real practice (should call `resolveStarterPromptId`).
- **Protected routes** — client-only redirect, no `middleware.ts` (RLS is the real gate).
- **Image attachment** — single attachment only; no max-3 / reorder / progress / retry / cancel.
- **Practice state machine** — collapsed to locked/available/complete; no `proof_submitted`/`feedback_received` surfaced states.
- **Feedback fields** — omit an explicit "encouragement" field; the AI helper mis-maps encouragement into next-step.
- **Contribute queue** — exclusions incomplete (blocked / moderation / demo / already-contributed not all applied) and not ranked by the brief's formula.
- **Reduced-motion** — gate covers CSS animations, not Framer-motion JS.
- **`submit_report` demo-target error** — falls through to generic client copy.
- **Block / unblock** — shipped, but the owner→viewer block check has an RLS shadow (R12), so it is not fully enforced — **Partial/Unsafe**, not Working.
- **Invite gate** — works, but redemption is **not atomic** (R27 race), so a capped invite can be over-redeemed — **Partial**, not Working.
- **Header icon buttons** — 40px (<44px touch target).

## 🟪 Mocked (fabricated/hardcoded values facing a user)

- `/dashboard` legacy route — hardcoded stats (`TrustBadge 62`, "3 days").
- Home mobile bell — hardcoded "1", links to `/feed` instead of a live count → `/notifications`.
- Notification-settings toggles (reminders / digests / loop-completed) — honored by nothing.
- `RESEND_API_KEY` in setup checklist — no email send path exists.
- AI features — run **mock-by-default**, and are **exposed by default** (`isAiEnabled()` is true when the flag is unset, R29) and stay rendered even when unconfigured; AI interaction text is also persisted to `ai_interactions.input_summary` (R28).
- Marketing `trackEvent()` — no analytics provider wired; events silently dropped.

## ⛔ Unsafe (security / privacy / integrity risk)

- **Private-intended proof media on a public, anon-readable bucket** (`collective-proof-media`, `public:true`) served via `getPublicUrl` (R2, Critical).
- **`visibility='cohort'` RLS mismatch** — real proofs write `private`, so real content is invisible and feed-level safety enforcement is unreachable (R1, Critical).
- **Self-feedback unguarded** (no client/server/DB check) → self-minted trust (R3).
- **Duplicate feedback unguarded** (no `UNIQUE(author_id, proof_id)`) → trust farming + notification spam (R4).
- **`NEXT_PUBLIC_DEMO_SEED` defaults ON** → fabricated community leaks into a live beta (R5).
- **`NEXT_PUBLIC_INCLUDE_DEMO_CONTENT` defaults ON** → `is_demo` rows in the real feed (R5).
- **Cross-user block** not enforced in the owner→viewer direction (RLS subquery shadow) (R12).
- **White-on-gold CTA (~2:1)** and `#9B958B` microcopy (~2.7:1) fail WCAG AA (R15).
- **Live `service_role` JWT** in plaintext `.env.local`, no secret scanning (R22, currently untracked).
- **Client-only, spoofable MIME validation** over a public bucket (R19).

## ❓ Missing (named deliverable does not exist)

- Password-reset / forgot-password flow (R6).
- Account-deletion / right-to-erasure path (R9).
- Proof drafts + autosave / resume / discard (R14).
- Delete-own-proof + post-publish attachment/visibility change (Package 10).
- Moderation-decision notifications to affected members (R11).
- Next-best-action priority engine (home "next step" = recommended only).
- React error boundary (`error.tsx` / `global-error.tsx`) (R7).
- CI + lint + test framework (R16).
- Ranked feedback queue implementing the `feedback_need` formula (R13).
- Profile reporting, account suspend/unsuspend, moderation audit trail (R21, R24).
- Admin user-search; operational funnel / coverage / return metrics (R18).
- Reminder / cron / edge-function infrastructure.

## 🔁 Duplicated (parallel concepts to consolidate)

- Legacy dark theme (`components/AppShell` + `components/ui/*` + `globals.css` 41–253) vs the beta cream theme (R8).
- Two proof/practice stacks (beta vs legacy; a broken `/proof/new?prompt=` link).
- **Three trust systems** (`lib/trust.ts`, `lib/betaTrust.ts`, `lib/trust/trustV2.ts`) with different tiers/weights (R17).
- Two feed rankers (live `rankFeed` vs dead `rankHomeFeed`/`scoreFeedItem`).
- Three "feedback"-named tables (`feedback`, `app_feedback`, `ai_user_feedback`).
- Two peer-help models (`feedback` vs `contributions`).
- `/dashboard` vs `/passport` progress.
- `proofModels` (snake_case) vs `betaTypes` (camelCase) domain models.

## 🗑️ Should remove / disable (safe to delete or gate for beta)

- Dead flags `CLOSED_BETA_MODE`, `ENABLE_DEV_TOOLS`, `GOOGLE_ENABLED` (read nowhere).
- Dead `rankHomeFeed` / `scoreFeedItem` / `enforcePassiveToActiveFlow`.
- Legacy component library (`ProofCard`/`TrustBadge`/`PathCard`) + `lib/data.ts` / `proofData.ts` / `proofModels.ts` once the legacy routes are removed.
- Unused `Card` `asButton` branch (focusable, no key handler).
- Three never-emitted beta event types (`signup_started` / `onboarding_started` / `practice_started`).
- Stale `BETA_QA.md` claim of an `/admin/beta` funnel that does not exist.
- **Surfaced out-of-scope routes** — `/cohorts`, `/cohorts/new`, `/cohorts/[id]` (create/join) and `/badges` (linked from `/passport` + proof submit) are live for testers though cohorts/achievements are out of founding-beta scope; remove or gate (extends R8).

## ⏸️ Intentionally delayed (flag-and-off, keep code dormant)

- AI features — gate behind `isAiEnabled` + a configured key, default hidden.
- Audio / video proof — restrict to a text+image allowlist for beta.
- Google login — flag off until configured.
- Cohorts / achievements / AI-lab tables — out of founding-beta scope.
- Multi-image (max-3) attachments with reorder/progress — target Package 7.
- `feature_flags` runtime kill-switch table — nice-to-have, not a blocker.
- Practice step-level granularity / full 5-state machine.
- Moderation appeals + hide-from-personal-view dismiss.

---

### Headline

The **core-loop features exist and mostly work in isolation** (Working bucket). Beta-readiness is blocked by the **Unsafe** and **Missing** buckets — chiefly the visibility mismatch and public media bucket (which together break the real peer step), plus the two feedback-integrity guards and the demo-data default. The **Duplicated/Should-remove** buckets are cleanup that reduces beta surface area and confusion but are mostly not blockers.
