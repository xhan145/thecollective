import { ButtonLink } from "@/components/beta/ui";
import { MARKETING } from "@/lib/marketing/content";

export default function BetaCta() {
  const { title, body, cta } = MARKETING.beta;
  return (
    <section className="w-full bg-[#FFF1C7]">
      <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center lg:py-24">
        <h2 className="font-display text-[30px] font-bold text-[#111111] lg:text-[40px]">{title}</h2>
        <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-7 text-[#6E6E6E]">{body}</p>
        <div className="mt-8 flex justify-center"><ButtonLink href="/auth">{cta}</ButtonLink></div>
      </div>
    </section>
  );
}
