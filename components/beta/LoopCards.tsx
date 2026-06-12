import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import type { Direction, PracticePrompt, TrustSummary } from "@/lib/betaTypes";
import { Badge, ButtonLink, Card, TrustPill } from "./ui";

export function DirectionCard({ direction }: { direction: Direction }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge>{direction.title}</Badge>
          <h3 className="mt-3 text-xl font-extrabold leading-tight text-[#111111]">{direction.subtitle}</h3>
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{direction.description}</p>
        </div>
        <ArrowRight className="mt-1 text-[#F2A900]" size={20} />
      </div>
      <ButtonLink href="/practice" className="mt-4 w-full">
        Start direction
      </ButtonLink>
    </Card>
  );
}

export function PracticePromptCard({ prompt, completed = false }: { prompt: PracticePrompt; completed?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${completed ? "bg-[#E8F8EE] text-[#22C55E]" : "bg-[#FFF1C7] text-[#F2A900]"}`}>
          {completed ? <CheckCircle2 size={21} /> : <Clock size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-extrabold leading-snug text-[#111111]">{prompt.title}</h3>
          <p className="mt-1 text-xs leading-5 text-[#6E6E6E]">{prompt.description}</p>
        </div>
        <Link href={`/proof/new/${prompt.id}`} className="rounded-full bg-[#F2A900] px-3 py-2 text-xs font-extrabold text-white" aria-label={`Submit proof for ${prompt.title}`}>
          Prove
        </Link>
      </div>
    </Card>
  );
}

export function TrustSnapshotCard({ trust }: { trust: TrustSummary }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#111111]">Trust snapshot</h2>
          <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">Trust grows through practice, proof, useful feedback, and contribution.</p>
        </div>
        <TrustPill label={trust.levelLabel} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="Practices" value={trust.practicesCompleted} />
        <Metric label="Proof" value={trust.proofsSubmitted} />
        <Metric label="Feedback" value={trust.feedbackGiven} />
        <Metric label="Helpful" value={trust.helpfulFeedback} />
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] bg-[#FFF8EE] p-3">
      <p className="text-xs font-bold text-[#6E6E6E]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[#111111]">{value}</p>
    </div>
  );
}

export function LoopSignalRow() {
  const items = [
    { icon: Clock, label: "Practice", body: "One small step" },
    { icon: ShieldCheck, label: "Proof", body: "Evidence of effort" },
    { icon: MessageCircle, label: "Feedback", body: "Useful next step" }
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-[18px] border border-[#EFE7D8] bg-[#FFFDF8] p-3 text-center">
            <Icon className="mx-auto text-[#F2A900]" size={18} />
            <p className="mt-2 text-xs font-extrabold text-[#111111]">{item.label}</p>
            <p className="mt-1 text-[10px] leading-4 text-[#6E6E6E]">{item.body}</p>
          </div>
        );
      })}
    </div>
  );
}
