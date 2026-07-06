"use client";

import { ButtonLink } from "@/components/beta/ui";
import AmbientBackdrop from "@/components/beta/AmbientBackdrop";
import { MARKETING, ROUTES } from "@/lib/marketing/content";
import { trackEvent } from "@/lib/analytics";
import HeroShowcase from "./HeroShowcase";

export default function Hero() {
  const { eyebrow, headline, sub, support, primaryCta, secondaryCta } = MARKETING.hero;
  return (
    <section className="relative w-full bg-[#FFF8EE]">
      <AmbientBackdrop />
      <div className="relative z-[1] mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
        <div className="text-center lg:text-left">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#F2A900]">{eyebrow}</p>
          <h1 className="text-gradient-gold mt-3 font-display text-[40px] font-bold leading-[1.05] tracking-tight lg:text-[56px]">{headline}</h1>
          <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-7 text-[#6E6E6E] lg:mx-0 lg:text-[18px]">{sub}</p>
          <p className="mx-auto mt-3 max-w-[520px] text-sm font-bold text-[#38322A] lg:mx-0">{support}</p>
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
