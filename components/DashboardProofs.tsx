"use client";

import { useEffect, useState } from "react";
import type { ProofSubmission } from "@/lib/types";
import { demoProofSubmissions } from "@/lib/data";
import { ProofMediaCard, ProofTypeBadge } from "./ProofMediaCard";
import { Pill } from "./ui";

export function DashboardProofs() {
  const [proofs, setProofs] = useState<ProofSubmission[]>(demoProofSubmissions);

  useEffect(() => {
    const proofJson = sessionStorage.getItem("collective.demo.latestProof");
    if (!proofJson) return;
    const latest = JSON.parse(proofJson) as ProofSubmission;
    setProofs((current) => [latest, ...current.filter((proof) => proof.id !== latest.id)]);
  }, []);

  return (
    <div className="space-y-3">
      {proofs.map((proof) => (
        <article key={proof.id} className="soft-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Pill tone="accent">{proof.pathTitle}</Pill>
              <h3 className="mt-3 font-black">{proof.promptTitle}</h3>
              <p className="mt-1 text-xs text-[#8f887e]">{new Date(proof.createdAt).toLocaleString()} · {proof.visibility}</p>
            </div>
            <ProofTypeBadge proofType={proof.proofType} mediaKind={proof.mediaKind} />
          </div>
          <div className="mt-3">
            <ProofMediaCard proof={proof} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <p className="surface-row px-3 py-2 text-[#8f887e]">Proof: <span className="font-bold text-white">{proof.status}</span></p>
            <p className="surface-row px-3 py-2 text-[#8f887e]">Feedback: <span className="font-bold text-white">{proof.feedbackStatus}</span></p>
          </div>
        </article>
      ))}
    </div>
  );
}
