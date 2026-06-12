"use client";

import { useState } from "react";
import type { AiMode } from "@/lib/ai/reflect";

export function AIReflectionPanel({
  mode,
  input,
  buttonLabel,
  proofId,
  onResult,
}: {
  mode: AiMode;
  input: string;
  buttonLabel: string;
  proofId?: string;
  onResult?: (output: string) => void;
}) {
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input, proofId }),
      });
      if (!res.ok) throw new Error("Request failed");
      const json = (await res.json()) as { output: string };
      setOutput(json.output);
      onResult?.(json.output);
    } catch {
      setError("Could not reach the helper right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-card bg-soft p-4">
      <p className="text-xs text-muted">
        AI can help you reflect. It does not judge your progress.
      </p>
      {output ? (
        <p className="mt-2 whitespace-pre-line text-sm text-ink">{output}</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="mt-3 w-full rounded-2xl border border-gold bg-card py-2.5 text-sm font-bold text-goldDeep disabled:opacity-50"
      >
        {loading ? "Thinking…" : output ? "Ask again" : buttonLabel}
      </button>
    </div>
  );
}
