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
