"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { ExternalLink, FileAudio, FileText, Image, Link as LinkIcon, ListChecks, Monitor, PlaySquare, Send, UploadCloud } from "lucide-react";
import { uploadProofMedia } from "@/lib/mediaUpload";
import { getAcceptForProofType, createDemoMediaRecord, formatFileSize, isValidHttpUrl, proofTypeLabels, proofTypeToMediaKind, validateProofFile } from "@/lib/media/proofMedia";
import type { MediaAwareFeedback, ProofMediaRecord, ProofSubmission, ProofType, ProofVisibility } from "@/lib/types";
import type { MvpProofVisibility, PracticeArea } from "@/lib/proofModels";
import { MediaPickerCard } from "./MediaPickerCard";
import { PracticeAreaSelector } from "./PracticeAreaSelector";
import { ProofMediaCard } from "./ProofMediaCard";
import { UploadProgressBar } from "./UploadProgressBar";
import { VisibilitySelector } from "./VisibilitySelector";
import { Pill, SectionHeader } from "./ui";

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
  const [title, setTitle] = useState("");
  const [practiceArea, setPracticeArea] = useState<PracticeArea>("communication");
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
  const [draftSaved, setDraftSaved] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const selectedOption = proofOptions.find((option) => option.type === proofType) || proofOptions[0];
  const SelectedIcon = selectedOption.icon;
  const needsFile = ["image", "video", "audio", "document", "screenshot"].includes(proofType);
  const usesMvpMediaPicker = proofType === "image" || proofType === "video";
  const mvpVisibility: MvpProofVisibility = visibility === "feedback-only" || visibility === "public" ? visibility : "private";
  const checklistItems = useMemo(() => checklistText.split("\n").map((item) => item.trim()).filter(Boolean), [checklistText]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function resetMedia(nextType: ProofType) {
    setProofType(nextType);
    setFile(null);
    setMediaRecord(undefined);
    setError("");
    setDraftSaved(false);
    setUploadProgress(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(undefined);
  }

  function removeSelectedMedia() {
    setFile(null);
    setMediaRecord(undefined);
    setUploadProgress(0);
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

  function onMvpMediaSelected(selected: File, objectUrl: string, selectedMediaType: "image" | "video") {
    removeSelectedMedia();
    setError("");
    setProofType(selectedMediaType);
    setFile(selected);
    setPreviewUrl(objectUrl);
    setMediaRecord(createDemoMediaRecord(selected, selectedMediaType, objectUrl));
  }

  function getPathTitleForPracticeArea(area: PracticeArea) {
    if (area === "momentum") return "Daily Momentum";
    if (area === "contribution") return "Give Better Feedback";
    return "Speak Up";
  }

  function buildProof(status: ProofSubmission["status"], feedbackStatus: ProofSubmission["feedbackStatus"], uploadedMedia = mediaRecord): ProofSubmission {
    return {
      id: `demo-proof-${Date.now()}`,
      pathSlug: practiceArea === "momentum" ? "daily-momentum" : practiceArea === "contribution" ? "give-better-feedback" : "speak-up",
      pathTitle: getPathTitleForPracticeArea(practiceArea),
      promptId: "speak-up-1",
      promptTitle: title.trim() || "Submitted practice proof",
      promptInstruction: "Show what you practiced. Proof can be imperfect.",
      proofType,
      mediaKind: uploadedMedia?.mediaKind || proofTypeToMediaKind(proofType),
      textResponse: textResponse.trim() || undefined,
      linkUrl: proofType === "link" ? linkUrl.trim() : undefined,
      checklistItems: proofType === "checklist" ? checklistItems : undefined,
      media: uploadedMedia,
      uploadStatus: uploadedMedia?.uploadStatus || "demo-uploaded",
      visibility,
      feedbackRequest: feedbackRequest.trim() || undefined,
      reflection: reflection.trim(),
      status,
      feedbackStatus,
      createdAt: new Date().toISOString()
    };
  }

  function saveDraft() {
    setError("");
    const draft = buildProof("draft", "not-requested");
    sessionStorage.setItem("collective.demo.latestProof", JSON.stringify(draft));
    setDraftSaved(true);
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

    let uploadedMedia = mediaRecord;
    if (file && (proofType === "image" || proofType === "video")) {
      try {
        const upload = await uploadProofMedia(file, { previewUrl, onProgress: setUploadProgress });
        uploadedMedia = {
          ...(mediaRecord || createDemoMediaRecord(file, proofType, upload.url)),
          fileUrl: upload.url,
          thumbnailUrl: upload.thumbnailUrl,
          storagePath: upload.storagePath,
          uploadStatus: upload.isMockUpload ? "demo-uploaded" : "uploaded"
        };
        setMediaRecord(uploadedMedia);
      } catch {
        setError("We could not upload this right now. Your reflection is still safe.");
        return;
      }
    }

    const proof = buildProof("feedback-ready", "ready", uploadedMedia);

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
        <div className="glass-panel p-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-green/15 text-green shadow-soft"><UploadCloud size={24} /></div>
          <h2 className="text-xl font-black">Proof uploaded in demo mode</h2>
          <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">No Supabase key is required. The prototype saved proof metadata locally and prepared fallback feedback for this {proofTypeLabels[proofType].toLowerCase()} proof.</p>
          <Link href="/feedback" className="btn-primary mt-5 w-full">View feedback</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submitProof}>
      <div className="glass-panel p-5">
        <Pill tone="accent">Guided proof</Pill>
        <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight">Submit proof</h2>
        <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">Show what you practiced. Proof can be imperfect, private, and small.</p>
        <div className="mt-4">
          <label className="mb-2 block text-sm font-bold">Proof title</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="input" placeholder="Example: First direct ask practice" />
        </div>
        <div className="mt-4">
          <label className="mb-2 block text-sm font-bold">Practice area</label>
          <PracticeAreaSelector value={practiceArea} onChange={setPracticeArea} />
        </div>
      </div>

      <div className="soft-card p-4">
        <SectionHeader eyebrow="Format" title="Choose proof type" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          {proofOptions.map((option) => {
            const Icon = option.icon;
            const active = option.type === proofType;
            return (
              <button key={option.type} type="button" onClick={() => resetMedia(option.type)} className={`chip-button rounded-[22px] border p-3 text-left transition ${active ? "border-purple2/50 bg-purple/15 text-white shadow-soft" : "border-white/10 bg-white/[0.04] text-[#c8c2b8]"}`}>
                <div className="flex items-center gap-2">
                  <Icon size={17} className={active ? "text-purple2" : "text-[#8f887e]"} />
                  <span className="text-xs font-black">{option.label}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#8f887e]">{option.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="soft-card p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-purple/15 text-purple2"><SelectedIcon size={18} /></span>
          <div>
            <p className="font-black">{selectedOption.label}</p>
            <p className="text-xs text-[#8f887e]">Demo mode validates files, stores metadata, and skips real upload.</p>
          </div>
        </div>

        {usesMvpMediaPicker && (
          <div className="mt-4">
            <MediaPickerCard
              mediaUrl={previewUrl}
              mediaType={file ? (proofType === "video" ? "video" : "image") : "none"}
              onFileSelected={onMvpMediaSelected}
              onRemove={removeSelectedMedia}
              onError={setError}
            />
          </div>
        )}

        {needsFile && !usesMvpMediaPicker && (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold">Upload file</label>
              <input className="input" type="file" accept={getAcceptForProofType(proofType)} onChange={onFileChange} />
            <p className="mt-2 text-xs text-[#8f887e]">Limit: {formatFileSize((proofType === "audio" ? 50 : proofType === "document" ? 25 : 10) * 1024 * 1024)}</p>
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
              <div className="mt-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-sm font-black"><ExternalLink size={16} className="text-purple2" /> Link preview</div>
                <p className="mt-1 break-all text-xs text-[#c8c2b8]">{linkUrl}</p>
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

      <div className="soft-card space-y-4 p-4">
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
          <VisibilitySelector value={mvpVisibility} onChange={(next) => setVisibility(next)} />
        </div>
      </div>

      {error && <p className="rounded-[24px] border border-red/30 bg-red/10 p-3 text-sm text-red">{error}</p>}
      {draftSaved && <p className="rounded-[24px] border border-green/30 bg-green/10 p-3 text-sm text-green">Draft saved in demo mode.</p>}
      {uploadProgress > 0 && uploadProgress < 100 && <UploadProgressBar progress={uploadProgress} />}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn-secondary w-full" type="button" onClick={saveDraft}>Save draft</button>
        <button className="btn-primary w-full" type="submit"><Send size={16} />Submit</button>
      </div>
    </form>
  );
}
