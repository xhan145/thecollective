"use client";

import { UserRound } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { TrustSnapshotCard } from "@/components/beta/LoopCards";
import { Badge, ButtonLink, Card, PageHeader, TrustPill } from "@/components/beta/ui";

export default function ProfilePage() {
  const { currentUser, trustSummary, signOutDemo } = useBetaApp();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Profile" subtitle="Progress you can build on." />
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#F2A900] text-2xl font-extrabold text-white">
              {currentUser?.initials || <UserRound size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#111111]">{currentUser?.displayName || "Alex"}</h2>
              <p className="mt-1 text-sm text-[#6E6E6E]">Building confident communication</p>
              <div className="mt-2"><TrustPill label={trustSummary.levelLabel} /></div>
            </div>
          </div>
        </Card>
        <TrustSnapshotCard trust={trustSummary} />
        <div className="grid grid-cols-2 gap-3">
          <ButtonLink href="/profile/saved" variant="secondary" className="w-full">Saved for practice</ButtonLink>
          <ButtonLink href="/profile/learning" variant="secondary" className="w-full">People you learn from</ButtonLink>
        </div>
        <ButtonLink href="/notes" variant="secondary" className="w-full">Peer notes &amp; requests</ButtonLink>
        <Card className="p-5">
          <Badge>Contribution</Badge>
          <h2 className="mt-3 text-xl font-extrabold text-[#111111]">Not rushed</h2>
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">You will unlock more ways to help others as your proof and feedback history grows.</p>
          <ButtonLink href="/app-feedback" className="mt-4 w-full">Give app feedback</ButtonLink>
          <button className="mt-3 w-full rounded-full px-4 py-3 text-sm font-extrabold text-[#6E6E6E]" onClick={signOutDemo}>
            Leave demo beta
          </button>
        </Card>
      </div>
    </AppShell>
  );
}
