# Collective — Pre-Beta Architecture Audit

**Date:** 2026-07-07
**Branch:** `docs/pre-beta-audit`
**Scope:** Read-only inspection of the real architecture and implementation state ahead of a founding-cohort beta. No refactoring performed. Every claim is cited to a file, migration, or live database check.

> Method: 11 evidence-based subsystem audits over the actual codebase + live Supabase project `qfzguujtjloskyxcdbon`, cross-checked by the lead engineer. The two Critical findings were re-verified by hand (see Risk Register R1/R2).

---

## 1. Framework, language, rendering

- **Framework:** Next.js **16.2.6** (App Router). `next.config.mjs` sets `poweredByHeader:false` and security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- **Language/typing:** TypeScript with `tsconfig.json` `"strict": true`. `noUncheckedIndexedAccess` is **not** enabled. `next build` type-checks by default; `npm run typecheck` = `tsc --noEmit`.
- **UI:** React **19.2.6**, Tailwind CSS, a hand-rolled cream/gold token system in `app/globals.css`. Framer Motion for entrances.
- **Rendering boundaries:** The beta app is overwhelmingly **client components** — `components/beta/AppStateProvider.tsx` is a large client context that loads all user data from Supabase on the client. Server usage is limited to a few `runtime = "nodejs"` API routes (`app/api/admin/*`, `app/api/google/*`) and marketing/legal pages. Implication: no server-render auth gate; **RLS is the real authorization boundary** (see §5).

## 2. Routing & protected routes

- App Router file routes under `app/`. The beta lives under `/home`, `/practice`, `/feed`, `/passport`, `/proof/*`, `/notifications`, `/settings/*`, `/admin/*`, `/member/[id]`, plus marketing `/`, `/demo`, `/privacy`, `/terms`.
- **Protection is client-only:** `components/beta/AppShell.tsx` holds `protectedPrefixes` and redirects unauthenticated users via `router.replace("/auth")` in a `useEffect`. **There is no `middleware.ts`.** A protected route's data is still safe because RLS gates the queries, but the *route shell* renders client-side before redirect.
- **Duplicated legacy routes:** a parallel legacy dark theme (`components/AppShell.tsx`, `components/ui/*`, `globals.css` lines ~41–253) is still URL-reachable at `/dashboard`, `/paths`, and ~6 others, several with **mocked** data (see Feature Inventory → Mocked / Duplicated).

## 3. Authentication

- **Provider:** Supabase Auth (email/password + Google OAuth). Not being replaced.
- **Flows present:** email signup/login/logout (`AppStateProvider.signUpWithEmail/signInWithEmail/signOut`), session persistence + auto-refresh via the Supabase browser client, `onAuthStateChange` rehydration, and a proper server-side nonce+state Google handshake (`app/api/google/*`).
- **Idempotent profile bootstrap:** DB trigger `handle_new_user` (`on conflict do nothing`) + a client `ensureProfile` fallback in `betaRepository.ts`.
- **Invite gate:** `NEXT_PUBLIC_REQUIRE_INVITE_CODE` → `lib/beta/redeemInvite.ts` + `/access`; `beta_invites` table (migration 022). **Redemption is not atomic** (R27) — concurrent redeems can over-consume a capped invite.
- **Gaps (Package 4):** **no forgot-password / reset flow** (change-password needs an active session), **no account-deletion / erasure path**, onboarding does not persist/resume and finishes on `/home` rather than opening a real practice, and the Google button renders whenever Supabase is configured (the documented `NEXT_PUBLIC_GOOGLE_ENABLED` flag is never read). See R6, R9, R20.

## 4. Database & migrations

- **Store:** Supabase Postgres. **33 migration files, `010`–`041`**, additive. ~41 real tables.
- **Core tables (real names):** `profiles` (010), `directions`/`practices` (013), `proofs` + `proof_attachments` (010), `feedback` (015), `contributions` (024), `notifications` (020), `trust_events` (023/027), `blocked_users` + `introduction_requests` + `user_settings` (034/037), `practice_tips` + `tip_reports` (028), `beta_invites` + `beta_events` (022), `reports` (040), plus mastery content loaded from `content/collective_content_mastery_seed.v1.json` (6 directions / 24 skills / 120 levels).
- **Divergence from the brief's canonical names:** most concepts exist under different names, and several canonical tables **do not exist**: `practice_steps`, `proof_drafts`, `selected_reviewers`, `feedback_requests`/`feedback_responses`/`feedback_acknowledgments` (collapsed into `feedback` + `contributions`), `moderation_actions`, `activity_events`, `analytics_events` (= `beta_events`), `admin_roles` (= `profiles.role` + `ADMIN_EMAILS`), `feature_flags` (= env vars only). See Feature Inventory → Missing and the Build Plan Package 2.
- **Migration hygiene:** numbering collisions — two `030_*` and two `031_*` files, and a missing `026` — create apply-order ambiguity for a fresh environment; loose ad-hoc SQL (`COPY_PASTE_ALL_SQL_FOR_PHONE.sql`, `MAKE_ME_ADMIN.sql`) sits in `supabase/` outside `migrations/`. No migration-validation tooling. See R23.

