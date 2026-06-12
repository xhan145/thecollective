import Link from "next/link";
import { Bookmark, HelpCircle, MessageCircle, PenLine, ShieldCheck, Sparkles } from "lucide-react";
import type { EngagementAction, EngagementIntent } from "@/lib/types";
import type { RankedFeedItem } from "@/lib/feedAlgorithm";

const intentIcon: Record<EngagementIntent, typeof MessageCircle> = {
  reflect: PenLine,
  context: HelpCircle,
  try: Sparkles,
  feedback: ShieldCheck,
  save: Bookmark
};

const intentClass: Record<EngagementIntent, string> = {
  reflect: "border-purple/25 bg-purple/10 text-purple2",
  context: "border-white/10 bg-white/[0.05] text-slate-200",
  try: "border-green/25 bg-green/10 text-green",
  feedback: "border-orange/25 bg-orange/10 text-orange",
  save: "border-white/10 bg-white/[0.05] text-slate-200"
};

export function getFeedEngagementActions(item: RankedFeedItem): EngagementAction[] {
  const primary: EngagementAction =
    item.mode === "active"
      ? { id: `${item.id}-try`, label: item.actionLabel || "Start", intent: "try", href: item.actionHref || "/paths" }
      : item.mode === "bridge"
        ? { id: `${item.id}-reflect`, label: "Reflect", intent: "reflect", href: item.actionHref }
        : { id: `${item.id}-save`, label: "Save prompt", intent: "save", href: item.actionHref };

  const second: EngagementAction =
    item.type === "feedback" || item.type === "contribution"
      ? { id: `${item.id}-feedback`, label: "Give feedback", intent: "feedback", href: "/contribute" }
      : { id: `${item.id}-context`, label: "Ask context", intent: "context" };

  const third: EngagementAction =
    item.proofType === "video"
      ? { id: `${item.id}-watch`, label: "Watch for request", intent: "feedback", href: "/contribute" }
      : item.proofType === "image" || item.proofType === "screenshot"
        ? { id: `${item.id}-try-photo`, label: "Try photo proof", intent: "try", href: "/proof/new" }
        : { id: `${item.id}-try-small`, label: "Try small", intent: "try", href: item.actionHref || "/proof/new" };

  return [primary, second, third];
}

export function EngagementActions({ actions }: { actions: EngagementAction[] }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {actions.map((action) => (
        <EngagementActionButton key={action.id} action={action} />
      ))}
    </div>
  );
}

function EngagementActionButton({ action }: { action: EngagementAction }) {
  const Icon = intentIcon[action.intent];
  const className = `intent-button ${intentClass[action.intent]}`;
  const content = (
    <>
      <Icon size={14} />
      <span>{action.label}</span>
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} className={className} aria-label={action.label}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} aria-label={action.label}>
      {content}
    </button>
  );
}
