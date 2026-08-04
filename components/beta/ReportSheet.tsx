"use client";

import { useState } from "react";
import { REPORT_REASONS, type ReportReason, type ReportTargetType } from "@/lib/moderation";
import { useBetaApp } from "./AppStateProvider";

/** Calm, beginner-safe reporting sheet for a proof or feedback note. All
 *  enforcement is server-side; this just collects a reason + optional note. */
export function ReportSheet({
  targetType,
  targetId,
  onClose,
}: {
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
}) {
  const { reportContent } = useBetaApp();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!reason) return;
    setBusy(true);
    setError(null);
    const res = await reportContent(targetType, targetId, reason, detail);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  const label = targetType === "proof" ? "proof" : "feedback note";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Report this ${label}`}>
      <div className="w-full max-w-[430px] rounded-t-[24px] bg-[var(--surface,#FFFDF8)] p-5 shadow-[0_-8px_40px_rgba(71,52,18,0.18)] sm:rounded-[24px]">
        {done ? (
          <div className="py-4 text-center">
            <p className="text-body font-semibold text-content">Thanks — our team will review this.</p>
            <p className="mt-1 text-body text-muted">You won&rsquo;t hear back on every report, but every one helps keep this space safe.</p>
            <button type="button" onClick={onClose} className="mt-4 w-full rounded-full bg-content px-4 py-3 text-body font-semibold text-white">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-body font-semibold text-content">Report this {label}</h2>
                <p className="mt-0.5 text-body text-muted">Reports are private. Pick the closest reason.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-full px-2 py-1 text-body font-medium text-muted hover:text-content">Cancel</button>
            </div>

            <div className="mt-4 space-y-1.5">
              {REPORT_REASONS.map((r) => {
                const active = reason === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setReason(r.id)}
                    aria-pressed={active}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-accent bg-surface-soft" : "border-line bg-surface"}`}
                  >
                    <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${active ? "border-accent bg-accent" : "border-subtle"}`}>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-body font-semibold text-content">{r.label}</span>
                      <span className="block text-caption text-muted">{r.help}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value.slice(0, 500))}
              placeholder="Add a note (optional)"
              className="mt-3 min-h-16 w-full rounded-2xl border border-line bg-bg p-3 text-body text-content placeholder:text-muted"
            />
            {error && <p className="mt-2 text-body font-medium text-danger-text">{error}</p>}

            <button
              type="button"
              disabled={!reason || busy}
              onClick={submit}
              className="mt-3 w-full rounded-full bg-accent px-4 py-3 text-body font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Sending…" : "Send report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
