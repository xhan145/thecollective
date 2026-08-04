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
      <p className="text-caption leading-5 text-muted">
        Complete this practice to share a tip with others.
      </p>
    );
  }

  if (done) {
    return (
      <p className="rounded-[18px] bg-success-soft px-4 py-3 text-body font-semibold text-success-text">
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
      <p className="text-body font-semibold text-content">Share a tip</p>
      <p className="text-caption leading-5 text-muted">
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
          className={`absolute bottom-3 right-3 text-overline font-medium ${overLimit ? "text-red-500" : remaining <= 40 ? "text-muted" : "text-transparent"}`}
          aria-live="polite"
        >
          {remaining}
        </span>
      </div>
      {error && (
        <p className="text-caption text-muted">{error}</p>
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
