import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function TrustExplainer() {
  const { title, body, rules, tiers } = MARKETING.trust;
  return (
    <Section id="trust" bg="surface">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
      </div>
      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        {tiers.map((tier, i) => (
          <div key={tier} className="flex items-center gap-2">
            <span className="rounded-full bg-[#FFF1C7] px-4 py-2 text-sm font-extrabold text-[#B07A00]">{tier}</span>
            {i < tiers.length - 1 && <span aria-hidden className="text-[#D8CBB0]">&rarr;</span>}
          </div>
        ))}
      </div>
      <ul className="mx-auto mt-8 grid max-w-2xl gap-2 sm:grid-cols-2">
        {rules.map((r) => (
          <li key={r} className="flex items-start gap-2 rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] p-3.5 text-sm font-bold text-[#38322A]">
            <span aria-hidden className="mt-0.5 text-[#22C55E]">✓</span>
            {r}
          </li>
        ))}
      </ul>
    </Section>
  );
}
