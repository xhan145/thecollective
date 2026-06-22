# Redesign Slice 1 — First Impression + Design Language (design)

Date: 2026-06-21
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind, mobile-first PWA, light + dark)

## Problem

A test user said the app is "confusing / looks unfinished" and "doesn't do anything
it's supposed to." Diagnosed (brainstorm) as **not a functional bug** — the app works —
but a **comprehension + polish** failure across all axes: it doesn't communicate what
Collective is or what to do first, the structure isn't obvious, and the execution
(system fonts, flat hierarchy) reads as a prototype, not a product.

## Scope

A full redesign is too large for one spec, so it's cut into slices; this spec is
**Slice 1 only**:

1. **Design language / foundation** — the visual + UX system the whole app inherits.
2. **Landing / auth** — the first screen a logged-out person sees.
3. **Onboarding** — choose a direction + learn the loop.
4. **Home / hub** — the signed-in landing; the "what do I do now" screen.

**Deferred (own specs later):** Slice 2 = Practice → Prove → Feedback; Slice 3 = Feed,
Profile, Contribute, Notifications. **Out of scope:** functional/behavioral changes
(the loop already works), backend, and any rebrand (palette + positioning are kept).

## Decisions (locked during brainstorm, via the visual companion)

- **Visual direction: "Soft Organic" (Direction B).** Rounded forms (24–28px), warm
  gold gradients with a soft glow, friendly/encouraging, calm. Keeps the existing brand;
  raises craft and warmth. (Alternatives A "Warm Editorial" and C "Quiet Minimal" were
  shown and not chosen.)
- **Keep the brand palette**, execute it better: cream `#FFF8EE`, card `#FFFDF8`,
  soft `#FFF1C7`, gold `#F2A900`, gold-bright `#FFB000`, ink `#111111`, muted `#6E6E6E`,
  line `#EFE7D8`, dark-gold ink `#5E3F00`/`#7A5300`/`#B07A00`; warm-dark bg
  `rgb(21,17,10)`.
- **Type: real fonts via `next/font`** — display **Lora** (serif, headings) + body
  **Inter** (sans). This single change does most of the "finished" lifting. (Raleway is
  an acceptable body alternative.)
- The first-run **flow** (Landing → Onboarding → Home) was approved as the Slice-1 layout.

## Design language (the foundation the rest inherits)

**Type scale** (Tailwind-friendly): display 28/1.1 (Lora 600), h1 23, h2 20, title 16,
body 15/1.55 (Inter 400), label 11 uppercase tracking-0.14em (Inter 800), caption 12.
Headings = Lora; everything else = Inter. Weight carries hierarchy (700 headings, 500
labels, 400 body) — not color alone.

**Spacing:** 8pt rhythm (4/8/12/16/24/32). Generous whitespace; group related items,
separate sections. Screen gutters 20px.

**Color usage (semantic, not raw hex in components):**
- Surfaces: page = cream (light) / `rgb(21,17,10)` (dark); cards = `#FFFDF8` (light) /
  warm-elevated dark token.
- Primary action = gold gradient (`#FFB000`→`#F2A900`) pill with soft gold shadow; exactly
  **one primary CTA per screen**; secondary = ghost/text.
- Gold is an accent + the primary action, never wall-to-wall. Labels use dark-gold inks.
- A subtle radial "glow" (gold, low opacity, blurred) is the signature texture — used
  once per screen, behind the header.

**Components (shared, reused by later slices):**
- `Card`: radius 22–24, `#FFFDF8`, soft shadow `0 8px 22px rgba(71,52,18,.10)`; a
  "hero card" variant uses a cream→gold-tint gradient.
- `PrimaryButton`: gold-gradient pill, radius 999, min-height 48, white 800 text,
  `active:scale-95` (composed, not replacing transforms), focus-visible gold ring.
- `OptionRow`: rounded 16, hairline border, selected = gold border + soft shadow.
- `LoopStrip`: a horizontal Practice→Prove→Feedback→Trust(→Contribute) indicator with
  numbered gold dots — the reusable "make the loop visible" element.
- `SectionLabel`, `EmptyState` (helpful message + one action), `ProgressBar` (gold fill).

**Motion (calm):** 150–300ms, ease-out enter; `active:scale-0.97` press on tappable
cards/buttons; respect `prefers-reduced-motion`. One or two animated elements per view.

