import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function PracticeExamples() {
  const { title, body, examples } = MARKETING.launchWedge;
  return (
    <Section bg="surface">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-title text-content lg:text-display">{title}</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-body leading-7 text-muted">{body}</p>
      </div>
      <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {examples.map((ex) => (
          <div key={ex} className="flex items-center gap-2.5 rounded-2xl border border-line bg-bg px-4 py-3 text-body font-medium text-secondary">
            <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-soft text-accent-text">•</span>
            {ex}
          </div>
        ))}
      </div>
    </Section>
  );
}
