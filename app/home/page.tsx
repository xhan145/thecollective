"use client";

import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { DirectionCard, LoopSignalRow, PracticePromptCard, TrustSnapshotCard } from "@/components/beta/LoopCards";
import { ProofCard } from "@/components/beta/ProofComponents";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, SectionLabel } from "@/components/beta/ui";
import { InstallPwaCard } from "@/components/beta/InstallPwaCard";

export default function HomePage() {
  const { currentUser, snapshot, trustSummary, getFeedbackForProof } = useBetaApp();
  const latestProof = snapshot.proofs.find((proof) => proof.userId === (currentUser?.id || "user-alex")) || snapshot.proofs[0];
  const featuredDirection = snapshot.directions.find((direction) => direction.id === "direction-communication") || snapshot.directions[0];
  const nextPrompt = snapshot.prompts.find((prompt) => !snapshot.completedPracticeIds.includes(prompt.id)) || snapshot.prompts[0];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={`Good morning${currentUser ? `, ${currentUser.displayName}` : ""}.`}
          subtitle="Small steps. Real progress."
          action={
            <Link href="/feed" className="relative grid h-11 w-11 place-items-center rounded-full bg-[#FFFDF8] text-[#111111] shadow-[0_10px_30px_rgba(71,52,18,0.08)]" aria-label="Notifications">
              <Bell size={19} />
              <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#F2A900] px-1 text-[10px] font-black text-white">1</span>
            </Link>
          }
        />

        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#111111]">Today's Focus</p>
              <h2 className="mt-2 text-xl font-extrabold text-[#111111]">Confident Communication</h2>
            </div>
            <ButtonLink href="/practice" className="h-11 min-h-11 w-11 px-0" aria-label="Continue today's focus">
              <ArrowRight size={19} />
            </ButtonLink>
          </div>
          <div className="mt-4 h-2 rounded-full bg-[#EFE7D8]">
            <div className="h-2 w-[72%] rounded-full bg-[#F2A900]" />
          </div>
          <p className="mt-3 text-xs font-bold text-[#6E6E6E]">2 of 3 practices completed</p>
        </Card>

        <LoopSignalRow />

        <section className="space-y-3">
          <SectionLabel title="Continue Practice" />
          <PracticePromptCard prompt={nextPrompt} completed={snapshot.completedPracticeIds.includes(nextPrompt.id)} />
        </section>

        <section className="space-y-3">
          <SectionLabel title="Recent Proof" action={<Link href="/feed" className="text-sm font-extrabold text-[#F2A900]">See all</Link>} />
          {latestProof ? (
            <ProofCard proof={latestProof} feedbackCount={getFeedbackForProof(latestProof.id).length} />
          ) : (
            <EmptyState title="No proof yet" body="Submit one small example of practice when you are ready." cta={<ButtonLink href={`/proof/new/${nextPrompt.id}`}>Submit proof</ButtonLink>} />
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
      </div>
    </AppShell>
  );
}
