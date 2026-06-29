"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/beta/ui";
import { getDirectionBySlug, getDirectionProgressSummary, getSkillsForDirection } from "@/lib/contentMastery/contentMasteryQueries";

export default function DirectionDetailPage() {
  const params = useParams<{ directionSlug: string }>();
  const direction = getDirectionBySlug(params.directionSlug);

  if (!direction) {
    return (
      <AppShell>
        <EmptyState title="Direction not found" body="Choose another direction and practice one small step." />
      </AppShell>
    );
  }

  const skills = getSkillsForDirection(direction.slug);
  const progress = getDirectionProgressSummary(direction.slug);
  const recommended = skills[0]?.levels[0];

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title={direction.name} subtitle={direction.description} />
        <Card className="p-5">
          <Badge>Progress</Badge>
          <h2 className="mt-3 text-xl font-extrabold text-[#111111]">{progress.label}</h2>
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Trust is earned through practice, proof, useful feedback, and contribution.</p>
          {recommended && <ButtonLink href={`/proof/new/${recommended.id}`} className="mt-4 w-full">Practice this</ButtonLink>}
        </Card>
        {skills.map((skill) => (
          <Card key={skill.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#111111]">{skill.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{skill.description}</p>
              </div>
              <Badge tone="muted">{skill.levels.length} levels</Badge>
            </div>
            <div className="mt-4 space-y-2">
              {skill.levels.map((level) => (
                <div key={level.id} className="rounded-[18px] bg-[#FFF8EE] p-3">
                  <p className="text-xs font-bold text-[#F2A900]">Level {level.levelNumber}: {level.levelName}</p>
                  <p className="mt-1 text-sm font-extrabold leading-5 text-[#111111]">{level.masteryGoal}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
