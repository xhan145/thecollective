"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { AiSupportCard } from "@/components/beta/AiSupportCard";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofDetail } from "@/components/beta/ProofComponents";
import { Button, EmptyState, PageHeader, SuccessState, TextArea } from "@/components/beta/ui";
import { getCollectiveAiService } from "@/lib/aiService";

export default function ProofFeedbackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, trustSummary, getProofById, getFeedbackForProof, addFeedback } = useBetaApp();
  const [sent, setSent] = useState(false);
  const [clarity, setClarity] = useState("");
  const [useful, setUseful] = useState("");
  const [nextStep, setNextStep] = useState("");
  const proof = getProofById(params.id);
  const feedback = proof ? getFeedbackForProof(proof.id) : [];
  const aiService = getCollectiveAiService();

  const canSend = Boolean(clarity.trim() || useful.trim() || nextStep.trim());

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Give feedback" subtitle="Respond to the practice, not the person." />
        {!proof ? (
          <EmptyState title="Proof not found" body="This proof is not available in the current session." />
        ) : sent ? (
          <SuccessState
            title="Feedback saved."
            body="Useful feedback helps someone take their next small step."
            cta={<Button className="w-full" onClick={() => router.push(`/proof/${proof.id}`)}>Back to proof</Button>}
          />
        ) : (
          <>
            <ProofDetail proof={proof} feedback={feedback} />

            <AiSupportCard
              title="Make my feedback more useful"
              description="AI can suggest clearer wording. You review it and choose what to use."
              ctaLabel="Coach my feedback"
              feature="FEEDBACK_COACH"
              sourceType="PEER_FEEDBACK"
              sourceId={proof.id}
              proofId={proof.id}
              inputSummary={[clarity, useful, nextStep].filter(Boolean).join(" / ") || `Feedback for ${proof.title}`}
              onGenerate={() =>
                aiService.generateFeedbackSuggestion(proof, [clarity, useful, nextStep].filter(Boolean).join("\n"), {
                  userId: currentUser?.id || "user-alex",
                  displayName: currentUser?.displayName || "Alex",
                  cohortId: currentUser?.cohortId || "founding-circle",
                  trustLevelLabel: trustSummary.levelLabel
                })
              }
              onApply={(response) => {
                if (response.structured.kind !== "feedbackCoach") return;
                const s = response.structured.data;
                if (s.whatWorked) setClarity(s.whatWorked);
                if (s.suggestion) setUseful(s.suggestion);
                if (s.encouragement) setNextStep(s.encouragement);
              }}
              applyLabel="Apply to my notes"
            />

            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!canSend) return;
                addFeedback({
                  proofId: proof.id,
                  clarityNote: clarity,
                  usefulNote: useful,
                  nextStepNote: nextStep
                });
                setSent(true);
              }}
            >
              <FeedbackField label="What was clear?" value={clarity} onChange={setClarity} placeholder="Name one thing that landed." />
              <FeedbackField label="What could be improved?" value={useful} onChange={setUseful} placeholder="One specific, kind suggestion." />
              <FeedbackField label="One useful next step" value={nextStep} onChange={setNextStep} placeholder="A small step they could try next." />
              <p className="text-center text-xs leading-5 text-[#9B958B]">
                Be specific, useful, and kind. Feedback helps someone improve. It does not define them.
              </p>
              <Button type="submit" className="w-full" disabled={!canSend}>Send feedback</Button>
            </form>
          </>
        )}
      </div>
    </AppShell>
  );
}

function FeedbackField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-extrabold text-[#111111]">{label}</span>
      <TextArea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-h-20" />
    </label>
  );
}
