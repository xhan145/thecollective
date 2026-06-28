"use client";

import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofCard } from "@/components/beta/ProofComponents";
import { ButtonLink, EmptyState, PageHeader, SectionLabel } from "@/components/beta/ui";
import { MotionItem, MotionList } from "@/components/beta/motion";
import { rankFeed } from "@/lib/feed/rankProofFeed";
import { hasCapability } from "@/lib/roles";

export default function FeedPage() {
  const { snapshot, currentUser, getFeedbackForProof } = useBetaApp();
  const userFor = (userId: string) => snapshot.users.find((u) => u.id === userId);
  const authorsById = Object.fromEntries(snapshot.users.map((u) => [u.id, u]));
  const viewer = currentUser ?? snapshot.users.find((u) => u.id === snapshot.currentUserId) ?? snapshot.users[0];
  const ranked = viewer ? rankFeed(viewer, snapshot.proofs, authorsById, snapshot.usefulCountByProof) : [];
  const canGiveFeedback = hasCapability(viewer, "give_feedback");
  const realCount = snapshot.proofs.filter((p) => !p.isDemo && p.userId !== viewer?.id).length;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Feed" subtitle="Learn from people ahead, share with people behind. Usefulness over attention." />
        {ranked.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-[#FFF1C7] px-4 py-2 text-xs font-extrabold text-[#7A5300]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
            {realCount > 0 ? `${realCount} real proof${realCount === 1 ? "" : "s"} shown first` : "No real proof yet. Here are example proofs to help you start."}
          </div>
        )}
        <section className="space-y-3">
          <SectionLabel title="For you" />
          {ranked.length ? (
            <MotionList className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
              {ranked.map(({ proof, relation }) => (
                <MotionItem key={proof.id}>
                  <ProofCard
                    proof={proof}
                    feedbackCount={getFeedbackForProof(proof.id).length}
                    authorName={userFor(proof.userId)?.displayName}
                    authorAvatarUrl={userFor(proof.userId)?.avatarUrl}
                    relation={relation}
                    canGiveFeedback={canGiveFeedback}
                  />
                </MotionItem>
              ))}
            </MotionList>
          ) : (
            <EmptyState title="No proof yet" body="No real proof yet. Here are example proofs to help you start." cta={<ButtonLink href="/proof/new/conf-s1">Submit proof</ButtonLink>} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
