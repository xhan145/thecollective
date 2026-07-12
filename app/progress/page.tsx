"use client";

// /progress — the Progress Constellation screen. Private, evidence-backed map
// of the member's growth loop with a first-class list equivalent.
// Structure (spec FULL PROGRESS SCREEN): header → direction → view toggle →
// viewport (map | list, with list as rendering fallback) → next-action card →
// how-it-works → recent evidence. Desktop (lg+) adds the anchored inspector
// column; mobile opens node details in a bottom sheet.

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Compass, List, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { Badge, Card, PageHeader, SectionLabel } from "@/components/beta/ui";
import { Reveal } from "@/components/beta/motion";
import { ApplyFeedbackSheet } from "@/components/constellation/ApplyFeedbackSheet";
import { ConstellationDetailPanel, ConstellationDetailSheet } from "@/components/constellation/ConstellationDetailSheet";
import { ConstellationListView } from "@/components/constellation/ConstellationListView";
import { ConstellationMap } from "@/components/constellation/ConstellationMap";
import {
  ConstellationError,
  ConstellationErrorBoundary,
  ConstellationSkeleton,
  OfflineBanner
} from "@/components/constellation/ConstellationStates";
import { NODE_ICONS } from "@/components/constellation/ConstellationNodeButton";
import { useConstellation } from "@/lib/constellation/useConstellation";
import type { ConstellationNodeKey } from "@/lib/constellation/types";
import { CONSTELLATION_NODE_ORDER } from "@/lib/constellation/types";

type ViewMode = "map" | "list";
const MODE_KEY = "collective.constellation.mode";

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return desktop;
}

function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

/** Legend + privacy note — the inspector's resting content and the mobile
 *  "How this works" card. */
