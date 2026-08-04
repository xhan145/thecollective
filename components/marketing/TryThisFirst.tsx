import Section from "./Section";
import { ButtonLink } from "@/components/beta/ui";
import { MARKETING, ROUTES } from "@/lib/marketing/content";

export default function TryThisFirst() {
  const { sectionTitle, sectionSub, card } = MARKETING.tryFirst;
  return (
    <Section bg="surface">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-accent">{sectionTitle}</p>
        <h2 className="mt-2 font-display text-title text-content lg:text-display">{card.title}</h2>
        <p className="mx-auto mt-3 max-w-[520px] text-body leading-7 text-muted">{sectionSub}</p>
      </div>
      <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-line bg-bg p-6 shadow-[0_18px_50px_rgba(71,52,18,0.08)] transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1 lg:p-8">
        <p className="text-caption font-semibold uppercase tracking-[0.14em] text-subtle">The prompt</p>
        <p className="mt-2 text-body-lg font-medium leading-7 text-content">{card.prompt}</p>

        <p className="mt-6 text-caption font-semibold uppercase tracking-[0.14em] text-subtle">Show your proof, any way you like</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {card.proofOptions.map((o) => (
            <span key={o} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-caption font-semibold text-secondary">{o}</span>
          ))}
        </div>

        <p className="mt-6 text-caption font-semibold uppercase tracking-[0.14em] text-subtle">Feedback you might get</p>
        <ul className="mt-2 space-y-1.5">
          {card.feedbackPreview.map((f) => (
            <li key={f} className="flex items-center gap-2 text-body text-secondary"><span aria-hidden className="text-success">✓</span> {f}</li>
          ))}
        </ul>

        <div className="mt-7">
          <ButtonLink href={ROUTES.demo} className="w-full">{card.cta}</ButtonLink>
          <p className="mt-3 text-center text-caption text-muted">{card.secondaryText}</p>
        </div>
      </div>
    </Section>
  );
}