## 5. Authorization (RLS) & storage

- **RLS is strong and is the real authz layer.** Enabled on every user-data table (011/019/020/034/040). Highlights: proofs are owner-or-cohort with block- and moderation-awareness (038/039); feedback hides `pending`/`removed` to non-authors; notifications/reports are owner/service-only; trust and moderation columns are locked to server-only writes (023/036/041); admin is server-enforced via `profiles.role` + `ADMIN_EMAILS` (`lib/supabase/serverAuth.ts`); `submit_report` guards self/demo/duplicate reporting.
- **Two authorization holes (Critical):**
  - **R1 — visibility taxonomy mismatch.** `submitProof` hardcodes `visibility: "private"` on *every* real proof (`AppStateProvider.tsx:598`); there is no visibility picker; the cross-member SELECT policy requires `visibility='cohort'` (`039:170`), which **only demo rows use**. Net: real proofs are invisible to other members, so the peer-feedback step cannot occur on real data, and by extension block/report enforcement on the feed is unreachable for real content. Verified by hand.
  - **R2 — public proof-media bucket.** Bucket `collective-proof-media` is `public: true` (verified via `storage.buckets`), and media is served with `getPublicUrl` (`betaRepository.ts:228`). Attachments are anon-readable by URL with no per-user authorization; paths are only mildly obscured (`userId/proofId/timestamp-filename`).
- **Missing guards:** no `CHECK(author_id <> recipient_id)` and no `UNIQUE(author_id, proof_id)` on `feedback` → self-feedback and duplicate-feedback both mint trust (R3/R4). Cross-user block relies on an inlined subquery over `blocked_users` whose own RLS can shadow the check in the owner→viewer direction (R12).

## 6. Storage ownership semantics

- Single bucket `collective-proof-media` (public). Upload helper lives in `lib/media/*` and `lib/mediaUpload.ts` (which still carries TODOs to "keep the bucket private"). A private-bucket signed-URL hook exists (`lib/media/useSignedMediaUrl.ts`) but proof media uses the public path. Changing bucket ownership/visibility is a **STOP-and-document** action per the brief; the plan proposes a private bucket + signed URLs in Package 7 (R2).

## 7. Server actions / API routes / RPC / jobs

- **API routes:** `app/api/admin/beta` (metrics/moderation read), `app/api/admin/moderation` (RPC actions), `app/api/admin/app-feedback`, `app/api/google/*`. All admin routes gate on `isAdminUser`.
- **RPCs (SECURITY DEFINER):** trust (`record_practice_trust`, `mark_feedback_helpful`, `_insert_trust_capped`, `_recompute_profile_counts`), moderation (`clear/remove/limit/hold_content`, `submit_report`), notification fan-out triggers (020). All revoked from `public/anon/authenticated` except the intended member-callable ones.
- **Background jobs:** **none.** No cron/edge-function infra → draft reminders, day-1/day-7 return events, and abandoned-upload cleanup have no home (R-notifications, R-analytics).

## 8. Validation, state, error handling, logging

- **Validation:** `zod` 3.25 present; used in the AI layer. Proof/attachment validation is **client-only** (MIME prefix + size from browser-supplied `file.type`), no server/DB re-validation (R19).
- **State:** one large React context (`AppStateProvider`) + TanStack Query in the media layer. No server state framework.
- **Error handling:** graceful in-flow (text preserved on attachment failure) but **no React error boundary** — no `app/error.tsx` / `app/global-error.tsx`. Any render throw in a client screen white-screens the app (R7).
- **Logging:** `logBetaEvent` writes typed events to `beta_events`; **no proof/feedback text is logged to `beta_events`**. However, the AI path DOES persist draft text: `AiSupportCard` passes `inputSummary = body` and `persistAiInteraction` stores it in `ai_interactions.input_summary` (R28) — so the "never logged" guarantee holds only for `beta_events`, not for AI interactions. No structured server logging/observability provider.

