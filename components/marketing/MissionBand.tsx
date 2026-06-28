import { MARKETING } from "@/lib/marketing/content";

export default function MissionBand() {
  return (
    <section id="mission" className="w-full bg-[#FFF1C7]">
      <div className="mx-auto w-full max-w-4xl px-5 py-16 text-center lg:py-20">
        <p className="font-display text-[26px] font-bold leading-snug text-[#111111] lg:text-[34px]">{MARKETING.mission}</p>
      </div>
    </section>
  );
}
