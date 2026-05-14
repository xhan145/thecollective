"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { ExternalLink, FileAudio, FileText, Image, Link as LinkIcon, ListChecks, Monitor, PlaySquare, Send, UploadCloud } from "lucide-react";
import { getAcceptForProofType, createDemoMediaRecord, formatFileSize, isValidHttpUrl, proofTypeLabels, proofTypeToMediaKind, validateProofFile } from "@/lib/media/proofMedia";
import type { MediaAwareFeedback, ProofMediaRecord, ProofSubmission, ProofType, ProofVisibility } from "@/lib/types";
import { ProofMediaCard } from "./ProofMediaCard";

const proofOptions: Array<{ type: ProofType; label: string; icon: typeof FileText; hint: string }> = [
  { type: "text", label: "Write text", icon: FileText, hint: "Fast private draft" },
  { type: "image", label: "Upload image", icon: Image, hint: "Visual progress" },
  { type: "video", label: "Upload video", icon: PlaySquare, hint: "Show the attempt" },
  { type: "audio", label: "Upload audio", icon: FileAudio, hint: "Practice voice or tone" },
  { type: "document", label: "Upload document/PDF", icon: FileText, hint: "Work sample or notes" },
  { type: "screenshot", label: "Screenshot", icon: Monitor, hint: "Message, task, or result" },
  { type: "link", label: "Add link", icon: LinkIcon, hint: "URL proof" },
  { type: "checklist", label: "Checklist/reflection", icon: ListChecks, hint: "Small steps completed" }
];

const defaultFeedback: MediaAwareFeedback = {
  summary: "Proof saved in demo mode.",
  whatWorked: "You captured a concrete attempt and reflected on it.",
  whatCouldImprove: "Make the feedback request specific so reviewers know what kind of help you want.",
  nextStep: "Review the feedback, then choose one small improvement for the next practice.",
  reflectionQuestion: "What did this proof make visible that would otherwise be easy to miss?",
  riskLevel: "low",
  confidenceScore: 0.74,
  mediaNotes: "Demo mode stores metadata only and does not upload files to Supabase."
};

