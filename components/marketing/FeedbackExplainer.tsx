import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function FeedbackExplainer() {
  const { title, body, bullets, footer } = MARKETING.feedbackExplainer;
  return (
    <Section id="feedback" bg="cream">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-title text-content lg:text-display">{title}</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-body leading-7 text-muted">{body}</p>
      </div>
      <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
        {bullets.map((b) => (
          <div key={b} className="rounded-2xl border border-line bg-surface p-4 text-body font-medium text-secondary">{b}</div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-[460px] text-center text-body font-medium text-accent-text">{footer}</p>
    </Section>
  );
}
