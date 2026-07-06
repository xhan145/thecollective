"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProofMediaType } from "@/lib/betaTypes";
import { AppShell } from "@/components/beta/AppShell";
import { AiSupportCard } from "@/components/beta/AiSupportCard";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { AttachmentPicker, ProofTypeSelector, type AttachmentDraft } from "@/components/beta/ProofComponents";
import { Button, Card, PageHeader, SuccessState, TextArea } from "@/components/beta/ui";
import { getCollectiveAiService } from "@/lib/aiService";
import { levelStatus } from "@/lib/mastery";
import { evaluateAchievements } from "@/lib/supabase/badgesRepository";
import { DEMO_ACHIEVEMENTS } from "@/lib/badges/demo";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function NewProofPage() {
  const params = useParams<{ promptId: string }>();
  const router = useRouter();
  const { snapshot, currentUser, trustSummary, supabaseEnabled, getPromptById, submitProof, logEvent } = useBetaApp();
  const promptId = params.promptId || "conf-s1";
  const prompt = getPromptById(promptId);
  const [mediaType, setMediaType] = useState<ProofMediaType>("text");

  // ── Mastery level context (content-mastery Tasks B+C) ──────────────
  const skill = prompt?.skillId ? snapshot.skills.find((s) => s.id === prompt.skillId) : undefined;
  const isMastery = Boolean(skill && prompt?.levelNumber);
  // Constrain proof types to the level's proof_type; text stays as the
  // beginner-safe fallback. `mixed`/absent → all types.
  const requiredType = prompt?.proofType && prompt.proofType !== "mixed" ? prompt.proofType : null;
  const allowedTypes: ProofMediaType[] | undefined = requiredType
    ? (Array.from(new Set([requiredType, "text"])) as ProofMediaType[])
    : undefined;
  // Preselect the level's proof type once (don't fight later user choice).
  const preselected = useRef(false);
  useEffect(() => {
    if (!preselected.current && requiredType && requiredType !== "text") {
      preselected.current = true;
      setMediaType(requiredType as ProofMediaType);
    }
  }, [requiredType]);
  // Client lock guard: a locked level bounces back to the ladder calmly.
  // (Server-side enforcement is Task D of the parent spec.)
  useEffect(() => {
    if (prompt && isMastery && levelStatus(prompt, snapshot.completedPracticeIds, snapshot.prompts) === "locked") {
      router.replace("/practice");
    }
  }, [prompt, isMastery, snapshot.completedPracticeIds, snapshot.prompts, router]);
  // The level this submission unlocks (for the success state).
  const nextLevel = isMastery
    ? snapshot.prompts.find((p) => p.skillId === prompt?.skillId && p.levelNumber === (prompt?.levelNumber ?? 0) + 1)
    : undefined;
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<AttachmentDraft | undefined>();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const aiService = getCollectiveAiService();

  // MVP upload limits (bytes). Keep text/caption safe even when a file is rejected.
  const SIZE_LIMITS: Record<string, number> = {
    image: 10 * 1024 * 1024,
    audio: 25 * 1024 * 1024,
    video: 100 * 1024 * 1024
  };
  function validateAttachment(): string | null {
    if (!attachment?.file) return null;
    const kind = attachment.mediaType;
    const limit = SIZE_LIMITS[kind];
    if (limit && attachment.sizeBytes > limit) {
      return `That ${kind} is too large for this beta (max ${Math.round(limit / (1024 * 1024))} MB). Your text is still here.`;
    }
    const mime = attachment.mimeType || attachment.file.type || "";
    if (kind === "image" && !mime.startsWith("image/")) return "That file is not an image. Your text is still here.";
    if (kind === "audio" && !mime.startsWith("audio/")) return "That file is not audio. Your text is still here.";
    if (kind === "video" && !mime.startsWith("video/")) return "That file is not a video. Your text is still here.";
    return null;
  }

  async function handleSubmit() {
    if (!body.trim() && !attachment) {
      setError("Add a short reflection or attach proof before submitting.");
      return;
    }
    const fileError = validateAttachment();
    if (fileError) {
      setError(fileError);
      return;
    }
    setError("");
    setSubmitting(true);
    logEvent("proof_submit_started", { promptId, mediaType });
    try {
      const { proof, error: saveError } = await submitProof({ promptId, body, mediaType, attachment });
      if (saveError) {
        // Text is preserved in state — the user can simply try again.
        setError(saveError);
        return;
      }
      if (proof) {
        setSubmittedId(proof.id);
        // Calm unlock moment: check for newly earned badges right after the
        // rep that may have earned them (recognition, never a reward loop).
        const client = supabaseEnabled ? getSupabaseClient() : null;
        if (client) {
          evaluateAchievements(client)
            .then((slugs) => { if (slugs.length) setNewBadges(slugs); })
            .catch(() => {});
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId) {
    return (
      <AppShell>
        <SuccessState
          title="Proof saved."
          body={prompt?.nextStep ? `Next: ${prompt.nextStep}` : "Feedback can come next."}
          cta={
            <div className="w-full space-y-2">
              {newBadges.length > 0 && (
                <Link href="/badges" className="block rounded-2xl bg-[#FFF1C7] px-4 py-3 text-center text-sm font-extrabold text-[#7A5300]">
                  Badge earned: {newBadges.map((slug) => DEMO_ACHIEVEMENTS.find((b) => b.slug === slug)?.name ?? slug).join(", ")}
                </Link>
              )}
              {nextLevel && (
                <Link
                  href={`/proof/new/${nextLevel.id}`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#FFB000] to-[#F2A900] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(242,169,0,0.32)]"
                >
                  Next level unlocked: {nextLevel.levelName ?? nextLevel.title}
                </Link>
              )}
              <Button onClick={() => router.push(`/proof/${submittedId}`)} variant={nextLevel ? "secondary" : "primary"} className="w-full">
                View proof
              </Button>
            </div>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Submit proof" subtitle="Show what you practiced. It does not need to be perfect." />
        <Card className="p-5">
          {isMastery && skill ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1C7] px-3 py-1 text-xs font-extrabold text-[#7A5300]">
              {skill.name} · Level {prompt?.levelNumber} · {prompt?.levelName}
            </span>
          ) : (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F2A900]">Practice prompt</p>
          )}
          <h2 className="mt-2 text-xl font-extrabold text-[#111111]">{prompt?.title || "Practice proof"}</h2>
          {isMastery && prompt?.masteryGoal && (
            <p className="mt-2 rounded-2xl bg-[#FFF8EE] px-3.5 py-2.5 text-sm font-bold leading-6 text-[#38322A]">
              Goal: {prompt.masteryGoal}
            </p>
          )}
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{prompt?.proofPrompt || prompt?.prompt || "Capture one small example of progress."}</p>
          {isMastery && prompt?.doesNotCount && (
            <p className="mt-2 text-xs leading-5 text-[#9B958B]">
              <span className="font-extrabold text-[#B07A00]">What doesn&rsquo;t count:</span> {prompt.doesNotCount}
            </p>
          )}
          {isMastery && prompt?.safetyNote && (
            <p className="mt-2 text-xs leading-5 text-[#9B958B]">{prompt.safetyNote}</p>
          )}
          {currentUser?.goalText && (
            <p className="mt-2 text-xs leading-5 text-[#7A5300]">Toward your goal: "{currentUser.goalText}" — it doesn't need to be perfect.</p>
          )}
        </Card>
        <AiSupportCard
          title="Help me prepare"
          description="AI can help you choose a safe proof shape and a focused feedback request."
          ctaLabel="Help me prepare"
          feature="PROOF_PREP"
          sourceType="PRACTICE_PROMPT"
          sourceId={promptId}
          promptId={promptId}
          inputSummary={prompt?.title || "Proof prep"}
          onGenerate={() =>
            aiService.prepareProof(prompt, {
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
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#111111]">Proof type</h2>
            <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">Proof is private in this prototype. You can share more later. Start with what feels safe.</p>
          </div>
          <ProofTypeSelector
            value={mediaType}
            allowed={allowedTypes}
            onChange={(type) => {
              setMediaType(type);
              setAttachment(undefined);
              setError("");
            }}
          />
          {requiredType && requiredType !== "text" && (
            <p className="text-xs leading-5 text-[#9B958B]">
              This practice works best as {requiredType === "audio" ? "an audio clip" : requiredType === "video" ? "a short video" : `a ${requiredType}`} — text is fine too if that&rsquo;s easier today.
            </p>
          )}
          <div>
            <label className="mb-2 block text-sm font-extrabold text-[#111111]">What did you practice or improve?</label>
            <TextArea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a short reflection..." />
          </div>
          <AiSupportCard
            title="Reflect on this"
            description="AI can help you notice what you practiced and choose one next small step. It will not judge the proof."
            ctaLabel="Reflect on this"
            feature="REFLECTION_HELPER"
            sourceType="PRACTICE_PROMPT"
            sourceId={promptId}
            promptId={promptId}
            inputSummary={body.trim() || prompt?.title || "Proof reflection"}
            onGenerate={() =>
              aiService.generateReflectionHelp(null, body, prompt, {
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
          <AttachmentPicker mediaType={mediaType} attachment={attachment} onAttachment={setAttachment} onRemove={() => setAttachment(undefined)} />
          {error && <p className="rounded-[18px] bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">{error}</p>}
          <p className="text-center text-xs leading-5 text-[#6E6E6E]">Only share what you are comfortable sharing.</p>
          <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Saving…" : "Submit proof"}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
