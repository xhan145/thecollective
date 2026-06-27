import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function AiSection() {
  const { title, body, points } = MARKETING.ai;
  return (
    <Section id="ai" bg="surface">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
          <p className="mt-3 text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {points.map((p) => (
            <div key={p} className="rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] p-4 text-sm font-bold text-[#38322A]">{p}</div>
          ))}
        </div>
      </div>
    </Section>
  );
}
