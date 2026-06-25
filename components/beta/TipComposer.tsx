"use client";

import { useState } from "react";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Button, Card, TextArea } from "@/components/beta/ui";

const MAX_CHARS = 280;

export function TipComposer({ promptId, canShare }: { promptId: string; canShare: boolean }) {
  const { submitTip } = useBetaApp();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!canShare) {
    // Calm hint — no pressure
    return (
      <p className="text-xs leading-5 text-[#9B958B]">
        Complete this practice to share a tip with others.
      </p>
    );
  }

  if (done) {
    return (
      <p className="rounded-[18px] bg-[#E8F8EE] px-4 py-3 text-sm font-extrabold text-[#17743B]">
        Thanks — your tip was shared.
      </p>
    );
  }

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    const { error: submitError } = await submitTip(promptId, trimmed);
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
    } else {
      setBody("");
      setDone(true);
    }
  }

  const remaining = MAX_CHARS - body.length;
  const overLimit = remaining < 0;

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-extrabold text-[#111111]">Share a tip</p>
      <p className="text-xs leading-5 text-[#6E6E6E]">
        One concrete thing that helped — no pressure to be perfect.
      </p>
      <div className="relative">
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_CHARS + 20))}
          placeholder="What helped you with this practice…"
          rows={3}
          maxLength={MAX_CHARS + 20}
          className={overLimit ? "border-red-300 focus:border-red-400" : ""}
          aria-label="Tip body"
        />
        <span
          className={`absolute bottom-3 right-3 text-[10px] font-bold ${overLimit ? "text-red-500" : remaining <= 40 ? "text-[#9B958B]" : "text-transparent"}`}
          aria-live="polite"
        >
          {remaining}
        </span>
      </div>
      {error && (
        <p className="text-xs text-[#9B958B]">{error}</p>
      )}
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting || !body.trim() || overLimit}
      >
        {submitting ? "Sharing…" : "Share tip"}
      </Button>
    </Card>
  );
}
