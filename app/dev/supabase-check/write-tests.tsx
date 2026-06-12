"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PROOF_BUCKET } from "@/lib/supabase/storage";

type Status = "ok" | "needs_setup" | "sign_in" | "error";

interface TestResult {
  label: string;
  status: Status;
  detail: string;
  fix?: string;
}

const statusLabel: Record<Status, string> = {
  ok: "OK",
  needs_setup: "Needs setup",
  sign_in: "Sign in first",
  error: "Error",
};

const statusClass: Record<Status, string> = {
  ok: "bg-success/10 text-success",
  needs_setup: "bg-gold/15 text-goldDeep",
  sign_in: "bg-soft text-goldDeep",
  error: "bg-danger/10 text-danger",
};

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Unknown error";
}

function ResultBox({ result }: { result: TestResult }) {
  return (
    <div className="rounded-card bg-card p-3 shadow-warm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{result.label}</p>
          <p className="mt-0.5 text-xs text-muted">{result.detail}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass[result.status]}`}
        >
          {statusLabel[result.status]}
        </span>
      </div>
      {result.fix ? (
        <p className="mt-2 rounded-xl bg-soft px-3 py-2 text-xs text-ink">
          Fix: {result.fix}
        </p>
      ) : null}
    </div>
  );
}

export function DevWriteTests({
  betaFeedbackReady,
  proofMediaReady,
}: {
  betaFeedbackReady: boolean;
  proofMediaReady: boolean;
}) {
  const [result, setResult] = useState<TestResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function getSignedInUser() {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return { supabase, user: null, error };
    }

    return { supabase, user, error: null };
  }

  async function testBetaFeedbackWrite() {
    setBusy(true);
    setResult(null);
    try {
      if (!betaFeedbackReady) {
        setResult({
          label: "Beta feedback write test",
          status: "needs_setup",
          detail: "The beta_feedback table is not ready yet.",
          fix: "Run the schema and RLS migrations, then refresh this page.",
        });
        return;
      }

      const { supabase, user, error } = await getSignedInUser();
      if (error) throw error;
      if (!user) {
        setResult({
          label: "Beta feedback write test",
          status: "sign_in",
          detail: "No signed-in tester in this browser.",
          fix: "Sign in, then try the write test again.",
        });
        return;
      }

      const { error: insertError } = await supabase.from("beta_feedback").insert({
        user_id: user.id,
        useful: "dev supabase-check test row",
        reuse_rating: "maybe",
      });

      if (insertError) throw insertError;

      setResult({
        label: "Beta feedback write test",
        status: "ok",
        detail: "Inserted one harmless dev-check row for the signed-in user.",
      });
    } catch (error) {
      setResult({
        label: "Beta feedback write test",
        status: "error",
        detail: messageFromError(error),
        fix: "Check the beta_feedback table, insert policy, and signed-in user.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function testProofMediaUpload() {
    setBusy(true);
    setResult(null);
    try {
      if (!proofMediaReady) {
        setResult({
          label: "Proof media upload test",
          status: "needs_setup",
          detail: `${PROOF_BUCKET} is not ready yet.`,
          fix: "Run the storage migration, then refresh this page.",
        });
        return;
      }

      const { supabase, user, error } = await getSignedInUser();
      if (error) throw error;
      if (!user) {
        setResult({
          label: "Proof media upload test",
          status: "sign_in",
          detail: "No signed-in tester in this browser.",
          fix: "Sign in, then try the upload test again.",
        });
        return;
      }

      const path = `${user.id}/dev-check/${Date.now()}-proof-media-check.txt`;
      const blob = new Blob(["collective proof media dev check"], {
        type: "text/plain",
      });
      const { error: uploadError } = await supabase.storage
        .from(PROOF_BUCKET)
        .upload(path, blob, {
          contentType: "text/plain",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: removeError } = await supabase.storage
        .from(PROOF_BUCKET)
        .remove([path]);

      if (removeError) {
        setResult({
          label: "Proof media upload test",
          status: "error",
          detail: `Upload worked, but cleanup failed: ${removeError.message}`,
          fix: "Run the storage delete policy, then remove the dev-check file if needed.",
        });
        return;
      }

      setResult({
        label: "Proof media upload test",
        status: "ok",
        detail: "Uploaded and cleaned up a tiny text file in the signed-in user's folder.",
      });
    } catch (error) {
      setResult({
        label: "Proof media upload test",
        status: "error",
        detail: messageFromError(error),
        fix: "Check the proof-media bucket and storage policies.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <button
        type="button"
        onClick={testBetaFeedbackWrite}
        disabled={busy}
        className="rounded-2xl border border-line bg-card py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
      >
        Test beta feedback write
      </button>
      <button
        type="button"
        onClick={testProofMediaUpload}
        disabled={busy}
        className="rounded-2xl border border-line bg-card py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
      >
        Test proof media upload
      </button>
      {result ? <ResultBox result={result} /> : null}
    </div>
  );
}
