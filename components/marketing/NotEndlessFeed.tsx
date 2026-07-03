import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function NotEndlessFeed() {
  const { title, body, avoid } = MARKETING.notFeed;
  return (
    <Section bg="surface">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
      </div>
      <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
        {avoid.map((a) => (
          <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-[#EFE7D8] bg-[#FFF8EE] px-3.5 py-1.5 text-xs font-bold text-[#9B958B]">
            <span aria-hidden className="text-[#C08A8A]">&times;</span>
            {a}
          </span>
        ))}
      </div>
    </Section>
  );
}
