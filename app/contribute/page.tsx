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
          <Card className="p-4"><p className="text-body leading-6 text-muted">Contributing unlocks after your first proof and your first feedback. You can still read open requests.</p></Card>
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
                      <span className="text-caption font-semibold text-content">{owner?.displayName || "A member"}</span>
                    </div>
                    <p className="text-body font-semibold leading-5 text-content">{p.title}</p>
                    {p.contributionFocus && <p className="text-caption leading-5 text-muted">Focus: {p.contributionFocus}</p>}
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
