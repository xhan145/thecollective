import Section from "./Section";
import PhoneMockup from "./PhoneMockup";
import { MARKETING } from "@/lib/marketing/content";

export default function ProductShowcase() {
  return (
    <Section bg="cream">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">See it in action</h2>
      <div className="mt-12 space-y-16">
        {MARKETING.showcase.map((item, i) => (
          <div key={item.title} className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <div className="flex justify-center">
              <div className="w-full max-w-[360px] rounded-3xl border border-[#EFE7D8] bg-[#FFFDF8] p-6 shadow-[0_18px_50px_rgba(71,52,18,0.10)]">
                <PhoneMockup className="!w-full !max-w-[240px]" />
              </div>
            </div>
            <div className="text-center lg:text-left">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#F2A900]">Step {i + 1}</p>
              <h3 className="mt-2 font-display text-[24px] font-bold text-[#111111]">{item.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-[#6E6E6E]">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
