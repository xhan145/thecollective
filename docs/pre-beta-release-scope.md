# Collective — Pre-Beta Release Scope

**Date:** 2026-07-07 · **Branch:** `docs/pre-beta-audit`

The resolved founding-cohort scope, reconciled with the audited build state. Status legend: ✅ done · 🟡 partial · ❌ missing · 🔒 flag-off · 🗑️ remove.

---

## Release-critical (must ship & pass the gate)

| Item | Status | Notes / gap |
|---|---|---|
| Email signup & login | ✅ | Working. |
| Logout | ✅ | Working. |
| Session persistence | ✅ | Auto-refresh via Supabase client. |
| Password reset | ❌ | **R6** — Package 4. |
| Account deletion | ❌ | **R9** — Package 4 (retain moderation evidence). |
| Protected routes | 🟡 | Client-only; RLS is the real gate. |
| Idempotent profile bootstrap | ✅ | `handle_new_user` + `ensureProfile`. |
| Onboarding | 🟡 | No resume; must end on a real practice — Package 4. |
| Five directions | ✅ | 6 directions shipped. |
| ≥15 production practices | ✅ | 120 mastery levels seeded. |
| Practice states & progress | 🟡 | Collapsed states — Package 5. |
| Text proof | ✅ | End-to-end, resilient. |
| Up to 3 image attachments | 🟡 | Single only — Package 7. |
| Proof drafts & autosave | ❌ | **R14** — Package 6. |
| Private / selected-reviewer / beta-community visibility | ❌ | **R1 Critical** — Package 0. |
| Structured feedback | 🟡 | Missing "encouragement" field — Package 8. |
| Feedback eligibility & queue | 🟡 | Exclusions + ranking incomplete — **R13** Package 8. |
| In-app notifications | 🟡 | Core types fire; moderation type missing — **R11** Package 9. |
| Private progress dashboard | ✅ | Passport; next-best-action ladder pending — Package 9. |
| Reporting | 🟡 | Proof/feedback; profile pending; report-target visibility not enforced — **R25** Package 10. |
| Blocking | 🟡 | Both-direction RLS, but owner→viewer RLS shadow — **R12** Package 3. |
| Proof deletion & visibility controls | ❌ | Package 10. |
| Minimal admin moderation | ✅ | Queue shipped; audit trail pending — **R21**. |
| Typed funnel analytics | 🟡 | Events partial; unread by admin — **R18** Package 11. |
| Complete UI states | 🟡 | No error boundary — **R7** Package 12. |
| Mobile & a11y remediation | 🟡 | Contrast/targets/320px — **R15** Package 12. |
| Security tests | ❌ | Package 1/3 (negative tests). |
| Core-loop E2E tests | ❌ | Package 12 (Journeys A–E). |
| Release/rollback/incident/support docs | ❌ | Package 12. |
| **Integrity: no self-feedback / no duplicate feedback** | ❌ | **R3/R4 Critical-adjacent** — Package 0. |
| **Private proof media not public** | ❌ | **R2 Critical** — Package 0. |
| **Demo data off in beta** | ❌ | **R5** — Package 0. |

## Feature-flagged & disabled by default (not gate blockers)

| Item | Status |
|---|---|
| Audio proof | 🔒 restrict to text+image allowlist |
| Video proof | 🔒 same |
| Google login | 🔒 gate on `NEXT_PUBLIC_GOOGLE_ENABLED` (default off) — **R20** |
| Transactional feedback emails | 🔒 no send path; keep off (`RESEND_API_KEY` documented but unused) |
| Trust-state display | 🔒 keep hidden (3 trust systems unconsolidated — **R17**) |
| Founding Cohort product mode | 🔒 off |
| AI assistance | ⚠️ **exposed by default** today — `isAiEnabled()` is true when unset (R29) and cards render + log text (R28). Must gate OFF + require endpoint before invites. |

## Explicitly out of scope (do not build; remove/disable if exposed)

Direct messages · groups · public comments · followers · public likes · leaderboards · competitive streaks · payments · coaching marketplace · creator monetization · user-created practices · public numeric trust · complex recommendation models · persistent AI agents · practice CMS · broad skill expansion.

**Exposed-and-must-address:** the legacy `/dashboard` route shows a **hardcoded numeric trust badge** (public numeric trust) — remove/redirect (**R8**). **`/cohorts*` and `/badges` are live, reachable routes** (create/join flows; badges linked from passport + proof submit) though cohorts/achievements are out of founding-beta scope — remove or gate before testers arrive (extends R8), do not merely treat as dormant. AI-lab tables can stay dormant if never surfaced.

---

## Release Gate (verbatim checklist — all must be true before invites)

- [ ] Signup works without developer help
- [ ] Password reset works — **R6**
- [ ] Sessions persist
- [ ] Onboarding opens a real practice — Package 4
- [ ] Practice start/resume/completion work
- [ ] Text proof succeeds
- [ ] Image proof succeeds — Package 7
- [ ] Failed uploads can be retried
- [ ] Drafts survive navigation & refresh — **R14**
- [ ] Private proof is inaccessible to other users — **R1/R2 (both Critical)**
- [ ] Structured feedback works
- [ ] Feedback notification works
- [ ] Progress updates
- [ ] Block works
- [ ] Report works
- [ ] Admin moderation works
- [ ] Core funnel analytics work — **R18**
- [ ] Mobile core loop works
- [ ] Keyboard core loop works — **R15**
- [ ] No P0/P1 bugs remain
- [ ] No known Critical/High security issue remains — **R1–R11 cleared**
- [ ] Backup & rollback procedures documented
- [ ] Three fresh outside testers complete the loop without live help

**Not gate blockers:** audio, video, trust states, AI, promotional email, cohort mode.

## Current gate status

**NOT READY.** The happy-path loop is built, but **2 Critical + 9 High beta-blocking issues** (R1–R11) stand between it and the gate — dominated by the visibility mismatch and public media bucket (which break the real peer step), the two feedback-integrity guards, demo-on, password reset, error boundary, and legacy-route exposure. **Package 0** clears the Criticals and the top integrity holes and is the correct first branch. See `pre-beta-build-plan.md`.
