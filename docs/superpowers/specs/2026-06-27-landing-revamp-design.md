# Landing Page Revamp — Design Spec

**Date:** 2026-06-27
**Status:** Approved (brainstorm)
**Branch:** `desktop-responsive` (isolated worktree)
**Source brief:** `docs/marketing/landing-review-2026-06-27.txt` (external review, 18 points + priority roadmap)

## Goal

Replace the current placeholder landing (`app/page.tsx` — a 430px phone-width column) with a **full-width, desktop-responsive marketing/conversion page** for first-time visitors. Primary conversion: **Join the closed beta**. Returning members get a quiet **Sign in**.

## Decisions (from brainstorm)

- **Purpose:** pure marketing/conversion page (not an app-entry hub). The app stays behind `/auth` → `/home`.
- **Responsiveness:** mobile-first single column → **desktop multi-column** (breakpoint `lg:` / 1024px), content centered at ~`max-w-6xl` (≈1152px). This is sub-project #4 of the broader "full bespoke desktop" effort and is independent of the app shell (no `AppShell`, no collision with the in-progress dark-mode work).
- **Logo:** feature the existing **Collective** brand SVG (`CollectiveMark` / `CollectiveWordmark` / `CollectiveMiniMark` in `components/beta/Brand.tsx`). No new logo asset.
- **Assets (pragmatic hybrid):** product visuals are **generated mockups from the live app screens**; the **founder story** is supplied by the owner (placeholder until then); **metrics + testimonials** are **real-only** — shown only when real, otherwise the section is omitted or rendered as a designed-but-hidden slot. No fabricated stats. A **demo video** CTA is a hidden slot until a video exists.
- **Theme:** Warm Proof-Based Growth — cream surfaces, gold (`#F2A900`) CTAs, `font-display` (Lora) headings + Inter body, soft rounded cards, calm motion. No clout mechanics (no follower counts, no leaderboards).

## Architecture

- `app/page.tsx` becomes a thin composition of marketing sections; the 430px cap is removed. Page is its own `<main>` (not `AppShell`).
- New isolated directory **`components/marketing/`** — one focused component per section, each self-contained and independently testable:
  - `MarketingNav.tsx`, `Hero.tsx`, `MissionBand.tsx`, `LoopShowcase.tsx`, `ProductShowcase.tsx`, `PracticeExamples.tsx`, `TrustExplainer.tsx`, `AiSection.tsx`, `SocialProof.tsx`, `VisionSection.tsx`, `FounderStory.tsx`, `BetaCta.tsx`, `MarketingFooter.tsx`.
- A small content/config module `lib/marketing/content.ts` holds copy + the feature flags for hidden slots (`SHOW_TESTIMONIALS`, `SHOW_METRICS`, `DEMO_VIDEO_URL`) and the real metrics object (empty by default).
- Responsive pattern: each section is full-bleed background with an inner `mx-auto max-w-6xl px-5 lg:px-8` container; multi-column via `grid lg:grid-cols-2` (hero) / `lg:grid-cols-3` (showcase, footer). Mobile stacks.

## Sections (top → bottom), mapped to the review

1. **Sticky top nav** (`MarketingNav`) — Collective logo (wordmark) left; right (desktop): anchor links "How it works", "AI", "Vision", then **Join the closed beta** (primary gold) + quiet **Sign in** (→ `/auth`). Mobile: logo + Join button only (no hamburger needed for v1). Sticky, blurred cream background. *(CTA hierarchy #12)*
2. **Hero** (`Hero`) — desktop split (`lg:grid-cols-2`): left = `font-display` headline **"Stop watching. Start practicing."**, subhead (one clear sentence on what users do), **Join the closed beta** (primary) + **Watch the 90-sec demo** (secondary, rendered only when `DEMO_VIDEO_URL` set); right = an **animated phone mockup** of the real app (Home/Feed) built from app UI (CSS/framer-motion float). Mobile: stacked, mockup below copy. *(#1, #2, #12)*
3. **Mission band** (`MissionBand`) — full-width gold-tinted band: **"Social media rewards attention. Collective rewards progress."** *(#6, #18)*
4. **The loop** (`LoopShowcase`) — Discover → Practice → Proof → Feedback → Trust → Contribute, as an animated horizontal row on desktop / vertical stack on mobile, each step a small iconed card with one-line copy. Subtle staggered entrance motion. *(#4)*
5. **Product showcase** (`ProductShowcase`) — generated mockups of Practice, Upload Proof, Receive Feedback, Trust profile; desktop `lg:grid-cols-2` alternating image/text rows; mobile stacked. *(#5)*
6. **Practice examples** (`PracticeExamples`) — chips/cards: interview practice, introductions, presentations, negotiation, leadership. *(#8)*
7. **How trust is earned** (`TrustExplainer`) — visual: practice + proof + useful feedback + contribution → trust tiers (New→Contributor), framed as earned, never bought. No numeric vanity. *(#9)*
8. **AI as helper, not authority** (`AiSection`) — AI-assisted practice prep, reflection, feedback coaching, summaries; explicit "AI never grades you or decides trust." *(#7)*
9. **Social proof** (`SocialProof`) — beta metrics + testimonials. Real-only: renders nothing unless `SHOW_METRICS` / `SHOW_TESTIMONIALS` flags are on and content exists. Designed but dormant. *(#3, #13)*
10. **Vision / future directions** (`VisionSection`) — Communication, Leadership, Career, Business, Relationships, Fitness as a calm grid. *(#14)*
11. **Founder story** (`FounderStory`) — short "why Collective exists." Owner-supplied; ships with a clearly-marked placeholder until provided. *(#11)*
12. **Exclusive-beta CTA** (`BetaCta`) — invitation framing ("help build the future of practice") + final **Join the closed beta**. *(#10)*
13. **Footer** (`MarketingFooter`) — columns: Mission, Privacy, Terms, Roadmap, Contact, Socials, Founder. Links to existing routes where they exist; placeholders (`#`) otherwise, clearly listed for follow-up. *(#15)*

Cross-cutting: generous desktop spacing/typography scale *(#16)*; subtle motion — logo/hero float, card entrance, button hover *(#17)*.

## Anti-clout guardrails (binding)

- No fabricated metrics or testimonials — real-only, behind flags, omitted otherwise.
- The "rewards progress, not attention" thesis is the centerpiece; no follower/like/leaderboard language anywhere.
- Trust is described as earned through practice/proof/feedback/contribution — never purchasable.

## Out of scope (this sub-project)

- The in-app screens' desktop layouts (sub-projects #1–3, on **hold** until the dark-mode toggle lands on `main`).
- A real demo video, real testimonials, real metrics (slots ship dormant).
- Auth/onboarding desktop responsiveness.

## Verification

- `npm run typecheck` clean; `npm run build` compiles.
- Responsive check via preview at mobile (390px) and desktop (≥1280px): nav, hero split, loop, showcase, footer all reflow correctly; no 430px cap; no horizontal scroll.
- Light + dark both read (reuse `--c-*` tokens / existing literal brand hex).
- Lighthouse-ish sanity: no external hotlinked critical assets; logo is the local SVG.
- All CTAs route correctly (Join → `/auth` signup, Sign in → `/auth`); hidden slots (video/testimonials/metrics) absent when flags off.
