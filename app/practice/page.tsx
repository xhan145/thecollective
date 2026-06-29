"use client";

import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { AiSupportCard } from "@/components/beta/AiSupportCard";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { PracticePromptCard } from "@/components/beta/LoopCards";
import { Badge, Button, ButtonLink, Card, PageHeader, SectionLabel } from "@/components/beta/ui";
import { VoiceCoach } from "@/components/VoiceCoach";
import { getCollectiveAiService } from "@/lib/aiService";
import { getNextRecommendedPractice } from "@/lib/contentMastery/contentMasteryQueries";

export default function PracticePage() {
  const { snapshot, currentUser, trustSummary, completePractice } = useBetaApp();
  const nextPrompt = snapshot.prompts.find((prompt) => !snapshot.completedPracticeIds.includes(prompt.id)) || snapshot.prompts[0];
  const recommendedMasteryPractice = getNextRecommendedPractice(currentUser?.id || "user-alex");
  const aiService = getCollectiveAiService();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Practice" subtitle="Pick one small step. Proof can come after." />
        <Card className="p-5">
          <h2 className="text-xl font-extrabold text-[#111111]">Confident Communication</h2>
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Today is about saying one clear thing with calm confidence.</p>
        </Card>
        {recommendedMasteryPractice && (
          <Card className="space-y-4 p-5">
            <div>
              <Badge>Content Mastery</Badge>
              <h2 className="mt-3 text-xl font-extrabold text-[#111111]">{recommendedMasteryPractice.masteryGoal}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{recommendedMasteryPractice.prompt}</p>
            </div>
            <div className="rounded-[18px] bg-[#FFF8EE] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F2A900]">{recommendedMasteryPractice.estimatedMinutes} minute practice</p>
              <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{recommendedMasteryPractice.safetyNote}</p>
            </div>
            <div className="grid gap-2">
              <Button variant="secondary" onClick={() => completePractice(recommendedMasteryPractice.id)}>
                Start practice
              </Button>
              <ButtonLink href={`/proof/new/${recommendedMasteryPractice.id}`} className="w-full">
                Submit proof
              </ButtonLink>
            </div>
          </Card>
        )}
        {nextPrompt && (
          <AiSupportCard
            title="Need a simple plan?"
            description="AI can help you understand the next practice without turning it into a performance."
            ctaLabel="Ask AI"
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
                trustLevelLabel: trustSummary.levelLabel
              })
            }
          />
        )}
        <VoiceCoach />

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
