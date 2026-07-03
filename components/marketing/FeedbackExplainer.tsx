import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function FeedbackExplainer() {
  const { title, body, bullets, footer } = MARKETING.feedbackExplainer;
  return (
    <Section id="feedback" bg="cream">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
      </div>
      <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
        {bullets.map((b) => (
          <div key={b} className="rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] p-4 text-sm font-bold text-[#38322A]">{b}</div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-[460px] text-center text-sm font-bold text-[#7A5300]">{footer}</p>
    </Section>
  );
}
