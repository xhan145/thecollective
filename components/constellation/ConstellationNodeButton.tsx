"use client";

// One constellation node: a real button (keyboard + SR first-class) whose disc
// carries the state visually — but never by color alone: every state also has
// a glyph (lock / check / progress arc / alert) and a text line, and the
// aria-label speaks the whole sentence.
//
// Fidelity notes (LumenDeck translation): two-layer glow = crisp 1px gold ring
// + soft wide bloom; completed is SETTLED (static halo), only the recommended
// node breathes (3.2s, double-gated in globals.css); hover is a one-step ring
// brighten + tooltip after a delay; press is an immediate 0.97 settle.

import { motion } from "framer-motion";
import { BookOpen, Check, CircleAlert, FileCheck2, HeartHandshake, Lock, MessageSquare, Repeat2 } from "lucide-react";
import type { ComponentType, KeyboardEvent } from "react";
import type { ConstellationNode, ConstellationNodeKey } from "@/lib/constellation/types";
import { NODE_POS, NODE_R, STAGE_H, STAGE_W } from "@/lib/constellation/layout";

export const NODE_ICONS: Record<ConstellationNodeKey, ComponentType<{ size?: number | string; strokeWidth?: number; className?: string }>> = {
  practice: BookOpen,
  prove: FileCheck2,
  feedback: MessageSquare,
  apply: Repeat2,
  contribute: HeartHandshake
};

export const STATUS_LABELS: Record<ConstellationNode["status"], string> = {
  locked: "Locked",
  available: "Available",
  active: "Next step",
  in_progress: "In progress",
  completed: "Complete",
  attention_needed: "Needs a look"
};

/** Disc treatment per state — gold is earned, cream is potential. Surface
 *  gradients are globals.css classes (constellation-disc-*) so dark mode gets
 *  real variants; borders/shadows stay utilities (remapped or brand-gold). */
const DISC_STYLES: Record<ConstellationNode["status"], string> = {
  locked:
    "border border-dashed border-[#E3D9C6] bg-[#FFFDF8] opacity-70 shadow-none",
  available:
    "constellation-disc-available border border-[#EFE7D8] shadow-[0_1px_2px_rgba(71,52,18,0.05),0_8px_20px_rgba(71,52,18,0.07)]",
  active:
    "border border-[#F2A900]/70 bg-gradient-to-br from-[#FFB000] to-[#F2A900] text-white shadow-[0_0_0_1px_rgba(242,169,0,0.38),0_0_22px_rgba(242,169,0,0.20),0_10px_30px_rgba(71,52,18,0.10)]",
  in_progress:
    "constellation-disc-in-progress border border-[#F2A900]/45 shadow-[0_1px_2px_rgba(71,52,18,0.05),0_8px_22px_rgba(71,52,18,0.08)]",
  completed:
    "constellation-disc-completed border border-[#F2A900]/50 shadow-[0_0_0_1px_rgba(242,169,0,0.30),0_0_16px_rgba(242,169,0,0.14),0_8px_22px_rgba(71,52,18,0.08)]",
  attention_needed:
    "constellation-disc-attention border-2 border-[#FFB000] shadow-[0_0_0_1px_rgba(255,176,0,0.25),0_8px_22px_rgba(71,52,18,0.08)]"
};

const ICON_COLOR: Record<ConstellationNode["status"], string> = {
  locked: "text-[#B7AE9E]",
  available: "text-[#B07A00]",
  active: "text-white",
  in_progress: "text-[#B07A00]",
  completed: "text-[#7A5300]",
  attention_needed: "text-[#B07A00]"
};

export function nodeAriaLabel(node: ConstellationNode): string {
  const state = STATUS_LABELS[node.status];
  const evidence =
    node.evidenceCount > 0 ? `${node.evidenceCount} piece${node.evidenceCount === 1 ? "" : "s"} of evidence.` : "No evidence yet.";
  return `${node.label}: ${state}. ${evidence} ${node.explanation}`;
}

