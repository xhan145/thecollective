"use client";

import { ButtonLink } from "@/components/beta/ui";
import AmbientBackdrop from "@/components/beta/AmbientBackdrop";
import { MARKETING, ROUTES } from "@/lib/marketing/content";
import { trackEvent } from "@/lib/analytics";
import HeroShowcase from "./HeroShowcase";

export default function Hero() {
  const { eyebrow, headline, sub, support, primaryCta, secondaryCta } = MARKETING.hero;
  return (
    <section className="relative w-full bg-bg">
      <AmbientBackdrop />
      <div className="relative z-[1] mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
        <div className="text-center lg:text-left">
          <p className="text-caption font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
          <h1 className="text-gradient-gold mt-3 font-display text-display leading-[1.05] tracking-tight lg:text-display">{headline}</h1>
          <p className="mx-auto mt-5 max-w-[520px] text-body-lg leading-7 text-muted lg:mx-0 lg:text-heading">{sub}</p>
          <p className="mx-auto mt-3 max-w-[520px] text-body font-medium text-secondary lg:mx-0">{support}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
            <ButtonLink href={ROUTES.demo} onClick={() => trackEvent("hero_try_practice_clicked")} className="w-full sm:w-auto">{primaryCta}</ButtonLink>
            <ButtonLink href={ROUTES.beta} variant="secondary" onClick={() => trackEvent("hero_join_beta_clicked")} className="w-full sm:w-auto">{secondaryCta}</ButtonLink>
          </div>
        </div>
        <HeroShowcase />
      </div>
    </section>
  );
}
