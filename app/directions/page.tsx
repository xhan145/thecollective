"use client";

import { useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { DirectionCard } from "@/components/beta/LoopCards";
import { PageHeader, Card, SectionLabel, Button } from "@/components/beta/ui";
import { Avatar } from "@/components/beta/Avatar";
import { hasCapability, tierForProfile } from "@/lib/roles";

export default function DirectionsPage() {
  const { snapshot, currentUser, toggleLearnFrom, isLearningFrom, sendPeerNote } = useBetaApp();

  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const myDir = currentUser?.currentDirectionId ?? null;

  // People to learn from: Helpful+ members in my direction who opted in (exclude me)
  const mentors = !myDir ? [] : snapshot.users.filter((u) =>
    u.id !== currentUser?.id &&
    !!u.mentorOptIn &&
    hasCapability(u, "mentor_visibility") &&
    (u.currentDirectionId === myDir || (u.directionIds ?? []).includes(myDir))
  ).slice(0, 8);

  // Newcomers to welcome: New-tier members in my direction (exclude me). Contributor-gated surface.
  const newcomers = !myDir || !hasCapability(currentUser, "welcome_newcomers") ? [] :
    snapshot.users.filter((u) =>
      u.id !== currentUser?.id &&
      tierForProfile(u) === "New" &&
      (u.currentDirectionId === myDir || (u.directionIds ?? []).includes(myDir))
    ).slice(0, 6);

  async function handleSayHi(n: { id: string; displayName?: string | null }) {
    const result = await sendPeerNote(n.id, `Hi ${n.displayName ?? "there"} — welcome to Collective! Glad you're here.`);
    if (result) {
      setSentIds((prev) => new Set(prev).add(n.id));
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Directions" subtitle="Choose a direction. Practice one small step." />

        {mentors.length > 0 && (
          <section className="space-y-3">
            <SectionLabel title="People to learn from in this direction" />
            <div className="space-y-2">
              {mentors.map((m) => (
                <Card key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.displayName} avatarUrl={m.avatarUrl} />
                    <span className="text-sm font-bold text-[#111111]">{m.displayName}</span>
                  </div>
                  <Button variant="quiet" onClick={() => toggleLearnFrom(m.id)}>
                    {isLearningFrom(m.id) ? "Learning" : "Learn from"}
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        )}

        {newcomers.length > 0 && (
          <section className="space-y-3">
            <SectionLabel title="Say hi to someone new" />
            <p className="text-xs text-[#6E6E6E]">A short, kind note goes a long way.</p>
            <div className="space-y-2">
              {newcomers.map((n) => (
                <Card key={n.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={n.displayName} avatarUrl={n.avatarUrl} />
                    <span className="text-sm font-bold text-[#111111]">{n.displayName}</span>
                  </div>
                  {sentIds.has(n.id) ? (
                    <span className="text-sm text-[#6E6E6E]">Sent</span>
                  ) : (
                    <Button variant="quiet" onClick={() => handleSayHi(n)}>
                      Say hi
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {snapshot.directions.map((direction) => <DirectionCard key={direction.id} direction={direction} />)}
      </div>
    </AppShell>
  );
}
