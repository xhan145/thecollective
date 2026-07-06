# Landing red-team UI refresh — decision note

**Date:** 2026-07-02 · **Branch:** `fix/landing-redteam-ui-refresh` · **Status:** decided → implementing

## Context
The red-team copy/structure critique already shipped (`3ac326a` hero/sections/demo/analytics, `db53884` review fixes).
This pass implements the remaining delta from the expanded mission brief.

## Options considered
1. **Full rebuild** of the landing around a new 3D-first design — rejected: throws away shipped, reviewed work; risks performance and calm-brand violations.
2. **Copy-only tweaks** — rejected: mission explicitly asks for depth/dimension, demo deepening, and workflow upgrades.
3. **Additive delta on the shipped page** (chosen): keep the verified structure, add the missing sections + CSS-only depth + demo input + events + metadata. Strongest on clarity, conversion, buildability, and principles.

## The delta (chosen design)
- **PainSection** (new, after Hero): "You do not need more advice. You need reps."
- **ProductLoop** (new, after TryThisFirst): "How Collective works" — the 6-step loop with concrete one-liners. Mobile = flat stack; desktop = 6-up with gentle depth. (Restores the loop the earlier pass removed, now with concrete copy and no redundancy with the 4-state section.)
- **Hero 3D composition**: CSS-only — radial cream/gold glow, slight perspective on the phone mock, two floating aria-hidden proof/feedback chips (desktop only), float animation gated by `prefers-reduced-motion`.
- **Card depth**: gentle motion-safe hover lift + warm shadows on marketing cards. No WebGL, no new deps.
- **Demo deepening** (`/demo`): picking *Written* or *Reflection* reveals an honest static textarea ("demo only — nothing is saved"); final CTA becomes "Create an account to save your proof"; "Back to home" stays.
- **FounderStory CTA event**: `founder_start_practice_clicked` via a leaf `TrackedCta` client component (FounderStory stays server).
- **SEO metadata**: title "Collective | Practice confidence in real life" + concrete description. No OG image invented (none exists — flagged as follow-up).
- **Trust labels**: display-only "Consistent" kept; internal `Reliable` untouched (already shipped).
- **Workflow**: branch → PR → merge if checks pass (no branch protection on this repo).

## Not doing
Fake proof/metrics/testimonials · likes/followers/leaderboards · Three.js/WebGL · auto-playing motion · nav restructure · app-shell changes.
