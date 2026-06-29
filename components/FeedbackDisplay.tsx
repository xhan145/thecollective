"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MediaAwareFeedback, ProofSubmission } from "@/lib/types";
import { demoProofSubmissions } from "@/lib/data";
import { getFeedbackRubricForMasteryLevel, getNextRecommendedPractice } from "@/lib/contentMastery/contentMasteryQueries";
import { proofTypeLabels } from "@/lib/media/proofMedia";
import { ProofMediaCard, ProofTypeBadge } from "./ProofMediaCard";
import { Pill, SectionHeader } from "./ui";

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
  const recommendedPractice = getNextRecommendedPractice("user-alex");
  const rubric = recommendedPractice ? getFeedbackRubricForMasteryLevel(recommendedPractice.masteryLevelId) : null;

  useEffect(() => {
    const proofJson = sessionStorage.getItem("collective.demo.latestProof");
    const feedbackJson = sessionStorage.getItem("collective.demo.latestFeedback");
    if (proofJson) setProof(JSON.parse(proofJson));
    if (feedbackJson) setFeedback(JSON.parse(feedbackJson));
  }, []);

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Pill tone="success">Proof reviewed</Pill>
            <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight">{proof.promptTitle}</h2>
            <p className="mt-1 text-sm text-[#c8c2b8]">{proof.pathTitle}</p>
          </div>
          <ProofTypeBadge proofType={proof.proofType} mediaKind={proof.mediaKind} />
        </div>
        <div className="mt-4">
          <ProofMediaCard proof={proof} />
        </div>
        <p className="mt-4 text-sm leading-7 text-[#c8c2b8]">{proof.reflection}</p>
      </div>

      <SectionHeader eyebrow="Supportive AI" title="Feedback to consider" />
      {rubric && (
        <div className="soft-card p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-purple2">Useful feedback rubric</p>
          <div className="mt-3 space-y-3 text-sm leading-7 text-[#e5ded4]">
            <p><strong>Clarity:</strong> {rubric.clarity}</p>
            <p><strong>Effort:</strong> {rubric.effort}</p>
            <p><strong>Usefulness:</strong> {rubric.usefulness}</p>
            <p><strong>Next step:</strong> {rubric.nextStep}</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#c8c2b8]">Feedback helps you improve. It does not define you.</p>
        </div>
      )}
      <FeedbackBlock label="Summary" text={feedback.summary} tone="accent" />
      <FeedbackBlock label="What worked" text={feedback.whatWorked} tone="success" />
      <FeedbackBlock label="What could improve" text={feedback.whatCouldImprove} tone="warning" />
      <FeedbackBlock label="Next step" text={feedback.nextStep} tone="accent" />
      <FeedbackBlock label="Reflection question" text={feedback.reflectionQuestion} tone="neutral" />
      <FeedbackBlock label="Media notes" text={feedback.mediaNotes || `This ${proofTypeLabels[proof.proofType].toLowerCase()} proof is handled as metadata in demo mode.`} tone="neutral" />

      <div className="soft-card grid grid-cols-2 gap-3 p-4 text-center">
        <div className="surface-row p-3">
          <p className="text-xs text-[#8f887e]">Risk</p>
          <p className="mt-1 font-black capitalize">{feedback.riskLevel}</p>
        </div>
        <div className="surface-row p-3">
          <p className="text-xs text-[#8f887e]">Confidence</p>
          <p className="mt-1 font-black">{Math.round(feedback.confidenceScore * 100)}%</p>
        </div>
      </div>

      <Link href="/dashboard" className="btn-primary w-full">Continue to progress</Link>
      <Link href="/practice/speak-up-2" className="btn-secondary w-full">Start next practice</Link>
    </div>
  );
}

function FeedbackBlock({ label, text, tone }: { label: string; text: string; tone: "accent" | "success" | "warning" | "neutral" }) {
  const toneClass = {
    accent: "text-purple2",
    success: "text-green",
    warning: "text-orange",
    neutral: "text-[#c8c2b8]"
  }[tone];

  return (
    <div className="soft-card p-4">
      <p className={`text-xs font-black uppercase tracking-[0.12em] ${toneClass}`}>{label}</p>
      <p className="mt-3 text-sm leading-7 text-[#e5ded4]">{text}</p>
    </div>
  );
}
