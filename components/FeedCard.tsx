import Link from "next/link";
import { ArrowRight, BadgeCheck, Flame, MessageCircle, Sparkles } from "lucide-react";
import { EngagementActions, getFeedEngagementActions } from "./EngagementActions";
import type { RankedFeedItem } from "@/lib/feedAlgorithm";
import { ProofTypeBadge } from "./ProofMediaCard";
import { Pill } from "./ui";

const typeIcon = { practice: Flame, proof: BadgeCheck, reflection: Sparkles, feedback: MessageCircle, milestone: BadgeCheck, prompt: Flame, lesson: Sparkles, question: MessageCircle, contribution: BadgeCheck };

export function FeedCard({ item }: { item: RankedFeedItem }) {
  const Icon = typeIcon[item.type];
  const modeLabel = item.mode === "passive" ? "Observe" : item.mode === "bridge" ? "Reflect" : "Act";
  const modeTone = item.mode === "active" ? "success" : item.mode === "bridge" ? "accent" : "muted";
  return (
    <article className="feed-card soft-card p-4 transition active:scale-[.995]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-purple2"><Icon size={18} /></div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-purple2">{item.type}</p>
            {item.actor && <p className="text-xs text-[#8f887e]">proof from {item.actor}</p>}
          </div>
        </div>
        <Pill tone={modeTone}>{modeLabel}</Pill>
      </div>
      <h2 className="text-[19px] font-black leading-tight tracking-tight">{item.title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#c8c2b8]">{item.body}</p>
      {item.proofType && <div className="mt-3"><ProofTypeBadge proofType={item.proofType} mediaKind={item.mediaKind} /></div>}
      {item.trustSignal && <p className="mt-3 rounded-[22px] bg-green/10 px-3 py-2 text-xs text-green">{item.trustSignal}</p>}
      {item.engagementPrompt && <p className="mt-3 rounded-[22px] bg-white/[0.04] px-3 py-2 text-xs leading-5 text-[#c8c2b8]">{item.engagementPrompt}</p>}
      <EngagementActions actions={getFeedEngagementActions(item)} />
      <p className="mt-3 text-[11px] leading-4 text-[#8f887e]">Why this appears: {item.reason}</p>
      {item.actionHref && item.actionLabel && <Link href={item.actionHref} className="btn-primary mt-4 w-full">{item.actionLabel}<ArrowRight size={16} /></Link>}
    </article>
  );
}
