"use client";

// List view — the constellation's first-class text equivalent. Required for
// screen readers, reduced motion, small screens, direct navigators, and as
// the rendering fallback. Same projection, same copy, zero re-derivation.

import { ArrowRight } from "lucide-react";
import { Badge, ButtonLink } from "@/components/beta/ui";
import { MotionItem, MotionList } from "@/components/beta/motion";
import type { ConstellationNodeKey, ConstellationState } from "@/lib/constellation/types";
import { CONSTELLATION_NODE_ORDER } from "@/lib/constellation/types";
import { NODE_ICONS, STATUS_LABELS } from "./ConstellationNodeButton";

const TILE_STYLES: Record<string, string> = {
  locked: "bg-[#FFF8EE] text-[#9B958B] border border-dashed border-[#E3D9C6]",
  available: "bg-[#FFF1C7] text-[#B07A00]",
  active: "bg-gradient-to-br from-[#FFB000] to-[#F2A900] text-white",
  in_progress: "bg-[#FFF1C7] text-[#B07A00]",
  completed: "bg-[#FFF1C7] text-[#7A5300]",
  attention_needed: "bg-[#FFF1C7] text-[#B07A00] border-2 border-[#FFB000]"
};

function statusTone(status: string): "gold" | "green" | "muted" {
  if (status === "completed") return "green";
  if (status === "locked") return "muted";
  return "gold";
}

export function ConstellationListView({
  state,
  onOpenNode,
  onApplyOpen
}: {
  state: ConstellationState;
  onOpenNode: (key: ConstellationNodeKey) => void;
  onApplyOpen: () => void;
}) {
  return (
    <MotionList className="space-y-3">
      <ol className="space-y-3" aria-label={`Your progress steps for ${state.directionName || "your direction"}`}>
        {CONSTELLATION_NODE_ORDER.map((key, index) => {
          const node = state.nodes[key];
          const Icon = NODE_ICONS[key];
          const recommended = state.recommendedNode === key;
          return (
            <li key={key}>
              <MotionItem>
                <div
                  className={`rounded-[22px] border bg-[#FFFDF8] p-4 shadow-[0_1px_2px_rgba(71,52,18,0.06),0_8px_22px_rgba(71,52,18,0.07)] ${recommended ? "border-[#F2A900]/60" : "border-[#EFE7D8]"} ${node.status === "locked" ? "opacity-80" : ""}`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${TILE_STYLES[node.status]}`}>
                      <Icon size={21} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[15px] font-extrabold text-[#111111]">
                          {index + 1}. {node.label}
                        </span>
                        <Badge tone={statusTone(node.status)}>{STATUS_LABELS[node.status]}</Badge>
                        {recommended && <Badge tone="gold">Next</Badge>}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">{node.explanation}</p>
                      {node.evidenceCount > 0 && (
                        <p className="mt-1 text-xs font-bold text-[#9B958B]">
                          {node.evidenceCount} piece{node.evidenceCount === 1 ? "" : "s"} of evidence
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {node.nextActionLabel &&
                          (key === "apply" ? (
                            <button
                              type="button"
                              onClick={onApplyOpen}
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FFB000] to-[#F2A900] px-4 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(242,169,0,0.28)] transition-transform duration-150 hover:-translate-y-px active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
                            >
                              {node.nextActionLabel} <ArrowRight size={14} />
                            </button>
                          ) : node.nextActionHref ? (
                            <ButtonLink href={node.nextActionHref} className="!min-h-10 !px-4 !text-xs">
                              {node.nextActionLabel}
                            </ButtonLink>
                          ) : null)}
                        <button
                          type="button"
                          onClick={() => onOpenNode(key)}
                          className="inline-flex min-h-10 items-center rounded-full border border-[#EFE7D8] bg-[#FFF8EE] px-4 text-xs font-extrabold text-[#38322A] transition-colors duration-150 hover:border-[#F2A900]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </MotionItem>
            </li>
          );
        })}
      </ol>
    </MotionList>
  );
}
