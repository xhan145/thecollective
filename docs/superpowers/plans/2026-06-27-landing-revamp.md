# Landing Page Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 430px phone-column landing (`app/page.tsx`) with a full-width, desktop-responsive marketing/conversion page built from `components/marketing/*`, per `docs/superpowers/specs/2026-06-27-landing-revamp-design.md`.

**Architecture:** A thin `app/page.tsx` composes focused section components from a new `components/marketing/` dir, each wrapped by a shared `<Section>` (full-bleed bg + inner `mx-auto max-w-6xl px-5 lg:px-8` container). Copy + feature flags live in `lib/marketing/content.ts`. Mobile-first single column → desktop multi-column via Tailwind `lg:` grids. Warm Proof-Based Growth theme (cream, gold `#F2A900`, `font-display` Lora headings, Inter body), subtle framer-motion.

**Tech Stack:** Next.js App Router (client components), TypeScript, Tailwind, framer-motion (already a dep), lucide-react icons, existing `components/beta/Brand.tsx` (Collective SVG logo) + `components/beta/ui.tsx` (`Button`, `ButtonLink`).

## Global Constraints

- Landing is its own `<main>` — do NOT use `AppShell`. Remove the `max-w-[430px]` cap.
- Mobile-first; desktop multi-column at `lg:` (1024px); content centered at `max-w-6xl` (1152px); no horizontal scroll at any width.
- Theme tokens only: cream `#FFF8EE` / surface `#FFFDF8` / soft `#FFF1C7` / ink `#111111` / muted `#6E6E6E` / line `#EFE7D8` / gold `#F2A900`; headings use `font-display`; reuse `--c-*` vars so dark mode reads.
- Anti-clout: NO fabricated metrics/testimonials, NO follower/like/leaderboard language. Real-only social proof behind flags; omitted when off.
- Logo = the existing `CollectiveWordmark` / `CollectiveMark` SVG (local). No hotlinked assets.
- Primary CTA everywhere: **"Join the closed beta"** → `/auth`. Secondary: quiet **"Sign in"** → `/auth`. "Watch the 90-sec demo" renders only when `DEMO_VIDEO_URL` is set.
- Verification per task: `npm run typecheck` clean + `npm run build` compiles. Final task adds a preview responsive check (mobile 390px + desktop ≥1280px).
- Reuse existing `Button`/`ButtonLink` (variants `primary | secondary | quiet`). Do not restyle the shared UI kit.

---

### Task 1: Marketing content module + shared Section wrapper

**Files:**
- Create: `lib/marketing/content.ts`
- Create: `components/marketing/Section.tsx`

**Interfaces:**
- Produces: `lib/marketing/content.ts` exports `MARKETING` (copy + data) and flags `SHOW_METRICS`, `SHOW_TESTIMONIALS`, `DEMO_VIDEO_URL`. `Section` (default export) props `{ id?: string; bg?: "cream" | "surface" | "gold"; className?: string; children: ReactNode }`.

- [ ] **Step 1: Create `lib/marketing/content.ts`**

