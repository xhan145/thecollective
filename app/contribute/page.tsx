"use client";

import Link from "next/link";
import { AppShell } from "@/components/beta/AppShell";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Card, EmptyState, PageHeader } from "@/components/beta/ui";

export default function ContributePage() {
  const { getOpenProofs, snapshot, isEligibleToContribute } = useBetaApp();
  const open = getOpenProofs();
  const eligible = isEligibleToContribute();
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Contribute" subtitle="Help someone take one specific next step." />
        {!eligible && (
          <Card className="p-4"><p className="text-sm leading-6 text-[#6E6E6E]">Contributing unlocks after your first proof and your first feedback. You can still read open requests.</p></Card>
        )}
        {open.length === 0 ? (
          <EmptyState title="No open requests right now" body="Check back soon — members open proofs when they want focused help." />
        ) : (
          <div className="space-y-3">
            {open.map((p) => {
              const owner = snapshot.users.find((u) => u.id === p.userId);
              return (
                <Link key={p.id} href={`/proof/${p.id}`}>
                  <Card interactive className="space-y-2 p-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={owner?.displayName} avatarUrl={owner?.avatarUrl} size={24} />
                      <span className="text-xs font-extrabold text-[#111111]">{owner?.displayName || "A member"}</span>
                    </div>
                    <p className="text-sm font-extrabold leading-5 text-[#111111]">{p.title}</p>
                    {p.contributionFocus && <p className="text-xs leading-5 text-[#6E6E6E]">Focus: {p.contributionFocus}</p>}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
