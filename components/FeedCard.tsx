import Link from "next/link";
import { ArrowRight, BadgeCheck, Flame, MessageCircle, Sparkles } from "lucide-react";
import type { RankedFeedItem } from "@/lib/feedAlgorithm";
import { ProofTypeBadge } from "./ProofMediaCard";

const typeIcon = { practice: Flame, proof: BadgeCheck, reflection: Sparkles, feedback: MessageCircle, milestone: BadgeCheck, prompt: Flame, lesson: Sparkles, question: MessageCircle, contribution: BadgeCheck };

export function FeedCard({ item }: { item: RankedFeedItem }) {
  const Icon = typeIcon[item.type];
  const modeLabel = item.mode === "passive" ? "Scroll" : item.mode === "bridge" ? "Scroll -> Try" : "Take action";
  return (
    <article className="feed-card card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/10 text-purple2"><Icon size={18} /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-purple2">{item.type} - {modeLabel}</p>
            {item.actor && <p className="text-xs text-slate-400">by {item.actor}</p>}
          </div>
        </div>
        <div className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-slate-300">{item.score}</div>
      </div>
      <h2 className="text-xl font-black leading-tight">{item.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
      {item.proofType && <div className="mt-3"><ProofTypeBadge proofType={item.proofType} mediaKind={item.mediaKind} /></div>}
      {item.trustSignal && <p className="mt-3 rounded-2xl bg-green/10 px-3 py-2 text-xs text-green">{item.trustSignal}</p>}
      <p className="mt-3 text-[11px] text-slate-500">Algorithm reason: {item.reason}</p>
      {item.actionHref && item.actionLabel && <Link href={item.actionHref} className="btn-primary mt-4 w-full">{item.actionLabel}<ArrowRight size={16} /></Link>}
    </article>
  );
}
