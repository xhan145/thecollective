import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function VisionSection() {
  const { title, directions } = MARKETING.vision;
  return (
    <Section id="vision" bg="surface">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
        {directions.map((d) => (
          <div key={d} className="rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] px-4 py-5 text-center text-sm font-bold text-[#38322A]">{d}</div>
        ))}
      </div>
    </Section>
  );
}
