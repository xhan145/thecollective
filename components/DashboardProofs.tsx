"use client";

import { useEffect, useState } from "react";
import type { ProofSubmission } from "@/lib/types";
import { demoProofSubmissions } from "@/lib/data";
import { ProofMediaCard, ProofTypeBadge } from "./ProofMediaCard";

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
        <article key={proof.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-purple2">{proof.pathTitle}</p>
              <h3 className="mt-1 font-black">{proof.promptTitle}</h3>
              <p className="mt-1 text-xs text-slate-500">{new Date(proof.createdAt).toLocaleString()} - {proof.visibility}</p>
            </div>
            <ProofTypeBadge proofType={proof.proofType} mediaKind={proof.mediaKind} />
          </div>
          <div className="mt-3">
            <ProofMediaCard proof={proof} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <p className="rounded-2xl bg-white/[0.04] px-3 py-2 text-slate-400">Proof: <span className="font-bold text-white">{proof.status}</span></p>
            <p className="rounded-2xl bg-white/[0.04] px-3 py-2 text-slate-400">Feedback: <span className="font-bold text-white">{proof.feedbackStatus}</span></p>
          </div>
        </article>
      ))}
    </div>
  );
}
