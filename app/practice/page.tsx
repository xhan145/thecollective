"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { AiSupportCard } from "@/components/beta/AiSupportCard";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { PracticePromptCard } from "@/components/beta/LoopCards";
import { SkillLadderRow } from "@/components/beta/MasteryComponents";
import { TipCard } from "@/components/beta/TipCard";
import { TipComposer } from "@/components/beta/TipComposer";
import { Badge, Button, HeroCard, PageHeader, SectionLabel } from "@/components/beta/ui";
import { getCollectiveAiService } from "@/lib/aiService";
import { directionProgress, nextMasteryStep } from "@/lib/mastery";
import { getNextPractice } from "@/lib/personalization";

export default function PracticePage() {
  const { snapshot, currentUser, trustSummary, completePractice, loadTips, getTipsForPractice } = useBetaApp();
  const masteryMode = snapshot.skills.length > 0;

  // Next step: deterministic ladder position in mastery mode; the legacy
  // personalized pick for fallback/demo content.
  const persona = { currentDirectionId: currentUser?.currentDirectionId ?? null, startingLevel: currentUser?.startingLevel ?? null, contextTags: currentUser?.contextTags ?? [] };
  const masteryData = { directions: snapshot.directions, skills: snapshot.skills, prompts: snapshot.prompts, completedPracticeIds: snapshot.completedPracticeIds };
  const nextPrompt = masteryMode
    ? nextMasteryStep(currentUser?.currentDirectionId, masteryData)
    : getNextPractice(persona, snapshot.prompts, snapshot.completedPracticeIds) || snapshot.prompts[0];
  const aiService = getCollectiveAiService();

  // Load tips for the primary practice on mount and whenever it changes.
  useEffect(() => {
    if (nextPrompt?.id) void loadTips(nextPrompt.id);
  }, [nextPrompt?.id, loadTips]);

  const tips = nextPrompt ? getTipsForPractice(nextPrompt.id) : [];
  const canShareTip = !!nextPrompt && snapshot.completedPracticeIds.includes(nextPrompt.id);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Practice" subtitle="Pick one small step. Proof can come after." />

        {nextPrompt && (
          <HeroCard>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#B07A00]">Your next step</p>
            <h2 className="mt-1.5 font-display text-[22px] font-bold leading-snug text-[#111111]">
              {masteryMode && nextPrompt.levelName ? nextPrompt.levelName : nextPrompt.title}
            </h2>
            {masteryMode && nextPrompt.masteryGoal ? (
              <p className="mt-1.5 text-sm leading-6 text-[#6E6E6E]">{nextPrompt.masteryGoal}</p>
            ) : (
              <p className="mt-1.5 text-sm leading-6 text-[#6E6E6E]">{nextPrompt.description || nextPrompt.prompt}</p>
            )}
            <p className="mt-2 text-xs font-bold text-[#9B958B]">
              {nextPrompt.estimatedMinutes} min{nextPrompt.difficulty ? ` · ${nextPrompt.difficulty}` : ""} · low pressure
            </p>
            <Link
              href={`/proof/new/${nextPrompt.id}`}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FFB000] to-[#F2A900] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(242,169,0,0.32)] transition-all hover:-translate-y-[1px]"
            >
              Begin
            </Link>
          </HeroCard>
        )}

        {nextPrompt && (
          <AiSupportCard
            title="Create a small practice"
            description="AI can help you understand the next practice without turning it into a performance."
            ctaLabel="Create a small practice"
            feature="PRACTICE_PREP"
            sourceType="PRACTICE_PROMPT"
            sourceId={nextPrompt.id}
            promptId={nextPrompt.id}
            inputSummary={nextPrompt.title}
            onGenerate={() =>
              aiService.generatePracticePrep(nextPrompt, {
                userId: currentUser?.id || "user-alex",
                displayName: currentUser?.displayName || "Alex",
                cohortId: currentUser?.cohortId || "founding-circle",
                trustLevelLabel: trustSummary.levelLabel,
                goalText: currentUser?.goalText ?? null,
                startingLevel: currentUser?.startingLevel ?? null,
                contextTags: currentUser?.contextTags ?? [],
                directionTitle: snapshot.directions.find((d) => d.id === currentUser?.currentDirectionId)?.title ?? null,
              })
            }
          />
        )}

        {nextPrompt && (
          <section className="space-y-3">
            <SectionLabel title="Tips from people who've done this" />
            {tips.length > 0 ? (
              tips.map((tip) => <TipCard key={tip.id} tip={tip} />)
            ) : (
              <p className="text-sm leading-6 text-[#6E6E6E]">
                {canShareTip ? "No tips yet — be the first to share what helped." : "No tips yet."}
              </p>
            )}
            <TipComposer promptId={nextPrompt.id} canShare={canShareTip} />
          </section>
        )}

        {masteryMode
          ? snapshot.directions.map((direction) => {
              const skills = snapshot.skills.filter((s) => s.directionId === direction.id);
              if (skills.length === 0) return null;
              const progress = directionProgress(direction, snapshot.skills, snapshot.prompts, snapshot.completedPracticeIds);
              return (
                <section key={direction.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <SectionLabel title={direction.title} />
                    <Badge tone={progress.done > 0 ? "gold" : "muted"}>
                      {progress.done}/{progress.total} levels
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {skills.map((skill) => (
                      <SkillLadderRow key={skill.id} skill={skill} prompts={snapshot.prompts} completedIds={snapshot.completedPracticeIds} />
                    ))}
                  </div>
                </section>
              );
            })
          : snapshot.directions.map((direction) => {
              // Fallback/demo content has no skill ladder — keep the flat list.
              const prompts = snapshot.prompts.filter((prompt) => prompt.directionId === direction.id);
              return (
                <section key={direction.id} className="space-y-3">
                  <SectionLabel title={direction.title} />
                  {prompts.map((prompt) => {
                    const completed = snapshot.completedPracticeIds.includes(prompt.id);
                    return (
                      <div key={prompt.id} className="space-y-2">
                        <PracticePromptCard prompt={prompt} completed={completed} />
                        {!completed && (
                          <Button className="w-full" variant="secondary" onClick={() => completePractice(prompt.id)}>
                            <CheckCircle2 size={17} /> I did this already
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </section>
              );
            })}
      </div>
    </AppShell>
  );
}
