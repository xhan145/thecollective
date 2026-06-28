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
