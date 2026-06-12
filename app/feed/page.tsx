"use client";

import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofCard } from "@/components/beta/ProofComponents";
import { ButtonLink, EmptyState, PageHeader, SectionLabel } from "@/components/beta/ui";

export default function FeedPage() {
  const { snapshot, getFeedbackForProof } = useBetaApp();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Feed" subtitle="Proof, feedback, and progress. Usefulness over attention." />
        <section className="space-y-3">
          <SectionLabel title="Recent proof" />
          {snapshot.proofs.length ? (
            snapshot.proofs.map((proof) => <ProofCard key={proof.id} proof={proof} feedbackCount={getFeedbackForProof(proof.id).length} />)
          ) : (
            <EmptyState title="No proof yet" body="Submit one small example of practice when you are ready." cta={<ButtonLink href="/proof/new/say-clear-thing">Submit proof</ButtonLink>} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
