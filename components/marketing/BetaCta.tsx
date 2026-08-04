"use client";

import { ButtonLink } from "@/components/beta/ui";
import { MARKETING, ROUTES } from "@/lib/marketing/content";
import { trackEvent } from "@/lib/analytics";

export default function BetaCta() {
  const { title, body, primaryCta, secondaryCta } = MARKETING.finalCta;
  return (
    <section className="w-full bg-surface-soft">
      <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center lg:py-24">
        <h2 className="font-display text-title text-content lg:text-display">{title}</h2>
        <p className="mx-auto mt-3 max-w-[460px] text-body leading-7 text-muted">{body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href={ROUTES.demo} onClick={() => trackEvent("final_try_practice_clicked")} className="w-full sm:w-auto">{primaryCta}</ButtonLink>
          <ButtonLink href={ROUTES.beta} variant="secondary" onClick={() => trackEvent("final_join_beta_clicked")} className="w-full sm:w-auto">{secondaryCta}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