**Copy voice:** warm, plain, beginner-safe, second person, low-pressure. Approved
vocabulary only (Practice, Prove, Feedback, Trust, Contribute, Useful, Saved for
practice, Learn from). Never likes/followers/leaderboards/clout/stre-shame.

**Dark mode:** designed as a pair — warm-dark surfaces (not inverted), gold constant,
secondary text ≥3:1, primary ≥4.5:1; cards become warm-elevated, glow dimmed.

**Accessibility:** contrast AA (4.5:1 text), touch targets ≥44px, visible focus rings,
labels on icon buttons, headings sequential, color never the only signal,
reduced-motion honored, no zoom disable, safe-area insets respected.

## Screen specs

### 1. Landing / auth (`app/auth/page.tsx`, `components/beta/AuthForm.tsx`)
- Replace "Welcome back." with the product promise: **display "Small steps. Real
  progress."** + one plain line of what Collective is ("Practice one small thing. Show
  your proof. Get useful feedback. Build trust over time — no likes, no followers.").
- A `LoopStrip` of chips (Practice · Prove · Feedback · Trust) so the value is legible
  before sign-up.
- **One** primary CTA ("Get started") + a ghost "I already have an account"; the email/
  password form appears on the chosen path. Keep "Explore the demo" as a quiet tertiary.
- Signature glow behind the logo/header. Gold-gradient primary.

### 2. Onboarding (`app/onboarding/page.tsx`)
- Header "Choose a direction" (Lora) + "Pick one focus to start. Change it anytime."
- `OptionRow` list of directions (selected = gold). Keep it skippable/back-able.
- A **"How it works"** `LoopStrip` (numbered Practice→Prove→Feedback→Trust) on the same
  screen, so the loop is taught before Home.
- One primary "Continue". Two short steps max (welcome+direction collapsed if possible).

### 3. Home / hub (`app/home/page.tsx`)
- Greeting (Lora) + a small day label.
- **Hero "Your next step" card** (gradient) is the focal point: the single next practice
  (title + "5 min · low pressure") + a "Begin →" primary. This is the always-present
  answer to "what do I do?" — never an empty/ambiguous landing.
- Calm **weekly progress** (`ProgressBar`, "2 of 3", no streak-shame).
- **Recent proof** mini card (reuses the existing proof card, restyled).
- A quiet **Contribute** entry. The center **+** (FAB) keeps the fixed-position fix from
  the earlier FAB work (centering transform untouched), restyled to the gold gradient.
- Empty states: if no proof yet, the hero still shows the next step + a calm "Start with
  one small practice."

## Implementation notes (for the plan, not this spec)

- Add Lora + Inter via `next/font/google` in `app/layout.tsx`; expose as CSS variables;
  set Tailwind `fontFamily` (`font-display` = Lora, `font-sans` = Inter).
- Introduce the shared components in `components/beta/` (e.g. `ui.tsx` additions +
  `LoopStrip`) so Slices 2–3 inherit them.
- Reuse `AppShell`, `ThemeProvider` (dark mode), and existing routes — restyle, don't
  re-architect. No new dependencies beyond fonts.
- Keep all existing behavior/data wiring intact (this is visual/UX only).

## Acceptance criteria

1. Lora (display) + Inter (body) load via `next/font`; headings are serif, body is Inter.
2. Landing states what Collective is + the loop, with one primary CTA — not "Welcome back."
3. Onboarding lets you pick a direction and shows the loop; skippable/back-able.
4. Home always shows a single "Your next step" hero + calm progress; no ambiguous empty
   landing.
5. Direction-B styling (rounded, gold-gradient primary, soft glow, soft shadows) applied
   consistently via shared components, in light **and** dark, AA-accessible, ≥44px targets,
   reduced-motion respected.
6. One primary CTA per screen; the loop is visually represented (`LoopStrip`).
7. No likes/followers/leaderboards/clout language. Existing behavior unchanged.
8. `typecheck` + `build` green; FAB centering fix preserved.

## Known limitations / next

- Slices 2 (Practice/Prove/Feedback) and 3 (Feed/Profile/Contribute/Notifications) still
  use the old styling until their own specs ship — there will be a visible seam between
  redesigned and not-yet-redesigned screens during the transition.
- A serif body alternative (Raleway) and finer dark-mode token tuning can follow.
