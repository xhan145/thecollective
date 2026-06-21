"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { AiSupportCard } from "@/components/beta/AiSupportCard";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofDetail } from "@/components/beta/ProofComponents";
import { ContributeComposer, ReceivedContributions } from "@/components/beta/ContributeComponents";
import { Button, ButtonLink, Card, EmptyState, PageHeader } from "@/components/beta/ui";
import { getCollectiveAiService } from "@/lib/aiService";

export default function ProofDetailPage() {
  const params = useParams<{ id: string }>();
  const { currentUser, trustSummary, getProofById, getFeedbackForProof, toggleProofOpen } = useBetaApp();
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
            {currentUser?.id === proof.userId ? (
              <div className="space-y-3">
                <OwnerOpenControl proof={proof} toggle={toggleProofOpen} />
                <ReceivedContributions proof={proof} />
              </div>
            ) : (
              proof.openForContributions && <ContributeComposer proof={proof} />
            )}
            {feedback.length >= 2 && (
              <AiSupportCard
                title="Summarize what to try next"
                description="AI can turn peer feedback into one simple next practice step. It does not decide trust."
                ctaLabel="Summarize what to try next"
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
            {!proof.isDemo && <ButtonLink href={`/proof/${proof.id}/feedback`} className="w-full">Give feedback</ButtonLink>}
            <Link href="/feed" className="block rounded-full px-4 py-3 text-center text-sm font-extrabold text-[#6E6E6E]">Back to feed</Link>
          </>
        ) : (
          <EmptyState title="Proof not found" body="This local proof is not available in the current beta session." cta={<ButtonLink href="/feed">Open feed</ButtonLink>} />
        )}
      </div>
    </AppShell>
  );
}

function OwnerOpenControl({ proof, toggle }: { proof: import("@/lib/betaTypes").Proof; toggle: (id: string, open: boolean, focus?: string) => void }) {
  const [focus, setFocus] = useState(proof.contributionFocus ?? "");
  const open = !!proof.openForContributions;
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-extrabold text-[#111111]">Open for contributions</p>
      <p className="text-xs leading-5 text-[#6E6E6E]">Invite focused help. Members suggest one observation and one next step; you accept what helps.</p>
      {!open ? (
        <>
          <input className="w-full rounded-2xl border border-[#EFE7D8] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#F2A900]"
            value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Optional focus, e.g. 'make the opening clearer'" />
          <Button className="w-full" onClick={() => toggle(proof.id, true, focus.trim() || undefined)}>Open this proof</Button>
        </>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => toggle(proof.id, false, focus.trim() || undefined)}>Close to new contributions</Button>
      )}
    </Card>
  );
}
