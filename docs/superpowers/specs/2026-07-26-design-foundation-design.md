# Design Foundation — Semantic Color + Type System

**Date:** 2026-07-26
**Status:** Approved (user approved; build authorized to run autonomously)
**Sub-project:** SP1 of 4 (SP2 motion, SP3 social surfaces, SP4 polish/a11y follow)
**Branch:** `feat/design-foundation` off `origin/main`, own PR, gated by adversarial review.

## Why

The app *looks* vibe-coded because it measurably is. Audited on 2026-07-26:

| Symptom | Measured |
|---|---|
| Hardcoded hex color literals in `app/` + `components/` | **1,165 occurrences, 75 distinct values, 113 files** |
| Font weights | **215 `font-extrabold` + 163 `font-bold` + 60 `font-black`** vs **5** normal/semibold |
| Distinct font sizes | **31** (incl. `text-[9px]`, `[13px]`, `[17px]`, `[19px]`, `[22px]`, `[26px]`, `[31px]`, `[34px]`, `[38px]`, `[56px]`) |
| Optical tracking / leading declarations | **0** |

Dark mode is a hand-maintained `.dark` block in `globals.css` that re-maps *specific enumerated* hex class variants (it catches `bg-[#FFFDF8]/95` but not `/85`). Every hex not in that list stays light in dark mode. This is the root cause of the historical dark-mode breakage (issue #8 / PR #20) and it is structurally guaranteed to recur.

Two competing token systems already exist half-built (`--text-primary…` and `--c-ink…`), neither consumed by components.

**Measured contrast failures (WCAG AA):**

| Pair | Ratio | Uses |
|---|---|---|
| `#9B958B` tertiary text on `#FFFDF8` | **2.92** ❌ | 65 |
| `#F2A900` gold as text on `#FFFDF8` | **1.98** ❌ | 26 (+16 as ring) |
| dark border `#352D20` on `#211B12` | **1.26** ❌ | all dark cards |

Note the dark *values* are fine (ink 15.16, muted 7.62, accent 8.50 — all pass AA). Dark mode is broken by **non-application**, not by bad color choice. The fix is plumbing + type craft, not a repaint.

## Goal

One semantic token system for color **and** type, consumed by every component, with build guards that make regression impossible rather than merely unlikely.

## Non-goals (queued, not here)

SP2 motion language; SP3 social-feel surfaces (feed richness, story row, threaded replies); SP4 elevation/spacing/empty-state/a11y sweep. No layout, copy, or product-behavior changes in this sub-project — **color and type only**, so the diff stays mechanically reviewable.

## Global constraints

- Brand identity is preserved: warm cream/gold "Warm Proof-Based Growth". UUPM's suggested community-purple palette is **rejected** — the brand guide is the canonical source.
- UUPM's "Flat Design Mobile" style is adopted only for its structural rules (press feedback, touch targets, contrast); its dark-mode approach ("color swap only") is **explicitly rejected** as the failure mode being fixed.
- Anti-clout vocabulary unchanged. No new UI affordances.
- Mobile-first 430px phone frame preserved; no layout changes.

## Color tokens

Defined once in `app/globals.css` under `:root` and `.dark`, exposed through `tailwind.config.ts` so components write `bg-surface text-muted border-line` — never an arbitrary hex.

| Token | Light | Dark | Notes |
|---|---|---|---|
| `bg` | `#FFF8EE` | `#15110A` | app background |
| `surface` | `#FFFDF8` | `#211B12` | cards |
| `surface-soft` | `#FFF1C7` | `#3A2F18` | chips, soft fills (dark lifted from `#2C2413` for separation) |
| `surface-input` | `#FFFFFF` | `#1C1710` | inputs |
| `text` | `#111111` | `#F6F1E7` | primary |
| `text-secondary` | `#38322A` | `#D6CEBE` | |
| `text-muted` | `#5C574F` | `#B7AC99` | **light fixed** from `#6E6E6E`/`#9B958B` family |
| `text-subtle` | `#6E6E6E` | `#9C9285` | lowest-emphasis text still ≥4.5:1 |
| `accent` | `#F2A900` | `#FFCE5C` | fills/indicators only — **never text on light** |
| `accent-text` | `#7A5300` | `#FFCE5C` | accent-colored *text*; passes AA both themes |
| `accent-soft` | `#FFF1C7` | `#3A2F18` | |
| `line` | `#EFE7D8` | `#4A3F2C` | **dark fixed** from `#352D20` (1.26 → 2.1) |
| `success` / `success-text` / `success-soft` | `#22C55E` / `#15803D` / `#E8F8EE` | `#4ADE80` / `#86EFAC` / `#16301F` | |
| `danger` / `danger-text` / `danger-soft` | `#C2413F` / `#B4443F` / `#FFF0F3` | `#F87171` / `#FCA5A5` / `#3A1A1A` | |
| `info-soft` | `#EBF4FD` | `#16233A` | |

**Migration mapping.** The 75 distinct hexes collapse onto the tokens above: the top 17 (~90% of occurrences) map 1:1; the ~58-value tail is mostly near-duplicate tints (`#E8F8EE`/`#EDF6F0`/`#ECFDF3`/`#E8F6EC` → `success-soft`; `#FFF0F3`/`#FBE3E1`/`#F6CFCB` → `danger-soft`; `#EBF4FD`/`#F5FAFF` → `info-soft`; the `#C8C2B8`/`#8F887E`/`#B6AE9F`/`#C9C2B5`/`#E5DED4` grays → `text-muted`/`text-subtle` by context) and the already-dark values (`#15110A`, `#211B12`, `#352D20`, `#1C1710`, `#2C2413`, `#F6F1E7`, `#B7AC99`) which are absorbed into the `.dark` token definitions and deleted from components.

Any hex the codemod cannot confidently map is **left in place and reported**, then resolved by hand — the codemod never guesses silently.

**The enumerated `.dark` remap block in `globals.css` is deleted.** Theme switching becomes a wholesale token flip via the existing `.dark` class on `<html>` (already managed by `ThemeProvider`).

## Type system

**Faces.** Fraunces (variable, display) replaces Lora; Inter (UI/body) stays. Both via `next/font/google` with `display: "swap"`, latin subset, and `font-optical-sizing: auto` so Fraunces' optical-size axis is actually used. Fraunces is loaded **variable with a restricted weight range (400–600)** to avoid a payload regression.

**Scale** — 8 named steps replacing all 31 ad-hoc sizes. Exposed as Tailwind `fontSize` entries carrying size + line-height + tracking together, so a single class is always internally consistent:

| Token | Size | Weight | Tracking | Leading | Face |
|---|---|---|---|---|---|
| `display` | 36px | 600 | −0.03em | 1.10 | Fraunces |
| `title` | 28px | 600 | −0.025em | 1.15 | Fraunces |
| `heading` | 20px | 600 | −0.015em | 1.25 | Fraunces |
| `body-lg` | 17px | 400 | 0 | 1.60 | Inter |
| `body` | 15px | 400 | 0 | 1.60 | Inter |
| `label` | 13px | 500 | 0 | 1.45 | Inter |
| `caption` | 12px | 400 | +0.01em | 1.40 | Inter |
| `overline` | 11px | 500 | +0.07em | 1.30 | Inter |

**Weight discipline.** `font-black` is removed entirely. `font-extrabold` (215) and `font-bold` (163) collapse to **600 headings / 500 labels / 400 body**. Hierarchy comes from size, weight *contrast*, and spacing — not from everything being maximum weight.

Mapping is context-driven, not blind: `text-sm font-extrabold` on a card heading → `text-label` + heading treatment; `text-xs font-extrabold uppercase tracking-*` → `text-overline`; body copy → `text-body`. Sizes ≥20px take Fraunces via `font-display`.

## Guards (the actual anti-vibe mechanism)

Two Node check scripts, runnable as `npm run check:design`:

1. **`scripts/check-design-tokens.ts`** — fails if any raw hex appears in a Tailwind arbitrary-value class in `app/` or `components/`. Allowlist: `app/globals.css`, `tailwind.config.ts`, OG-image/brand asset routes, and demo SVG generators (documented inline).
2. **`scripts/check-typography.ts`** — fails on `font-black`, `font-extrabold`, or arbitrary `text-[Npx]` outside the allowlist.
3. Both scripts additionally **assert WCAG contrast numerically** for every foreground/background token pair in both themes (≥4.5:1 body, ≥3:1 large/secondary) — contrast is computed, never eyeballed.

**Deliberately NOT wired into `next build`.** There is no CI yet (that is beta Package 1), and PR #31 (intro clips) is open with un-tokenized files; wiring the guard into `build` would break `main` the moment #31 merges. It ships as a standalone script now and gets attached to CI in Package 1.

## Verification

1. `npm run check:design` green (includes the contrast assertions).
2. `npx tsc --noEmit` and `npm run build` green.
3. Dev server: core screens (landing, home, practice, feed, proof detail, passport, member, settings) rendered in **both** themes; screenshots captured; console checked for errors.
4. `grep` proves zero remaining arbitrary-hex classes outside the allowlist.
5. Adversarial multi-agent review before the PR; fix all Critical/Important.

## Risks

- **Large diff (~113 files).** Mitigated: mechanical, color/type only, no logic; guards + both-theme screenshots prove correctness. Splitting it would leave the app half-tokenized, which is strictly worse.
- **Codemod mis-mapping a context-dependent gray.** Mitigated: unmappable values are reported, not guessed; visual verification in both themes.
- **Fraunces payload.** Mitigated: variable font, restricted weight range, latin subset, `swap`.
- **Merge conflict with PR #31.** Expected and accepted: after both merge, `IntroClipRecorder`/`IntroClipPlayer` need a small tokenization follow-up. Documented here and in the PR body.