```ts
// Single source of marketing copy + feature flags. Real-only social proof:
// flags stay false until genuine content exists (no fabricated stats/quotes).
export const DEMO_VIDEO_URL: string | null = null; // set to a URL to reveal "Watch the 90-sec demo"
export const SHOW_METRICS = false;                 // flip on only with real beta numbers
export const SHOW_TESTIMONIALS = false;            // flip on only with real quotes

export const MARKETING = {
  hero: {
    headline: "Stop watching. Start practicing.",
    sub: "Collective turns self-improvement into reps: pick a direction, do one small practice, post proof, and get useful feedback. Real progress — no likes, no followers.",
    primaryCta: "Join the closed beta",
    secondaryCta: "Watch the 90-sec demo",
  },
  mission: "Social media rewards attention. Collective rewards progress.",
  loop: [
    { key: "discover", title: "Discover", body: "Choose a direction worth practicing." },
    { key: "practice", title: "Practice", body: "One small, low-pressure rep." },
    { key: "proof", title: "Proof", body: "Show what you actually did." },
    { key: "feedback", title: "Feedback", body: "Get useful, kind notes." },
    { key: "trust", title: "Trust", body: "Earn it by showing up." },
    { key: "contribute", title: "Contribute", body: "Help someone's next step." },
  ],
  showcase: [
    { title: "Practice", body: "A tailored next step for your direction — short and doable." },
    { title: "Upload proof", body: "Text, photo, video, or audio. Evidence of the rep, not content for clout." },
    { title: "Receive feedback", body: "Structured, encouraging notes from people a step ahead." },
    { title: "Trust profile", body: "Watch trust grow from practice, proof, useful feedback, and contribution." },
  ],
  practiceExamples: ["Interview practice", "Introductions", "Presentations", "Negotiation", "Leadership reps", "Difficult conversations"],
  trust: {
    title: "Trust is earned, never bought.",
    body: "Every rep, every useful note, every contribution adds up. Move from New to Contributor by showing up — there's no shortcut and nothing to buy.",
    tiers: ["New", "Practicing", "Reliable", "Helpful", "Contributor"],
  },
  ai: {
    title: "AI that helps you practice — never grades you.",
    body: "Optional AI assists with prep, reflection, feedback coaching, and summaries. It never decides your trust, judges your worth, or posts for you.",
    points: ["Practice prep", "Reflection help", "Feedback coaching", "Plain-language summaries"],
  },
  vision: {
    title: "Built to grow with you.",
    directions: ["Communication", "Leadership", "Career", "Business", "Relationships", "Fitness"],
  },
  // Owner-supplied. Until provided this placeholder renders with a visible marker.
  founder: {
    placeholder: true,
    body: "Collective exists because real growth comes from doing the reps, not collecting likes. [Founder story placeholder — replace in lib/marketing/content.ts]",
  },
  beta: {
    title: "Help build the future of practice.",
    body: "We're in closed beta with a small group shaping the product. Join us.",
    cta: "Join the closed beta",
  },
  footer: {
    columns: [
      { heading: "Product", links: [{ label: "How it works", href: "#how" }, { label: "Roadmap", href: "#" }] },
      { heading: "Company", links: [{ label: "Mission", href: "#mission" }, { label: "Founder", href: "#founder" }, { label: "Contact", href: "mailto:hello@thecollective.app" }] },
      { heading: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
    ],
    socials: [{ label: "X", href: "#" }, { label: "LinkedIn", href: "#" }],
  },
} as const;
```

- [ ] **Step 2: Create `components/marketing/Section.tsx`**

```tsx
import type { ReactNode } from "react";

const BG: Record<string, string> = {
  cream: "bg-[#FFF8EE]",
  surface: "bg-[#FFFDF8]",
  gold: "bg-[#FFF1C7]",
};

export default function Section({
  id,
  bg = "cream",
  className = "",
  children,
}: {
  id?: string;
  bg?: "cream" | "surface" | "gold";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`w-full ${BG[bg]} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:px-8 lg:py-24">{children}</div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck` — Expected: clean. (No build yet; nothing imports these.)

- [ ] **Step 4: Commit**

```bash
git add lib/marketing/content.ts components/marketing/Section.tsx
git commit -m "feat(landing): marketing content module + Section wrapper"
```

---

### Task 2: MarketingNav + Hero (with phone mockup)

**Files:**
- Create: `components/marketing/MarketingNav.tsx`
- Create: `components/marketing/PhoneMockup.tsx`
- Create: `components/marketing/Hero.tsx`

**Interfaces:**
- Consumes: `MARKETING`, `DEMO_VIDEO_URL` from `lib/marketing/content.ts`; `CollectiveWordmark` from `@/components/beta/Brand`; `ButtonLink` from `@/components/beta/ui`.
- Produces: default-exported `MarketingNav`, `Hero` (no props); `PhoneMockup` (`{ className?: string }`).

