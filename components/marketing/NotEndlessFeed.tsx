import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function NotEndlessFeed() {
  const { title, body, avoid } = MARKETING.notFeed;
  return (
    <Section bg="surface">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-title text-content lg:text-display">{title}</h2>
        <p className="mx-auto mt-3 max-w-[560px] text-body leading-7 text-muted">{body}</p>
      </div>
      <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
        {avoid.map((a) => (
          <span key={a} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3.5 py-1.5 text-caption font-medium text-muted">
            <span aria-hidden className="text-danger-text">&times;</span>
            {a}
          </span>
        ))}
      </div>
    </Section>
  );
}
