import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function ProductShowcase() {
  const steps = MARKETING.showcaseSteps;
  return (
    <Section bg="surface">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">{MARKETING.showcaseTitle}</h2>
      <p className="mx-auto mt-3 max-w-[520px] text-center text-[15px] leading-7 text-[#6E6E6E]">One rep, start to finish — the same loop every time.</p>
      <div className="mx-auto mt-10 grid max-w-5xl gap-4 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.n} className="relative">
            <div className="h-full rounded-3xl border border-[#EFE7D8] bg-[#FFFDF8] p-5 shadow-[0_10px_30px_rgba(71,52,18,0.06)] transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF1C7] text-sm font-black text-[#B07A00]">{s.n}</div>
              <h3 className="mt-3 font-display text-[18px] font-bold text-[#111111]">{s.title}</h3>
              <p className="mt-1.5 text-[14px] leading-6 text-[#6E6E6E]">{s.body}</p>
            </div>
            {i < steps.length - 1 && (
              <>
                {/* desktop: arrow in the gap to the next card; mobile: chevron below */}
                <span aria-hidden className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 text-lg text-[#E0D3B4] lg:block">&rarr;</span>
                <span aria-hidden className="mt-1 block text-center text-lg text-[#E0D3B4] lg:hidden">&darr;</span>
              </>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
