# Progress Constellation — Design

**Date:** 2026-07-11 · **Branch:** `feature/progress-constellation` · **Status:** Approved for implementation

A private, evidence-backed map of one member's growth loop — Practice → Prove → Feedback → Apply → Contribute — rendered at LumenDeck-level fidelity, translated into Collective's warm, calm, beginner-safe brand. Every illuminated node corresponds to real user activity. Not a social graph, leaderboard, score, or decoration.

---

## 1. Architecture summary (what exists, what we reuse)

### Collective (target codebase, `origin/main` @ `b6d85c1`)

- **Shell:** Next 16 App Router, all `"use client"` screens. Each page wraps itself in `components/beta/AppShell.tsx` (`max-w-[430px]` cream phone frame, sticky blurred header, 4-tab bottom nav + gold FAB, client-side auth redirect via `useBetaApp()`, `protectedPrefixes` list). `AmbientBackdrop` (aurora) is already mounted inside AppShell on every authed screen.
- **Design system:** literal-hex Tailwind utilities (`bg-[#FFFDF8]`, `border-[#EFE7D8]`, gold `#F2A900`/`#FFB000`, soft `#FFF1C7`, ink `#111111`, muted `#6E6E6E`), Lora `font-display` headings + Inter body, cards `rounded-[22px]` with the 3-layer brown-tinted `ELEVATION` shadow, buttons `rounded-full min-h-12` with `focus-visible:ring-4 ring-[#F2A900]/40`. Kit: `components/beta/ui.tsx` (Card, Button, Badge, PageHeader, HeroCard, EmptyState, SuccessState, ProgressBar, LoopStrip), `components/beta/motion.tsx` (easeOut `[0.22,1,0.36,1]`, MotionList/MotionItem stagger 70 ms, Reveal, CountUp, Skeleton).
- **Dark mode:** `.dark` remaps a *specific list* of arbitrary-hex utilities in `app/globals.css`; any new hex/opacity variant must be added there or it won't theme.
- **Motion gating:** all ambient motion is double-gated — `@media (prefers-reduced-motion: no-preference)` **and** `html:not([data-motion="reduced"])` (in-app preference from `CustomizationProvider`).
- **Data spine:** `AppStateProvider` → `useBetaApp()` hydrates a `snapshot` via `lib/supabase/betaRepository.ts` (RLS-scoped reads, Postgres RPCs for writes). Feature repos exist per domain (`badgesRepository`, `passportRepository`). Pure logic lives in `lib/*.ts` (e.g. `lib/mastery.ts`) verified by `tsx scripts/check-*.ts` scripts — the repo's testing convention (no vitest/jest anywhere).
- **Analytics:** first-party `logBetaEvent()` → `beta_events` table, fixed snake_case union `BetaEventType`, RLS insert-own-only, never throws.
- **Sheets:** `components/beta/ReportSheet.tsx` is the only sheet precedent (`fixed inset-0 z-[80]`, bottom sheet on mobile / centered card `sm:+`, `rounded-t-[24px]`, `role="dialog" aria-modal`). It lacks drag handle/Escape/focus-trap — the constellation sheet adds those.
- **Evidence tables (all RLS, owner-scoped):** `practice_completions(user_id, prompt_id)`, `proofs(user_id, prompt_id, direction_id, status: draft|submitted|feedback-ready|used-for-practice, visibility, moderation_status)`, `feedback(proof_id, author_id, recipient_id, helpful, moderation_status)`, `useful_marks`, `trust_events`. Directions/practices are content tables (013/030) with an in-app seed fallback; `profiles.currentDirectionId` + `direction_ids[]` hold the member's chosen directions.
- **Open-PR constraint:** PRs #27/#28/#29 are open and consume migrations **042–049**; they also edit `AppStateProvider`/`betaRepository` heavily. → Our migration is **050**, and we minimize edits to those shared files to stay mergeable.

### LumenDeck (fidelity benchmark, not a visual source)

Its constellation quality decomposes into techniques that are mostly **not** WebGL-bound:

