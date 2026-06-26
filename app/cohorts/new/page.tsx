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
  { key: "gold", label: "Gold", swatch: "bg-gradient-to-br from-[#FFF1C7] to-[#FFE080]" },
  { key: "rose", label: "Rose", swatch: "bg-gradient-to-br from-[#FFF0F3] to-[#FFB3C6]" },
  { key: "sage", label: "Sage", swatch: "bg-gradient-to-br from-[#EDF6F0] to-[#8FD3A8]" },
  { key: "sky", label: "Sky", swatch: "bg-gradient-to-br from-[#EBF4FD] to-[#89C4E8]" },
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
            <p className="font-display text-lg font-bold text-[#111111]">
              Keep going — you&apos;re getting there
            </p>
            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-[#6E6E6E]">
              Reach <strong>Reliable</strong> by practicing consistently and giving useful feedback.
              Once you&apos;re there, you can start your own cohort.
            </p>
            <button
              onClick={() => router.back()}
              className="mt-5 text-sm font-bold text-[#7A5300] underline-offset-2 hover:underline"
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
              className="block text-[13px] font-extrabold text-[#111111]"
            >
              Name <span aria-hidden className="text-[#F2A900]">*</span>
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
              className="block text-[13px] font-extrabold text-[#111111]"
            >
              Description <span className="font-normal text-[#9B958B]">(optional)</span>
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
                className="block text-[13px] font-extrabold text-[#111111]"
              >
                Direction <span className="font-normal text-[#9B958B]">(optional)</span>
              </label>
              <select
                id="cohort-direction"
                value={directionId}
                onChange={(e) => setDirectionId(e.target.value)}
                className="min-h-12 w-full rounded-[18px] border border-[#EFE7D8] bg-white px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#9B958B] focus:border-[#F2A900] focus:ring-4 focus:ring-[#FFF1C7]"
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
            <p className="block text-[13px] font-extrabold text-[#111111]">Who can join?</p>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map(({ value, label, description: desc }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-4 rounded-[18px] border p-4 transition-colors ${
                    visibility === value
                      ? "border-[#F2A900] bg-[#FFF8EE]"
                      : "border-[#EFE7D8] bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={value}
                    checked={visibility === value}
                    onChange={() => setVisibility(value)}
                    className="accent-[#F2A900]"
                  />
                  <span>
                    <span className="block text-sm font-extrabold text-[#111111]">{label}</span>
                    <span className="block text-xs text-[#6E6E6E]">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Accent picker */}
          <div className="space-y-2">
            <p className="block text-[13px] font-extrabold text-[#111111]">Accent colour</p>
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
                      ? "ring-2 ring-[#F2A900] ring-offset-2 shadow-[0_0_0_4px_rgba(242,169,0,0.18)]"
                      : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[#C0392B]" role="alert">
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
