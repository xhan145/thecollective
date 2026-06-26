# Collective

> **Small steps. Real progress.** A calm, beginner-safe, anti-clout PWA where people stop *watching* self-improvement content and start *practicing* — and submitting proof.

Collective is a mobile-first progress-and-contribution app: pick a direction, do a small practice, post **proof**, get **useful feedback**, and earn **trust** by helping others. No likes, no follower counts, no leaderboards — energy lives in the work, not the clout.

**Live:** [thecollective-gh1a.vercel.app](https://thecollective-gh1a.vercel.app) (closed beta, invite-gated) · auto-deployed from `main` via Vercel.

---

## What's inside

The app runs the full loop on live Supabase (Postgres + RLS + SECURITY-DEFINER RPCs + Realtime + Storage):

- **Personalized onboarding → practice** — a short onboarding (direction, goal, starting level, why-now, cadence) tailors which practices and proof prompts you see.
- **Multimodal proof** — text, image, video, audio, docs/PDF, links, and checklist/reflection proofs, with beginner-safe visibility.
- **Level-matched feed** — ranks proofs by shared interest × *relative earned level* (same and slightly-ahead, plus some behind to help) — watching others learn feels productive, never doomscroll.
- **Trust System V2** — four earned dimensions (Practice / Feedback / Consistency / Contribution) → tiers **New · Practicing · Reliable · Helpful · Contributor**. Trust is earned through SECURITY-DEFINER RPCs and can never be minted by a client.
- **Contributions** — members help on open proofs; the owner accepts a contribution (which earns trust).
- **Knowledge tips** — practice-anchored tips, gated to people who completed the practice, with layered safety + report-to-admin.
- **Cohorts** — focused practice groups (public / request-to-join / invite-only) with a per-cohort feed and owner moderation.
- **Spam enforcement** — reversible, server-stamped content quarantine that self-heals; nothing shames a misfiring beginner.
- **AI support layer** — real OpenAI-backed help (practice prep, reflection, peer-feedback coaching, summaries) behind a deterministic safety gate. AI is a *helper, not an authority* — it never grades users, decides trust, or auto-submits anything. Falls back to a safe mock with no key.
- **Engagement** — Useful, Save for practice, Learn-from, peer notes, notifications (Realtime), light + dark mode.

Design language: **Warm Proof-Based Growth** — 80% calm/trustworthy, 15% expressive user content, 5% playful-nostalgia. No leaderboards, no follower counts, no shame-streaks.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase · OpenAI · deployed on Vercel. Mobile-first PWA in a max-`430px` phone frame; bottom nav is **Home · Practice · Feed · Profile** with a center proof button.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build
```

The app runs in **demo mode** with no keys (seeded demo data, local persistence). Connect Supabase + OpenAI for the full experience.

## Configuration

Copy `.env.example` to `.env.local` (UTF-8 **without** a BOM) and fill in Supabase + OpenAI values. The full reference — which vars are public vs server-only secrets — is in **[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)**.

Key points: `NEXT_PUBLIC_SUPABASE_*` are public; `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are **server-only** (never `NEXT_PUBLIC_`). With no `OPENAI_API_KEY`, the AI layer and tip moderation degrade to a safe regex-only mock.

## Database

Additive SQL migrations live in `supabase/migrations/` (**010 → 030**). Apply them in order. Highlights: `023` trust integrity RPCs · `024` contributions · `025` personalization · `027` Trust V2 · `028` knowledge tips · `029` spam enforcement · `030` cohorts. Earlier migrations (010–029) are never edited — only added to.

Running the closed beta? Start with **[docs/BETA_QA.md](docs/BETA_QA.md)** for env vars, migration order, invite-code setup, the `/admin/beta` dashboard, storage notes, and the manual QA checklist.

## Routes

Core: `/` · `/auth` · `/access` (invite gate) · `/onboarding` · `/home` · `/directions` · `/practice` · `/proof/new/[promptId]` · `/proof/[id]` · `/proof/[id]/feedback` · `/feed` · `/profile` (+ `/profile/saved`, `/profile/learning`) · `/notes` · `/notifications` · `/settings` · `/account`.

Features: `/contribute` · `/cohorts` (+ `/cohorts/new`, `/cohorts/[id]`). Admin: `/admin/beta`, `/beta-feedback-review`.

## PWA install (iPhone)

Open `/install` in Safari → Share → **Add to Home Screen** → Add.

## Documentation

- [docs/BETA_QA.md](docs/BETA_QA.md) — beta operations + manual QA
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) — environment variables
- [docs/FEED_ALGORITHM.md](docs/FEED_ALGORITHM.md) — feed ranking
- [docs/AI_SUPPORT_LAYER.md](docs/AI_SUPPORT_LAYER.md) — AI design + safety
- [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) — product spec
- [docs/superpowers/specs/](docs/superpowers/specs/) — per-feature design specs

## Guardrails

Beginner-safe, contribution over popularity. **No** likes, followers, leaderboards, certificates, or shame-streaks. The only social actions are Useful, Feedback, and Learn-from. Trust is earned, never bought or minted. AI helps; it never judges.