| # | Technique (file evidence) | Portability |
|---|---|---|
| 1 | Two-layer glow: crisp 1 px edge ring + soft wide bloom (`tokens.css --glow-accent`) | CSS 1:1 |
| 2 | Motion hierarchy: 150/240/400 ms, three easings only; everything tokenized | CSS 1:1 |
| 3 | Selected node "breathes" its glow (2.4 s ease-in-out shadow pulse, `app.css node-pulse`) | CSS 1:1 |
| 4 | Quadratic-Bézier connections that bow toward the viewer and **kiss the node surface** (`WIRE_ARC 40`, `orbSurfacePoint`) | SVG `Q` path 1:1 |
| 5 | Directed energy pulses along the same curve; count/speed encode real activity; deterministic phase (`energyFlow.ts`) | SVG `animateMotion` |
| 6 | Additive neon = blurred wide stroke under crisp bright stroke | SVG two-stroke stack |
| 7 | Recency luminosity with exponential half-life (`nodeMeta.ts`, 45 s) | CSS opacity 1:1 |
| 8 | Staggered 35 ms cascade entrances; asymmetric reveal/hide (240/150 ms) | framer-motion 1:1 |
| 9 | Glass discipline: one blur per region, hairline edge-light border, contrast term | CSS 1:1 |
| 10 | Adaptive quality + idle-sleep (only animate what changed; pause when hidden) | pattern ports |
| 11 | Reduced-motion done twice: CSS nuke **and** every JS loop renders a static frame | pattern ports |
| — | Orb fresnel shader, UnrealBloom, gravity-dust sim, spacetime fabric | WebGL-only — approximate the *read*, not the math |

**Conclusion:** LumenDeck's perceived finish comes from glow layering, curve quality, motion tokens, and restraint-by-default — all achievable in DOM/SVG/CSS. Three.js is not required and would fight Collective's 430 px, mobile-first, no-three-dependency reality.

---

## 2. Rendering approach (decision)

**Option C — hybrid: DOM nodes + SVG connection layer + CSS atmosphere.** (Options considered: A = SVG-only, B = Canvas/Three.js + DOM overlay, C = hybrid.)

- Nodes are real `<button>`s absolutely positioned in a bounded stage → free keyboard focus, screen-reader semantics, 44 px+ hit targets, crisp text at every zoom.
- Connections are one `<svg>` underneath: quadratic Béziers with a two-stroke glow stack, `stroke-dashoffset` draw-in on completion, an `animateMotion` shimmer dot on the single active route (conditionally rendered — never runs under reduced motion or when hidden).
- Atmosphere is layered CSS (existing `.ambient-aurora` + a soft radial gold wash + a deterministic field of low-opacity "past evidence" dots derived from real evidence ids) — no canvas, no rAF loop, zero idle CPU beyond compositor keyframes.
- Zoom (1.0–1.5, buttons) + drag-pan when zoomed + Reset view, with LumenDeck's 5 px click-slop pattern. No wheel/pinch hijack; page scroll is never intercepted unless the map is zoomed and the gesture starts on it.
- Why not Three.js: bundle (+~150 kB gz) for a 6-node scene, text softness, a second rendering paradigm in a codebase with none, mobile GPU cost, and the spec's own preference for the lightest capable implementation.

Deterministic layout (no force simulation): percentage coordinates per node in a 100×100 stage space, one composition for narrow (<380 px) and one for regular widths, chosen to read as forward motion:

```
Practice  (18, 76)  lower-left   →  Prove (14, 38) upper-left  →  Feedback (56, 14) upper-right
→  Apply (84, 44) right  →  Contribute (70, 80) lower-right, completing the arc.
Direction hub sits at (44, 48) — the gravitational center, slightly left of geometric center.
```

Hub spokes (center→each node) render faint; the journey arc (Practice→…→Contribute) renders as the primary path. Stage aspect is ~1:1.05 within the 430 px frame; the same proportions scale down to 320 px with labels clamped to two lines.

---

## 3. Brand translation (LumenDeck → Collective)