function HowToReadCard() {
  const samples: { label: string; className: string; note: string }[] = [
    { label: "Next step", className: "border border-[#F2A900]/60 bg-gradient-to-br from-[#FFB000] to-[#F2A900]", note: "your recommended move" },
    { label: "Complete", className: "border border-[#F2A900]/45 bg-[#FFF1C7]", note: "backed by real evidence" },
    { label: "Available", className: "border border-[#EFE7D8] bg-[#FFFDF8]", note: "open when you are" },
    { label: "Locked", className: "border border-dashed border-[#E3D9C6] bg-[#FFFDF8] opacity-70", note: "unlocks with the step before it" }
  ];
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-[#111111]">How to read your constellation</h2>
      <p className="mt-1.5 text-sm leading-6 text-[#6E6E6E]">
        Each light is something you actually did — a practice, a proof, a response, a step you applied, help you gave.
        Nothing here is decoration.
      </p>
      <ul className="mt-3 space-y-2">
        {samples.map((s) => (
          <li key={s.label} className="flex items-center gap-3">
            <span aria-hidden className={`h-6 w-6 shrink-0 rounded-full ${s.className}`} />
            <span className="text-sm text-[#38322A]">
              <span className="font-extrabold">{s.label}</span> — {s.note}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-2xl bg-[#FFF8EE] px-3.5 py-2.5 text-xs leading-5 text-[#6E6E6E]">
        Only you can see this map. It grows from your practice — it is never a score, a rank, or a comparison.
      </p>
    </div>
  );
}

export default function ProgressPage() {
  const { phase, state, retry, applyTargets, applicationsAvailable, planApplication, advanceApplication, logEvent } =
    useConstellation();
  const isDesktop = useIsDesktop();
  const online = useOnline();

  const [mode, setMode] = useState<ViewMode>("map");
  const [selectedKey, setSelectedKey] = useState<ConstellationNodeKey | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const viewedLogged = useRef(false);
  const zoomLogged = useRef(false);
  const focusLogged = useRef(new Set<ConstellationNodeKey>());

  // Restore the preferred view once (list is also the auto-fallback).
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(MODE_KEY) : null;
    if (saved === "list" || saved === "map") setMode(saved);
  }, []);

  useEffect(() => {
    if (!viewedLogged.current && state) {
      viewedLogged.current = true;
      logEvent("constellation_viewed", { mode, completedNodeCount: state.completedNodeCount });
    }
  }, [state, mode, logEvent]);

  const switchMode = (next: ViewMode) => {
    if (next === mode) return;
    setMode(next);
    // Choosing the map again after a render failure retries with a fresh
    // boundary (mapAttempt keys the boundary below).
    if (next === "map" && mapFailed) {
      setMapFailed(false);
      setMapAttempt((a) => a + 1);
    }
    window.localStorage.setItem(MODE_KEY, next);
    logEvent("constellation_mode_changed", { mode: next });
  };

  const openNode = useCallback(
    (key: ConstellationNodeKey | null) => {
      setSelectedKey(key);
      if (key) logEvent("constellation_node_opened", { node: key });
    },
    [logEvent]
  );

  const onNodeFocused = useCallback(
    (key: ConstellationNodeKey) => {
      if (focusLogged.current.has(key)) return;
      focusLogged.current.add(key);
      logEvent("constellation_node_focused", { node: key });
    },
    [logEvent]
  );

  const closeAndRefocus = useCallback(() => {
    setSelectedKey(null);
  }, []);

  // Opening the Apply flow closes any node detail first — one dialog at a time.
  const openApply = useCallback(() => {
    setSelectedKey(null);
    setApplyOpen(true);
  }, []);

  const onNextAction = useCallback(
    (node: ConstellationNodeKey) => {
      if (!state) return;
      logEvent("constellation_next_action_selected", {
        node,
        rule: node === state.recommendedNode ? state.recommendedRule : "direct",
        recommended: node === state.recommendedNode
      });
    },
    [state, logEvent]
  );

  const onMapFallback = useCallback(() => {
    setMapFailed(true);
    setMode("list");
    logEvent("constellation_list_fallback_used", { reason: "render_error" });
  }, [logEvent]);

  const recentEvidence = useMemo(() => {
    if (!state) return [];
    return CONSTELLATION_NODE_ORDER.flatMap((key) =>
      state.nodes[key].evidence.map((e) => ({ ...e, nodeKey: key }))
    )
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
      .slice(0, 4);
  }, [state]);

  const selectedNode = state && selectedKey ? state.nodes[selectedKey] : null;
  const nextNode = state ? state.nodes[state.recommendedNode] : null;
  const showMap = mode === "map" && !mapFailed;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Progress"
          subtitle="Your growth loop, backed by what you've actually done."
          action={
            state?.directionId ? (
              <Link
                href="/directions"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#EFE7D8] bg-[#FFFDF8] px-3.5 py-2 text-xs font-extrabold text-[#38322A] shadow-[0_6px_16px_rgba(71,52,18,0.07)] transition-colors hover:border-[#F2A900]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
              >
                <Compass size={14} className="text-[#B07A00]" />
                Change direction
              </Link>
            ) : undefined
          }
        />

        {!online && <OfflineBanner />}

        {phase === "error" ? (
          <ConstellationError onRetry={retry} />
        ) : phase === "loading" || !state ? (
          <div className="space-y-4">
            <ConstellationSkeleton />
            <div className="h-24 animate-pulse rounded-[22px] bg-[#F2E9D8]/60" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="min-w-0 space-y-5">
              {/* Direction + view toggle row */}
              <Reveal>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge tone="gold">{state.directionName || "No direction yet"}</Badge>
                    {state.completedLoopCount > 0 && <Badge tone="green">Loop complete</Badge>}
                  </div>
                  <div
                    role="group"
                    aria-label="Progress view"
                    className="flex gap-1 rounded-full border border-[#EFE7D8] bg-[#FFFDF8] p-1 shadow-[0_6px_16px_rgba(71,52,18,0.06)]"
                  >
                    {(["map", "list"] as const).map((m) => {
                      return (
                        <button
                          key={m}
                          aria-pressed={mode === m}
                          type="button"
                          onClick={() => switchMode(m)}
                          className={`relative inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40 ${mode === m ? "text-[#7A5300]" : "text-[#8D877F] hover:text-[#111111]"}`}
                        >
                          {mode === m && (
                            <motion.span
                              layoutId="constellation-mode-pill"
                              className="absolute inset-0 rounded-full bg-[#FFF1C7]"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10 inline-flex items-center gap-1.5">
                            {m === "map" ? <Sparkles size={13} /> : <List size={13} />}
                            {m === "map" ? "Constellation" : "List"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Reveal>

              {/* Viewport */}
              {showMap ? (
                <ConstellationErrorBoundary
                  key={mapAttempt}
                  onFallback={onMapFallback}
                  fallback={<ConstellationListView state={state} onOpenNode={openNode} onApplyOpen={openApply} />}
                >
                  <ConstellationMap
                    state={state}
                    selectedKey={selectedKey}
                    onSelect={openNode}
                    onNodeFocused={onNodeFocused}
                    onZoomUsed={() => {
                      if (!zoomLogged.current) {
                        zoomLogged.current = true;
                        logEvent("constellation_zoom_used");
                      }
                    }}
                    onResetView={() => logEvent("constellation_reset_view")}
                  />
                </ConstellationErrorBoundary>
              ) : (
                <ConstellationListView state={state} onOpenNode={openNode} onApplyOpen={openApply} />
              )}

              {/* Recommended next action */}
              {nextNode?.nextActionLabel && (
                <Reveal delay={0.05}>
                  <div className="relative rounded-[24px] border border-[#F6E7C8] bg-gradient-to-br from-[#FFF1C7] to-[#FFFDF8] p-5 shadow-[0_2px_4px_rgba(71,52,18,0.06),0_14px_34px_rgba(71,52,18,0.12)]">
                    <div aria-hidden className="mk-breathe pointer-events-none absolute -inset-3 -z-10 rounded-[30px] bg-[radial-gradient(60%_70%_at_50%_20%,rgba(242,169,0,0.10),transparent_75%)]" />
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#B07A00]">Recommended next step</p>
                    <div className="mt-2 flex items-center gap-3">
                      {(() => {
                        const Icon = NODE_ICONS[state.recommendedNode];
                        return (
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#FFB000] to-[#F2A900] text-white shadow-[0_8px_18px_rgba(242,169,0,0.30)]">
                            <Icon size={20} strokeWidth={2.2} />
                          </span>
                        );
                      })()}
                      <div className="min-w-0">
                        <p className="font-display text-lg font-bold leading-tight text-[#111111]">{nextNode.nextActionLabel}</p>
                        <p className="mt-0.5 text-sm leading-5 text-[#6E6E6E]">{nextNode.explanation.split(". ")[0]}.</p>
                      </div>
                    </div>
                    {state.recommendedNode === "apply" ? (
                      <button
                        type="button"
                        onClick={() => {
                          onNextAction(state.recommendedNode);
                          openApply();
                        }}
                        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FFB000] to-[#F2A900] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(242,169,0,0.32)] transition-transform duration-200 hover:-translate-y-px active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
                      >
                        {nextNode.nextActionLabel} <ArrowRight size={16} />
                      </button>
                    ) : nextNode.nextActionHref ? (
                      <Link
                        href={nextNode.nextActionHref}
                        onClick={() => onNextAction(state.recommendedNode)}
                        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FFB000] to-[#F2A900] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(242,169,0,0.32)] transition-transform duration-200 hover:-translate-y-px active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
                      >
                        {nextNode.nextActionLabel} <ArrowRight size={16} />
                      </Link>
                    ) : null}
                  </div>
                </Reveal>
              )}

              {/* How it works — mobile & tablet (desktop shows it in the inspector). */}
              <Card className="p-5 lg:hidden">
                <HowToReadCard />
              </Card>

              {/* Recent evidence */}
              {recentEvidence.length > 0 && (
                <section className="space-y-3">
                  <SectionLabel title="Recent evidence" />
                  <Card className="divide-y divide-[#EFE7D8] p-2">
                    {recentEvidence.map((e) => {
                      const Icon = NODE_ICONS[e.nodeKey];
                      const inner = (
                        <span className="flex items-center gap-3 px-3 py-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFF1C7] text-[#B07A00]">
                            <Icon size={16} strokeWidth={2.2} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-[#111111]">{e.title}</span>
                            <span className="block text-[11px] font-bold text-[#9B958B]">
                              {new Date(e.occurredAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </span>
                          {e.href && <ArrowRight size={15} className="shrink-0 text-[#B07A00]" />}
                        </span>
                      );
                      return e.href ? (
                        <Link key={`${e.nodeKey}-${e.id}`} href={e.href} className="block rounded-2xl transition-colors hover:bg-[#FFF8EE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40">
                          {inner}
                        </Link>
                      ) : (
                        <div key={`${e.nodeKey}-${e.id}`}>{inner}</div>
                      );
                    })}
                  </Card>
                </section>
              )}
            </div>

            {/* Desktop inspector column */}
            {isDesktop && (
              <div className="sticky top-6 hidden lg:block">
                <ConstellationDetailPanel
                  node={selectedNode}
                  isRecommended={selectedKey === state.recommendedNode}
                  onClose={closeAndRefocus}
                  onNextAction={() => selectedKey && onNextAction(selectedKey)}
                  onOpenApply={openApply}
                  emptyContent={<HowToReadCard />}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile node detail sheet */}
      {!isDesktop && state && (
        <ConstellationDetailSheet
          node={selectedNode}
          isRecommended={selectedKey === state.recommendedNode}
          onClose={closeAndRefocus}
          onNextAction={() => selectedKey && onNextAction(selectedKey)}
          onOpenApply={openApply}
        />
      )}

      <ApplyFeedbackSheet
        open={applyOpen}
        targets={applyTargets}
        applicationsAvailable={applicationsAvailable}
        onClose={() => setApplyOpen(false)}
        onPlan={planApplication}
        onAdvance={advanceApplication}
      />
    </AppShell>
  );
}