- [ ] **Step 1: Create `components/marketing/MarketingNav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/beta/ui";
import { CollectiveWordmark } from "@/components/beta/Brand";

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#EFE7D8]/70 bg-[#FFF8EE]/85 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3 lg:px-8">
        <Link href="/" aria-label="Collective home"><CollectiveWordmark /></Link>
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden items-center gap-6 lg:flex">
            <a href="#how" className="text-sm font-bold text-[#38322A] hover:text-[#111111]">How it works</a>
            <a href="#ai" className="text-sm font-bold text-[#38322A] hover:text-[#111111]">AI</a>
            <a href="#vision" className="text-sm font-bold text-[#38322A] hover:text-[#111111]">Vision</a>
          </div>
          <Link href="/auth" className="hidden text-sm font-bold text-[#6E6E6E] hover:text-[#111111] sm:block">Sign in</Link>
          <ButtonLink href="/auth">Join the closed beta</ButtonLink>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Create `components/marketing/PhoneMockup.tsx`** (stylized CSS mockup of the app — no screenshot dependency; owner can swap a real image later)

```tsx
"use client";

import { motion } from "framer-motion";
import { CollectiveMiniMark } from "@/components/beta/Brand";

// A stylized phone showing the product's look (cream cards, gold, the loop).
// Pure CSS/markup so it ships without screenshot capture; swap for a real
// screenshot <img> later if desired.
export default function PhoneMockup({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative mx-auto w-[280px] rounded-[40px] border border-[#EFE7D8] bg-[#FFFDF8] p-3 shadow-[0_30px_80px_rgba(71,52,18,0.18)] ${className}`}
    >
      <div className="overflow-hidden rounded-[30px] bg-[#FFF8EE] p-4">
        <div className="flex items-center justify-between">
          <CollectiveMiniMark className="h-7 w-7" />
          <span className="h-7 w-7 rounded-full bg-[#FFF1C7]" />
        </div>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#FFF1C7] to-[#FFFDF8] p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#B07A00]">Your next step</p>
          <p className="mt-1 font-display text-base font-bold text-[#111111]">Introduce yourself in 60 seconds</p>
          <p className="mt-1 text-[11px] text-[#6E6E6E]">3 min · low pressure</p>
          <div className="mt-3 h-9 w-full rounded-full bg-[#F2A900]" />
        </div>
        <div className="mt-3 space-y-2">
          {["Proof posted", "Useful feedback +1", "Trust growing"].map((t) => (
            <div key={t} className="flex items-center gap-2 rounded-xl bg-[#FFFDF8] p-2 shadow-[0_6px_16px_rgba(71,52,18,0.06)]">
              <span className="h-6 w-6 rounded-lg bg-[#E8F8EE]" />
              <span className="text-[11px] font-bold text-[#38322A]">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Create `components/marketing/Hero.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/beta/ui";
import { MARKETING, DEMO_VIDEO_URL } from "@/lib/marketing/content";
import PhoneMockup from "./PhoneMockup";

export default function Hero() {
  const { headline, sub, primaryCta, secondaryCta } = MARKETING.hero;
  return (
    <section className="w-full bg-[#FFF8EE]">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
        <div className="text-center lg:text-left">
          <h1 className="font-display text-[40px] font-bold leading-[1.05] tracking-tight text-[#111111] lg:text-[56px]">{headline}</h1>
          <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-7 text-[#6E6E6E] lg:mx-0 lg:text-[18px]">{sub}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
            <ButtonLink href="/auth" className="w-full sm:w-auto">{primaryCta}</ButtonLink>
            {DEMO_VIDEO_URL && (
              <Link href={DEMO_VIDEO_URL} className="inline-flex min-h-[50px] w-full items-center justify-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8] px-6 text-sm font-extrabold text-[#111111] sm:w-auto">{secondaryCta}</Link>
            )}
          </div>
        </div>
        <PhoneMockup />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add components/marketing/MarketingNav.tsx components/marketing/PhoneMockup.tsx components/marketing/Hero.tsx
git commit -m "feat(landing): marketing nav + responsive hero with phone mockup"
```

---

### Task 3: MissionBand + LoopShowcase

**Files:**
- Create: `components/marketing/MissionBand.tsx`
- Create: `components/marketing/LoopShowcase.tsx`

**Interfaces:**
- Consumes: `MARKETING.mission`, `MARKETING.loop`; `Section` from `./Section`.
- Produces: default-exported `MissionBand`, `LoopShowcase`.

- [ ] **Step 1: Create `components/marketing/MissionBand.tsx`**

```tsx
import { MARKETING } from "@/lib/marketing/content";

export default function MissionBand() {
  return (
    <section id="mission" className="w-full bg-[#FFF1C7]">
      <div className="mx-auto w-full max-w-4xl px-5 py-16 text-center lg:py-20">
        <p className="font-display text-[26px] font-bold leading-snug text-[#111111] lg:text-[34px]">{MARKETING.mission}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/marketing/LoopShowcase.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function LoopShowcase() {
  return (
    <Section id="how" bg="surface">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">The loop</h2>
      <p className="mx-auto mt-3 max-w-[560px] text-center text-[15px] leading-7 text-[#6E6E6E]">A calm cycle that compounds — not an endless feed to scroll.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {MARKETING.loop.map((step, i) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] p-4 text-center"
          >
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[#FFF1C7] text-sm font-black text-[#B07A00]">{i + 1}</div>
            <p className="mt-3 font-display text-base font-bold text-[#111111]">{step.title}</p>
            <p className="mt-1 text-[12px] leading-5 text-[#6E6E6E]">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Verify** — Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/MissionBand.tsx components/marketing/LoopShowcase.tsx
git commit -m "feat(landing): mission band + animated loop showcase"
```

---

### Task 4: ProductShowcase + PracticeExamples

**Files:**
- Create: `components/marketing/ProductShowcase.tsx`
- Create: `components/marketing/PracticeExamples.tsx`

**Interfaces:**
- Consumes: `MARKETING.showcase`, `MARKETING.practiceExamples`; `Section`; `PhoneMockup` from `./PhoneMockup`.
- Produces: default-exported `ProductShowcase`, `PracticeExamples`.

- [ ] **Step 1: Create `components/marketing/ProductShowcase.tsx`** (alternating rows; reuse PhoneMockup as the visual; real screenshots can replace later)

```tsx
import Section from "./Section";
import PhoneMockup from "./PhoneMockup";
import { MARKETING } from "@/lib/marketing/content";

export default function ProductShowcase() {
  return (
    <Section bg="cream">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">See it in action</h2>
      <div className="mt-12 space-y-16">
        {MARKETING.showcase.map((item, i) => (
          <div key={item.title} className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <div className="flex justify-center">
              <div className="w-full max-w-[360px] rounded-3xl border border-[#EFE7D8] bg-[#FFFDF8] p-6 shadow-[0_18px_50px_rgba(71,52,18,0.10)]">
                <PhoneMockup className="!w-full !max-w-[240px]" />
              </div>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#F2A900]">Step {i + 1}</p>
              <h3 className="mt-2 font-display text-[24px] font-bold text-[#111111]">{item.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-[#6E6E6E]">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Create `components/marketing/PracticeExamples.tsx`**

```tsx
import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function PracticeExamples() {
  return (
    <Section bg="surface">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">Practice things that matter</h2>
      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
        {MARKETING.practiceExamples.map((ex) => (
          <span key={ex} className="rounded-full border border-[#EFE7D8] bg-[#FFF8EE] px-5 py-2.5 text-sm font-bold text-[#38322A]">{ex}</span>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Verify** — Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/ProductShowcase.tsx components/marketing/PracticeExamples.tsx
git commit -m "feat(landing): product showcase + practice examples"
```

---

### Task 5: TrustExplainer + AiSection

**Files:**
- Create: `components/marketing/TrustExplainer.tsx`
- Create: `components/marketing/AiSection.tsx`

**Interfaces:**
- Consumes: `MARKETING.trust`, `MARKETING.ai`; `Section`.
- Produces: default-exported `TrustExplainer`, `AiSection`.

- [ ] **Step 1: Create `components/marketing/TrustExplainer.tsx`**

```tsx
import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function TrustExplainer() {
  const { title, body, tiers } = MARKETING.trust;
  return (
    <Section bg="cream">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
      </div>
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        {tiers.map((tier, i) => (
          <div key={tier} className="flex items-center gap-2">
            <span className="rounded-full bg-[#FFF1C7] px-4 py-2 text-sm font-extrabold text-[#B07A00]">{tier}</span>
            {i < tiers.length - 1 && <span className="text-[#D8CBB0]">→</span>}
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Create `components/marketing/AiSection.tsx`**

```tsx
import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function AiSection() {
  const { title, body, points } = MARKETING.ai;
  return (
    <Section id="ai" bg="surface">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
          <p className="mt-3 text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {points.map((p) => (
            <div key={p} className="rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] p-4 text-sm font-bold text-[#38322A]">{p}</div>
          ))}
        </div>
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Verify** — Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/marketing/TrustExplainer.tsx components/marketing/AiSection.tsx
git commit -m "feat(landing): trust explainer + AI-as-helper section"
```

---

### Task 6: SocialProof + VisionSection + FounderStory + BetaCta + MarketingFooter

**Files:**
- Create: `components/marketing/SocialProof.tsx`
- Create: `components/marketing/VisionSection.tsx`
- Create: `components/marketing/FounderStory.tsx`
- Create: `components/marketing/BetaCta.tsx`
- Create: `components/marketing/MarketingFooter.tsx`

**Interfaces:**
- Consumes: `MARKETING`, `SHOW_METRICS`, `SHOW_TESTIMONIALS`; `Section`; `ButtonLink`; `CollectiveWordmark`.
- Produces: default-exported `SocialProof`, `VisionSection`, `FounderStory`, `BetaCta`, `MarketingFooter`.

- [ ] **Step 1: Create `components/marketing/SocialProof.tsx`** (real-only: renders null when both flags off)

```tsx
import Section from "./Section";
import { SHOW_METRICS, SHOW_TESTIMONIALS } from "@/lib/marketing/content";

export default function SocialProof() {
  if (!SHOW_METRICS && !SHOW_TESTIMONIALS) return null; // no fabricated proof
  return (
    <Section bg="cream">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">From the beta</h2>
      {/* Real metrics/testimonials render here once the flags + data are set. */}
    </Section>
  );
}
```

- [ ] **Step 2: Create `components/marketing/VisionSection.tsx`**

```tsx
import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function VisionSection() {
  const { title, directions } = MARKETING.vision;
  return (
    <Section id="vision" bg="surface">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        {directions.map((d) => (
          <div key={d} className="rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] px-4 py-5 text-center text-sm font-bold text-[#38322A]">{d}</div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 3: Create `components/marketing/FounderStory.tsx`** (placeholder marker until owner-supplied)

```tsx
import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function FounderStory() {
  const { body, placeholder } = MARKETING.founder;
  return (
    <Section id="founder" bg="cream">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#F2A900]">Why Collective</p>
        <p className="mt-4 font-display text-[22px] font-medium leading-relaxed text-[#111111] lg:text-[26px]">{body}</p>
        {placeholder && <p className="mt-3 text-xs font-bold text-[#B07A00]">↑ Placeholder — replace in lib/marketing/content.ts</p>}
      </div>
    </Section>
  );
}
```

- [ ] **Step 4: Create `components/marketing/BetaCta.tsx`**

```tsx
import { ButtonLink } from "@/components/beta/ui";
import { MARKETING } from "@/lib/marketing/content";

export default function BetaCta() {
  const { title, body, cta } = MARKETING.beta;
  return (
    <section className="w-full bg-[#FFF1C7]">
      <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center lg:py-24">
        <h2 className="font-display text-[30px] font-bold text-[#111111] lg:text-[40px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
        <div className="mt-8 flex justify-center"><ButtonLink href="/auth">{cta}</ButtonLink></div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `components/marketing/MarketingFooter.tsx`**

```tsx
import Link from "next/link";
import { MARKETING } from "@/lib/marketing/content";
import { CollectiveWordmark } from "@/components/beta/Brand";

export default function MarketingFooter() {
  return (
    <footer className="w-full border-t border-[#EFE7D8] bg-[#FFFDF8]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <CollectiveWordmark />
          <p className="mt-3 max-w-[220px] text-sm leading-6 text-[#6E6E6E]">Small steps. Real progress.</p>
        </div>
        {MARKETING.footer.columns.map((col) => (
          <div key={col.heading}>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#9B958B]">{col.heading}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm font-bold text-[#38322A] hover:text-[#111111]">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-[#EFE7D8] px-5 py-6 sm:flex-row lg:px-8">
        <p className="text-xs text-[#9B958B]">© 2026 Collective. Proof over performance.</p>
        <div className="flex gap-4">
          {MARKETING.footer.socials.map((s) => (
            <Link key={s.label} href={s.href} className="text-xs font-bold text-[#6E6E6E] hover:text-[#111111]">{s.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 6: Verify** — Run: `npm run typecheck` — Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add components/marketing/SocialProof.tsx components/marketing/VisionSection.tsx components/marketing/FounderStory.tsx components/marketing/BetaCta.tsx components/marketing/MarketingFooter.tsx
git commit -m "feat(landing): social-proof slot, vision, founder, beta CTA, footer"
```

---

### Task 7: Compose `app/page.tsx` + final responsive verification

**Files:**
- Modify: `app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: all `components/marketing/*` defaults.

- [ ] **Step 1: Rewrite `app/page.tsx`**

```tsx
import MarketingNav from "@/components/marketing/MarketingNav";
import Hero from "@/components/marketing/Hero";
import MissionBand from "@/components/marketing/MissionBand";
import LoopShowcase from "@/components/marketing/LoopShowcase";
import ProductShowcase from "@/components/marketing/ProductShowcase";
import PracticeExamples from "@/components/marketing/PracticeExamples";
import TrustExplainer from "@/components/marketing/TrustExplainer";
import AiSection from "@/components/marketing/AiSection";
import SocialProof from "@/components/marketing/SocialProof";
import VisionSection from "@/components/marketing/VisionSection";
import FounderStory from "@/components/marketing/FounderStory";
import BetaCta from "@/components/marketing/BetaCta";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function LandingPage() {
  return (
    <main className="w-full bg-[#FFF8EE] text-[#111111]">
      <MarketingNav />
      <Hero />
      <MissionBand />
      <LoopShowcase />
      <ProductShowcase />
      <PracticeExamples />
      <TrustExplainer />
      <AiSection />
      <SocialProof />
      <VisionSection />
      <FounderStory />
      <BetaCta />
      <MarketingFooter />
    </main>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run: `npm run typecheck` then `npm run build` — Expected: both clean; `/` listed in the build output.

- [ ] **Step 3: Responsive preview check**

Start the dev server (preview tooling) and load `/`. Verify at **390px** (mobile): single column, nav shows logo + Join, hero stacks, no horizontal scroll. Verify at **≥1280px** (desktop): hero is 2-column, loop is a 6-up row, showcase alternates, footer is multi-column, content centered (not stretched edge-to-edge). Confirm console is clean.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat(landing): compose responsive marketing landing page"
```

---

## Self-Review

**Spec coverage:** Nav/CTA hierarchy (#12) → T2; hero+mockup (#1,#2) → T2; value prop (#2) → content/T2; mission/centerpiece (#6,#18) → T3; loop (#4) → T3; product screenshots (#5) → T4; practice examples (#8) → T4; trust (#9) → T5; AI (#7) → T5; social proof real-only (#3,#13) → T6; vision (#14) → T6; founder (#11) → T6; exclusive beta (#10) → T6; footer (#15) → T6; mobile polish/motion (#16,#17) → throughout + T7; desktop responsive + remove 430px cap → T7. All 18 review points + spec sections covered.

**Placeholder scan:** The founder copy is an intentional, visibly-marked owner-supplied placeholder (per spec decision), not a plan gap. Social-proof renders null until real (per anti-clout constraint). No TODO/TBD logic.

**Type consistency:** All section components are default exports with no/typed props; `Section` props match usage; `MARKETING` keys referenced match the `content.ts` shape; `ButtonLink`/`CollectiveWordmark`/`CollectiveMiniMark` are existing exports.
