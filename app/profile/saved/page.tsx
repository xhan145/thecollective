"use client";

import Link from "next/link";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofCard } from "@/components/beta/ProofComponents";
import { ButtonLink, Card, EmptyState, PageHeader, SectionLabel } from "@/components/beta/ui";

export default function SavedPage() {
  const { getSavedProofs, getSavedPractices, getFeedbackForProof, snapshot } = useBetaApp();
  const proofs = getSavedProofs();
  const practices = getSavedPractices();
  const nameFor = (userId: string) => snapshot.users.find((u) => u.id === userId)?.displayName;
  const avatarFor = (userId: string) => snapshot.users.find((u) => u.id === userId)?.avatarUrl;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Saved for practice" subtitle="Come back to these when you are ready to practice." />
        {proofs.length === 0 && practices.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            body="Save a proof or practice to keep it here for later."
            cta={<ButtonLink href="/feed">Open feed</ButtonLink>}
          />
        ) : (
          <>
            {practices.length > 0 && (
              <section className="space-y-3">
                <SectionLabel title="Practices" />
                {practices.map((p) => (
                  <Card key={p.id} className="p-4">
                    <p className="text-sm font-extrabold text-[#111111]">{p.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#6E6E6E]">{p.description}</p>
                    <Link href={`/proof/new/${p.id}`} className="mt-3 inline-block text-xs font-extrabold text-[#F2A900]">
                      Start practice →
                    </Link>
                  </Card>
                ))}
              </section>
            )}
            {proofs.length > 0 && (
              <section className="space-y-3">
                <SectionLabel title="Proof" />
                {proofs.map((proof) => (
                  <ProofCard
                    key={proof.id}
                    proof={proof}
                    feedbackCount={getFeedbackForProof(proof.id).length}
                    authorName={nameFor(proof.userId)}
                    authorAvatarUrl={avatarFor(proof.userId)}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
