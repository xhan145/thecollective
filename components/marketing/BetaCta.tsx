"use client";

import { ButtonLink } from "@/components/beta/ui";
import { MARKETING, ROUTES } from "@/lib/marketing/content";
import { trackEvent } from "@/lib/analytics";

export default function BetaCta() {
  const { title, body, primaryCta, secondaryCta } = MARKETING.finalCta;
  return (
    <section className="w-full bg-[#FFF1C7]">
      <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center lg:py-24">
        <h2 className="font-display text-[30px] font-bold text-[#111111] lg:text-[40px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href={ROUTES.demo} onClick={() => trackEvent("final_try_practice_clicked")} className="w-full sm:w-auto">{primaryCta}</ButtonLink>
          <ButtonLink href={ROUTES.beta} variant="secondary" onClick={() => trackEvent("final_join_beta_clicked")} className="w-full sm:w-auto">{secondaryCta}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
