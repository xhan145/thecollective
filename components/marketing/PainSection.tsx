import Section from "./Section";
import { MARKETING } from "@/lib/marketing/content";

export default function PainSection() {
  const { title, body } = MARKETING.pain;
  return (
    <Section bg="cream" className="!py-0">
      <div className="mx-auto max-w-2xl pb-4 pt-2 text-center lg:pb-8">
        <h2 className="font-display text-[26px] font-bold leading-snug text-[#111111] lg:text-[34px]">{title}</h2>
        <p className="mx-auto mt-4 max-w-[600px] text-[15px] leading-7 text-[#6E6E6E] lg:text-[16px]">{body}</p>
      </div>
    </Section>
  );
}
