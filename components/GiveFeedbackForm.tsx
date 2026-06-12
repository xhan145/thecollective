"use client";

import { useActionState, useRef, useState } from "react";
import { giveFeedback, type GiveFeedbackState } from "@/lib/actions";

export function GiveFeedbackForm({
  proofId,
  proofBody,
}: {
  proofId: string;
  proofBody: string;
}) {
  const [state, formAction, pending] = useActionState<GiveFeedbackState, FormData>(
    giveFeedback,
    { error: null },
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [aiBusy, setAiBusy] = useState(false);

  async function improveWithAI() {
    const form = formRef.current;
    if (!form) return;
    const draft = [
      `What worked: ${(form.elements.namedItem("what_worked") as HTMLTextAreaElement)?.value ?? ""}`,
      `Could be clearer: ${(form.elements.namedItem("could_be_clearer") as HTMLTextAreaElement)?.value ?? ""}`,
      `Next step: ${(form.elements.namedItem("next_step") as HTMLTextAreaElement)?.value ?? ""}`,
    ].join("\n");
    setAiBusy(true);
    try {
      const res = await fetch("/api/ai/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "feedback_helper",
          input: `Proof:\n${proofBody}\n\nDraft feedback:\n${draft}`,
        }),
      });
      const json = (await res.json()) as { output: string };
      const target = form.elements.namedItem("what_worked") as HTMLTextAreaElement;
      if (target && json.output) target.value = json.output;
    } finally {
      setAiBusy(false);
    }
  }

  const field =
    "w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-ink outline-none focus:border-gold";

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="proof_id" value={proofId} />

      <p className="rounded-2xl bg-soft px-4 py-3 text-sm text-ink">
        Be specific, useful, and kind. Feedback helps someone improve. It does
        not define them.
      </p>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">What worked?</span>
        <textarea name="what_worked" required rows={3} className={field}
          placeholder="Name one thing that landed." />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">What could be clearer?</span>
        <textarea name="could_be_clearer" rows={2} className={field}
          placeholder="Optional — one specific spot." />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">One useful next step</span>
        <textarea name="next_step" rows={2} className={field}
          placeholder="Optional — something small to try next." />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Encouragement</span>
        <textarea name="encouragement" rows={2} className={field}
          placeholder="Optional — a short, genuine note." />
      </label>

      <button
        type="button"
        onClick={improveWithAI}
        disabled={aiBusy}
        className="rounded-2xl border border-gold bg-card py-2.5 text-sm font-bold text-goldDeep disabled:opacity-50"
      >
        {aiBusy ? "Improving…" : "Help me make this more useful"}
      </button>
      <p className="-mt-2 text-center text-xs text-muted">
        AI can help you reflect. It does not judge your progress.
      </p>

      {state.error ? (
        <p className="rounded-2xl bg-soft px-4 py-2 text-sm font-semibold text-danger">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-goldBright py-3.5 font-bold text-white shadow-warm disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
