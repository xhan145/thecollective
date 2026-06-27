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