export function ConstellationNodeButton({
  node,
  entranceDelay = 0,
  selected,
  focusable,
  hovered,
  motionAllowed,
  onSelect,
  onHover,
  onFocusNode,
  onKeyNav,
  buttonRef
}: {
  node: ConstellationNode;
  entranceDelay?: number;
  selected: boolean;
  focusable: boolean;
  hovered: boolean;
  motionAllowed: boolean;
  onSelect: (key: ConstellationNodeKey) => void;
  onHover: (key: ConstellationNodeKey | null) => void;
  onFocusNode: (key: ConstellationNodeKey) => void;
  onKeyNav: (event: KeyboardEvent, key: ConstellationNodeKey) => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  const pos = NODE_POS[node.key];
  const Icon = NODE_ICONS[node.key];
  const discPct = ((NODE_R * 2) / STAGE_W) * 100;
  const showProgressArc =
    node.status === "in_progress" ||
    (node.key === "practice" && node.progressCurrent !== null && node.progressTarget !== null && node.progressCurrent > 0 && node.progressCurrent < node.progressTarget);
  const fraction =
    node.progressCurrent !== null && node.progressTarget ? Math.min(1, node.progressCurrent / node.progressTarget) : 0.4;

  const breathing = node.status === "active" && motionAllowed;
  const emphasis = selected ? "scale-[1.07]" : hovered ? "scale-[1.03]" : "";

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      tabIndex={focusable ? 0 : -1}
      aria-label={nodeAriaLabel(node)}
      aria-haspopup="dialog"
      aria-expanded={selected}
      data-node={node.key}
      initial={motionAllowed ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: motionAllowed ? entranceDelay : 0 }}
      onClick={() => onSelect(node.key)}
      onKeyDown={(e) => onKeyNav(e, node.key)}
      onPointerEnter={() => onHover(node.key)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onFocusNode(node.key)}
      className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 touch-manipulation flex-col items-center rounded-[26px] outline-none"
      style={{ left: `${(pos.x / STAGE_W) * 100}%`, top: `${(pos.y / STAGE_H) * 100}%`, width: `${discPct + 10}%` }}
    >
      {/* Disc */}
      <span
        aria-hidden
        className={`relative grid aspect-square place-items-center rounded-full transition-[transform,box-shadow,border-color,opacity] duration-150 ease-out active:scale-[0.97] ${DISC_STYLES[node.status]} ${emphasis} ${breathing ? "constellation-breathe" : ""} ${selected ? "ring-4 ring-[#F2A900]/40 ring-offset-2 ring-offset-[#FFF8EE]" : "group-focus-visible:ring-4 group-focus-visible:ring-[#F2A900]/40 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#FFF8EE]"}`}
        style={{ width: `${(discPct / (discPct + 10)) * 100}%` }}
      >
        <Icon size="42%" strokeWidth={2.2} className={ICON_COLOR[node.status]} />

        {/* In-progress arc — a settled, deterministic ring segment, never a spinner. */}
        {showProgressArc && (
          <svg viewBox="0 0 36 36" className="pointer-events-none absolute -inset-[9%] h-[118%] w-[118%]" aria-hidden>
            <circle cx="18" cy="18" r="16.4" fill="none" stroke="#F2A900" strokeOpacity="0.18" strokeWidth="1.6" />
            <circle
              cx="18"
              cy="18"
              r="16.4"
              fill="none"
              stroke="#F2A900"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(4, fraction * 103)} 103`}
              transform="rotate(-90 18 18)"
            />
          </svg>
        )}

        {/* State glyph chip — meaning without color. */}
        {node.status === "locked" && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-[30%] w-[30%] min-h-5 min-w-5 place-items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8] text-[#9B958B]">
            <Lock size="58%" strokeWidth={2.4} />
          </span>
        )}
        {node.status === "completed" && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-[32%] w-[32%] min-h-5 min-w-5 place-items-center rounded-full bg-[#F2A900] text-white shadow-[0_2px_8px_rgba(242,169,0,0.4)]">
            <Check size="62%" strokeWidth={3} />
          </span>
        )}
        {node.status === "attention_needed" && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-[32%] w-[32%] min-h-5 min-w-5 place-items-center rounded-full bg-[#FFB000] text-white">
            <CircleAlert size="66%" strokeWidth={2.6} />
          </span>
        )}
      </span>

      {/* Label + state line */}
      <span className="mt-1.5 flex flex-col items-center">
        <span className={`text-[12px] font-extrabold leading-tight ${node.status === "locked" ? "text-[#9B958B]" : "text-[#111111]"}`}>
          {node.label}
        </span>
        {/* #7A5300 (not #B07A00) where the text carries state — 6.3:1 on cream. */}
        <span className={`text-[10px] font-bold leading-tight ${node.status === "active" || node.status === "attention_needed" ? "text-[#7A5300]" : "text-[#9B958B]"}`}>
          {node.evidenceCount > 0 ? `${node.evidenceCount} · ${STATUS_LABELS[node.status]}` : STATUS_LABELS[node.status]}
        </span>
      </span>

      {/* Hover tooltip (pointer devices only; delayed via CSS; no layout shift) */}
      <span
        aria-hidden
        className="constellation-tooltip pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 w-max max-w-[180px] -translate-x-1/2 rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8]/95 px-3 py-1.5 text-center text-[11px] font-bold leading-snug text-[#38322A] opacity-0 shadow-[0_10px_26px_rgba(71,52,18,0.14)] backdrop-blur"
      >
        {node.explanation.split(". ")[0]}.
      </span>
    </motion.button>
  );
}
