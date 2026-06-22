# Redesign Slice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Collective read as a finished, legible product on its first three surfaces (landing, onboarding, Home) by installing a "Soft Organic" design language (real fonts + shared components) and rebuilding those screens so the app says what it is and always shows one next step.

**Architecture:** Visual/UX only — no behavior or data changes. Add Lora (display) + Inter (body) via `next/font`, expose them as Tailwind `fontFamily` tokens, add a handful of shared components in `components/beta/ui.tsx` (gold-gradient primary button, `LoopStrip`, `ProgressBar`, `HeroCard`), then restyle `app/auth` (AuthForm), `app/onboarding`, and `app/home` to consume them. Reuse `AppShell`, `ThemeProvider`, existing routes/data.

**Tech Stack:** Next.js App Router + TypeScript, Tailwind CSS, `next/font/google`, framer-motion (already present), lucide-react (custom shim). No new dependencies beyond the two Google fonts.

## Global Constraints

- Visual/UX only. Do NOT change behavior, data wiring, routes, or Supabase logic.
- Keep the existing brand palette (no rebrand): cream `#FFF8EE`, card `#FFFDF8`, soft `#FFF1C7`, gold `#F2A900`, gold-bright `#FFB000`, ink `#111111`, muted `#6E6E6E`, line `#EFE7D8`, dark-gold inks `#5E3F00`/`#7A5300`/`#B07A00`.
- Direction B "Soft Organic": rounded 22–28px, gold-gradient primary (`#FFB000`→`#F2A900`), soft brown-tinted shadows, one subtle gold radial "glow" per header.
- Fonts: display = **Lora** (headings), body = **Inter** — via `next/font/google` only.
- One primary CTA per screen; the loop is shown via `LoopStrip`; Home always shows a single "Your next step".
- Approved vocabulary only. NEVER likes / followers / leaderboards / clout / streak-shame.
- Accessibility: text contrast ≥4.5:1, touch targets ≥44px, visible focus rings, `prefers-reduced-motion` respected, color never the only signal, no zoom disable, safe-area insets kept.
- Light AND dark mode must both look right (dark uses the existing `.dark` token layer in `app/globals.css`).
- Preserve the bottom FAB centering fix in `components/beta/AppShell.tsx` (do not touch the FAB wrapper transforms).
- Verification gates: `npm run typecheck` and `npm run build` must pass. No unit-test runner exists; verify visually via the preview (eval-based checks acceptable — the screenshot tool has been flaky this session).
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (Git Bash). **Start on a new branch `redesign-slice1` off `main`.**

## File Structure

- `app/layout.tsx` — **modify.** Wire Lora + Inter via `next/font`; put their CSS variables on `<html>`, set `<body>` to `font-sans`.
- `tailwind.config.ts` — **modify.** Add `fontFamily.sans` / `fontFamily.display` tokens pointing at the font CSS variables.
- `components/beta/ui.tsx` — **modify.** Gold-gradient primary `Button` (+ active scale + focus ring); add `LoopStrip`, `ProgressBar`, `HeroCard`; serif headings on `PageHeader`/`SectionLabel`; restyle `EmptyState`.
- `components/beta/AuthForm.tsx` — **modify.** Landing: product promise + `LoopStrip` + one primary CTA (keep demo + invite logic intact).
- `app/onboarding/page.tsx` — **modify.** Choose-direction + How-it-works `LoopStrip`; serif headings; keep behavior (skippable via Back; `completeOnboarding`).
- `app/home/page.tsx` — **modify.** "Your next step" hero + calm progress + recent proof + quiet Contribute; serif greeting.

No file should grow unwieldy; `ui.tsx` gains ~3 small focused components.

## Source-of-truth reference (read before starting)

