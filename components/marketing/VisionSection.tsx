import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function VisionSection() {
  const { title, body, directions } = MARKETING.vision;
  return (
    <Section id="vision" bg="cream">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[24px] font-bold text-[#111111] lg:text-[30px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {directions.map((d) => (
            <span key={d} className="rounded-full border border-[#EFE7D8] bg-[#FFF8EE] px-4 py-2 text-xs font-bold text-[#9B958B]">{d}</span>
          ))}
        </div>
      </div>
    </Section>
  );
}
