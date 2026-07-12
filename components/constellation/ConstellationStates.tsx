"use client";

// Non-happy-path surfaces: loading skeleton (a composed constellation, not a
// spinner), error + retry, offline banner, and the rendering-fallback error
// boundary that drops to list view instead of a blank canvas.

import { Component, type ReactNode } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/beta/ui";
import { CollectiveMiniMark } from "@/components/beta/Brand";
import { JOURNEY, HUB_POS, NODE_POS, STAGE_H, STAGE_W } from "@/lib/constellation/layout";

/** Skeleton mirrors the real composition — six soft discs + faint paths — so
 *  loading already looks like the feature (spec: no blank canvas). */
export function ConstellationSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading your progress constellation"
      className="relative w-full overflow-hidden rounded-[26px] border border-[#EFE7D8] bg-[#FFF8EE]"
      style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}` }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(58% 52% at 44% 46%, rgba(242,169,0,0.07), transparent 75%)" }}
      />
      {[{ pos: HUB_POS, size: 24 }, ...JOURNEY.map((k) => ({ pos: NODE_POS[k], size: 17 }))].map((n, i) => (
        <span
          key={i}
          aria-hidden
          className="constellation-skeleton-disc absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2E9D8]"
          style={{
            left: `${(n.pos.x / STAGE_W) * 100}%`,
            top: `${(n.pos.y / STAGE_H) * 100}%`,
            width: `${n.size}%`,
            aspectRatio: "1",
            animationDelay: `${i * 120}ms`
          }}
        />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ConstellationError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[22px] border border-[#EFE7D8] bg-[#FFFDF8] p-7 text-center shadow-[0_1px_2px_rgba(71,52,18,0.06),0_10px_30px_rgba(71,52,18,0.08)]">
      <CollectiveMiniMark className="mx-auto h-12 w-20" />
      <p className="mt-2 font-display text-lg font-bold text-[#111111]">Your map didn&rsquo;t load</p>
      <p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-[#6E6E6E]">
        Nothing is lost — your practice and proof are safe. Try again in a moment.
      </p>
      <Button className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 rounded-2xl border border-[#EFE7D8] bg-[#FFF1C7] px-4 py-2.5 text-xs font-bold text-[#7A5300]"
    >
      <WifiOff size={15} className="shrink-0" />
      You&rsquo;re offline — showing your last synced progress.
    </div>
  );
}

/** If the map itself throws, fall back to the list view (never a blank hole). */
export class ConstellationErrorBoundary extends Component<
  { fallback: ReactNode; onFallback?: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFallback?.();
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
