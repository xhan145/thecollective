"use client";

import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofCard } from "@/components/beta/ProofComponents";
import { ButtonLink, EmptyState, PageHeader, SectionLabel } from "@/components/beta/ui";
import { MotionItem, MotionList } from "@/components/beta/motion";

export default function FeedPage() {
  const { snapshot, getFeedbackForProof } = useBetaApp();
  const nameFor = (userId: string) => snapshot.users.find((u) => u.id === userId)?.displayName;
  const activeMembers = new Set(snapshot.proofs.map((p) => p.userId)).size;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Feed" subtitle="Proof, feedback, and progress. Usefulness over attention." />
        {snapshot.proofs.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-[#FFF1C7] px-4 py-2 text-xs font-extrabold text-[#7A5300]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
            {activeMembers} members active · {snapshot.proofs.length} proofs shared
          </div>
        )}
        <section className="space-y-3">
          <SectionLabel title="Recent proof" />
          {snapshot.proofs.length ? (
            <MotionList className="space-y-3">
              {snapshot.proofs.map((proof) => (
                <MotionItem key={proof.id}>
                  <ProofCard proof={proof} feedbackCount={getFeedbackForProof(proof.id).length} authorName={nameFor(proof.userId)} />
                </MotionItem>
              ))}
            </MotionList>
          ) : (
            <EmptyState title="No proof yet" body="Submit one small example of practice when you are ready." cta={<ButtonLink href="/proof/new/say-clear-thing">Submit proof</ButtonLink>} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
