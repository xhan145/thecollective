"use client";

// The constellation stage. Layer order (spec ATMOSPHERIC LAYERS):
//   1 warm radial wash (CSS)            4 connection SVG (+ evidence dots)
//   2 app-wide grain/aurora (AppShell)  5 DOM node buttons + hub
//   3 evidence dots (inside the SVG)    6 labels, focus rings, tooltips
//
// Interaction: tap/click/Enter/Space select a node; arrow keys rove the
// journey order; bounded zoom (1–1.5×) via buttons with drag-pan while
// zoomed; Reset view restores. Page scrolling is never hijacked — the stage
// only owns gestures once the member has zoomed in.

import { motion } from "framer-motion";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { CollectiveMiniMark } from "@/components/beta/Brand";
import { easeOut } from "@/components/beta/motion";
import type { ConstellationNodeKey, ConstellationState } from "@/lib/constellation/types";
import { HUB_POS, HUB_R, JOURNEY, STAGE_H, STAGE_W } from "@/lib/constellation/layout";
import { ConstellationConnections } from "./ConstellationConnections";
import { ConstellationNodeButton, STATUS_LABELS } from "./ConstellationNodeButton";
import { useMotionAllowed, usePageVisible } from "./useMotionAllowed";

const MIN_SCALE = 1;
const MAX_SCALE = 1.5;
const SCALE_STEP = 0.25;
const CLICK_SLOP_PX = 5; // LumenDeck's press/drag disambiguation distance

