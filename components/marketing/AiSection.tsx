import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function AiSection() {
  const { title, can, cannot } = MARKETING.ai;
  return (
    <Section id="ai" bg="cream">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
      </div>
      <div className="mx-auto mt-8 grid max-w-4xl gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#EFE7D8] bg-[#FFFDF8] p-6">
          <p className="text-sm font-extrabold text-[#15803D]">AI can help you</p>
          <ul className="mt-3 space-y-2">
            {can.map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm text-[#38322A]"><span aria-hidden className="mt-0.5 text-[#22C55E]">✓</span>{c}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-[#EFE7D8] bg-[#FFF8EE] p-6">
          <p className="text-sm font-extrabold text-[#B4443F]">AI cannot</p>
          <ul className="mt-3 space-y-2">
            {cannot.map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm text-[#38322A]"><span aria-hidden className="mt-0.5 text-[#B4443F]">&times;</span>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
