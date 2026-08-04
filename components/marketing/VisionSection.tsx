import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function VisionSection() {
  const { title, body, directions } = MARKETING.vision;
  return (
    <Section id="vision" bg="cream">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-title text-content lg:text-title">{title}</h2>
        <p className="mx-auto mt-3 max-w-[520px] text-body leading-7 text-muted">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {directions.map((d) => (
            <span key={d} className="rounded-full border border-line bg-bg px-4 py-2 text-caption font-medium text-muted">{d}</span>
          ))}
        </div>
      </div>
    </Section>
  );
}
