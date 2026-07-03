import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function PracticeExamples() {
  const { title, body, examples } = MARKETING.launchWedge;
  return (
    <Section bg="surface">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
      </div>
      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {examples.map((ex) => (
          <div key={ex} className="flex items-center gap-2.5 rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] px-4 py-3 text-sm font-bold text-[#38322A]">
            <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#FFF1C7] text-[#B07A00]">•</span>
            {ex}
          </div>
        ))}
      </div>
    </Section>
  );
}
