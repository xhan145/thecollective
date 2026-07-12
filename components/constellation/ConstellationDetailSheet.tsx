"use client";

// Node detail surface. One content component, two frames:
//   <lg  → modal bottom sheet (ReportSheet lineage + drag handle, Escape,
//          focus trap, safe-area padding, AnimatePresence rise)
//   lg+  → anchored inspector card in the page's right column (non-modal,
//          the constellation stays fully visible — spec: never obscure it)
//
// Focus contract: opening moves focus to the sheet; Escape or Close returns
// it to the node button that opened it (handled by the parent via data-node).

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Badge, Button, ButtonLink } from "@/components/beta/ui";
import type { ConstellationNode, ConstellationNodeKey } from "@/lib/constellation/types";
import { NODE_ICONS, STATUS_LABELS } from "./ConstellationNodeButton";
import { useMotionAllowed } from "./useMotionAllowed";

const NODE_PURPOSE: Record<ConstellationNodeKey, string> = {
  practice: "Small, low-pressure reps. Every loop starts here.",
  prove: "A real attempt, captured while it's fresh.",
  feedback: "One kind, specific response from another member.",
  apply: "Where feedback turns into your next attempt.",
  contribute: "Your practice becoming useful to someone else."
};

const HISTORY_HREF: Record<ConstellationNodeKey, string | null> = {
  practice: "/practice",
  prove: "/passport?tab=proof",
  feedback: "/feedback",
  apply: null,
  contribute: "/feedback"
};

function statusTone(status: ConstellationNode["status"]): "gold" | "green" | "muted" {
  if (status === "completed") return "green";
  if (status === "locked") return "muted";
  return "gold";
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NodeDetailContent({
  node,
  isRecommended,
  onNextAction,
  onOpenApply,
  onClose
}: {
  node: ConstellationNode;
  isRecommended: boolean;
  onNextAction: () => void;
  onOpenApply: () => void;
  onClose: () => void;
}) {
  const Icon = NODE_ICONS[node.key];
  const history = HISTORY_HREF[node.key];
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${node.status === "completed" ? "bg-[#FFF1C7] text-[#7A5300]" : node.status === "locked" ? "bg-[#FFF8EE] text-[#9B958B]" : "bg-gradient-to-br from-[#FFB000] to-[#F2A900] text-white"}`}
          >
            <Icon size={22} strokeWidth={2.2} />
          </span>
          <div>
            <h2 id="constellation-detail-title" className="font-display text-xl font-bold leading-tight text-[#111111]">
              {node.label}
            </h2>
            <p className="mt-0.5 text-xs font-bold text-[#9B958B]">{NODE_PURPOSE[node.key]}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#9B958B] transition-colors hover:bg-[#FFF8EE] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(node.status)}>{STATUS_LABELS[node.status]}</Badge>
        {/* "active" already reads "Next step" — don't double-badge it. */}
        {isRecommended && node.status !== "active" && <Badge tone="gold">Recommended next</Badge>}
        {node.evidenceCount > 0 && (
          <span className="text-xs font-bold text-[#6E6E6E]">
            {node.evidenceCount} piece{node.evidenceCount === 1 ? "" : "s"} of evidence
          </span>
        )}
        {node.completedAt && <span className="text-xs font-bold text-[#9B958B]">since {formatWhen(node.completedAt)}</span>}
      </div>

      <p className="mt-3 text-sm leading-6 text-[#38322A]">{node.explanation}</p>

      {node.evidence.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#9B958B]">What backs this up</p>
          <ul className="mt-2 space-y-1.5">
            {node.evidence.map((e) => {
              const row = (
                <span className="flex min-w-0 items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#111111]">{e.title}</span>
                    <span className="block text-[11px] font-bold text-[#9B958B]">{formatWhen(e.occurredAt)}</span>
                  </span>
                  {e.href && <ArrowRight size={15} className="shrink-0 text-[#B07A00]" />}
                </span>
              );
              return (
                <li key={e.id}>
                  {e.href ? (
                    <Link
                      href={e.href}
                      className="block rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] px-3.5 py-2.5 transition-colors duration-150 hover:border-[#F2A900]/50 hover:bg-[#FFF1C7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
                    >
                      {row}
                    </Link>
                  ) : (
                    <span className="block rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] px-3.5 py-2.5">{row}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {(node.nextActionLabel || history) && (
        <div className="mt-5 space-y-2">
          {node.nextActionLabel &&
            (node.key === "apply" ? (
              <Button className="w-full" onClick={() => { onNextAction(); onOpenApply(); }}>
                {node.nextActionLabel}
              </Button>
            ) : node.nextActionHref ? (
              <ButtonLink href={node.nextActionHref} className="w-full" onClick={onNextAction}>
                {node.nextActionLabel}
              </ButtonLink>
            ) : null)}
          {history && (
            <ButtonLink href={history} variant="secondary" className="w-full">
              View history
            </ButtonLink>
          )}
        </div>
      )}
    </div>
  );
}

/** Simple focus trap: keep Tab inside the dialog, Escape closes. */
function useDialogFocus(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>('button, [href], textarea, input, [tabindex]:not([tabindex="-1"])')
      ).filter((n) => !n.hasAttribute("disabled"));
    focusables()[0]?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);
  return ref;
}

export function ConstellationDetailSheet({
  node,
  isRecommended,
  onClose,
  onNextAction,
  onOpenApply
}: {
  node: ConstellationNode | null;
  isRecommended: boolean;
  onClose: () => void;
  onNextAction: () => void;
  onOpenApply: () => void;
}) {
  const motionAllowed = useMotionAllowed();
  const dialogRef = useDialogFocus(node !== null, onClose);
  // Portal to <body>: the page content lives in a `relative z-[1]` wrapper,
  // so a fixed overlay rendered in place would stack UNDER the bottom nav.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {node && (
        <motion.div
          key="constellation-sheet"
          initial={motionAllowed ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: motionAllowed ? 0.18 : 0 } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="constellation-detail-title"
            initial={motionAllowed ? { y: 24, opacity: 0 } : { y: 0, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={motionAllowed ? { y: 24, opacity: 0, transition: { duration: 0.18 } } : { opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[86vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-[#FFFDF8] p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_40px_rgba(71,52,18,0.18)]"
          >
            <div aria-hidden className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#EFE7D8]" />
            <NodeDetailContent
              node={node}
              isRecommended={isRecommended}
              onNextAction={onNextAction}
              onOpenApply={onOpenApply}
              onClose={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Desktop inspector — lives in the page's right column; not a modal. */
export function ConstellationDetailPanel({
  node,
  isRecommended,
  onClose,
  onNextAction,
  onOpenApply,
  emptyContent
}: {
  node: ConstellationNode | null;
  isRecommended: boolean;
  onClose: () => void;
  onNextAction: () => void;
  onOpenApply: () => void;
  emptyContent: ReactNode;
}) {
  const motionAllowed = useMotionAllowed();
  return (
    <div className="rounded-[22px] border border-[#EFE7D8] bg-[#FFFDF8] p-5 shadow-[0_1px_2px_rgba(71,52,18,0.06),0_10px_30px_rgba(71,52,18,0.08)]">
      <AnimatePresence mode="wait" initial={false}>
        {node ? (
          <motion.div
            key={node.key}
            initial={motionAllowed ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={motionAllowed ? { opacity: 0, y: -8, transition: { duration: 0.15 } } : undefined}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <NodeDetailContent
              node={node}
              isRecommended={isRecommended}
              onNextAction={onNextAction}
              onOpenApply={onOpenApply}
              onClose={onClose}
            />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={motionAllowed ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {emptyContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
