import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function TrustExplainer() {
  const { title, body, rules, tiers } = MARKETING.trust;
  return (
    <Section id="trust" bg="surface">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-title text-content lg:text-display">{title}</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-body leading-7 text-muted">{body}</p>
      </div>
      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        {tiers.map((tier, i) => (
          <div key={tier} className="flex items-center gap-2">
            <span className="rounded-full bg-surface-soft px-4 py-2 text-body font-semibold text-accent-text">{tier}</span>
            {i < tiers.length - 1 && <span aria-hidden className="text-subtle">&rarr;</span>}
          </div>
        ))}
      </div>
      <ul className="mx-auto mt-8 grid max-w-2xl gap-2 sm:grid-cols-2">
        {rules.map((r) => (
          <li key={r} className="flex items-start gap-2 rounded-2xl border border-line bg-bg p-3.5 text-body font-medium text-secondary">
            <span aria-hidden className="mt-0.5 text-success">✓</span>
            {r}
          </li>
        ))}
      </ul>
    </Section>
  );
}
