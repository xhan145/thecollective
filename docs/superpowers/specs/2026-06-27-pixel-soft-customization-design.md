# Pixel-Soft + Customization — Design Spec

**Date:** 2026-06-27
**Status:** Approved (brainstorm); user delegated spec + implementation ("i trust you")
**Branch:** `desktop-responsive` (worktree) → merge to `main`
**Part of:** Collective Passport/Profile/Settings system (from `docs/badges/` + the Passport dev prompt). This is **sub-project #1 of ~4**. See memory `collective-passport-settings`.

## Decisions locked (brainstorm)
- **Pixel-soft scope/default:** **Soft, whole-app, default-on** (off / soft / medium levels).
- **Nav:** later sub-projects do a **Profile→Passport label rename only** (keep the 4 tabs + proof FAB; no Discover/Proof-tab churn).
- **UUPM:** the `ui-ux-pro-max` Claude skill is used at *design time* only — it is **not** an npm package; no runtime adapter is built (would be dead code).
- This is the **appearance/customization slice** of the eventual `user_settings` architecture (a later sub-project); built forward-compatible (localStorage now → Supabase later).

## Goal
A configurable, tasteful "pixel-soft" retro layer (subtle Nintendo-handheld influence, NOT arcade/childish) applied app-wide at Soft by default, plus a `/settings/customization` page to control it — without harming the calm-premium brand or accessibility.

## 1. Pixel-soft visual layer (`app/globals.css`)
- Variables on `:root` (Soft defaults), overridden by `[data-pixel="medium"]` and zeroed by `[data-pixel="off"]`:
  `--pixel-intensity: .18`, `--pixel-grid-opacity: .035`, `--pixel-border-size: 1px`, `--pixel-radius-step: 4px`, `--retro-shadow: 2px 2px 0 rgba(17,17,17,.06)`. Medium roughly doubles intensity/grid-opacity and `--retro-shadow` offset.
- Utility classes (consume the vars): `.pixel-card` (1px stepped border + `--retro-shadow` + slightly reduced radius), `.pixel-button`, `.pixel-grid-bg` (low-opacity pixel grid via `background-image` linear-gradients, opacity `--pixel-grid-opacity`), `.pixel-corner` (8-bit corner accents via `::before/::after`), `.pixel-icon-tile` (blocky icon container, small radius), `.pixel-soft` (pixel font for **labels only** — a system-safe pixel-ish stack, applied to small uppercase labels not body text).
- **Whole-app Soft, applied honestly:** the page-frame/shell gets `.pixel-grid-bg` + a subtle stepped frame at Soft so every screen *feels* pixel-soft via the background grid; components adopt `.pixel-*` classes as screens are touched (Passport/Settings sub-projects). `[data-pixel="off"]` neutralizes all of it (grid opacity 0, retro-shadow none, radius-step 0).
- **Guardrails (binding):** never pixelate text or avatars; no harsh black outlines; no neon; keep cream/gold + rounded cards; maintain ≥4.5:1 contrast; honor `prefers-reduced-motion` (no animated grid).

## 2. Customization module (`lib/settings/customization.ts` + `components/beta/CustomizationProvider.tsx`)
- `Customization` type + `DEFAULT_CUSTOMIZATION`: `pixelStyle:"soft"`, `pixelGrid:true`, `density:"comfortable"`, `cardRoundness:"rounded"`, `motion:"full"`, `iconStyle:"pixelSoft"`, `fontMode:"system"`, `accentStrength:"calm"`, `avatarTreatment:"softFrame"`, `beginnerSafeLanguage:true`, `hideAdvancedPractices:false`. Pure helpers: `loadCustomization()`, `applyCustomizationToDom(c)` (sets `<html>` data-attrs: `data-pixel`, `data-pixel-grid`, `data-density`, `data-roundness`, `data-motion`, `data-accent`), `mergeCustomization`.
- `CustomizationProvider` ("use client"): loads from `localStorage` key `collective.customization.v1` on mount, applies to `<html>`, exposes `useCustomization() → { customization, setCustomization(partial) }`. `setCustomization` persists + re-applies. Respects OS `prefers-reduced-motion` (if motion==="reduced" OR OS prefers reduced → `data-motion="reduced"`). `// TODO(settings-arch): sync to Supabase user_settings.customization`. SSR-safe (apply in effect; a tiny inline script in layout sets the initial `data-pixel` to avoid flash — optional).
- Wrapped in `app/layout.tsx` around the app (alongside existing ThemeProvider). Default Soft means the layer is active on first paint.

## 3. `/settings/customization` page (`app/settings/customization/page.tsx`)
- AppShell page. Sections: **Visual Feel** (Pixel Style off/soft/medium radio cards; Pixel Grid toggle; Icon Style soft/pixelSoft; Font Mode system/friendly/retroLabels), **Layout** (Density comfortable/compact; Card Roundness soft/rounded/extra), **Motion** (Full/Reduced), **Tone** (beginner-safe language toggle; hide advanced practices toggle).
- A **live mini "Passport card" preview** at the top that reflects the current settings (pixel border/grid, density padding, roundness) so changes are visible immediately. Changes apply instantly (debounce-free; harmless appearance settings) via `setCustomization`.
- Add a "Customization" row/link on `/settings`. Add `/settings/customization` to `protectedPrefixes` (already covered by `/settings`).
- Theme (light/dark/system) stays in ThemeProvider; the page may show a small note/link, but theme control itself is out of scope here.

## Accessibility
Reduced-motion honored; controls are real radios/checkboxes with visible labels + focus-visible rings + ≥44px targets; contrast preserved in light + dark; no text/avatar pixelation; `data-pixel="off"` fully removes the effect.

## Verification
- `npm run typecheck` + `npm run build` clean.
- `npx tsx scripts/check-customization.ts` (pure): `applyCustomizationToDom` maps each setting to the right attribute; `mergeCustomization` + defaults; off/soft/medium produce distinct `data-pixel`.
- Preview: at Soft (default) the app shows a subtle grid + retro frame without looking arcade; toggling to Off removes it; Medium intensifies; light + dark both read; reduced-motion respected.

## Out of scope (later sub-projects)
Full `user_settings` table + privacy/notification/feedback settings + Supabase sync; the Passport screen + 3-dot menu; per-component deep pixel restyle; the Profile→Passport rename.
