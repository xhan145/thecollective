"use client";

import { useActionState, useState } from "react";
import { submitProof, type SubmitProofState } from "@/lib/actions";
import type { ProofType } from "@/lib/types";
import { TextField } from "./ui";

const TYPES: { key: ProofType; label: string }[] = [
  { key: "text", label: "Text" },
  { key: "image", label: "Image" },
  { key: "video", label: "Video" },
  { key: "audio", label: "Audio" },
  { key: "link", label: "Link" },
];

const ACCEPT: Record<string, string> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
};

export function SubmitProofForm({
  practiceId,
  practiceLogId,
  practiceTitle,
}: {
  practiceId?: string | null;
  practiceLogId?: string | null;
  practiceTitle?: string | null;
}) {
  const [state, formAction, pending] = useActionState<SubmitProofState, FormData>(
    submitProof,
    { error: null },
  );
  const [proofType, setProofType] = useState<ProofType>("text");
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="practice_id" value={practiceId ?? ""} />
      <input type="hidden" name="practice_log_id" value={practiceLogId ?? ""} />
      <input type="hidden" name="proof_type" value={proofType} />

      <TextField
        label="What did you practice?"
        name="title"
        required
        placeholder={practiceTitle ?? "One small step you took"}
        defaultValue={practiceTitle ?? ""}
      />
      <TextField
        label="What proof are you sharing?"
        name="body"
        multiline
        required
        rows={4}
        placeholder="Show what you practiced. It does not need to be perfect."
      />
      <TextField
        label="What kind of feedback would help?"
        name="feedback_request"
        placeholder="Optional — e.g. was my main point clear?"
      />

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-ink">Proof type</span>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setProofType(t.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                proofType === t.key
                  ? "border-gold bg-soft text-ink"
                  : "border-line bg-card text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {proofType === "link" ? (
        <TextField label="Link" name="link_url" type="url" placeholder="https://…" />
      ) : null}

      {proofType !== "text" && proofType !== "link" ? (
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">
            Attach {proofType}
          </span>
          <div className="rounded-2xl border border-dashed border-line bg-card p-4 text-center">
            <input
              type="file"
              name="media"
              accept={ACCEPT[proofType]}
              className="hidden"
              id="media-input"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            <label
              htmlFor="media-input"
              className="cursor-pointer text-sm font-semibold text-gold"
            >
              {fileName ?? `Choose a ${proofType} file`}
            </label>
            <p className="mt-1 text-xs text-muted">Up to 50 MB · shared only with the closed beta group</p>
          </div>
        </label>
      ) : null}

      <p className="text-xs text-muted">
        Visible only to the closed beta group. Not public.
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
        {pending ? "Saving…" : "Submit proof"}
      </button>
    </form>
  );
}
