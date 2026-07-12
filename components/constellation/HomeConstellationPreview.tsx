"use client";

// Compact home-screen preview: the five step states at a glance, the one
// recommended next step in words, and a single Continue CTA. Deliberately NOT
// a miniature of the full observatory — a calm summary that links to it.

import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { Card } from "@/components/beta/ui";
import { useConstellation } from "@/lib/constellation/useConstellation";
import { CONSTELLATION_NODE_ORDER } from "@/lib/constellation/types";
import { NODE_ICONS, STATUS_LABELS } from "./ConstellationNodeButton";

const MINI_STYLES: Record<string, string> = {
  locked: "border border-dashed border-[#E3D9C6] bg-[#FFFDF8] text-[#C7BEA9]",
  available: "border border-[#EFE7D8] bg-[#FFFDF8] text-[#B07A00]",
  active:
    "border border-[#F2A900]/60 bg-gradient-to-br from-[#FFB000] to-[#F2A900] text-white shadow-[0_0_0_1px_rgba(242,169,0,0.30),0_0_12px_rgba(242,169,0,0.22)]",
  in_progress: "border border-[#F2A900]/45 bg-[#FFF1C7] text-[#B07A00]",
  completed: "border border-[#F2A900]/45 bg-[#FFF1C7] text-[#7A5300]",
  attention_needed: "border-2 border-[#FFB000] bg-[#FFFDF8] text-[#B07A00]"
};

export function HomeConstellationPreview() {
  const { phase, state } = useConstellation();
  if (phase === "error" || !state) return null;

  if (phase === "loading") {
    return (
      <Card className="p-5" aria-label="Loading your path">
        <div className="h-3 w-24 rounded-full bg-[#F2E9D8]" />
        <div className="mt-3 flex items-center gap-1.5">
          {CONSTELLATION_NODE_ORDER.map((k) => (
            <span key={k} className="h-8 w-8 shrink-0 rounded-full bg-[#F2E9D8]" />
          ))}
        </div>
        <div className="mt-3 h-3 w-40 rounded-full bg-[#F2E9D8]" />
      </Card>
    );
  }

  const next = state.nodes[state.recommendedNode];

  return (
    <Card className="overflow-hidden p-5">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#B07A00]">Your current path</p>
      <p className="mt-1 font-display text-lg font-bold leading-tight text-[#111111]">
        {state.directionName || "Choose a direction"}
      </p>
      <p className="mt-0.5 text-xs font-bold text-[#9B958B]">{state.completedNodeCount} of 5 steps connected</p>

      {/* Five mini nodes joined by state-colored links. */}
      <div className="mt-3.5 flex items-center" aria-hidden>
        {CONSTELLATION_NODE_ORDER.map((key, i) => {
          const node = state.nodes[key];
          const Icon = NODE_ICONS[key];
          const done = node.status === "completed" || node.completedAt !== null;
          const prevDone =
            i > 0 &&
            (state.nodes[CONSTELLATION_NODE_ORDER[i - 1]].status === "completed" ||
              state.nodes[CONSTELLATION_NODE_ORDER[i - 1]].completedAt !== null);
          return (
            <span key={key} className="flex min-w-0 flex-1 items-center last:flex-none">
              {i > 0 && (
                <span
                  className={`h-[2px] min-w-2 flex-1 rounded-full ${prevDone ? "bg-[#F2A900]/60" : "bg-[#EFE7D8]"}`}
                />
              )}
              <span
                className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full ${MINI_STYLES[node.status]}`}
                title={`${node.label}: ${STATUS_LABELS[node.status]}`}
              >
                <Icon size={15} strokeWidth={2.3} />
                {done && node.status !== "active" && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#F2A900] text-white">
                    <Check size={9} strokeWidth={3.4} />
                  </span>
                )}
                {node.status === "locked" && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8] text-[#9B958B]">
                    <Lock size={8} strokeWidth={3} />
                  </span>
                )}
              </span>
            </span>
          );
        })}
      </div>
      {/* Text equivalent of the mini map. */}
      <p className="sr-only">
        {CONSTELLATION_NODE_ORDER.map((key) => `${state.nodes[key].label}: ${STATUS_LABELS[state.nodes[key].status]}`).join(". ")}
      </p>

      {next.nextActionLabel && (
        <p className="mt-3 text-sm leading-6 text-[#6E6E6E]">
          <span className="font-extrabold text-[#38322A]">Next:</span> {next.explanation.split(". ")[0]}.
        </p>
      )}

      <Link
        href="/progress"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFB000] to-[#F2A900] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(242,169,0,0.32)] transition-transform duration-200 hover:-translate-y-px active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
      >
        Continue your path <ArrowRight size={16} />
      </Link>
    </Card>
  );
}
