import { MARKETING } from "@/lib/marketing/content";

export default function MissionBand() {
  return (
    <section id="mission" className="w-full bg-surface-soft">
      <div className="mx-auto w-full max-w-4xl px-5 py-16 text-center lg:py-20">
        <p className="font-display text-title leading-snug text-content lg:text-display">{MARKETING.mission}</p>
      </div>
    </section>
  );
}
