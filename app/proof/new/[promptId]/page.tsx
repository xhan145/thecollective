"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import type { ProofMediaType } from "@/lib/betaTypes";
import { AppShell } from "@/components/beta/AppShell";
import { AiSupportCard } from "@/components/beta/AiSupportCard";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { AttachmentPicker, ProofTypeSelector, type AttachmentDraft } from "@/components/beta/ProofComponents";
import { Button, Card, PageHeader, SuccessState, TextArea } from "@/components/beta/ui";
import { getCollectiveAiService } from "@/lib/aiService";

export default function NewProofPage() {
  const params = useParams<{ promptId: string }>();
  const router = useRouter();
  const { currentUser, trustSummary, getPromptById, submitProof, logEvent } = useBetaApp();
  const promptId = params.promptId || "say-clear-thing";
  const prompt = getPromptById(promptId);
  const [mediaType, setMediaType] = useState<ProofMediaType>("text");
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<AttachmentDraft | undefined>();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
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
      if (proof) setSubmittedId(proof.id);
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId) {
    return (
      <AppShell>
        <SuccessState
          title="Proof saved."
          body="Feedback can come next."
          cta={<Button onClick={() => router.push(`/proof/${submittedId}`)} className="w-full">View proof</Button>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Submit proof" subtitle="Show what you practiced. It does not need to be perfect." />
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F2A900]">Practice prompt</p>
          <h2 className="mt-2 text-xl font-extrabold text-[#111111]">{prompt?.title || "Practice proof"}</h2>
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{prompt?.prompt || "Capture one small example of progress."}</p>
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
              trustLevelLabel: trustSummary.levelLabel
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
            onChange={(type) => {
              setMediaType(type);
              setAttachment(undefined);
              setError("");
            }}
          />
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
                trustLevelLabel: trustSummary.levelLabel
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
