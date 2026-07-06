import PhoneMockup from "./PhoneMockup";

/** Hero visual: the phone mock in gentle 3D perspective over a warm radial
 *  glow, with two floating proof/feedback chips. Pure CSS transforms — the
 *  chips are decorative (aria-hidden), desktop-only, and their float
 *  animation is disabled under prefers-reduced-motion (see globals.css). */
export default function HeroShowcase() {
  return (
    <div className="relative flex items-center justify-center" aria-hidden>
      {/* Warm radial glow — breathes gently when motion is allowed. */}
      <div className="mk-breathe pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_55%_at_50%_45%,rgba(242,169,0,0.14),transparent_75%)]" />

      <div className="[perspective:1200px]">
        <div className="transition-transform duration-300 ease-out lg:[transform:rotateY(-8deg)_rotateX(2deg)] lg:motion-safe:hover:[transform:rotateY(-4deg)_rotateX(1deg)]">
          <PhoneMockup />
        </div>
      </div>

      {/* Floating chips — hidden below lg so mobile stays simple. */}
      <div className="mk-float absolute -left-2 top-[18%] hidden rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8]/95 p-3 shadow-[0_14px_36px_rgba(71,52,18,0.12)] backdrop-blur lg:block">
        <p className="text-[11px] font-extrabold text-[#15803D]">✓ Practice done</p>
        <p className="mt-0.5 text-[12px] font-bold text-[#38322A]">Said the first sentence</p>
      </div>
      <div className="mk-float-late absolute -right-3 bottom-[20%] hidden rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8]/95 p-3 shadow-[0_14px_36px_rgba(71,52,18,0.12)] backdrop-blur lg:block">
        <p className="text-[11px] font-extrabold text-[#B07A00]">Feedback</p>
        <p className="mt-0.5 max-w-[170px] text-[12px] font-bold leading-4 text-[#38322A]">&ldquo;Clear intro — try a slower pace next.&rdquo;</p>
      </div>
    </div>
  );
}
