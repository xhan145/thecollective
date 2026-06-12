import Link from "next/link";
import { ArrowRight, Camera, HelpCircle, Play, ShieldCheck, Sparkles } from "lucide-react";
import type { MediaLane, MediaProofSpotlight } from "@/lib/types";
import { ProofTypeBadge } from "./ProofMediaCard";
import { SectionHeader } from "./ui";

const laneMeta: Record<MediaLane, { title: string; kicker: string; icon: typeof Camera }> = {
  photo: { title: "Photo proof", kicker: "quick context", icon: Camera },
  video: { title: "Video proof", kicker: "richer signal", icon: Play }
};

const toneClass: Record<MediaProofSpotlight["thumbnailTone"], string> = {
  purple: "from-purple/80 via-purple2/40 to-white/10",
  green: "from-green/70 via-purple/25 to-white/10",
  orange: "from-orange/80 via-purple/30 to-white/10"
};

export function MediaProofSwipe({ photos, videos }: { photos: MediaProofSpotlight[]; videos: MediaProofSpotlight[] }) {
  return (
    <section className="space-y-3">
      <SectionHeader eyebrow="Media proof" title="Photos, then videos" action={
        <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1 text-[11px] font-black text-slate-300">
          <span className="rounded-full bg-white/10 px-2.5 py-1">Photo</span>
          <span className="px-2.5 py-1">Video</span>
        </div>
      } />
      <div className="no-scrollbar -mx-5 overflow-x-auto px-5 pb-1">
        <div className="flex snap-x snap-mandatory gap-4">
          <MediaLanePanel lane="photo" items={photos} />
          <MediaLanePanel lane="video" items={videos} />
        </div>
      </div>
    </section>
  );
}

function MediaLanePanel({ lane, items }: { lane: MediaLane; items: MediaProofSpotlight[] }) {
  const meta = laneMeta[lane];
  const LaneIcon = meta.icon;

  return (
    <article className="soft-card min-w-full snap-center p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-purple2">
            <LaneIcon size={18} />
          </div>
          <div>
            <h3 className="font-black">{meta.title}</h3>
            <p className="text-xs text-slate-500">{meta.kicker}</p>
          </div>
        </div>
        <Link href={lane === "photo" ? "/proof/new" : "/contribute"} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-purple2 transition active:scale-95" aria-label={lane === "photo" ? "Submit proof" : "Give feedback"}>
          <ArrowRight size={17} />
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <MediaSpotlightCard key={item.id} item={item} />
        ))}
      </div>
    </article>
  );
}

function MediaSpotlightCard({ item }: { item: MediaProofSpotlight }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-3">
      <div className="grid grid-cols-[96px_1fr] gap-3">
        <div className={`relative min-h-[124px] overflow-hidden rounded-[22px] bg-gradient-to-br ${toneClass[item.thumbnailTone]}`}>
          <div className="absolute inset-x-3 top-3 h-10 rounded-2xl bg-white/20" />
          <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-ink/55 p-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-white/80">{item.lane}</p>
            <p className="mt-1 text-[11px] leading-4 text-white">{item.strengthLabel}</p>
          </div>
          {item.lane === "video" ? (
            <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink">
              <Play size={17} fill="currentColor" />
            </div>
          ) : (
            <div className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-2xl bg-ink/45 text-white">
              <Camera size={16} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="truncate text-xs font-black text-purple2">{item.actor} - {item.pathTitle}</p>
            <ProofTypeBadge proofType={item.proofType} mediaKind={item.mediaKind} />
          </div>
          <h4 className="text-sm font-black leading-5">{item.title}</h4>
          <p className="mt-2 text-xs leading-5 text-[#c8c2b8]">{item.body}</p>
          <p className="mt-2 rounded-[20px] bg-ink/60 px-3 py-2 text-[11px] leading-4 text-[#c8c2b8]">{item.feedbackRequest}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Link href={item.actionHref} className="intent-button border-green/25 bg-green/10 text-green">
          <Sparkles size={14} />
          Try
        </Link>
        <button type="button" className="intent-button border-white/10 bg-white/[0.05] text-slate-200">
          <HelpCircle size={14} />
          Context
        </button>
        <Link href="/contribute" className="intent-button border-orange/25 bg-orange/10 text-orange">
          <ShieldCheck size={14} />
          Feedback
        </Link>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{item.trustSignal} - {item.frictionLabel}</p>
    </div>
  );
}
