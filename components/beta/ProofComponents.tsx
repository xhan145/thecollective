"use client";

import Link from "next/link";
import { FileAudio, FileText, Image, PlaySquare, Upload, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import type { Feedback, Proof, ProofAttachment, ProofMediaType } from "@/lib/betaTypes";
import { Button, ButtonLink, Card, TextArea } from "./ui";
import { Avatar } from "./Avatar";

export type AttachmentDraft = Omit<ProofAttachment, "id" | "storagePath"> & { file?: File };

const mediaLabels: Record<ProofMediaType, string> = {
  text: "Text reflection",
  image: "Image proof",
  video: "Video proof",
  audio: "Audio proof"
};

const mediaAccept: Record<ProofMediaType, string> = {
  text: "",
  image: "image/*",
  video: "video/*",
  audio: "audio/*"
};

export function mediaTypeLabel(type: ProofMediaType) {
  return mediaLabels[type];
}

export function ProofMediaIcon({ type, className = "text-[#F2A900]" }: { type: ProofMediaType; className?: string }) {
  const Icon = type === "image" ? Image : type === "video" ? PlaySquare : type === "audio" ? FileAudio : FileText;
  return <Icon className={className} size={20} />;
}

export function AttachmentPicker({
  mediaType,
  attachment,
  onAttachment,
  onRemove
}: {
  mediaType: ProofMediaType;
  attachment?: AttachmentDraft;
  onAttachment: (attachment: AttachmentDraft) => void;
  onRemove: () => void;
}) {
  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    onAttachment({
      mediaType,
      fileName: file.name,
      mimeType: file.type || `${mediaType}/*`,
      sizeBytes: file.size,
      localUrl,
      file
    });
  }

  if (mediaType === "text") {
    return (
      <div className="rounded-[18px] border border-[#EFE7D8] bg-[#FFF8EE] p-4">
        <div className="flex items-center gap-3">
          <ProofMediaIcon type="text" />
          <div>
            <p className="text-sm font-extrabold text-[#111111]">Text reflection selected</p>
            <p className="text-xs text-[#6E6E6E]">Proof can stay simple while you practice.</p>
          </div>
        </div>
      </div>
    );
  }

  if (attachment) {
    return <AttachmentPreview attachment={attachment} onRemove={onRemove} />;
  }

  return (
    <label className="block cursor-pointer rounded-[18px] border border-dashed border-[#E0CFAE] bg-[#FFF8EE] p-4 transition active:scale-[0.99]" aria-label={`Attach ${mediaType} proof`}>
      <input type="file" className="sr-only" accept={mediaAccept[mediaType]} onChange={onFileChange} />
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF1C7] text-[#F2A900]">
          <Upload size={20} />
        </div>
        <div>
          <p className="text-sm font-extrabold text-[#111111]">Attach {mediaType}</p>
          <p className="text-xs leading-5 text-[#6E6E6E]">Optional. Only share what you are comfortable sharing.</p>
        </div>
      </div>
    </label>
  );
}

