"use client";

import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofCard } from "@/components/beta/ProofComponents";
import { ButtonLink, EmptyState, PageHeader, SectionLabel } from "@/components/beta/ui";
import { MotionItem, MotionList } from "@/components/beta/motion";
import { shouldShowDemoActivity } from "@/lib/feedAlgorithm";

export default function FeedPage() {
  const { snapshot, getFeedbackForProof } = useBetaApp();
  const userFor = (userId: string) => snapshot.users.find((u) => u.id === userId);
  const nameFor = (userId: string) => userFor(userId)?.displayName;
  const realProofs = snapshot.proofs.filter((proof) => !proof.isDemo);
  const demoProofs = snapshot.proofs.filter((proof) => proof.isDemo);
  const demoLimit = Math.max(0, 8 - realProofs.length);
  const displayProofs = shouldShowDemoActivity(realProofs.length)
    ? [...realProofs, ...demoProofs.slice(0, demoLimit || 8)]
    : realProofs;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Feed" subtitle="Proof, feedback, and progress. Usefulness over attention." />
        {displayProofs.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-[#FFF1C7] px-4 py-2 text-xs font-extrabold text-[#7A5300]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
            {realProofs.length > 0
              ? `${realProofs.length} real proof${realProofs.length === 1 ? "" : "s"} shown first`
              : "No real proof yet. Here are example proofs to help you start."}
          </div>
        )}
        <section className="space-y-3">
          <SectionLabel title="Recent proof" />
          {displayProofs.length ? (
            <MotionList className="space-y-3">
              {displayProofs.map((proof) => (
                <MotionItem key={proof.id}>
                  <ProofCard
                    proof={proof}
                    feedbackCount={getFeedbackForProof(proof.id).length}
                    authorName={nameFor(proof.userId)}
                    authorAvatarUrl={userFor(proof.userId)?.avatarUrl}
                  />
                </MotionItem>
              ))}
            </MotionList>
          ) : (
            <EmptyState
              title="No proof yet"
              body="No real proof yet. Here are example proofs to help you start."
              cta={<ButtonLink href="/proof/new/conf-s1">Submit proof</ButtonLink>}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
