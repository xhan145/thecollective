import Section from "./Section";
import TrackedCta from "./TrackedCta";
import { MARKETING, ROUTES } from "@/lib/marketing/content";

export default function FounderStory() {
  const { eyebrow, paragraphs, cta } = MARKETING.founder;
  return (
    <Section id="founder" bg="cream">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        <div className="mt-4 space-y-4">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-body-lg leading-7 text-secondary lg:text-body-lg">{para}</p>
          ))}
        </div>
        <div className="mt-7 flex justify-center">
          <TrackedCta href={ROUTES.demo} event="founder_start_practice_clicked">{cta}</TrackedCta>
        </div>
      </div>
    </Section>
  );
}
