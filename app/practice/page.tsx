"use client";

import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { AiSupportCard } from "@/components/beta/AiSupportCard";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { PracticePromptCard } from "@/components/beta/LoopCards";
import { Button, Card, PageHeader, SectionLabel } from "@/components/beta/ui";
import { getCollectiveAiService } from "@/lib/aiService";
import { getPersonalizedPractices, getNextPractice } from "@/lib/personalization";

export default function PracticePage() {
  const { snapshot, currentUser, trustSummary, completePractice } = useBetaApp();
  const persona = { currentDirectionId: currentUser?.currentDirectionId ?? null, startingLevel: currentUser?.startingLevel ?? null, contextTags: currentUser?.contextTags ?? [] };
  const nextPrompt = getNextPractice(persona, snapshot.prompts, snapshot.completedPracticeIds) || snapshot.prompts[0];
  const aiService = getCollectiveAiService();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Practice" subtitle="Pick one small step. Proof can come after." />
        <Card className="p-5">
          <h2 className="text-xl font-extrabold text-[#111111]">Confident Communication</h2>
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Today is about saying one clear thing with calm confidence.</p>
        </Card>
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

        <section className="space-y-3">
          <SectionLabel title="For you" />
          {getPersonalizedPractices(persona, snapshot.prompts).slice(0, 5).map((prompt) => {
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

        {snapshot.directions.map((direction) => {
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
