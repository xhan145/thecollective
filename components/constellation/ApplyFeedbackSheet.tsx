"use client";

// "Apply feedback" flow — turn one received response into a plan, then mark
// it practiced / demonstrated. Calm ladder, no scores: planned → practiced →
// demonstrated. Creates the evidence behind the Apply node (migration 050).

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Badge, Button } from "@/components/beta/ui";
import type { ApplyTarget } from "@/lib/constellation/useConstellation";
import type { FeedbackApplicationStatus } from "@/lib/constellation/types";
import { useMotionAllowed } from "./useMotionAllowed";

const STATUS_COPY: Record<FeedbackApplicationStatus, string> = {
  planned: "Planned",
  practiced: "Practiced",
  demonstrated: "Demonstrated"
};

export function ApplyFeedbackSheet({
  open,
  targets,
  applicationsAvailable,
  onClose,
  onPlan,
  onAdvance
}: {
  open: boolean;
  targets: ApplyTarget[];
  applicationsAvailable: boolean;
  onClose: () => void;
  onPlan: (feedbackId: string, reflection: string | null) => Promise<{ error: string | null }>;
  onAdvance: (applicationId: string, status: FeedbackApplicationStatus) => Promise<{ error: string | null }>;
}) {
  const motionAllowed = useMotionAllowed();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setReflection("");
      setError(null);
      setConfirmation(null);
      return;
    }
    const el = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('button, [href], textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter(
        (n) => !n.hasAttribute("disabled")
      );
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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

  const selected = targets.find((t) => t.feedbackId === selectedId) ?? null;

  // Portal to <body> — same stacking-context escape as the detail sheet.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function plan() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const res = await onPlan(selected.feedbackId, reflection.trim() || null);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setConfirmation("Planned. Use it in your next practice — then mark it practiced.");
  }

  async function advance(applicationId: string, status: FeedbackApplicationStatus) {
    setBusy(true);
    setError(null);
    const res = await onAdvance(applicationId, status);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setConfirmation(
      status === "practiced"
        ? "Marked practiced. The Apply step is now part of your constellation."
        : "Marked demonstrated. Feedback, made visible in your work."
    );
  }

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="apply-sheet"
          initial={motionAllowed ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: motionAllowed ? 0.18 : 0 } }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Apply feedback"
            initial={motionAllowed ? { y: 24, opacity: 0 } : { y: 0, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={motionAllowed ? { y: 24, opacity: 0, transition: { duration: 0.18 } } : { opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[86vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-[#FFFDF8] p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_40px_rgba(71,52,18,0.18)] sm:rounded-[28px]"
          >
            <div aria-hidden className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#EFE7D8] sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-[#111111]">Apply feedback</h2>
                <p className="mt-0.5 text-sm text-[#6E6E6E]">Choose one suggestion to use in another practice.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#9B958B] transition-colors hover:bg-[#FFF8EE] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
              >
                <X size={18} />
              </button>
            </div>

            {confirmation ? (
              <div className="py-6 text-center">
                <motion.div
                  className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FFF1C7] text-[#F2A900]"
                  initial={motionAllowed ? { scale: 0.6, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                >
                  <Check size={28} strokeWidth={2.6} />
                </motion.div>
                <p className="mt-4 text-base font-extrabold text-[#111111]">{confirmation}</p>
                <Button className="mt-5 w-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            ) : !applicationsAvailable ? (
              <p className="mt-4 rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] p-4 text-sm leading-6 text-[#6E6E6E]">
                Applying feedback is almost ready — this part of the beta is still being switched on. Your feedback is safe;
                check back soon.
              </p>
            ) : targets.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] p-4 text-sm leading-6 text-[#6E6E6E]">
                No feedback to apply yet. When a member responds to one of your proofs, it will appear here.
              </p>
            ) : (
              <>
                <div className="mt-4 space-y-2" role="radiogroup" aria-label="Feedback to apply">
                  {targets.map((t) => {
                    const active = selectedId === t.feedbackId;
                    return (
                      <button
                        key={t.feedbackId}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelectedId(t.feedbackId)}
                        className={`w-full rounded-2xl border p-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2A900]/40 ${active ? "border-[#F2A900] bg-[#FFF1C7]" : "border-[#EFE7D8] bg-[#FFFDF8] hover:border-[#F2A900]/40"}`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#7A5300]">
                            {t.authorName} · on “{t.proofTitle}”
                          </span>
                          {t.application && <Badge tone="gold">{STATUS_COPY[t.application.status]}</Badge>}
                        </span>
                        <span className="mt-1 line-clamp-3 block text-sm leading-6 text-[#38322A]">{t.body}</span>
                      </button>
                    );
                  })}
                </div>

                {selected && !selected.application && (
                  <>
                    <label htmlFor="apply-reflection" className="mt-4 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#9B958B]">
                      What will you try? (optional)
                    </label>
                    <textarea
                      id="apply-reflection"
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value.slice(0, 400))}
                      placeholder="One sentence is plenty."
                      className="mt-2 min-h-20 w-full rounded-2xl border border-[#EFE7D8] bg-[#FFF8EE] p-3 text-sm leading-6 text-[#111111] outline-none transition placeholder:text-[#9B958B] focus:border-[#F2A900] focus:ring-4 focus:ring-[#FFF1C7]"
                    />
                  </>
                )}

                {error && <p className="mt-2 text-sm font-bold text-[#B4443F]">{error}</p>}

                {/* One footer action, driven by where the selected feedback is
                    on its ladder: plan → practiced → demonstrated. */}
                {selected?.application ? (
                  selected.application.status === "demonstrated" ? (
                    <Button className="mt-4 w-full" disabled>
                      Demonstrated — complete
                    </Button>
                  ) : (
                    <Button
                      className="mt-4 w-full"
                      disabled={busy}
                      onClick={() =>
                        void advance(
                          selected.application!.id,
                          selected.application!.status === "planned" ? "practiced" : "demonstrated"
                        )
                      }
                    >
                      {busy ? "Saving…" : selected.application.status === "planned" ? "Mark practiced" : "Mark demonstrated"}
                    </Button>
                  )
                ) : (
                  <Button className="mt-4 w-full" disabled={!selected || busy} onClick={plan}>
                    {busy ? "Saving…" : "Plan to apply this"}
                  </Button>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
