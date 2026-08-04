# Design Foundation — Implementation Plan

> Executed inline (autonomous). Source of truth: `docs/superpowers/specs/2026-07-26-design-foundation-design.md`.

**Goal:** One semantic color + type token system consumed everywhere, with build guards preventing regression.
**Branch:** `feat/design-foundation` off `origin/main`.

## Global Constraints
- Color and type ONLY. No layout, copy, product-behavior, or component-API changes.
- Brand identity preserved (warm cream/gold). Anti-clout vocabulary untouched.
- Weights collapse to 400/500/600; `font-black` deleted. 8 type steps, no arbitrary sizes.
- Guards are standalone scripts, NOT wired into `next build` (no CI yet; would break main when PR #31 merges).

## Tasks

### T1 — Token definitions
- `app/globals.css`: `:root` + `.dark` semantic color tokens per the spec table; delete the enumerated `.dark` hex-remap block and the two dead half-systems (`--text-primary…`, `--c-ink…`) once nothing references them.
- `app/layout.tsx`: swap Lora → Fraunces (variable, weights 400–600, latin, swap); keep Inter; set `font-optical-sizing: auto`.
- `tailwind.config.ts`: expose semantic colors; add the 8-step `fontSize` scale carrying size + lineHeight + letterSpacing; `display` family → Fraunces.

### T2 — Codemod: colors
- `scripts/codemod-design-tokens.mjs`: map arbitrary-hex Tailwind classes → token classes across `app/` + `components/`, preserving opacity modifiers (`/95` etc.).
- Unmappable hexes are REPORTED, never guessed. Resolve the report by hand.
- Absorb already-dark hexes into `.dark` token defs and remove from components.

### T3 — Codemod: typography
- Same script (second pass): weights → 400/500/600 (`font-black`/`font-extrabold` eliminated); 31 sizes → the 8 scale tokens, context-driven (overline for uppercase micro-labels, heading/title/display ≥20px take `font-display`).

### T4 — Guards
- `scripts/check-design-tokens.ts` (raw hex), `scripts/check-typography.ts` (weights/arbitrary sizes), both with numeric WCAG contrast assertions over every token pair in both themes. `npm run check:design` runs both.

### T5 — Verify
- `npm run check:design`, `tsc --noEmit`, `npm run build` all green.
- Dev server: landing, home, practice, feed, proof detail, passport, member, settings in BOTH themes; screenshots; console clean.
- `grep` proves zero arbitrary-hex classes outside the allowlist.

### T6 — Adversarial review → fix → PR
- Multi-lens review (contrast/a11y, codemod correctness/regressions, dark-mode completeness, type hierarchy, guard soundness). Fix Critical/Important. Open PR.
