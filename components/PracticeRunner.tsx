"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { logPractice } from "@/lib/actions";
import type { Practice } from "@/lib/types";
import { AIReflectionPanel } from "./AIReflectionPanel";

export function PracticeRunner({
  practice,
  remixProofId,
}: {
  practice: Practice;
  remixProofId: string | null;
}) {
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);
  const [savedForLater, setSavedForLater] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  function complete() {
    startTransition(async () => {
      const result = await logPractice(practice.id, "completed", remixProofId);
      setLogId(result.logId ?? "logged");
    });
  }

  function saveForLater() {
    startTransition(async () => {
      await logPractice(practice.id, "saved_for_later", null);
      setSavedForLater(true);
    });
  }

  // ---- Practice complete sheet ----
  if (logId) {
    return (
      <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30">
        <div
          className="w-full max-w-[480px] rounded-t-sheet bg-card p-6 pb-10 shadow-warmLg"
          style={{ paddingBottom: "calc(2.5rem + var(--safe-bottom))" }}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
          <p className="text-center text-2xl font-bold text-ink">Practice logged.</p>
          <p className="mt-1 text-center text-muted">Small steps count.</p>
          <p className="mt-4 rounded-2xl bg-soft px-4 py-3 text-center text-sm text-ink">
            {practice.title}
          </p>
          <Link
            href={`/proof/new?practice=${practice.id}&log=${logId}`}
            className="mt-5 block rounded-2xl bg-goldBright py-3.5 text-center font-bold text-white shadow-warm"
          >
            Submit proof
          </Link>
          <Link
            href="/home"
            className="mt-2 block rounded-2xl py-3 text-center font-semibold text-muted"
          >
            Skip for now
          </Link>
        </div>
      </div>
    );
  }

  if (savedForLater) {
    return (
      <div className="rounded-card bg-soft p-5 text-center">
        <p className="font-bold text-ink">Saved for later.</p>
        <p className="mt-1 text-sm text-muted">It will be here when you are ready.</p>
        <Link href="/home" className="mt-3 block font-semibold text-gold">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Timer */}
      <div className="flex flex-col items-center gap-3 rounded-card bg-card p-6 shadow-warm">
        <p
          className="text-5xl font-bold tabular-nums text-ink"
          aria-live="polite"
        >
          0:{String(seconds).padStart(2, "0")}
        </p>
        {!running && seconds === 60 ? (
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="w-full rounded-2xl bg-goldBright py-3 font-bold text-white"
          >
            Start 60-second timer
          </button>
        ) : running ? (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="w-full rounded-2xl border border-line bg-card py-3 font-semibold text-ink"
          >
            Pause
          </button>
        ) : (
          <p className="text-sm text-muted">
            {seconds === 0 ? "Time. Nice work showing up." : "Paused"}
          </p>
        )}
      </div>

      <AIReflectionPanel
        mode="practice_coach"
        buttonLabel="Help me prepare"
        input={`Practice: ${practice.title}. Prompt: ${practice.prompt}`}
      />

      <button
        type="button"
        onClick={complete}
        disabled={pending}
        className="rounded-2xl bg-goldBright py-3.5 font-bold text-white shadow-warm disabled:opacity-50"
      >
        {pending ? "Logging…" : "I practiced"}
      </button>
      <button
        type="button"
        onClick={saveForLater}
        disabled={pending}
        className="rounded-2xl border border-line bg-card py-3 font-semibold text-ink disabled:opacity-50"
      >
        Save for later
      </button>
    </div>
  );
}
