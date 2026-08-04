import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

/** The six-step loop as a responsive ribbon: flat stack on mobile, six-up with
 *  gentle depth on wide screens. Motion is hover-only and transform-based. */
export default function ProductLoop() {
  return (
    <Section id="how" bg="cream">
      <h2 className="text-center font-display text-title text-content lg:text-display">How Collective works</h2>
      <p className="mx-auto mt-3 max-w-[520px] text-center text-body leading-7 text-muted">The same calm loop, every rep.</p>
      <div className="mx-auto mt-10 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {MARKETING.loopSteps.map((s) => (
          <div
            key={s.n}
            className="rounded-3xl border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(71,52,18,0.05)] transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-surface-soft text-caption font-semibold text-accent-text">{s.n}</div>
            <h3 className="mt-2.5 font-display text-body-lg font-medium text-content">{s.title}</h3>
            <p className="mt-1 text-label leading-5 text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