| LumenDeck (dark observatory) | Collective (warm observatory) |
|---|---|
| Near-black `#071426` field | Warm cream `#FFF8EE` field + soft radial gold wash `rgba(242,169,0,0.10) → transparent` |
| Additive cyan/violet neon | Restrained gold: wide `#F2A900` at 10–22 % opacity under crisp `#F2A900`/`#B07A00` strokes |
| Glass `rgba(18,22,29,.55)` + white hairline | Cream translucency `bg-[#FFFDF8]/90 backdrop-blur` + `#EFE7D8` hairline + warm shadow |
| UnrealBloom | Layered warm `box-shadow` bloom on lit nodes only (`0 0 0 1px rgba(242,169,0,.35), 0 0 24px rgba(242,169,0,.20)`) |
| Starfield + gravity dust | ≤24 static 2–3 px dots at 4–10 % ink/gold opacity, positions seeded from real evidence ids; `mk-breathe`-class ambient only |
| Cyan selection ring | Gold double ring: `0 0 0 2px #FFF8EE, 0 0 0 4px #F2A900` (matches existing focus ring) |
| Error red torus | Warm amber `#FFB000` attention ring + plain-language helper text; red reserved for real errors |

Copy voice: direct, beginner-safe ("Show what you practiced. It does not need to be perfect."), no hype, no shame, no streak pressure.

---

## 4. Data model & projection

### 4.1 New table — migration `050_feedback_applications.sql`