- `components/beta/ui.tsx` current exports: `PageHeader`, `Card` (`HTMLMotionProps<"div"> & {asButton?, interactive?}`, rounded-22, warm shadow, framer reveal), `Button` (`variant: "primary"|"secondary"|"quiet"`), `ButtonLink`, `Badge`, `SectionLabel`, `TrustPill`, `EmptyState({title, body, cta})`, `SuccessState`, `TextArea`. Components use inline hex, not Tailwind color tokens.
- `app/layout.tsx`: `<html lang="en"><head>{themeInitScript}</head><body><ThemeProvider><BetaAppProvider>…</body></html>` — no font classes yet.
- Provider hooks available via `useBetaApp()`: `currentUser`, `snapshot` (`.proofs`, `.directions`, `.prompts`, `.completedPracticeIds`), `trustSummary`, `getFeedbackForProof`, `completeOnboarding(directionId)`, `supabaseEnabled`, `signUpWithEmail`, `signInWithEmail`, `enterDemoBeta`. (Do not change these.)
- Dark mode: `app/globals.css` remaps specific inline-hex utility classes under `.dark`. New gradient/glow styles should also read acceptably on `rgb(21,17,10)`; verify in dark.

---

### Task 1: Fonts + Tailwind tokens (design-language foundation)

**Files:**
- Modify: `app/layout.tsx`, `tailwind.config.ts`

**Interfaces:**
- Produces: Tailwind utilities `font-sans` (Inter) and `font-display` (Lora); CSS vars `--font-inter`, `--font-lora` on `<html>`. Later tasks add `font-display` to heading elements.

- [ ] **Step 1: Create the branch**

```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b redesign-slice1
```

- [ ] **Step 2: Wire the fonts in `app/layout.tsx`**

Add near the top imports:
```tsx
import { Inter, Lora } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-lora", display: "swap" });
```
Change the `<html>` and `<body>` tags so the font variables are available and Inter is the default body font:
```tsx
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
```
```tsx
      <body className="font-sans">
```
(Leave everything else in `layout.tsx` — head script, ThemeProvider, providers — unchanged.)

- [ ] **Step 3: Add Tailwind font tokens in `tailwind.config.ts`**

Inside `theme.extend`, add a `fontFamily` block (keep the existing `colors`/`boxShadow`):
```ts
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-lora)", "Georgia", "Cambria", "serif"],
      },
```

- [ ] **Step 4: Typecheck + build (build compiles font loaders)**

```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: typecheck clean; `✓ Compiled successfully`.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx tailwind.config.ts
git commit -m "feat(ui): add Lora display + Inter body via next/font + tailwind tokens"
```

---

### Task 2: Shared components (gold-gradient button, LoopStrip, ProgressBar, HeroCard, serif headings)

**Files:**
- Modify: `components/beta/ui.tsx`

**Interfaces:**
- Consumes: `font-display` token (Task 1).
- Produces:
  - `Button` primary → gold gradient + `active:scale-95` + focus-visible ring (same props).
  - `LoopStrip({ numbered?: boolean; steps?: string[] })`
  - `ProgressBar({ value: number; label?: string })` (value 0–100)
  - `HeroCard({ children, className? })`
  - `PageHeader`/`SectionLabel`/`EmptyState` headings use `font-display`.

- [ ] **Step 1: Restyle the primary button**

In `components/beta/ui.tsx`, replace the `buttonStyles.primary` line so primary is a gold gradient with a soft shadow:
```ts
  primary: "bg-gradient-to-r from-[#FFB000] to-[#F2A900] text-white shadow-[0_10px_24px_rgba(242,169,0,0.32)]",
```
Then, on the `Button` component's rendered element `className`, append accessible interaction classes (keep existing classes; add these to the template string):
```
 outline-none transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-[#F2A900]/40
```

- [ ] **Step 2: Serif headings on PageHeader + SectionLabel**

