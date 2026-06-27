# Desktop Shell & Navigation — Design Spec

**Date:** 2026-06-27
**Status:** Approved (brainstorm); user pre-approved this + the remaining desktop sub-projects ("approved for all other")
**Branch:** `desktop-responsive` (isolated worktree)
**Part of:** "Full bespoke desktop" responsiveness — sub-project #1 of 3 (shell → core screens → secondary screens).

## Goal

Make `components/beta/AppShell.tsx` responsive: below `lg` the phone experience is unchanged; at `lg+` the app gets a persistent **left sidebar** + a wide content area, with content centered at a comfortable max-width. This is the foundation the per-screen desktop layouts (#2, #3) build on.

## Current state

`AppShell` renders `<main class="mx-auto min-h-screen max-w-[430px] …">` with: a sticky top **header** (logo → `/home`, demo badge, dark-mode toggle [Moon/Sun via `useTheme`], notifications bell with unread badge) and a fixed bottom **BottomNav** (4 tabs Home/Practice/Feed/Profile + center proof FAB → `/proof/new/conf-s1`). It also holds the auth/onboarding/invite redirect `useEffect` and an auth-loading skeleton. The dark-mode toggle is already merged.

## Design

**Responsive switch (single `AppShell`), breakpoint `lg` (1024px):**
- **< lg:** unchanged — 430px frame, sticky top header, bottom tab bar + center FAB. Pixel-identical to today.
- **≥ lg:** the 430px cap is lifted; layout becomes `flex` with a fixed-width left **sidebar** and a flexible content area. The mobile top header and bottom nav are hidden (`lg:hidden`); the sidebar is `hidden lg:flex`.

**Sidebar (desktop, `w-64` ≈ 256px, `bg-[#FFFDF8]`, `border-r border-[#EFE7D8]`, sticky full-height):**
- Top: `CollectiveWordmark` → `/home`.
- Nav: the 4 destinations as vertical icon+label rows (lucide icons Home/BookOpen/MessageSquare/User); active row (pathname match) = soft-gold pill `bg-[#FFF1C7] text-[#F2A900]`, inactive `text-[#8D877F]`. Reuse a `framer-motion` `layoutId` pill for the active indicator (vertical).
- Proof CTA: a full-width gold button "Submit proof" → `/proof/new/conf-s1` (the FAB's action) under the nav.
- Spacer, then bottom cluster: notifications (bell + unread badge) → `/notifications`, the dark-mode toggle (Moon/Sun, same `useTheme` handler), and the demo badge when shown.

**Content area (desktop):** `flex-1` region; the page renders inside a centered `mx-auto w-full max-w-4xl px-8 py-8` column so screens read intentionally (not edge-to-edge). The framer-motion page-transition wrapper + auth-loading skeleton are preserved.

**Shared, not duplicated:** extract the nav-item list (`NAV_ITEMS`) and small shared controls (notifications button, theme toggle button) so the mobile chrome and desktop sidebar render from the same source — they never drift. All auth/onboarding/invite redirect logic and the loading skeleton remain in `AppShell` and apply to both layouts unchanged.

## Architecture

- One responsive `AppShell` component. Internally split into:
  - `AppShell` (orchestrates: auth redirects, loading, picks layout via CSS responsive classes — both chrome trees render, visibility via `lg:`).
  - `MobileChrome` (existing top header + `BottomNav`, wrapped `lg:hidden`).
  - `DesktopSidebar` (`hidden lg:flex`).
  - Shared: `NAV_ITEMS` array; `ThemeToggleButton`, `NotificationsButton` small components used by both.
- Keep everything in `components/beta/AppShell.tsx` (it's cohesive chrome) unless it grows unwieldy, in which case `DesktopSidebar` may move to `components/beta/DesktopSidebar.tsx`.

## Constraints / guardrails

- Mobile (< lg) experience is **pixel-identical** to current — verify nothing shifts at ≤ 1023px.
- Theme tokens only (cream/surface/soft/ink/muted/line/gold); reuse existing icons + `useTheme` + `useBetaApp` selectors.
- No change to routing, auth/redirect logic, or any screen's content in this sub-project.
- Dark mode must read on the sidebar (use `var(--c-*)`/remapped literals already in `globals.css`).
- No new deps.

## Out of scope (later sub-projects)

- Per-screen multi-column desktop layouts (Home, Feed = #2; Practice/Proof/Profile/Cohorts/Notes/Settings = #3). Screens stay single-column, centered, here.

## Verification

- `npm run typecheck` + `npm run build` clean.
- Preview at 1023px: identical to today (top header + bottom nav, no sidebar). At 1280px: sidebar visible, top header + bottom nav hidden, content centered ~max-w-4xl, active nav pill tracks the route, proof button + notifications + theme toggle work. Light + dark both read. No horizontal overflow.
