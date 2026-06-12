# Collective — Brand Package

**Small steps. Real progress.**

A warm, calm identity for a progress-and-contribution platform where people discover
meaningful directions, practice real growth, submit proof, receive feedback, build trust,
and eventually help others.

Core loop: **Discover → Practice → Prove → Get Feedback → Build Trust → Contribute**
Launch wedge: confidence, communication, momentum.

---

## The mark

A wide open capital **C** wraps **three people** standing over an **open book**. It reads as
collective learning, shared practice, proof, and contribution — not a sun, star, flower, or
badge. Single flat gold, no gradients, no rays, no rising bars.

These assets come from the **official Collective Final Brand Package v2.0** (the uploaded
brand package is the source of truth). See `Collective_Brand_Guide.pdf` in this folder.

| File | Use |
|------|-----|
| `collective-mark-primary.svg` | Primary mark — headers, empty states, loading, success (40px min) |
| `collective-mark-mini.svg` | Simplified mini mark for UI under ~32px (18px min) |
| `collective-mark-white.svg` / `collective-mark-mini-white.svg` | Reversed marks for gold/dark backgrounds |
| `collective-logo-horizontal.svg` | Mark + "Collective" wordmark + tagline (decks, landing pages, docs) |
| `collective-app-icon.svg` | Cream rounded-square icon with centered gold mark |
| `collective-favicon.svg` | Favicon source |
| `collective-splash.svg` | Splash composition (mark on cream + wordmark + tagline) |
| `png/` | PNG exports (app icon 512/1024, favicon, splash, marketing gradient) |

The gradient marketing variant (`png/collective-mark-gradient-marketing-1024.png`) is for
marketing explorations only — never the production app icon or in-app mark.

In the Android app the same shape lives as a vector drawable
(`app/src/main/res/drawable/ic_collective_mark.xml`, plus a simplified
`ic_collective_mark_mini.xml` for small sizes) and is rendered through the
`CollectiveMark` / `CollectiveMiniMark` composables, so the in-app logo, empty states,
splash, success mark, and launcher icon all stay identical. The launcher uses an adaptive
icon (`mipmap-anydpi-v26/ic_launcher.xml`) with a cream background and the gold mark.

### Do not
Stretch, rotate, recolor randomly, add gradients in production UI, place on loud
backgrounds, or use the mark as a clout/status badge.

---

## Color

| Token | Hex |
|-------|-----|
| collectiveGold | `#F2A900` |
| collectiveGoldBright (marketing highlight only) | `#FFB000` |
| collectiveSoft | `#FFF1C7` |
| collectiveCream (screen background) | `#FFF8EE` |
| collectiveCard | `#FFFDF8` |
| collectiveText | `#111111` |
| collectiveMuted | `#6E6E6E` |
| collectiveSuccess | `#22C55E` |
| collectiveLine | `#EFE7D8` |
| collectiveWarmShadow | `rgba(45,26,0,0.06)` |

The production app logo stays flat gold. `#FFB000` is only for marketing/export assets.

## Type
System fonts. Web: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.
Android: Roboto/system. iOS: SF Pro/system. Large calm headings, clear readable body,
warm but not childish, premium but not luxury, utility-first.

## Shape & elevation
Cards ~18dp radius, bottom sheets ~28dp top corners, pills 999. Subtle warm shadows only —
no heavy borders, no harsh black blocks, no loud gradients.

---

## Copy

**Use:** Small steps. Real progress. · Choose a direction. · Practice one small step. ·
Show what you practiced. · It does not need to be perfect. · Feedback helps you improve. ·
Trust is earned through practice, proof, useful feedback, and contribution. · Build trust by
showing the work. · Progress you can build on.

**Avoid:** go viral · followers · likes · influencer · leaderboard · crush it · dominate ·
elite · shame-based streaks · public ranking · clout · fame.

## AI principle
AI is **support, not authority**. It can help you reflect, summarize proof, prepare for
feedback, and suggest a next practice. It does not assign trust, judge worth, diagnose
identity, or rank users. *"AI can help you organize your thoughts. You decide what is true
and useful."*

## App principles
Real progress over appearance · practice over passive content · usefulness over attention ·
contribution over clout · earned trust, not paid trust · AI support, not AI authority ·
beginner safety before public performance. Collective should feel like a calm, useful place
to practice, prove progress, get feedback, build trust, and help others — never like
Instagram, TikTok, a course marketplace, a coaching funnel, or a quote app.

See `usage-notes.md` for asset-by-asset placement.
