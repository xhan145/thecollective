import { CollectiveMiniMark } from "@/components/beta/Brand";

// A stylized phone showing the product's look (cream cards, gold, the loop).
// Pure CSS/markup so it ships without screenshot capture; swap for a real
// screenshot <img> later if desired. Deliberately static (no JS entrance
// animation): the hero visual must be visible even before hydration or when
// JS fails — a marketing page can't have an opacity-0 hero.
export default function PhoneMockup({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative mx-auto w-[280px] rounded-[40px] border border-line bg-surface p-3 shadow-[0_30px_80px_rgba(71,52,18,0.18)] ${className}`}
    >
      <div className="overflow-hidden rounded-[30px] bg-bg p-4">
        <div className="flex items-center justify-between">
          <CollectiveMiniMark className="h-7 w-7" />
          <span className="h-7 w-7 rounded-full bg-surface-soft" />
        </div>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-surface-soft to-surface p-4">
          <p className="text-overline uppercase tracking-wider text-accent-text">Your next step</p>
          <p className="mt-1 font-display text-body font-medium text-content">Introduce yourself in 60 seconds</p>
          <p className="mt-1 text-overline text-muted">3 min · low pressure</p>
          <div className="mt-3 h-9 w-full rounded-full bg-accent" />
        </div>
        <div className="mt-3 space-y-2">
          {["Proof posted", "Useful feedback +1", "Trust growing"].map((t) => (
            <div key={t} className="flex items-center gap-2 rounded-xl bg-surface p-2 shadow-[0_6px_16px_rgba(71,52,18,0.06)]">
              <span className="h-6 w-6 rounded-lg bg-success-soft" />
              <span className="text-overline text-secondary">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
