# Usage notes — where the mark appears

Source of truth: **Collective Final Brand Package v2.0** (official). The in-app vectors
(`ic_collective_mark.xml`, `ic_collective_mark_mini.xml`, `ic_launcher_foreground.xml`) are
direct conversions of `collective-mark-primary.svg` / `collective-mark-mini.svg`.

Sizing rules from the official notes: primary mark 40px minimum; mini mark below ~32px
(18px minimum); keep ~15% clear space; the logo supports the product, it does not dominate.

The shape is defined once and reused everywhere via vector. Update the vector drawable and
every surface below updates with it.

| Surface | Source | Notes |
|---------|--------|-------|
| Primary app icon | `res/mipmap-anydpi-v26/ic_launcher.xml` + `res/drawable/ic_launcher_foreground.xml` | Adaptive: cream background (`@color/collective_cream`) + gold mark at ~60% safe zone. Also `ic_launcher_round.xml`. minSdk 26, so no PNG fallbacks needed. |
| Header / hero mark | `CollectiveMark` (Home), `CollectiveBrandHeader` | Renders `ic_collective_mark.xml`, tinted gold. |
| Sheet / dialog mini mark | `CollectiveMiniMark` | Swaps to `ic_collective_mark_mini.xml` below 44dp for legibility. |
| Empty-state mark | `CollectiveMiniMark(size = 58–62dp)` | Used in loop/empty components. |
| Loading / splash mark | `CollectiveMark` | Larger gold mark on cream. |
| Success / completion mark | `CollectiveSuccessMark` | Gold check on soft-gold disc. |
| Brand exports | `brand/*.svg` | Vector source for marketing, store listings, web/PWA favicons. |

## Producing raster assets (store / web)
The SVGs are true vector. To export PNGs (e.g. Play Store 512×512, favicons), render
`collective-app-icon.svg` (icon) or `collective-mark.svg` (transparent mark) at the target
size with any SVG rasterizer. Background for the icon is cream `#FFF8EE`; the mark itself is
transparent.

## Replaced / retired
- Old gold **sunburst** mark (rays + dots + arcs) — removed everywhere: the vector
  (`ic_collective_mark.xml`), the Compose Canvas version (`CollectiveLogo.kt`), and the
  second Canvas copy that lived in `CollectiveComponents.kt` (`SunburstLogo`, used by
  `CollectiveTopBar` and `EmptyStateCard`). All now render `CollectiveMiniMark`.
- Legacy **ForestGreen / SoftPurple / SoftPeach** palette — `ui/theme/Color.kt` keeps the
  old names for source compatibility but every value now resolves into the gold family
  (gold `#F2A900`, deep gold `#B97F00`, soft gold `#FFF1C7`, line `#EFE7D8`), so the whole
  legacy prototype shell restyles to the brand without touching its call sites.
- The dead pre-redesign bottom nav (`BottomNavBar` / `CenterCreateButton`, green "+") was
  deleted from `CollectiveApp.kt`.
- The gradient streak card on the primary Home is now flat brand gold (no loud gradients).

## Navigation (aligned to the loop)
Both shells share `CollectiveBottomNav`: **Home · Discover · [Submit proof] · Feedback ·
Profile**. The center CTA is proof-oriented ("Submit proof"), never "Post". Home's
"Practice now" routes to the focused Practice screen.