export function ConstellationMap({
  state,
  selectedKey,
  onSelect,
  onZoomUsed,
  onResetView,
  onNodeFocused
}: {
  state: ConstellationState;
  selectedKey: ConstellationNodeKey | null;
  onSelect: (key: ConstellationNodeKey | null) => void;
  onZoomUsed: () => void;
  onResetView: () => void;
  onNodeFocused: (key: ConstellationNodeKey) => void;
}) {
  const motionAllowed = useMotionAllowed();
  const pageVisible = usePageVisible();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<ConstellationNodeKey, HTMLButtonElement>());
  const [hoveredKey, setHoveredKey] = useState<ConstellationNodeKey | null>(null);
  const [focusKey, setFocusKey] = useState<ConstellationNodeKey>(state.recommendedNode);
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Ambient evidence-dot seeds — real ids only (spec: decorative points must
  // correspond to real records).
  const evidenceIds = useMemo(
    () => JOURNEY.flatMap((k) => state.nodes[k].evidence.map((e) => `${k}:${e.id}`)),
    [state]
  );

  const clampPan = useCallback((tx: number, ty: number, scale: number) => {
    const el = containerRef.current;
    const w = el?.clientWidth ?? 390;
    const h = el?.clientHeight ?? 414;
    const maxX = ((scale - 1) * w) / 2;
    const maxY = ((scale - 1) * h) / 2;
    return { tx: Math.max(-maxX, Math.min(maxX, tx)), ty: Math.max(-maxY, Math.min(maxY, ty)) };
  }, []);

  const setZoom = useCallback(
    (next: number) => {
      setView((v) => {
        const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
        const { tx, ty } = clampPan(v.tx, v.ty, scale);
        return { scale, tx: scale === 1 ? 0 : tx, ty: scale === 1 ? 0 : ty };
      });
    },
    [clampPan]
  );

  const zoomIn = () => {
    onZoomUsed();
    setZoom(view.scale + SCALE_STEP);
  };
  const zoomOut = () => setZoom(view.scale - SCALE_STEP);
  const resetView = () => {
    setView({ scale: 1, tx: 0, ty: 0 });
    onResetView();
  };
  const transformed = view.scale !== 1 || view.tx !== 0 || view.ty !== 0;

  // Drag-pan (only while zoomed; only from the stage background so node taps
  // stay taps; 5px slop before it counts as a pan).
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (view.scale === 1) return;
    // Never capture pointers that begin on a node/control — capturing would
    // retarget the pointerup and swallow the tap. Background drags only.
    if ((e.target as Element).closest("button")) return;
    dragRef.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty, moved: false };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < CLICK_SLOP_PX) return;
    d.moved = true;
    setDragging(true);
    setView((v) => ({ ...v, ...clampPan(d.tx + dx, d.ty + dy, v.scale) }));
  };
  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  // Roving focus in journey order.
  const focusNode = useCallback((key: ConstellationNodeKey) => {
    setFocusKey(key);
    nodeRefs.current.get(key)?.focus();
  }, []);

  const onKeyNav = (e: KeyboardEvent, key: ConstellationNodeKey) => {
    const idx = JOURNEY.indexOf(key);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      focusNode(JOURNEY[(idx + 1) % JOURNEY.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      focusNode(JOURNEY[(idx - 1 + JOURNEY.length) % JOURNEY.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusNode(JOURNEY[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      focusNode(JOURNEY[JOURNEY.length - 1]);
    }
  };

  const handleFocusNode = (key: ConstellationNodeKey) => {
    setFocusKey(key);
    onNodeFocused(key);
    const node = state.nodes[key];
    setAnnouncement(`${node.label}: ${STATUS_LABELS[node.status]}. ${node.explanation}`);
  };

  // Keep the roving target valid when the recommendation moves.
  useEffect(() => {
    setFocusKey((k) => (JOURNEY.includes(k) ? k : state.recommendedNode));
  }, [state.recommendedNode]);

  const hub = state.nodes; // narrow alias for readability below
  const hubTitle = state.directionName || "Choose a direction";
  const discPct = ((HUB_R * 2) / STAGE_W) * 100;

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={`Your progress constellation for ${hubTitle}. ${state.completedNodeCount} of 5 steps complete.`}
      data-paused={pageVisible ? undefined : "true"}
      className="constellation-stage relative w-full overflow-hidden rounded-[26px] border border-[#EFE7D8] bg-[#FFF8EE]"
      style={{ aspectRatio: `${STAGE_W} / ${STAGE_H}`, touchAction: view.scale > 1 ? "none" : "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Layer 1 — warm radial wash + soft vignette. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 52% at 44% 46%, rgba(242,169,0,0.10), rgba(255,241,199,0.05) 55%, transparent 78%), radial-gradient(120% 100% at 50% 118%, rgba(242,169,0,0.06), transparent 55%)"
        }}
      />

      {/* Zoomable stage — connections + hub + nodes move together. */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
          transition: dragging || !motionAllowed ? "none" : "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)"
        }}
      >
        <ConstellationConnections
          state={state}
          hoveredKey={hoveredKey}
          selectedKey={selectedKey}
          motionAllowed={motionAllowed}
          pageVisible={pageVisible}
          evidenceIds={evidenceIds}
        />

        {/* Hub — the active direction, gravitational center (not a step).
            Outer div owns positioning; inner motion.div owns the entrance so
            framer's transform never fights the centering translate. */}
        <div
          aria-hidden
          className="absolute z-[5] -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(HUB_POS.x / STAGE_W) * 100}%`, top: `${(HUB_POS.y / STAGE_H) * 100}%`, width: `${discPct + 12}%` }}
        >
          <motion.div
            initial={motionAllowed ? { opacity: 0, scale: 0.92 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: easeOut }}
            className="flex flex-col items-center"
          >
            <span
              className={`constellation-disc-hub grid aspect-square place-items-center rounded-full border shadow-[0_0_0_1px_rgba(242,169,0,0.25),0_0_28px_rgba(242,169,0,0.16),0_14px_34px_rgba(71,52,18,0.10)] ${state.directionId ? "border-[#F2A900]/45" : "border-dashed border-[#E3D9C6]"}`}
              style={{ width: `${(discPct / (discPct + 12)) * 100}%` }}
            >
              <CollectiveMiniMark className="h-[38%] w-[58%]" />
            </span>
            <span className="mt-1.5 max-w-[140%] text-center font-display text-[13px] font-bold leading-tight text-[#111111]">
              {hubTitle}
            </span>
            <span className="text-[10px] font-bold text-[#9B958B]">{state.completedNodeCount} of 5 connected</span>
          </motion.div>
        </div>

        {/* Loop nodes — staggered entrance, 60ms apart (MotionList rhythm). */}
        {JOURNEY.map((key, i) => (
          <ConstellationNodeButton
            key={key}
            node={hub[key]}
            entranceDelay={0.08 + i * 0.06}
            selected={selectedKey === key}
            focusable={focusKey === key}
            hovered={hoveredKey === key}
            motionAllowed={motionAllowed}
            onSelect={(k) => onSelect(selectedKey === k ? null : k)}
            onHover={setHoveredKey}
            onFocusNode={handleFocusNode}
            onKeyNav={onKeyNav}
            buttonRef={(el) => {
              if (el) nodeRefs.current.set(key, el);
              else nodeRefs.current.delete(key);
            }}
          />
        ))}
      </div>

      {/* Zoom + reset controls — 44px targets, top-right, quiet. */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={zoomIn}
          disabled={view.scale >= MAX_SCALE}
          aria-label="Zoom in"
          className="grid h-11 w-11 place-items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8]/95 text-[#38322A] shadow-[0_6px_16px_rgba(71,52,18,0.10)] backdrop-blur transition-transform duration-150 ease-out hover:-translate-y-px active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
        >
          <Plus size={18} strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          disabled={view.scale <= MIN_SCALE}
          aria-label="Zoom out"
          className="grid h-11 w-11 place-items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8]/95 text-[#38322A] shadow-[0_6px_16px_rgba(71,52,18,0.10)] backdrop-blur transition-transform duration-150 ease-out hover:-translate-y-px active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
        >
          <Minus size={18} strokeWidth={2.4} />
        </button>
        {transformed && (
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset view"
            className="grid h-11 w-11 place-items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8]/95 text-[#38322A] shadow-[0_6px_16px_rgba(71,52,18,0.10)] backdrop-blur transition-transform duration-150 ease-out hover:-translate-y-px active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
          >
            <RotateCcw size={17} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* SR announcements for focus/selection state changes. */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
