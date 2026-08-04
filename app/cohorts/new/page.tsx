"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import {
  Button,
  Card,
  PageHeader,
  TextArea,
  TextInput,
} from "@/components/beta/ui";
import { canCreateCohort } from "@/lib/cohorts/access";
import type { CohortVisibility } from "@/lib/cohorts/types";

// Small warm accent palette for the picker
const ACCENTS: { key: string; label: string; swatch: string }[] = [
  { key: "gold", label: "Gold", swatch: "bg-gradient-to-br from-surface-soft to-accent-soft" },
  { key: "rose", label: "Rose", swatch: "bg-gradient-to-br from-danger-soft to-danger-soft" },
  { key: "sage", label: "Sage", swatch: "bg-gradient-to-br from-success-soft to-success" },
  { key: "sky", label: "Sky", swatch: "bg-gradient-to-br from-info-soft to-info-soft" },
];

const VISIBILITY_OPTIONS: { value: CohortVisibility; label: string; description: string }[] = [
  { value: "public", label: "Public", description: "Anyone can join" },
  { value: "request", label: "Request to join", description: "Members need your approval" },
  { value: "invite", label: "Invite only", description: "Members join via invite link" },
];

export default function NewCohortPage() {
  const router = useRouter();
  const { currentUser, snapshot, createCohortAction } = useBetaApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [directionId, setDirectionId] = useState("");
  const [visibility, setVisibility] = useState<CohortVisibility>("public");
  const [accent, setAccent] = useState("gold");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: user must be Reliable+ to create a cohort
  if (!canCreateCohort(currentUser)) {
    return (
      <AppShell>
        <div className="space-y-5">
          <PageHeader
            title="Create a cohort"
            subtitle="Bring people together around a shared practice."
          />
          <Card className="p-7 text-center">
            <p className="font-display text-heading text-content">
              Keep going — you&apos;re getting there
            </p>
            <p className="mx-auto mt-3 max-w-[280px] text-body leading-6 text-muted">
              Reach <strong>Reliable</strong> by practicing consistently and giving useful feedback.
              Once you&apos;re there, you can start your own cohort.
            </p>
            <button
              onClick={() => router.back()}
              className="mt-5 text-body font-medium text-accent-text underline-offset-2 hover:underline"
            >
              Back
            </button>
          </Card>
        </div>
      </AppShell>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("A cohort name is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createCohortAction({
        name: trimmedName,
        description: description.trim() || undefined,
        directionId: directionId || undefined,
        visibility,
        accent,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        router.push(`/cohorts/${result.id}`);
      } else {
        // fallback: the new cohort appears under "Your cohorts" on the list page
        router.push("/cohorts");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Create a cohort"
          subtitle="Bring people together around a shared practice."
        />

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="cohort-name"
              className="block text-label text-content"
            >
              Name <span aria-hidden className="text-accent">*</span>
            </label>
            <TextInput
              id="cohort-name"
              placeholder="e.g. Daily Writers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="cohort-desc"
              className="block text-label text-content"
            >
              Description <span className="font-normal text-muted">(optional)</span>
            </label>
            <TextArea
              id="cohort-desc"
              placeholder="What are you all working on together?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={400}
            />
          </div>

          {/* Direction */}
          {snapshot.directions.length > 0 && (
            <div className="space-y-1.5">
              <label
                htmlFor="cohort-direction"
                className="block text-label text-content"
              >
                Direction <span className="font-normal text-muted">(optional)</span>
              </label>
              <select
                id="cohort-direction"
                value={directionId}
                onChange={(e) => setDirectionId(e.target.value)}
                className="min-h-12 w-full rounded-[18px] border border-line bg-surface-input px-4 text-body text-content outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-surface-soft"
              >
                <option value="">No specific direction</option>
                {snapshot.directions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visibility */}
          <div className="space-y-2">
            <p className="block text-label text-content">Who can join?</p>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map(({ value, label, description: desc }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-4 rounded-[18px] border p-4 transition-colors ${
                    visibility === value
                      ? "border-accent bg-bg"
                      : "border-line bg-surface-input"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={value}
                    checked={visibility === value}
                    onChange={() => setVisibility(value)}
                    className="accent-accent"
                  />
                  <span>
                    <span className="block text-body font-semibold text-content">{label}</span>
                    <span className="block text-caption text-muted">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Accent picker */}
          <div className="space-y-2">
            <p className="block text-label text-content">Accent colour</p>
            <div className="flex gap-3">
              {ACCENTS.map(({ key, label, swatch }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccent(key)}
                  aria-label={`${label} accent`}
                  aria-pressed={accent === key}
                  className={`h-10 w-10 rounded-full ${swatch} transition-shadow ${
                    accent === key
                      ? "ring-2 ring-accent ring-offset-2 shadow-[0_0_0_4px_rgba(242,169,0,0.18)]"
                      : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-body text-danger" role="alert">
              {error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !name.trim()}
            className="w-full"
          >
            {submitting ? "Creating…" : "Create cohort"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
