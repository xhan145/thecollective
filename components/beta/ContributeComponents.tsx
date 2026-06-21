"use client";

import { useState } from "react";
import type { Contribution, Proof } from "@/lib/betaTypes";
import { useBetaApp } from "./AppStateProvider";
import { Avatar } from "./Avatar";
import { Button, Card, TextArea } from "./ui";

const field = "w-full rounded-2xl border border-[#EFE7D8] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#F2A900]";

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
    return <Card className="p-4"><p className="text-sm font-extrabold text-[#111111]">Contribution sent.</p>
      <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">The owner can accept it if it helps.</p></Card>;
  }
  if (!eligible) {
    return <Card className="p-4"><p className="text-sm leading-6 text-[#6E6E6E]">Contributing unlocks after your first proof and your first feedback.</p></Card>;
  }
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-extrabold text-[#111111]">Contribute a focused next step</p>
      {proof.contributionFocus && <p className="text-xs leading-5 text-[#6E6E6E]">Focus: {proof.contributionFocus}</p>}
      <label className="block"><span className="mb-1 block text-xs font-extrabold text-[#111111]">One specific observation</span>
        <input className={field} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="What worked or what you noticed…" /></label>
      <label className="block"><span className="mb-1 block text-xs font-extrabold text-[#111111]">One concrete next step</span>
        <TextArea value={nextStep} onChange={(e) => setNextStep(e.target.value)} rows={3} placeholder="A small, kind, specific suggestion…" /></label>
      {error && <p className="rounded-2xl bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">{error}</p>}
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
    return <Card className="p-4"><p className="text-sm leading-6 text-[#6E6E6E]">No contributions yet. Open proofs invite focused help.</p></Card>;
  }
  return (
    <div className="space-y-3">
      {items.map((c: Contribution) => {
        const author = snapshot.users.find((u) => u.id === c.contributorId);
        return (
          <Card key={c.id} className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Avatar name={author?.displayName} avatarUrl={author?.avatarUrl} size={24} />
              <span className="text-xs font-extrabold text-[#111111]">{author?.displayName || "A member"}</span>
              {c.status === "accepted" && <span className="ml-auto rounded-full bg-[#E8F6EC] px-2 py-0.5 text-[11px] font-bold text-[#15803D]">Accepted</span>}
            </div>
            <p className="text-sm leading-6 text-[#38322A]"><span className="font-bold">Observed:</span> {c.observation}</p>
            <p className="text-sm leading-6 text-[#38322A]"><span className="font-bold">Next step:</span> {c.nextStep}</p>
            {c.status === "pending" && (
              <Button variant="secondary" className="w-full" onClick={() => void acceptContribution(c.id)}>Accept this contribution</Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