The one missing evidence link: "I used this feedback." Field names adapted to the real schema (`practice_completions`, not the spec's `practice_progress`):

```sql
create table public.feedback_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  related_practice_completion_id uuid references public.practice_completions(id) on delete set null,
  related_proof_id uuid references public.proofs(id) on delete set null,
  reflection text,
  status text not null default 'planned' check (status in ('planned','practiced','demonstrated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feedback_id)
);
```

RLS (pattern of 011/023): select/insert/update/delete own rows; `with check` integrity — `feedback_id` must be feedback the user **received** (`feedback.recipient_id = auth.uid()`), related proof/completion must be owned by the user. A `security definer` guard trigger re-validates cross-row integrity on write (023 style). No client-writable moderation/trust columns exist on this table.

Account deletion: covered by FK cascade chain (proofs → feedback → feedback_applications; profiles → feedback_applications). PR note: `delete_own_account` (PR #29, unmerged) should add an explicit purge line when both land.

**Apply/rollout safety:** repository code tolerates a missing table (returns `[]` on error) so deploy-before-migrate never breaks the screen; positions are presentation-only and never stored.

### 4.2 Typed contract (`lib/constellation/types.ts`)

As specified, adapted to house style:

```ts
type ConstellationNodeStatus = "locked" | "available" | "active" | "in_progress" | "completed" | "attention_needed";
type ConstellationNodeKey = "practice" | "prove" | "feedback" | "apply" | "contribute";
interface ConstellationEvidence { id; type; title; occurredAt; href: string | null }
interface ConstellationNode { key; label; status; evidenceCount; progressCurrent; progressTarget;
  completedAt; explanation; nextActionLabel; nextActionHref; evidence: ConstellationEvidence[] }
interface ConstellationState { directionId; directionName; nodes: Record<Key, Node>;
  recommendedNode; completedLoopCount; updatedAt }
```

### 4.3 Projection (`lib/constellation/projection.ts` — pure, IO-free)

Inputs: the member's own RLS-scoped rows (snapshot models + `feedback_applications`) plus the direction/prompt content. Rules, per active direction (`profiles.currentDirectionId ?? directionIds[0]`):

- **practice** — completed when ≥1 `practice_completion` whose prompt belongs to the direction. `progressCurrent/Target` = completions vs. total active prompts in the direction. Evidence: completions (title = prompt title).
- **prove** — completed when ≥1 own proof in the direction with `status ≠ 'draft'` and `moderation_status ∈ {clear, limited}`. A draft proof ⇒ `in_progress`. Locked until practice has evidence.
- **feedback** — completed when ≥1 visible feedback received on those proofs. Proofs exist but no feedback yet ⇒ `available` ("Feedback usually arrives within a few days"). Locked until prove has evidence.
- **apply** — completed when ≥1 `feedback_application` with status `practiced`/`demonstrated` on direction feedback; `planned` ⇒ `in_progress`; feedback exists but nothing applied ⇒ `available`; locked until feedback completed.
- **contribute** — completed when ≥1 feedback the user **authored** on another member's proof in the direction is marked `helpful`; authored-but-not-yet-helpful ⇒ `in_progress`; locked until the member has received feedback themselves (beginner-safe ordering); `attention_needed` never used here.
- Evidence with `moderation_status ∈ {pending, removed}` is excluded from counts and lists (own or not); deleted rows simply vanish → the UI's "evidence unavailable" copy covers dangling references.
- `status = "active"` marks the recommended node (visual emphasis); `attention_needed` is reserved for real, user-actionable holds (e.g. own proof `pending` review) with calm amber + explanatory text.
- **completedLoopCount** = 1 when all five nodes are completed for the direction, else 0 (v1 is single-loop; the event `growth_loop_completed` fires on the 5th completion).
- **recommendedNode / next action** — first matching rule, deterministic:
  1. resume active practice (practice available/in_progress with a started-but-uncompleted prompt) → `/practice`
  2. finish proof draft → `/proof/new/{promptId}` (draft exists)
  3. review unread feedback (feedback received, apply not started) → `/feedback`
  4. apply accepted feedback (application planned or none after review) → apply sheet
  5. give feedback to an eligible proof → `/feed`
  6. start another recommended practice → `/practice`

`updatedAt` = max evidence timestamp. All copy strings live in the projection so list view, map, and panel say the same thing.

### 4.4 Verification (`scripts/check-constellation.ts`, repo convention)

Fixture-driven assertions: every node-status rule; lock ordering; moderated/deleted evidence exclusion; next-action priority table (one fixture per rule, plus tie order); loop-count; determinism (same input ⇒ deep-equal output); no evidence ⇒ empty-direction state; cross-user rows never counted (fixture includes foreign rows that must be ignored). Run via `npx tsx scripts/check-constellation.ts`; wired into the QA checklist alongside `typecheck` and `build`. (Live RLS denial is asserted by the migration's policy design + existing convention of dashboard verification; the client never queries other users' rows.)

---

## 5. Component architecture

```
app/progress/page.tsx                      — full screen (AppShell, header, direction selector,
                                             viewport, next-action card, view toggle, evidence strip)
components/constellation/
  ConstellationMap.tsx                     — stage: layout, zoom/pan, atmosphere layers, SVG + nodes
  ConstellationNodeButton.tsx              — one node: states, glow, icon, label, progress arc, aria
  ConstellationConnections.tsx             — SVG paths (spokes + journey arc), draw-in, shimmer dot
  ConstellationDetailSheet.tsx             — node detail (bottom sheet <sm, centered panel sm+):
                                             purpose, state, evidence list, why, next action, CTAs
  ConstellationListView.tsx                — accessible list equivalent (icon, name, state, evidence,
                                             explanation, CTA) — also the rendering fallback
  HomeConstellationPreview.tsx             — compact card for /home (5 mini states + next step + CTA)
  ApplyFeedbackSheet.tsx                   — create/advance a feedback_application (plan → practiced)
lib/constellation/{types,projection,layout,copy}.ts
lib/supabase/constellationRepository.ts    — feedback_applications IO (missing-table tolerant)
hooks/useConstellation.ts                  — composes useBetaApp() snapshot + applications + events
supabase/migrations/050_feedback_applications.sql
scripts/check-constellation.ts
```

Shared-file touches (kept minimal for open-PR mergeability): `AppShell.tsx` +`"/progress"` in `protectedPrefixes`; `betaEvents.ts` union extension; `app/home/page.tsx` one preview-card insertion; `globals.css` one clearly-bannered constellation section (keyframes + dark remaps for any new hex variants).

Loading: `next/dynamic` for the map module (list view and screen chrome render immediately; the map hydrates in — no blocked content, static fallback if the chunk fails).

---

## 6. Motion & interaction spec

| Interaction | Treatment | Timing |
|---|---|---|
| Hover (pointer) | ring brightens, related paths clarify, tooltip after 350 ms delay | 150 ms easeOut |
| Press | scale 0.97, no camera movement | immediate |
| Select | node lifts (scale 1.06 + brighter ring), sheet opens coordinated | 220 ms / 260 ms easeOut |
| Sheet enter/exit | rise + fade (`y: 24 → 0`), asymmetric out 180 ms | 280 ms easeOut |
| Recommended node | slow glow breathe (box-shadow alpha/radius only) | 3.2 s ease-in-out ∞ |
| Completion draw | connection `stroke-dashoffset` draw-in, once, on real transition | 700 ms |
| Active-route shimmer | one 3 px gold dot, `animateMotion`, one route only | 3.6 s linear ∞ |
| Entrance | nodes stagger in (MotionList pattern) 60 ms apart, connections fade after | 450 ms easeOut |
| Zoom/reset | transform interpolation | 400 ms easeOut |
| In-progress arc | static SVG arc at `progressCurrent/Target` sweep — never a spinner | — |

Reduced motion (OS `prefers-reduced-motion` **or** `html[data-motion="reduced"]`): no breathe, no shimmer (element not rendered), no draw-in (paths render complete), entrance = opacity only, zoom snaps. Everything remains fully legible and attractive — state is never conveyed by motion alone. Ambient/shimmer layers also pause via `visibilitychange` when the tab is hidden.

## 7. Accessibility

- Nodes are buttons inside a `role="group"` labelled "Your progress constellation"; each `aria-label` = "{Label}: {status sentence}, {evidence summary}" — full meaning without color.
- Status is always triple-encoded: icon shape + text label + color. Locked shows a lock glyph; completed shows a check; attention shows an alert glyph.
- Keyboard: Tab through nodes in journey order (hub first), Enter/Space opens the sheet, Escape closes and **returns focus to the source node**, arrow keys move between nodes (roving tabindex). Sheet uses a focus trap.
- Live region (`aria-live="polite"`) announces selection and state changes ("Feedback step opened. Completed — 1 response received.").
- List view is a first-class, always-available toggle (also auto-selected under forced-colors / rendering failure). Headings h1 (page) → h2 (sections). Contrast: gold-on-cream text uses `#7A5300`/`#B07A00` (≥4.5:1); ink on cream everywhere else.

## 8. Analytics (extend `BetaEventType`, via `logBetaEvent` — no content in metadata)

`constellation_viewed` (mode), `constellation_mode_changed`, `constellation_node_focused` (first focus per node per view), `constellation_node_opened`, `constellation_next_action_selected` (node key + rule), `constellation_reset_view`, `constellation_zoom_used` (once per session), `constellation_list_fallback_used`, `feedback_application_planned`, `feedback_application_completed`, `growth_loop_completed`. No hover spam; metadata = keys/counts only, never proof/feedback text.

## 9. Privacy & AI boundaries

Private by default: only the owner's constellation renders (all reads owner-scoped by RLS; the route lives behind `protectedPrefixes`). Evidence hrefs point at existing screens that re-authorize under RLS. Moderated/removed evidence is excluded server-side of the projection; blocked users can't appear (own-data only). No public constellation, no sharing, no admin view in this task. **No AI anywhere in the feature**; the next-action engine is the deterministic rule table above. Nothing in analytics carries user content.

## 10. UI states (all designed, none blank)

initial loading (skeleton constellation: 6 soft discs + faint paths), refresh (stale-while-revalidate from snapshot), empty direction (unlit-but-composed map + "Choose a direction" CTA), no completed practice (all locked except practice available), partial, full loop (calm gold, settled), evidence unavailable/deleted/moderated (panel line: "This evidence is no longer available."), offline (cached snapshot + quiet banner), retry on load failure, rendering fallback → list view, reduced motion, error (friendly card, never raw).

## 11. Test & QA plan

- `scripts/check-constellation.ts` (unit/integration fixtures, §4.4) + `npm run typecheck` + `npm run build` — all green before PR.
- Manual QA checklist (in PR): 320/375/390/430/tablet/desktop/wide; keyboard-only walkthrough; screen-reader labels; dark mode; pixel-soft on; reduced-motion (OS + in-app); offline; list parity; home preview; apply-feedback flow end-to-end; no horizontal overflow; bottom-nav clearance; sheet safe-area.
- Screenshots for review: desktop + mobile × {empty, partial, completed, selected, reduced-motion, list}.

## 12. Rollback plan

UI is additive (new route + one home card): revert commit(s) to remove; no data loss. Migration 050 is additive; rollback = `drop table public.feedback_applications` (+ policies/trigger dropped with it); no other object is modified. The screen tolerates the table's absence, so UI-revert and migration-revert are independent.

## 13. Verification record (2026-07-11)

**Automated:** `npx tsx scripts/check-constellation.ts` (projection contract: status rules, lock order, moderation exclusion, foreign-row rejection, priority table, determinism) — pass. `node scripts/check-constellation-a11y.mjs` (real-browser keyboard contract: roving tabindex, arrow nav, Enter opens dialog w/ focus, Escape closes + returns focus, list parity, labels, live region) — 10/10 pass. `npm run typecheck` + `npm run build` — pass. Horizontal overflow at 320/375/390/430 px — 0 px each (measured headless).

**End-to-end:** full loop exercised through the real UI in demo mode — apply sheet → plan → mark practiced → "5 of 5 connected" + Loop complete badge (screenshots 14–17).

**Screenshots** (`constellation-shots/`, captured by `scripts/capture-constellation-shots.mjs` — requires `npm i --no-save puppeteer-core` + installed Chrome + dev server on :3160): partial/empty/full-loop × mobile+desktop, selected sheet + desktop inspector, list view, reduced motion, dark mode ×2, 320/375/430/tablet widths, home preview, apply flow ×3.

**Performance notes:** no rAF loops and no canvas — ambient motion is compositor-only CSS (transform/opacity/box-shadow keyframes), double-gated, and `animation-play-state: paused` when the tab is hidden; the SMIL shimmer dot is unmounted (not just paused) under reduced motion or hidden tab. The map module is client-only and route-scoped; evidence dots are capped at 24 static SVG circles; layout math is pure and memoized; the two extra reads (completions + applications) run once per mount and only on /progress and /home-preview. Build output for /progress stays within the app's normal page-chunk range (framer-motion + lucide are already shared chunks).

**Manual QA checklist (for reviewer):**
- [ ] 320 / 375 / 390 / 430 / tablet / desktop / wide — no overflow, no clipped nodes, CTA reachable, no bottom-nav collision
- [ ] Keyboard-only walkthrough (Tab → arrows → Enter → Escape) matches the a11y script
- [ ] Screen reader announces node state on focus and selection
- [ ] Dark mode + pixel-soft on: discs/lines/labels legible (dark disc variants in globals.css)
- [ ] OS reduced-motion AND in-app data-motion="reduced": no breathe/shimmer/draw-in; everything legible
- [ ] Offline: banner shows, last snapshot still renders
- [ ] List view parity: same states, same copy, working CTAs
- [ ] Apply flow: plan → practiced → demonstrated ladder; Escape/backdrop close; focus returns
- [ ] Home preview mirrors the map states and routes to /progress
- [ ] Evidence links land on authorized screens only (own proof/feedback routes)

**Known limitations:** demo-mode hard-refresh on /progress can bounce to /auth (pre-existing hydration race in demo entry, not constellation-specific); `resume_practice` rule is dormant until an in-progress practice is persisted; feedback "unread" relies on notifications rows; full-loop count is single-loop (v1) by design; screenshots capture stills — breathe/shimmer/draw-in reviewed live.

## 14. Acceptance criteria

Visual: reads as deliberate and finished as LumenDeck's surfaces while unmistakably Collective; composed, not scattered; panels integrated; empty state complete; reduced-motion attractive. Functional: every completed node has real evidence; links re-authorize; deterministic next action; private; works without AI, without animation, in list view, at 320 px; typecheck/build/check-script pass. Prohibited list honored (no scores, followers, streak pressure, paid/AI nodes, random layouts, decorative fake evidence, unbounded zoom, hidden gestures, placeholder icons).
