"use client";

import { useTransition } from "react";
import { markFeedbackHelpful } from "@/lib/actions";

export function MarkHelpfulButton({ feedbackId }: { feedbackId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => markFeedbackHelpful(feedbackId))}
      className="mt-3 w-full rounded-2xl border border-line bg-card py-2 text-sm font-semibold text-ink disabled:opacity-50"
    >
      {pending ? "Saving…" : "Mark as helpful"}
    </button>
  );
}