export function ProofComposer() {
  const [proofType, setProofType] = useState<ProofType>("text");
  const [textResponse, setTextResponse] = useState("");
  const [reflection, setReflection] = useState("");
  const [feedbackRequest, setFeedbackRequest] = useState("");
  const [visibility, setVisibility] = useState<ProofVisibility>("private");
  const [linkUrl, setLinkUrl] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [mediaRecord, setMediaRecord] = useState<ProofMediaRecord | undefined>();
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedOption = proofOptions.find((option) => option.type === proofType) || proofOptions[0];
  const SelectedIcon = selectedOption.icon;
  const needsFile = ["image", "video", "audio", "document", "screenshot"].includes(proofType);
  const checklistItems = useMemo(() => checklistText.split("\n").map((item) => item.trim()).filter(Boolean), [checklistText]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function resetMedia(nextType: ProofType) {
    setProofType(nextType);
    setFile(null);
    setMediaRecord(undefined);
    setError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(undefined);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    setError("");
    setFile(null);
    setMediaRecord(undefined);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(undefined);
    if (!selected) return;

    const validation = validateProofFile(selected, proofType);
    if (!validation.valid) {
      setError(validation.error || "Choose a supported file.");
      event.target.value = "";
      return;
    }
    const objectUrl = URL.createObjectURL(selected);
    setFile(selected);
    setPreviewUrl(objectUrl);
    setMediaRecord(createDemoMediaRecord(selected, proofType, objectUrl));
  }

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (needsFile && !file) {
      setError("Choose a file before submitting this proof type.");
      return;
    }
    if (proofType === "link" && !isValidHttpUrl(linkUrl)) {
      setError("Add a valid http or https link.");
      return;
    }
    if (proofType === "checklist" && checklistItems.length === 0) {
      setError("Add at least one checklist item or reflection line.");
      return;
    }
    if (!reflection.trim()) {
      setError("Add a short reflection so feedback has context.");
      return;
    }

    const proof: ProofSubmission = {
      id: `demo-proof-${Date.now()}`,
      pathSlug: "speak-up",
      pathTitle: "Speak Up",
      promptId: "speak-up-1",
      promptTitle: "One Honest Sentence",
      promptInstruction: "Write one sentence you would say if you were being honest but respectful.",
      proofType,
      mediaKind: mediaRecord?.mediaKind || proofTypeToMediaKind(proofType),
      textResponse: textResponse.trim() || undefined,
      linkUrl: proofType === "link" ? linkUrl.trim() : undefined,
      checklistItems: proofType === "checklist" ? checklistItems : undefined,
      media: mediaRecord,
      uploadStatus: "demo-uploaded",
      visibility,
      feedbackRequest: feedbackRequest.trim() || undefined,
      reflection: reflection.trim(),
      status: "feedback-ready",
      feedbackStatus: "ready",
      createdAt: new Date().toISOString()
    };

    let feedback = defaultFeedback;
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathTitle: proof.pathTitle,
          promptTitle: proof.promptTitle,
          promptInstruction: proof.promptInstruction,
          proofType,
          textResponse: proof.textResponse,
          mediaMetadata: mediaRecord,
          fileName: mediaRecord?.fileName,
          fileType: mediaRecord?.fileType,
          fileSize: mediaRecord?.fileSize,
          linkUrl: proof.linkUrl,
          reflection: proof.reflection,
          feedbackRequest: proof.feedbackRequest,
          visibility
        })
      });
      if (response.ok) feedback = await response.json();
    } catch {
      feedback = defaultFeedback;
    }

    sessionStorage.setItem("collective.demo.latestProof", JSON.stringify(proof));
    sessionStorage.setItem("collective.demo.latestFeedback", JSON.stringify(feedback));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="card p-5 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-green/15 text-green"><UploadCloud size={24} /></div>
          <h2 className="text-xl font-black">Proof uploaded in demo mode</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">No Supabase key is required. The prototype saved proof metadata locally and prepared fallback feedback for this {proofTypeLabels[proofType].toLowerCase()} proof.</p>
          <Link href="/feedback" className="btn-primary mt-5 w-full">View feedback</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submitProof}>
      <div className="card p-4">
        <p className="text-sm font-black">Choose proof type</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {proofOptions.map((option) => {
            const Icon = option.icon;
            const active = option.type === proofType;
            return (
              <button key={option.type} type="button" onClick={() => resetMedia(option.type)} className={`rounded-2xl border p-3 text-left transition ${active ? "border-purple2 bg-purple/20 text-white" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                <div className="flex items-center gap-2">
                  <Icon size={17} className={active ? "text-purple2" : "text-slate-500"} />
                  <span className="text-xs font-black">{option.label}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{option.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2">
          <SelectedIcon size={18} className="text-purple2" />
          <div>
            <p className="font-black">{selectedOption.label}</p>
            <p className="text-xs text-slate-500">Demo mode validates files, stores metadata, and skips real upload.</p>
          </div>
        </div>

        {needsFile && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold">Upload file</label>
            <input className="input" type="file" accept={getAcceptForProofType(proofType)} onChange={onFileChange} />
            <p className="mt-2 text-xs text-slate-500">Limit: {formatFileSize((proofType === "video" ? 200 : proofType === "audio" ? 50 : proofType === "document" ? 25 : 10) * 1024 * 1024)}</p>
            {mediaRecord && <div className="mt-3"><ProofMediaCard media={mediaRecord} /></div>}
          </div>
        )}

        {proofType === "text" && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold">Text proof</label>
            <textarea value={textResponse} onChange={(event) => setTextResponse(event.target.value)} className="input min-h-32" placeholder="Example: I wrote a direct but respectful message asking for more time." />
          </div>
        )}

        {proofType === "link" && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold">Proof link</label>
            <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} className="input" placeholder="https://example.com/your-proof" />
            {isValidHttpUrl(linkUrl) && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-sm font-black"><ExternalLink size={16} className="text-purple2" /> Link preview</div>
                <p className="mt-1 break-all text-xs text-slate-400">{linkUrl}</p>
              </div>
            )}
          </div>
        )}

        {proofType === "checklist" && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold">Checklist items</label>
            <textarea value={checklistText} onChange={(event) => setChecklistText(event.target.value)} className="input min-h-32" placeholder={"One completed step per line\nExample: Wrote the sentence\nRead it out loud\nChose one next step"} />
          </div>
        )}
      </div>

      <div className="card space-y-4 p-4">
        <div>
          <label className="mb-2 block text-sm font-bold">What did you notice?</label>
          <textarea value={reflection} onChange={(event) => setReflection(event.target.value)} className="input min-h-24" placeholder="Example: I wanted to soften the ask even though it was reasonable." />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold">What do you want feedback on?</label>
          <input value={feedbackRequest} onChange={(event) => setFeedbackRequest(event.target.value)} className="input" placeholder="Clarity, tone, courage, next step..." />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold">Visibility</label>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value as ProofVisibility)} className="input">
            <option value="private">Private</option>
            <option value="reviewers">Selected reviewers</option>
            <option value="path">Path members</option>
            <option value="public">Public</option>
          </select>
        </div>
      </div>

      {error && <p className="rounded-2xl border border-orange/30 bg-orange/10 p-3 text-sm text-orange">{error}</p>}
      <button className="btn-primary w-full" type="submit"><Send size={16} />Submit proof</button>
    </form>
  );
}
