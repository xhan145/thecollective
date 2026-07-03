"use client";

import Section from "./Section";
import { ButtonLink } from "@/components/beta/ui";
import { MARKETING, ROUTES } from "@/lib/marketing/content";
import { trackEvent } from "@/lib/analytics";

export default function FounderStory() {
  const { eyebrow, paragraphs, cta } = MARKETING.founder;
  return (
    <Section id="founder" bg="cream">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#F2A900]">{eyebrow}</p>
        <div className="mt-4 space-y-4">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-[16px] leading-7 text-[#38322A] lg:text-[17px]">{para}</p>
          ))}
        </div>
        <div className="mt-7 flex justify-center">
          <ButtonLink href={ROUTES.demo} onClick={() => trackEvent("demo_practice_started", { source: "founder" })}>{cta}</ButtonLink>
        </div>
      </div>
    </Section>
  );
}
