"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { AiSupportCard } from "@/components/beta/AiSupportCard";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofDetail } from "@/components/beta/ProofComponents";
import { ButtonLink, EmptyState, PageHeader } from "@/components/beta/ui";
import { getCollectiveAiService } from "@/lib/aiService";

export default function ProofDetailPage() {
  const params = useParams<{ id: string }>();
  const { currentUser, trustSummary, getProofById, getFeedbackForProof } = useBetaApp();
  const proof = getProofById(params.id);
  const feedback = proof ? getFeedbackForProof(proof.id) : [];
  const aiService = getCollectiveAiService();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Proof detail" subtitle="Proof is evidence of practice, not content for clout." />
        {proof ? (
          <>
            <ProofDetail proof={proof} feedback={feedback} />
            {feedback.length >= 2 && (
              <AiSupportCard
                title="Summarize feedback"
                description="AI can turn peer feedback into one simple next practice step. It does not decide trust."
                ctaLabel="Summarize feedback"
                feature="FEEDBACK_SUMMARY"
                sourceType="FEEDBACK_LIST"
                sourceId={proof.id}
                proofId={proof.id}
                inputSummary={`${feedback.length} feedback notes for ${proof.title}`}
                onGenerate={() =>
                  aiService.generateFeedbackSummary(proof, feedback, {
                    userId: currentUser?.id || "user-alex",
                    displayName: currentUser?.displayName || "Alex",
                    cohortId: currentUser?.cohortId || "founding-circle",
                    trustLevelLabel: trustSummary.levelLabel
                  })
                }
              />
            )}
            <ButtonLink href={`/proof/${proof.id}/feedback`} className="w-full">Give feedback</ButtonLink>
            <Link href="/feed" className="block rounded-full px-4 py-3 text-center text-sm font-extrabold text-[#6E6E6E]">Back to feed</Link>
          </>
        ) : (
          <EmptyState title="Proof not found" body="This local proof is not available in the current beta session." cta={<ButtonLink href="/feed">Open feed</ButtonLink>} />
        )}
      </div>
    </AppShell>
  );
}
