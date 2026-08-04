import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function AiSection() {
  const { title, can, cannot } = MARKETING.ai;
  return (
    <Section id="ai" bg="cream">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-title text-content lg:text-display">{title}</h2>
      </div>
      <div className="mx-auto mt-8 grid max-w-4xl gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-body font-semibold text-success-text">AI can help you</p>
          <ul className="mt-3 space-y-2">
            {can.map((c) => (
              <li key={c} className="flex items-start gap-2 text-body text-secondary"><span aria-hidden className="mt-0.5 text-success">✓</span>{c}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-line bg-bg p-6">
          <p className="text-body font-semibold text-danger-text">AI cannot</p>
          <ul className="mt-3 space-y-2">
            {cannot.map((c) => (
              <li key={c} className="flex items-start gap-2 text-body text-secondary"><span aria-hidden className="mt-0.5 text-danger-text">&times;</span>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
