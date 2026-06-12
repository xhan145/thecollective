"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitBetaFeedback, type BetaFeedbackState } from "@/lib/actions";
import { TextField } from "./ui";

const RATINGS = [
  { key: "would_use_again", label: "I would use this again" },
  { key: "maybe", label: "Maybe" },
  { key: "not_yet", label: "Not yet" },
];

export function BetaFeedbackForm() {
  const [state, formAction, pending] = useActionState<BetaFeedbackState, FormData>(
    submitBetaFeedback,
    { error: null },
  );
  const [rating, setRating] = useState("would_use_again");
  const [fileName, setFileName] = useState<string | null>(null);

  if (state.done) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-2xl font-bold text-ink">Thank you.</p>
        <p className="max-w-[280px] text-muted">
          Your feedback directly shapes what we build next.
        </p>
        <Link
          href="/home"
          className="mt-2 rounded-2xl bg-goldBright px-8 py-3 font-bold text-white shadow-warm"
        >
          Back home
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="reuse_rating" value={rating} />
      <TextField label="What felt useful?" name="useful" multiline rows={2} />
      <TextField label="What felt confusing?" name="confusing" multiline rows={2} />
      <TextField label="What felt unnecessary?" name="unnecessary" multiline rows={2} />
      <TextField label="What should we build next?" name="build_next" multiline rows={2} />

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-ink">
          Would you use Collective again?
        </span>
        <div className="flex flex-col gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRating(r.key)}
              className={`rounded-2xl border px-4 py-2.5 text-left text-sm font-semibold ${
                rating === r.key
                  ? "border-gold bg-soft text-ink"
                  : "border-line bg-card text-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">
          Screenshot (optional)
        </span>
        <div className="rounded-2xl border border-dashed border-line bg-card p-4 text-center">
          <input
            type="file"
            name="screenshot"
            accept="image/*"
            className="hidden"
            id="beta-screenshot"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <label
            htmlFor="beta-screenshot"
            className="cursor-pointer text-sm font-semibold text-gold"
          >
            {fileName ?? "Attach a screenshot"}
          </label>
        </div>
      </label>

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
        {pending ? "Sending…" : "Send beta feedback"}
      </button>
    </form>
  );
}
