"use client";

import { useState } from "react";
import type { Contribution, Proof } from "@/lib/betaTypes";
import { useBetaApp } from "./AppStateProvider";
import { Avatar } from "./Avatar";
import { Button, Card, TextArea } from "./ui";

const field = "w-full rounded-2xl border border-line bg-surface-input px-4 py-3 text-body text-content outline-none focus:border-accent";

/** Composer shown to eligible non-owners on an open proof. */
export function ContributeComposer({ proof }: { proof: Proof }) {
  const { submitContribution, isEligibleToContribute, getContributionsForProof, currentUser } = useBetaApp();
  const eligible = isEligibleToContribute();
  const already = getContributionsForProof(proof.id).some((c) => c.contributorId === currentUser?.id);
  const [observation, setObservation] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (already || done) {
    return <Card className="p-4"><p className="text-body font-semibold text-content">Contribution sent.</p>
      <p className="mt-1 text-body leading-6 text-muted">The owner can accept it if it helps.</p></Card>;
  }
  if (!eligible) {
    return <Card className="p-4"><p className="text-body leading-6 text-muted">Contributing unlocks after your first proof and your first feedback.</p></Card>;
  }
  return (
    <Card className="space-y-3 p-4">
      <p className="text-body font-semibold text-content">Contribute a focused next step</p>
      {proof.contributionFocus && <p className="text-caption leading-5 text-muted">Focus: {proof.contributionFocus}</p>}
      <label className="block"><span className="mb-1 block text-caption font-semibold text-content">One specific observation</span>
        <input className={field} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="What worked or what you noticed…" /></label>
      <label className="block"><span className="mb-1 block text-caption font-semibold text-content">One concrete next step</span>
        <TextArea value={nextStep} onChange={(e) => setNextStep(e.target.value)} rows={3} placeholder="A small, kind, specific suggestion…" /></label>
      {error && <p className="rounded-2xl bg-surface-soft p-3 text-body font-medium leading-6 text-accent-text">{error}</p>}
      <Button className="w-full" disabled={busy || !observation.trim() || !nextStep.trim()} onClick={async () => {
        setBusy(true); setError("");
        try {
          const { error: e } = await submitContribution({ proofId: proof.id, observation, nextStep });
          if (e) setError(e); else setDone(true);
        } finally { setBusy(false); }
      }}>{busy ? "Sending…" : "Send contribution"}</Button>
    </Card>
  );
}

/** Owner-facing list of received contributions with Accept. */
export function ReceivedContributions({ proof }: { proof: Proof }) {
  const { getContributionsForProof, acceptContribution, snapshot } = useBetaApp();
  const items = getContributionsForProof(proof.id);
  if (items.length === 0) {
    return <Card className="p-4"><p className="text-body leading-6 text-muted">No contributions yet. Open proofs invite focused help.</p></Card>;
  }
  return (
    <div className="space-y-3">
      {items.map((c: Contribution) => {
        const author = snapshot.users.find((u) => u.id === c.contributorId);
        return (
          <Card key={c.id} className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Avatar name={author?.displayName} avatarUrl={author?.avatarUrl} size={24} />
              <span className="text-caption font-semibold text-content">{author?.displayName || "A member"}</span>
              {c.status === "accepted" && <span className="ml-auto rounded-full bg-success-soft px-2 py-0.5 text-overline text-success-text">Accepted</span>}
            </div>
            <p className="text-body leading-6 text-secondary"><span className="font-medium">Observed:</span> {c.observation}</p>
            <p className="text-body leading-6 text-secondary"><span className="font-medium">Next step:</span> {c.nextStep}</p>
            {c.status === "pending" && (
              <Button variant="secondary" className="w-full" onClick={() => void acceptContribution(c.id)}>Accept this contribution</Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
