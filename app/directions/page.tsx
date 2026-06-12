"use client";

import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { DirectionCard } from "@/components/beta/LoopCards";
import { PageHeader } from "@/components/beta/ui";

export default function DirectionsPage() {
  const { snapshot } = useBetaApp();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Directions" subtitle="Choose a direction. Practice one small step." />
        {snapshot.directions.map((direction) => <DirectionCard key={direction.id} direction={direction} />)}
      </div>
    </AppShell>
  );
}
