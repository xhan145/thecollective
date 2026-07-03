"use client";

import Section from "./Section";
import { ButtonLink } from "@/components/beta/ui";
import { MARKETING, ROUTES } from "@/lib/marketing/content";
import { trackEvent } from "@/lib/analytics";

export default function TryThisFirst() {
  const { sectionTitle, sectionSub, card } = MARKETING.tryFirst;
  return (
    <Section bg="surface">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#F2A900]">{sectionTitle}</p>
        <h2 className="mt-2 font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{card.title}</h2>
        <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-7 text-[#6E6E6E]">{sectionSub}</p>
      </div>
      <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-[#EFE7D8] bg-[#FFF8EE] p-6 shadow-[0_18px_50px_rgba(71,52,18,0.08)] lg:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#B6AE9F]">The prompt</p>
        <p className="mt-2 text-[16px] font-bold leading-7 text-[#111111]">{card.prompt}</p>

        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-[#B6AE9F]">Show your proof, any way you like</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {card.proofOptions.map((o) => (
            <span key={o} className="rounded-full border border-[#EFE7D8] bg-[#FFFDF8] px-3.5 py-1.5 text-xs font-extrabold text-[#38322A]">{o}</span>
          ))}
        </div>

        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-[#B6AE9F]">Feedback you might get</p>
        <ul className="mt-2 space-y-1.5">
          {card.feedbackPreview.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-[#38322A]"><span aria-hidden className="text-[#22C55E]">✓</span> {f}</li>
          ))}
        </ul>

        <div className="mt-7">
          <ButtonLink href={ROUTES.demo} onClick={() => trackEvent("demo_practice_started", { source: "try_this_first" })} className="w-full">{card.cta}</ButtonLink>
          <p className="mt-3 text-center text-xs text-[#9B958B]">{card.secondaryText}</p>
        </div>
      </div>
    </Section>
  );
}
