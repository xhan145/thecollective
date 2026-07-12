"use client";

// Connection layer — one SVG under the DOM nodes. Every path is a quadratic
// Bézier trimmed to kiss node rims (layout.ts). Fidelity comes from the
// two-stroke stack (wide, blurred, low-opacity gold UNDER a crisp stroke —
// the 2D translation of LumenDeck's additive neon), state-graded opacity,
// a draw-in on live completion, and ONE slow shimmer dot on the active route.
//
// State grammar:
//   completed segment → stable gold, settled (no motion)
//   active route      → clearest line + slow directional shimmer
//   available         → soft warm line
//   locked            → faint dashed cream — the journey stays visible, quietly
// Hovering a node clarifies its adjacent segments (opacity step, 150ms).

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ConstellationNodeKey, ConstellationState } from "@/lib/constellation/types";
import {
  HUB_POS,
  HUB_R,
  JOURNEY,
  STAGE_H,
  STAGE_W,
  evidenceDots,
  journeyPaths,
  spokePaths
} from "@/lib/constellation/layout";

type SegmentState = "locked" | "available" | "active" | "completed";

// Widths are stage units (scale with the stage) — tuned so the crisp stroke
// reads ~1.6px at 390px and ~2.6px at desktop, LumenDeck-wire territory.
const SEGMENT_STYLE: Record<SegmentState, { stroke: string; width: number; opacity: number; dash?: string; glow: number }> = {
  locked: { stroke: "#D8CFBE", width: 0.36, opacity: 0.55, dash: "1.4 2", glow: 0 },
  available: { stroke: "#E4C97E", width: 0.4, opacity: 0.7, glow: 0.06 },
  active: { stroke: "#F2A900", width: 0.56, opacity: 0.95, glow: 0.2 },
  completed: { stroke: "#E0A400", width: 0.46, opacity: 0.8, glow: 0.13 }
};

/** Underlying completion, independent of display status (a completed node can
 *  be displayed "active" while it is the recommended step, e.g. unread
 *  feedback). The projection sets completedAt only from real evidence. */
function isDone(state: ConstellationState, key: ConstellationNodeKey): boolean {
  return state.nodes[key].status === "completed" || state.nodes[key].completedAt !== null;
}

export function ConstellationConnections({
  state,
  hoveredKey,
  selectedKey,
  motionAllowed,
  pageVisible,
  evidenceIds
}: {
  state: ConstellationState;
  hoveredKey: ConstellationNodeKey | null;
  selectedKey: ConstellationNodeKey | null;
  motionAllowed: boolean;
  pageVisible: boolean;
  evidenceIds: string[];
}) {
  const journey = journeyPaths();
  const spokes = spokePaths();
  const dots = evidenceDots(evidenceIds);

  // Segment status: completed when both endpoints have settled evidence;
  // active when it leads INTO the recommended node; available when its start
  // is complete; locked otherwise.
  const segmentStates: SegmentState[] = journey.map((_, i) => {
    const fromKey = JOURNEY[i];
    const toKey = JOURNEY[i + 1];
    const fromDone = isDone(state, fromKey);
    const toDone = isDone(state, toKey);
    if (fromDone && toDone) return "completed";
    if (fromDone && toKey === state.recommendedNode) return "active";
    if (fromDone) return "available";
    return "locked";
  });

  // Draw-in only on a LIVE incomplete→complete transition, never on mount.
  const prevStates = useRef<SegmentState[] | null>(null);
  const justCompleted = journey.map((_, i) => {
    const prev = prevStates.current;
    return prev !== null && prev[i] !== "completed" && segmentStates[i] === "completed";
  });
  useEffect(() => {
    prevStates.current = segmentStates;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentStates.join()]);

  const activeIndex = segmentStates.findIndex((s) => s === "active");
  const shimmerPath = activeIndex >= 0 ? journey[activeIndex] : null;
  const showShimmer = shimmerPath !== null && motionAllowed && pageVisible;

  const adjacency = (i: number, key: ConstellationNodeKey | null) =>
    key !== null && (JOURNEY[i] === key || JOURNEY[i + 1] === key);

  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
      aria-hidden
      focusable="false"
    >
      {/* Layer 3 — distant points: one faint mark per real past action. */}
      {dots.map((d) => (
        <circle key={d.id} cx={d.x} cy={d.y} r={d.r} fill="#B07A00" opacity={d.opacity * 0.6} />
      ))}

      {/* Hub halo — soft gravitational center. */}
      <circle cx={HUB_POS.x} cy={HUB_POS.y} r={HUB_R + 5.5} fill="url(#constellation-hub-glow)" opacity="0.5" />
      <defs>
        <radialGradient id="constellation-hub-glow">
          <stop offset="0%" stopColor="#F2A900" stopOpacity="0.20" />
          <stop offset="62%" stopColor="#F2A900" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#F2A900" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Spokes — faint structure from the direction hub. */}
      {spokes.map((p, i) => {
        const key = JOURNEY[i];
        const lit = state.nodes[key].status !== "locked";
        const clarified = hoveredKey === key || selectedKey === key;
        return (
          <path
            key={p.id}
            d={p.d}
            fill="none"
            stroke={lit ? "#E4C97E" : "#E7DEC9"}
            strokeWidth={0.3}
            strokeLinecap="round"
            opacity={clarified ? 0.85 : lit ? 0.5 : 0.34}
            style={{ transition: "opacity 150ms ease-out" }}
          />
        );
      })}

      {/* Journey arc — under-glow stroke then crisp stroke, per segment. */}
      {journey.map((p, i) => {
        const seg = SEGMENT_STYLE[segmentStates[i]];
        const clarified = adjacency(i, hoveredKey) || adjacency(i, selectedKey);
        const opacity = Math.min(1, seg.opacity + (clarified ? 0.22 : 0));
        return (
          <g key={p.id}>
            {seg.glow > 0 && (
              <path d={p.d} fill="none" stroke="#F2A900" strokeWidth={seg.width * 3.4} strokeLinecap="round" opacity={seg.glow + (clarified ? 0.06 : 0)} style={{ transition: "opacity 150ms ease-out" }} />
            )}
            {justCompleted[i] && motionAllowed ? (
              <motion.path
                d={p.d}
                fill="none"
                stroke={seg.stroke}
                strokeWidth={seg.width}
                strokeLinecap="round"
                strokeDasharray={seg.dash}
                initial={{ pathLength: 0, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : (
              <path
                d={p.d}
                fill="none"
                stroke={seg.stroke}
                strokeWidth={seg.width}
                strokeLinecap="round"
                strokeDasharray={seg.dash}
                opacity={opacity}
                style={{ transition: "opacity 150ms ease-out" }}
              />
            )}
          </g>
        );
      })}

      {/* One shimmer dot riding the active route — the only continuous motion,
          removed entirely under reduced motion or when the tab is hidden. */}
      {showShimmer && shimmerPath && (
        <circle r="0.9" fill="#FFB000" opacity="0.9">
          <animateMotion dur="3.6s" repeatCount="indefinite" path={shimmerPath.d} />
        </circle>
      )}
      {showShimmer && shimmerPath && (
        <circle r="1.8" fill="#FFB000" opacity="0.25">
          <animateMotion dur="3.6s" repeatCount="indefinite" path={shimmerPath.d} />
        </circle>
      )}
    </svg>
  );
}
