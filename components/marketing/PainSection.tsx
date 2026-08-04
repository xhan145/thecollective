import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function PainSection() {
  const { title, body } = MARKETING.pain;
  return (
    <Section bg="cream" className="!py-0">
      <div className="mx-auto max-w-2xl pb-4 pt-2 text-center lg:pb-8">
        <h2 className="font-display text-title leading-snug text-content lg:text-display">{title}</h2>
        <p className="mx-auto mt-4 max-w-[600px] text-body leading-7 text-muted lg:text-body-lg">{body}</p>
      </div>
    </Section>
  );
}