## 9. Analytics

- `beta_events` (022) + `logBetaEvent()` + `BetaEventType`. ~11 of ~14 declared events fire; taxonomy is thinner than the brief's required list (missing `onboarding_started/step_completed`, `practice_resumed`, `proof_draft_created`, `feedback_queue_viewed`, `notification_opened`, `day_1_return`/`day_7_return`). **The admin route never reads `beta_events`** — it computes static table counts, not the funnel/coverage/return metrics (R18). Marketing `trackEvent()` has no provider wired (silently dropped).

## 10. Testing, CI/CD, deployment

- **Tests:** no runner (no jest/vitest/playwright installed, no `test` script, zero `.test/.spec/.e2e` files). 16 hand-written `scripts/check-*.ts` assert-scripts exist (moderation severity, feed ranking, mastery, content) but only 2 are wired to npm; the rest run only via manual `npx tsx` (R16).
- **CI/CD:** **none** (no `.github/`, no workflows, no PR template). Only manual `npm run typecheck`.
- **Deployment:** Vercel (`.vercelignore` trims android/legacy/docs). Prod at `thecollective-gh1a.vercel.app`. Env configured in Vercel dashboard.
- **Env config:** `.env.example` documents **8** vars; the app reads **~20** (missing the invite gate, `ADMIN_EMAILS`, demo/AI toggles). A live `service_role` JWT sits in the working-tree `.env.local` (gitignored, not committed); no secret-scanning guard (R10, R22).

## 11. Feature flags (as-built)

| Flag | Read at | Default | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_REQUIRE_INVITE_CODE` | `redeemInvite.ts` | off | The real closed-beta gate; **undocumented** in `.env.example`. |
| `NEXT_PUBLIC_DEMO_SEED` | `betaData.ts:9` | **ON** (`!== 'false'`) | Fabricated community seed; must be OFF for beta (R5). |
| `NEXT_PUBLIC_INCLUDE_DEMO_CONTENT` | `betaRepository.ts:322` | **ON** | `is_demo` rows in the real feed; must be OFF (R5). |
| `NEXT_PUBLIC_COLLECTIVE_AI_ENABLED` / `_MOCK_MODE` / `_ENDPOINT` | `aiService.ts` | mock/off | AI runs mock-by-default; keep hidden until configured. |
| `ADMIN_EMAILS` | `serverAuth.ts` | empty | Admin allowlist; **undocumented**. |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | *nowhere* | — | Documented but **never read**; button always shows (R20). |
| `NEXT_PUBLIC_CLOSED_BETA_MODE`, `NEXT_PUBLIC_ENABLE_DEV_TOOLS` | *nowhere* | — | Dead; remove. |

## 12. Mobile & accessibility

- Mobile-first 430px phone-frame; brand tokens match the brief almost exactly (bg `#FFF8EE`, card `#FFFDF8`, gold `#F2A900/#FFB000/#FFF1C7`, text `#111111/#6E6E6E`, divider `#EFE7D8`, success `#22C55E`, ~28px sheet radius). Good `focus-visible` rings, aria labels, disabled states, keyboard order on core flows.
- **A11y gaps:** white 14px on the gold CTA/FAB ≈ **2:1** (fails WCAG AA); `#9B958B` microcopy ≈ 2.7:1 used for real information; header icon buttons 40px (<44px target); the reduced-motion gate covers CSS but not Framer JS; 320px width not verified. See R15.

---

## Architecture verdict

The **core loop is genuinely built** — real email auth, a 120-level mastery ladder, end-to-end text proof, structured feedback, realtime notifications, a private passport, and (just-shipped) blocking + report→tiered-hide + an admin queue with server-locked writes. The stack is sound and should be **preserved**, not replaced.

It is **not beta-ready as wired**, and the blocker theme is *enforcement/exposure around the loop, not the happy path*. One change unlocks the peer step on real data (fix the `visibility` taxonomy, R1); a small cluster of additional fixes (private media bucket R2, self/duplicate-feedback guards R3/R4, demo-off R5, password reset R6, error boundary R7, legacy-route removal R8) clears the critical/high beta blockers. Full detail in `pre-beta-risk-register.md`; sequencing in `pre-beta-build-plan.md`.
