"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MediaAwareFeedback, ProofSubmission } from "@/lib/types";
import { demoProofSubmissions } from "@/lib/data";
import { proofTypeLabels } from "@/lib/media/proofMedia";
import { ProofMediaCard, ProofTypeBadge } from "./ProofMediaCard";

const fallbackFeedback: MediaAwareFeedback = {
  summary: "You uploaded an audio proof. In demo mode I cannot analyze the full file yet, but I can still help you reflect on what this proof represents.",
  whatWorked: "You turned a private practice attempt into visible evidence. That is the core prove step in Collective.",
  whatCouldImprove: "Ask for one focused type of feedback so the next response is easier to act on.",
  nextStep: "Try the same sentence again with one clearer ask, then submit a second proof.",
  reflectionQuestion: "What did the proof reveal that you would not notice from memory alone?",
  riskLevel: "low",
  confidenceScore: 0.74,
  mediaNotes: "Demo fallback uses proof metadata only. Live image, video, audio, and document analysis is planned for later versions."
};

export function FeedbackDisplay() {
  const [proof, setProof] = useState<ProofSubmission>(demoProofSubmissions[0]);
  const [feedback, setFeedback] = useState<MediaAwareFeedback>(fallbackFeedback);

  useEffect(() => {
    const proofJson = sessionStorage.getItem("collective.demo.latestProof");
    const feedbackJson = sessionStorage.getItem("collective.demo.latestFeedback");
    if (proofJson) setProof(JSON.parse(proofJson));
    if (feedbackJson) setFeedback(JSON.parse(feedbackJson));
  }, []);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-purple2">Proof reviewed</p>
            <h2 className="mt-1 text-xl font-black">{proof.promptTitle}</h2>
            <p className="mt-1 text-sm text-slate-400">{proof.pathTitle}</p>
          </div>
          <ProofTypeBadge proofType={proof.proofType} mediaKind={proof.mediaKind} />
        </div>
        <div className="mt-4">
          <ProofMediaCard proof={proof} />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">{proof.reflection}</p>
      </div>

      <FeedbackBlock label="Summary" text={feedback.summary} tone="text-purple2" />
      <FeedbackBlock label="What worked" text={feedback.whatWorked} tone="text-green" />
      <FeedbackBlock label="What could improve" text={feedback.whatCouldImprove} tone="text-orange" />
      <FeedbackBlock label="Next step" text={feedback.nextStep} tone="text-purple2" />
      <FeedbackBlock label="Reflection question" text={feedback.reflectionQuestion} tone="text-slate-200" />
      <FeedbackBlock label="Media notes" text={feedback.mediaNotes || `This ${proofTypeLabels[proof.proofType].toLowerCase()} proof is handled as metadata in demo mode.`} tone="text-slate-200" />

      <div className="card grid grid-cols-2 gap-3 p-4 text-center">
        <div>
          <p className="text-xs text-slate-500">Risk</p>
          <p className="mt-1 font-black capitalize">{feedback.riskLevel}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Confidence</p>
          <p className="mt-1 font-black">{Math.round(feedback.confidenceScore * 100)}%</p>
        </div>
      </div>

      <Link href="/dashboard" className="btn-primary w-full">Continue to dashboard</Link>
      <Link href="/practice/speak-up-2" className="btn-secondary w-full">Start next practice</Link>
    </div>
  );
}

function FeedbackBlock({ label, text, tone }: { label: string; text: string; tone: string }) {
  return (
    <div className="card p-5">
      <p className={`text-xs font-black ${tone}`}>{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}