In `PageHeader`, change the `<h1>` className to include `font-display`:
```tsx
          <h1 className="font-display text-[31px] font-bold leading-tight tracking-tight text-[#111111]">{title}</h1>
```
(Lora's 700 reads as bold; `font-extrabold` is not needed for serif. Keep the rest of `PageHeader` unchanged.)

- [ ] **Step 3: Add LoopStrip**

Append to `components/beta/ui.tsx`:
```tsx
/** Visual representation of the Collective loop. Plain chips, or numbered steps. */
export function LoopStrip({ numbered = false, steps = ["Practice", "Prove", "Feedback", "Trust"] }: { numbered?: boolean; steps?: string[] }) {
  if (numbered) {
    return (
      <div className="flex items-center gap-1.5" role="list" aria-label="How Collective works">
        {steps.map((s, i) => (
          <div key={s} role="listitem" className="flex-1 text-center">
            <span className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-[#FFE7AE] text-[11px] font-extrabold text-[#7A5300]">{i + 1}</span>
            <span className="block text-[10px] font-bold text-[#B07A00]">{s}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="How Collective works">
      {steps.map((s) => (
        <span key={s} role="listitem" className="rounded-full bg-[#FFF1C7] px-3 py-1 text-[11px] font-bold text-[#7A5300]">{s}</span>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Add ProgressBar**

Append to `components/beta/ui.tsx`:
```tsx
/** Calm weekly-progress bar (gold fill). value is 0–100. */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9B958B]">{label}</p>}
      <div className="h-2 overflow-hidden rounded-full bg-[#FFE7AE]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-[#FFB000] to-[#F2A900] transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add HeroCard**

Append to `components/beta/ui.tsx`:
```tsx
/** Focal "hero" surface: warm cream→gold gradient card for the one key action on a screen. */
export function HeroCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[24px] border border-[#F6E7C8] bg-gradient-to-br from-[#FFF1C7] to-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(71,52,18,0.12)] ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Restyle EmptyState heading to serif**

In `EmptyState`, change its title element to use `font-display` (find the title `<h..>`/`<p>` and add `font-display`). Example — the title line becomes:
```tsx
      <p className="font-display text-lg font-bold text-[#111111]">{title}</p>
