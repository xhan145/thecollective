import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

/** The six-step loop as a responsive ribbon: flat stack on mobile, six-up with
 *  gentle depth on wide screens. Motion is hover-only and transform-based. */
export default function ProductLoop() {
  return (
    <Section id="how" bg="cream">
      <h2 className="text-center font-display text-[28px] font-bold text-[#111111] lg:text-[36px]">How Collective works</h2>
      <p className="mx-auto mt-3 max-w-[520px] text-center text-[15px] leading-7 text-[#6E6E6E]">The same calm loop, every rep.</p>
      <div className="mx-auto mt-10 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {MARKETING.loopSteps.map((s) => (
          <div
            key={s.n}
            className="rounded-3xl border border-[#EFE7D8] bg-[#FFFDF8] p-4 shadow-[0_8px_24px_rgba(71,52,18,0.05)] transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#FFF1C7] text-xs font-black text-[#B07A00]">{s.n}</div>
            <h3 className="mt-2.5 font-display text-[16px] font-bold text-[#111111]">{s.title}</h3>
            <p className="mt-1 text-[13px] leading-5 text-[#6E6E6E]">{s.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
