"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, MessageCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { Direction, PracticePrompt, TrustSummary } from "@/lib/betaTypes";
import { Badge, ButtonLink, Card, TrustPill } from "./ui";
import { CountUp, MotionItem, MotionList } from "./motion";

export function DirectionCard({ direction }: { direction: Direction }) {
  return (
    <Card interactive className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge>{direction.title}</Badge>
          <h3 className="mt-3 text-heading leading-tight text-content">{direction.subtitle}</h3>
          <p className="mt-2 text-body leading-6 text-muted">{direction.description}</p>
        </div>
        <motion.div initial={{ x: -4, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <ArrowRight className="mt-1 text-accent" size={20} />
        </motion.div>
      </div>
      <ButtonLink href="/practice" className="mt-4 w-full">
        Start direction
      </ButtonLink>
    </Card>
  );
}

export function PracticePromptCard({ prompt, completed = false }: { prompt: PracticePrompt; completed?: boolean }) {
  return (
    <Card interactive className="p-4">
      <div className="flex items-center gap-3">
        <motion.div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${completed ? "bg-success-soft text-success" : "bg-surface-soft text-accent"}`}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          {completed ? <CheckCircle2 size={21} /> : <Clock size={20} />}
        </motion.div>
        <div className="min-w-0 flex-1">
          <h3 className="text-body font-semibold leading-snug text-content">{prompt.title}</h3>
          <p className="mt-1 text-caption leading-5 text-muted">{prompt.description}</p>
        </div>
        <Link
          href={`/proof/new/${prompt.id}`}
          className="rounded-full bg-accent px-3 py-2 text-caption font-semibold text-accent-on transition active:scale-95 hover:-translate-y-[1px]"
          aria-label={`Submit proof for ${prompt.title}`}
        >
          Prove
        </Link>
      </div>
    </Card>
  );
}

export function TrustSnapshotCard({ trust }: { trust: TrustSummary }) {
  const metrics = [
    { label: "Practices", value: trust.practicesCompleted },
    { label: "Proof", value: trust.proofsSubmitted },
    { label: "Feedback", value: trust.feedbackGiven },
    { label: "Helpful", value: trust.helpfulFeedback }
  ];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-heading text-content">Trust snapshot</h2>
          <p className="mt-1 text-body leading-6 text-muted">Trust grows through practice, proof, useful feedback, and contribution.</p>
        </div>
        <TrustPill label={trust.levelLabel} />
      </div>
      <MotionList className="mt-4 grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <MotionItem key={metric.label}>
            <div className="rounded-[18px] bg-bg p-3">
              <p className="text-caption font-medium text-muted">{metric.label}</p>
              <p className="mt-1 text-title text-content">
                <CountUp value={metric.value} />
              </p>
            </div>
          </MotionItem>
        ))}
      </MotionList>
    </Card>
  );
}

export function LoopSignalRow() {
  const items = [
    { icon: Clock, label: "Practice", body: "One small step" },
    { icon: ShieldCheck, label: "Proof", body: "Evidence of effort" },
    { icon: MessageCircle, label: "Feedback", body: "Useful next step" }
  ];
  return (
    <MotionList className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <MotionItem key={item.label}>
            <motion.div
              whileHover={{ y: -3 }}
              className="rounded-[18px] border border-line bg-surface p-3 text-center shadow-[0_1px_2px_rgba(71,52,18,0.05),0_8px_22px_rgba(71,52,18,0.07)]"
            >
              <Icon className="mx-auto text-accent" size={18} />
              <p className="mt-2 text-caption font-semibold text-content">{item.label}</p>
              <p className="mt-1 text-overline leading-4 text-muted">{item.body}</p>
            </motion.div>
          </MotionItem>
        );
      })}
    </MotionList>
  );
}
