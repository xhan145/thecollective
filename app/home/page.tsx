"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { DirectionCard, LoopSignalRow, PracticePromptCard, TrustSnapshotCard } from "@/components/beta/LoopCards";
import { ProofCard } from "@/components/beta/ProofComponents";
import { Badge, ButtonLink, Card, EmptyState, HeroCard, PageHeader, ProgressBar, SectionLabel } from "@/components/beta/ui";
import { InstallPwaCard } from "@/components/beta/InstallPwaCard";
import { getNextPractice } from "@/lib/personalization";
import { getGreeting } from "@/lib/greeting";

export default function HomePage() {
  const { currentUser, snapshot, trustSummary, getFeedbackForProof } = useBetaApp();
  // Start from a stable value so SSR and the first client render match (the
  // server's clock/timezone may differ from the user's), then swap to the
  // device-local greeting after mount.
  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => setGreeting(getGreeting()), []);
  const latestProof = snapshot.proofs.find((proof) => proof.userId === (currentUser?.id || "user-alex")) || snapshot.proofs[0];
  const featuredDirection =
    snapshot.directions.find((direction) => direction.id === currentUser?.currentDirectionId) ||
    snapshot.directions.find((direction) => direction.slug === "confident-communication" || direction.slug === "communication") ||
    snapshot.directions[0];
  const nextPrompt =
    getNextPractice(
      { currentDirectionId: currentUser?.currentDirectionId ?? null, startingLevel: currentUser?.startingLevel ?? null, contextTags: currentUser?.contextTags ?? [] },
      snapshot.prompts,
      snapshot.completedPracticeIds,
    ) || snapshot.prompts[0];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={`${greeting}${currentUser ? `, ${currentUser.displayName}` : ""}.`}
          subtitle={currentUser?.goalText ? `Working toward: ${currentUser.goalText}` : "Small steps. Real progress."}
          action={
            <Link href="/feed" className="relative grid h-11 w-11 place-items-center rounded-full bg-[#FFFDF8] text-[#111111] shadow-[0_10px_30px_rgba(71,52,18,0.08)]" aria-label="Notifications">
              <Bell size={19} />
              <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#F2A900] px-1 text-[10px] font-black text-white">1</span>
            </Link>
          }
        />

        <HeroCard>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#B07A00]">Your next step</p>
          <h2 className="mt-1 font-display text-xl font-bold text-[#111111]">{nextPrompt.title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">{nextPrompt.estimatedMinutes} min · low pressure</p>
          <ButtonLink href={`/proof/new/${nextPrompt.id}`} className="mt-4 w-full">Begin →</ButtonLink>
          <div className="mt-4">
            <ProgressBar value={66} label="This week" />
          </div>
        </HeroCard>

        <LoopSignalRow />

        <section className="space-y-3">
          <SectionLabel title="Continue Practice" />
          <PracticePromptCard prompt={nextPrompt} completed={snapshot.completedPracticeIds.includes(nextPrompt.id)} />
        </section>

        <section className="space-y-3">
          <SectionLabel title="Recent Proof" action={<Link href="/feed" className="text-sm font-extrabold text-[#F2A900]">See all</Link>} />
          {latestProof ? (
            <ProofCard proof={latestProof} feedbackCount={getFeedbackForProof(latestProof.id).length} authorName={snapshot.users.find((u) => u.id === latestProof.userId)?.displayName} authorAvatarUrl={snapshot.users.find((u) => u.id === latestProof.userId)?.avatarUrl} />
          ) : (
            <EmptyState title="No proof yet" body="Start with one small practice." cta={<ButtonLink href={`/proof/new/${nextPrompt.id}`}>Submit proof</ButtonLink>} />
          )}
        </section>

        <TrustSnapshotCard trust={trustSummary} />
        <DirectionCard direction={featuredDirection} />
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E8F8EE] text-[#22C55E]">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <Badge tone="green">Private beta</Badge>
              <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">Proof is evidence of practice and progress, not content for clout.</p>
            </div>
          </div>
        </Card>
        <InstallPwaCard />
        <ButtonLink href="/contribute" variant="secondary" className="w-full">Contribute — help someone's next step</ButtonLink>
      </div>
    </AppShell>
  );
}
