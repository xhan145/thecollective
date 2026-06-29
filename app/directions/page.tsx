"use client";

import { AppShell } from "@/components/beta/AppShell";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/beta/ui";
import { getAllDirections } from "@/lib/contentMastery/contentMasteryQueries";

export default function DirectionsPage() {
  const directions = getAllDirections();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Directions" subtitle="Choose a direction. Practice one small step." />
        {directions.map((direction) => {
          const firstLevel = direction.skills[0]?.levels[0];
          return (
            <Card key={direction.id} className="p-5">
              <Badge>{direction.name}</Badge>
              <h2 className="mt-3 text-xl font-extrabold leading-tight text-[#111111]">{direction.description}</h2>
              <p className="mt-3 text-sm leading-6 text-[#6E6E6E]">{direction.skills.length} skills. Every level leads to practice and proof.</p>
              {firstLevel && (
                <div className="mt-4 rounded-[18px] bg-[#FFF8EE] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F2A900]">Recommended first practice</p>
                  <p className="mt-2 text-sm font-extrabold text-[#111111]">{firstLevel.masteryGoal}</p>
                </div>
              )}
              <ButtonLink href={`/directions/${direction.slug}`} className="mt-4 w-full">
                Start one small practice
              </ButtonLink>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