```
(Keep its body + cta unchanged.)

- [ ] **Step 7: Typecheck + commit**

```bash
npm run typecheck
git add components/beta/ui.tsx
git commit -m "feat(ui): gold-gradient primary, LoopStrip, ProgressBar, HeroCard, serif headings"
```
Expected: typecheck clean.

---

### Task 3: Landing / auth redesign

**Files:**
- Modify: `components/beta/AuthForm.tsx`

**Interfaces:**
- Consumes: `LoopStrip`, `Button`, `Card` (Task 2); `useBetaApp()` (unchanged).

- [ ] **Step 1: Add the imports**

In `components/beta/AuthForm.tsx`, ensure the `@/components/beta/ui` import includes `LoopStrip` (it already imports `Button, Card`):
```tsx
import { Button, Card, LoopStrip } from "@/components/beta/ui";
```

- [ ] **Step 2: Replace the header block with the product promise + loop**

Find the header `<div className="text-center">…</div>` (the one containing `CollectiveMark` + the `mode === "signup" ? "Join the closed beta." : "Welcome back."` `<h1>` + the "Small steps. Real progress." `<p>`). Replace that whole block with:
```tsx
      <div className="text-center">
        <CollectiveMark className="mx-auto h-[88px] w-[180px]" />
        <h1 className="mt-5 font-display text-[32px] font-bold leading-tight text-[#111111]">
          {mode === "signup" ? "Small steps. Real progress." : "Welcome back."}
        </h1>
        <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-[#6E6E6E]">
          {mode === "signup"
            ? "Practice one small thing. Show your proof. Get useful feedback. Build trust over time — no likes, no followers."
            : "Small steps. Real progress."}
        </p>
        {mode === "signup" && (
          <div className="mt-4 flex justify-center">
            <LoopStrip />
          </div>
        )}
      </div>
```
(Keep the rest of `AuthForm` — the `supabaseEnabled` form, email/password inputs, invite field, "Explore the demo" button, and all handlers — exactly as-is. The primary "Create account" / "Sign in" button now renders as the gold gradient automatically.)

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add components/beta/AuthForm.tsx
git commit -m "feat(ui): landing states the product promise + loop, one primary CTA"
```
Expected: typecheck clean.

---

### Task 4: Onboarding redesign

**Files:**
- Modify: `app/onboarding/page.tsx`

**Interfaces:**
- Consumes: `LoopStrip` (Task 2); `useBetaApp()` (`completeOnboarding`, `snapshot.directions`, unchanged).

- [ ] **Step 1: Add imports**

In `app/onboarding/page.tsx`, add to the `@/components/beta/ui` import: `LoopStrip` (alongside the existing `Button, Card`). If `Card` isn't imported, import `Button, Card, LoopStrip`.

- [ ] **Step 2: Serif headings**

Change the step-0 `<h1>` ("Welcome to Collective.") and the step-1 `<h1>` ("Choose a direction.") and step-2 `<h1>` to include `font-display`, e.g.:
```tsx
          <h1 className="font-display text-[30px] font-bold leading-tight">Welcome to Collective.</h1>
```
```tsx
          <h1 className="font-display text-2xl font-bold">Choose a direction.</h1>
```
```tsx
          <h1 className="font-display text-2xl font-bold">How Collective works.</h1>
```

- [ ] **Step 3: Add the "How it works" LoopStrip to the direction step**

In the step-1 block (`step === 1`), immediately AFTER the directions `<div className="space-y-3">…</div>` and BEFORE the "Continue" `<Button>`, insert:
```tsx
          <div className="rounded-[20px] border border-[#EFE7D8] bg-[#FFFDF8] p-4">
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#B07A00]">How it works</p>
            <LoopStrip numbered />
          </div>
```
(Keep the direction-selection logic, the step state machine, Back/skip behavior, and `finish()`/`completeOnboarding` exactly as-is.)

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add app/onboarding/page.tsx
git commit -m "feat(ui): onboarding teaches the loop + serif headings"
```
Expected: typecheck clean.

---

### Task 5: Home redesign ("Your next step" hero)

**Files:**
- Modify: `app/home/page.tsx`

**Interfaces:**
- Consumes: `HeroCard`, `ProgressBar`, `Button`, `Card`, `SectionLabel`, `EmptyState`, `ButtonLink` (Task 2 + existing); `useBetaApp()` (`currentUser`, `snapshot`, `getFeedbackForProof`, unchanged).

- [ ] **Step 1: Add imports**

In `app/home/page.tsx`, extend the `@/components/beta/ui` import to include `HeroCard, ProgressBar` (alongside the existing `Badge, ButtonLink, Card, EmptyState, PageHeader, SectionLabel`). Keep the `useRouter`/links/`ProofCard` imports.

- [ ] **Step 2: Replace the "Today's Focus" card with the "Your next step" hero**

Find the `<Card interactive className="p-5">…Today's Focus…</Card>` block (the one with `AnimatedBar value={72}` and "2 of 3 practices completed"). Replace that whole `<Card>…</Card>` with:
```tsx
        <HeroCard>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#B07A00]">Your next step</p>
          <h2 className="mt-1 font-display text-xl font-bold text-[#111111]">{nextPrompt.title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">{nextPrompt.estimatedMinutes} min · low pressure</p>
          <ButtonLink href={`/proof/new/${nextPrompt.id}`} className="mt-4 w-full">Begin →</ButtonLink>
          <div className="mt-4">
            <ProgressBar value={66} label="This week" />
          </div>
        </HeroCard>
```
(`nextPrompt` is already computed in the file. `ButtonLink` renders the gold-gradient primary. The static `66`/`value={72}` is a placeholder progress figure matching the current UI — keep it static; wiring real weekly counts is out of Slice-1 scope.)

- [ ] **Step 3: Make the greeting serif**

The greeting comes from `PageHeader title={...}` — `PageHeader` now uses `font-display` (Task 2), so no change needed here. Leave the `PageHeader` call as-is.

- [ ] **Step 4: Keep Contribute as a quiet entry (already present)**

The file already ends with `<ButtonLink href="/contribute" variant="secondary" className="w-full">Contribute — help someone's next step</ButtonLink>`. Leave it; it now sits below the redesigned sections. No change.

- [ ] **Step 5: Typecheck + build (Home is a key route)**

```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: typecheck clean; `✓ Compiled successfully`.

- [ ] **Step 6: Commit**

```bash
git add app/home/page.tsx
git commit -m "feat(ui): Home leads with an always-present 'Your next step' hero"
```

---

### Task 6: Verify (light + dark, FAB intact)

**Files:** none (verification only).

- [ ] **Step 1: Build**

```bash
npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 2: Start preview + check fonts/components render (light)**

Start the dev server via the preview tool (`collective-web`). Then eval on the running server to confirm Lora loaded and the landing renders the promise:
```js
(async () => {
  await document.fonts.ready;
  const hasLora = [...document.fonts].some(f => /Lora/i.test(f.family));
  return { hasLora, href: location.href };
})()
```
Navigate to `/auth` and confirm the promise copy + LoopStrip chips are present:
```js
(() => ({ promise: /Small steps\. Real progress\./.test(document.body.innerText), loop: /Practice/.test(document.body.innerText) && /Trust/.test(document.body.innerText) }))()
```
Expected: `hasLora: true`; promise + loop present.

- [ ] **Step 3: Enter demo, check Home hero (light) + dark mode**

Enter demo (click "Explore the demo" on `/auth`), go to `/home`, confirm the hero + progress render and 0 broken; then toggle dark and re-check:
```js
(() => { const t = document.body.innerText; return { nextStep: /Your next step/.test(t), begin: /Begin/.test(t) }; })()
```
```js
(() => { document.documentElement.classList.add('dark'); return { dark: document.documentElement.classList.contains('dark'), bg: getComputedStyle(document.body).backgroundColor }; })()
```
Expected: hero present in light; dark bg `rgb(21, 17, 10)` with content still legible (no white boxes on the hero/cards).

- [ ] **Step 4: Confirm the FAB centering fix is intact**

```js
(() => { const fab = document.querySelector('a[aria-label="Submit proof"]'); if(!fab) return {fab:false}; const r=fab.getBoundingClientRect(); const before=r.left+r.width/2; fab.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1})); const r2=fab.getBoundingClientRect(); fab.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1})); return { driftOnTap:+((r2.left+r2.width/2)-before).toFixed(1) }; })()
```
Expected: `driftOnTap: 0` (the FAB wrapper was not touched).

- [ ] **Step 5: No banned vocabulary introduced**

```bash
grep -rniE "\b(likes?|followers?|leaderboard|influencer|viral|clout)\b" components/beta/ui.tsx components/beta/AuthForm.tsx app/onboarding/page.tsx app/home/page.tsx || echo "no banned terms (good)"
```
Expected: no banned terms.

- [ ] **Step 6: (No commit needed — verification only.)**

---

## Self-Review

**1. Spec coverage:**
- Lora + Inter via next/font + Tailwind tokens → Task 1. ✓
- Gold-gradient primary, LoopStrip, ProgressBar, HeroCard, serif headings, restyled EmptyState → Task 2. ✓
- Landing: promise + LoopStrip + one primary CTA, demo kept → Task 3. ✓
- Onboarding: choose direction + How-it-works LoopStrip, skippable preserved → Task 4. ✓
- Home: always-present "Your next step" hero + calm progress + recent proof (existing ProofCard section retained) + quiet Contribute → Task 5. ✓
- Light+dark, AA, ≥44px, reduced-motion: components use ≥44px (`min-h-12`/button sizing), focus rings, transform-based motion; dark verified Task 6. ✓
- FAB preserved (untouched) + verified → Task 6 Step 4. ✓
- typecheck + build + no banned vocab → Tasks 1/5/6. ✓
- Out of scope (behavior, Slices 2–3, rebrand, real weekly counts) → not in plan, noted. ✓

**2. Placeholder scan:** No TBD/TODO. Every code step shows full code or an exact, located edit. The static `66`/`72` progress value is explicitly called out as intentional (not a placeholder to wire).

**3. Type consistency:** New component names + props identical across definition (Task 2) and use (Tasks 3–5): `LoopStrip({numbered?, steps?})`, `ProgressBar({value, label?})`, `HeroCard({children, className?})`. Font tokens `font-sans`/`font-display` defined Task 1, used Tasks 2–5. `nextPrompt` referenced in Task 5 already exists in `home/page.tsx`. No signature drift.