export function AttachmentPreview({ attachment, onRemove }: { attachment: AttachmentDraft | ProofAttachment; onRemove?: () => void }) {
  return (
    <div className="rounded-[18px] border border-[#EFE7D8] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#FFF1C7] text-[#F2A900]">
          {attachment.mediaType === "image" && attachment.localUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachment.localUrl} alt="Proof thumbnail" className="h-full w-full object-cover" />
          ) : (
            <ProofMediaIcon type={attachment.mediaType} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-[#111111]">{mediaTypeLabel(attachment.mediaType)} attached</p>
          <p className="truncate text-xs text-[#6E6E6E]">{attachment.fileName}</p>
        </div>
        {onRemove && (
          <button type="button" onClick={onRemove} className="grid h-11 w-11 place-items-center rounded-full bg-[#FFF8EE] text-[#6E6E6E]" aria-label="Remove attachment">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export function ProofTypeSelector({ value, onChange }: { value: ProofMediaType; onChange: (type: ProofMediaType) => void }) {
  const options: ProofMediaType[] = ["text", "image", "video", "audio"];
  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map((type) => {
        const active = type === value;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`min-h-16 rounded-[16px] border p-2 text-center transition active:scale-[0.98] ${active ? "border-[#F2A900] bg-[#FFF1C7] text-[#111111]" : "border-[#EFE7D8] bg-white text-[#6E6E6E]"}`}
            aria-label={`Select ${mediaTypeLabel(type)}`}
          >
            <ProofMediaIcon type={type} className={active ? "mx-auto text-[#F2A900]" : "mx-auto text-[#8D877F]"} />
            <span className="mt-1 block text-[11px] font-extrabold capitalize">{type}</span>
          </button>
        );
      })}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  const m = Math.floor(diff / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

// Render only after mount so SSR/client markup matches (no hydration warning).
function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(timeAgo(iso));
  }, [iso]);
  return <>{label}</>;
}

export function ProofCard({ proof, feedbackCount, authorName, authorAvatarUrl }: { proof: Proof; feedbackCount: number; authorName?: string; authorAvatarUrl?: string }) {
  const name = authorName || "A member";
  const showDemoBadge = proof.isDemo && process.env.NEXT_PUBLIC_SHOW_DEMO_BADGES === "true";
  const thumb = proof.attachments[0]?.localUrl || proof.thumbnailUrl || proof.mediaUrl;
  return (
    <Link href={`/proof/${proof.id}`} aria-label={`Proof detail for ${proof.title}`}>
      <Card interactive className="p-3">
        <div className="mb-2.5 flex items-center gap-2">
          <Avatar name={name} avatarUrl={authorAvatarUrl} size={28} />
          <span className="truncate text-xs font-extrabold text-[#111111]">{name}</span>
          <span className="text-[#D9CDB8]">•</span>
          <span className="shrink-0 text-xs text-[#9B958B]"><TimeAgo iso={proof.createdAt} /></span>
          {showDemoBadge && (
            <span className="ml-auto shrink-0 rounded-full bg-[#FFF8EE] px-2 py-0.5 text-[10px] font-bold text-[#9B958B]">Sample</span>
          )}
        </div>
        <div className="flex gap-3">
          <div className="grid h-[72px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-[16px] bg-gradient-to-br from-[#FFF1C7] to-[#FFD986] text-[#8A5D00]">
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="Proof thumbnail" className="h-full w-full object-cover" />
            ) : (
              <ProofMediaIcon type={proof.mediaType} className="text-[#8A5D00]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-extrabold leading-5 text-[#111111]">{proof.title}</h3>
            <p className="mt-1 text-xs text-[#6E6E6E]">{mediaTypeLabel(proof.mediaType)}</p>
            <p className="mt-2 text-xs font-bold text-[#F2A900]">{feedbackCount ? `${feedbackCount} feedback note${feedbackCount === 1 ? "" : "s"}` : "No feedback yet"}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ProofDetail({ proof, feedback }: { proof: Proof; feedback: Feedback[] }) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FFF1C7] text-[#F2A900]">
            <ProofMediaIcon type={proof.mediaType} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6E6E6E]">{mediaTypeLabel(proof.mediaType)}</p>
            <h1 className="mt-1 text-[24px] font-extrabold leading-tight text-[#111111]">{proof.title}</h1>
          </div>
        </div>
        {proof.body && <p className="mt-4 rounded-[18px] bg-[#FFF8EE] p-4 text-sm leading-6 text-[#38322A]">{proof.body}</p>}
        {proof.attachments[0] && <div className="mt-4"><AttachmentPreview attachment={proof.attachments[0]} /></div>}
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-extrabold text-[#111111]">Feedback</h2>
        <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">Feedback helps you improve. It does not define you.</p>
        <div className="mt-4 space-y-2">
          {feedback.length ? (
            feedback.map((item) => {
              const hasNotes = item.clarityNote || item.usefulNote || item.nextStepNote;
              return (
                <div key={item.id} className="space-y-2 rounded-[16px] bg-[#FFF8EE] p-3 text-sm leading-6 text-[#38322A]">
                  {hasNotes ? (
                    <>
                      {item.clarityNote && <FeedbackNote label="What was clear" value={item.clarityNote} />}
                      {item.usefulNote && <FeedbackNote label="What could be improved" value={item.usefulNote} />}
                      {item.nextStepNote && <FeedbackNote label="One useful next step" value={item.nextStepNote} />}
                    </>
                  ) : (
                    item.body
                  )}
                </div>
              );
            })
          ) : (
            <p className="rounded-[16px] bg-[#FFF8EE] p-3 text-sm leading-6 text-[#6E6E6E]">No feedback yet. Feedback can come next.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function FeedbackNote({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#9B958B]">{label}</p>
      <p className="text-sm leading-6 text-[#38322A]">{value}</p>
    </div>
  );
}

export function FeedbackForm({ onSubmit }: { onSubmit: (body: string) => void }) {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const body = String(data.get("body") || "");
        onSubmit(body);
        form.reset();
      }}
    >
      <TextArea name="body" placeholder="Write one specific thing that worked and one useful next step..." required />
      <Button type="submit" className="w-full">Send feedback</Button>
    </form>
  );
}

export function ProofSubmitActions({ promptId }: { promptId: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <ButtonLink href="/home" variant="secondary">Maybe later</ButtonLink>
      <ButtonLink href={`/proof/new/${promptId}`}>Submit proof</ButtonLink>
    </div>
  );
}
