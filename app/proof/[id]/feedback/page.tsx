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
  const [draftFeedback, setDraftFeedback] = useState("");
  const proof = getProofById(params.id);
  const feedback = proof ? getFeedbackForProof(proof.id) : [];
  const aiService = getCollectiveAiService();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Get feedback" subtitle="Respond to the practice, not the person." />
        {!proof ? (
          <EmptyState title="Proof not found" body="This local proof is not available in the current beta session." />
        ) : sent ? (
          <SuccessState
            title="Feedback saved."
            body="Feedback saved for the next practice."
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
              inputSummary={draftFeedback || `Feedback draft for ${proof.title}`}
              onGenerate={() =>
                aiService.generateFeedbackSuggestion(proof, draftFeedback, {
                  userId: currentUser?.id || "user-alex",
                  displayName: currentUser?.displayName || "Alex",
                  cohortId: currentUser?.cohortId || "founding-circle",
                  trustLevelLabel: trustSummary.levelLabel
                })
              }
              onApply={(response) => {
                if (response.structured.kind !== "feedbackCoach") return;
                const suggestion = response.structured.data;
                setDraftFeedback(
                  [
                    `What worked: ${suggestion.whatWorked}`,
                    `One useful suggestion: ${suggestion.suggestion}`,
                    `Encouragement: ${suggestion.encouragement}`
                  ].join("\n")
                );
              }}
              applyLabel="Apply to draft"
            />
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draftFeedback.trim()) return;
                addFeedback({ proofId: proof.id, body: draftFeedback, tone: "specific" });
                setSent(true);
              }}
            >
              <TextArea
                value={draftFeedback}
                onChange={(event) => setDraftFeedback(event.target.value)}
                placeholder="Write one specific thing that worked and one useful next step..."
              />
              <Button type="submit" className="w-full">Send feedback</Button>
            </form>
          </>
        )}
      </div>
    </AppShell>
  );
}
