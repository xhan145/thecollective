"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileAudio, FileText, Image, PlaySquare, Upload, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import type { Feedback, Proof, ProofAttachment, ProofMediaType } from "@/lib/betaTypes";
import { Button, ButtonLink, Card, TextArea } from "./ui";
import { Avatar } from "./Avatar";
import { useBetaApp } from "./AppStateProvider";
import { ReportSheet } from "./ReportSheet";
import { DEMO_ACHIEVEMENTS } from "@/lib/badges/demo";

/** Calm Useful + Save toggles. No counts shown (usefulness over attention). */
export function ProofActions({ proof, compact = false }: { proof: Proof; compact?: boolean }) {
  const { currentUser, isUseful, isSaved, toggleUseful, toggleSaved } = useBetaApp();
  const own = currentUser?.id === proof.userId;
  const useful = isUseful(proof.id);
  const saved = isSaved("proof", proof.id);
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold transition";
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-2.5" : "mt-4"}`}>
      {!own && !proof.isDemo && (
        <button
          type="button"
          onClick={(e) => { stop(e); toggleUseful(proof.id); }}
          aria-pressed={useful}
          className={`${base} ${useful ? "bg-accent text-white" : "bg-surface-soft text-accent-text"}`}
        >
          {useful ? "Marked useful" : "Useful"}
        </button>
      )}
      <button
        type="button"
        onClick={(e) => { stop(e); toggleSaved("proof", proof.id); }}
        aria-pressed={saved}
        className={`${base} ${saved ? "bg-content text-white" : "border border-line bg-surface text-muted"}`}
      >
        {saved ? "Saved for practice" : "Save for practice"}
      </button>
    </div>
  );
}

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

export function ProofMediaIcon({ type, className = "text-accent" }: { type: ProofMediaType; className?: string }) {
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
      <div className="rounded-[18px] border border-line bg-bg p-4">
        <div className="flex items-center gap-3">
          <ProofMediaIcon type="text" />
          <div>
            <p className="text-body font-semibold text-content">Text reflection selected</p>
            <p className="text-caption text-muted">Proof can stay simple while you practice.</p>
          </div>
        </div>
      </div>
    );
  }

  if (attachment) {
    return <AttachmentPreview attachment={attachment} onRemove={onRemove} />;
  }

  return (
    <label className="block cursor-pointer rounded-[18px] border border-dashed border-subtle bg-bg p-4 transition active:scale-[0.99]" aria-label={`Attach ${mediaType} proof`}>
      <input type="file" className="sr-only" accept={mediaAccept[mediaType]} onChange={onFileChange} />
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-soft text-accent">
          <Upload size={20} />
        </div>
        <div>
          <p className="text-body font-semibold text-content">Attach {mediaType}</p>
          <p className="text-caption leading-5 text-muted">Optional. Only share what you are comfortable sharing.</p>
        </div>
      </div>
    </label>
  );
}

export function AttachmentPreview({ attachment, onRemove }: { attachment: AttachmentDraft | ProofAttachment; onRemove?: () => void }) {
  return (
    <div className="rounded-[18px] border border-line bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-soft text-accent">
          {attachment.mediaType === "image" && attachment.localUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachment.localUrl} alt="Proof thumbnail" className="h-full w-full object-cover" />
          ) : (
            <ProofMediaIcon type={attachment.mediaType} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold text-content">{mediaTypeLabel(attachment.mediaType)} attached</p>
          <p className="truncate text-caption text-muted">{attachment.fileName}</p>
        </div>
        {onRemove && (
          <button type="button" onClick={onRemove} className="grid h-11 w-11 place-items-center rounded-full bg-bg text-muted" aria-label="Remove attachment">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export function ProofTypeSelector({ value, onChange, allowed }: { value: ProofMediaType; onChange: (type: ProofMediaType) => void; allowed?: ProofMediaType[] }) {
  // `allowed` constrains options to a mastery level's proof type (text stays
  // in as the beginner-safe fallback — callers include it). Absent = all.
  const all: ProofMediaType[] = ["text", "image", "video", "audio"];
  const options = allowed ? all.filter((t) => allowed.includes(t)) : all;
  return (
    <div className={`grid gap-2 ${options.length === 4 ? "grid-cols-4" : options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((type) => {
        const active = type === value;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`min-h-16 rounded-[16px] border p-2 text-center transition active:scale-[0.98] ${active ? "border-accent bg-surface-soft text-content" : "border-line bg-white text-muted"}`}
            aria-label={`Select ${mediaTypeLabel(type)}`}
          >
            <ProofMediaIcon type={type} className={active ? "mx-auto text-accent" : "mx-auto text-muted"} />
            <span className="mt-1 block text-overline capitalize">{type}</span>
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

export function ProofCard({ proof, feedbackCount, authorName, authorAvatarUrl, relation, canGiveFeedback }: { proof: Proof; feedbackCount: number; authorName?: string; authorAvatarUrl?: string; relation?: import("@/lib/feed/rankProofFeed").FeedRelation; canGiveFeedback?: boolean }) {
  const { isLearningFrom, toggleLearnFrom } = useBetaApp();
  const learning = isLearningFrom(proof.userId);
  const name = authorName || "A member";
  const showDemoBadge = Boolean(proof.isDemo);
  const attachmentUrl = proof.attachments[0]?.localUrl;
  const isVideo = proof.mediaType === "video";
  // A video's own URL is not an image, so rendering it in <img> produces a broken
  // tile. Prefer a real poster image (thumbnailUrl) when present; otherwise show a
  // frame from the video itself via a muted <video> element.
  const imageThumb = isVideo ? proof.thumbnailUrl : attachmentUrl || proof.thumbnailUrl || proof.mediaUrl;
  const videoThumb = isVideo && !imageThumb ? attachmentUrl || proof.mediaUrl : undefined;
  // A single stretched <Link> owns card navigation (keyboard-accessible, valid
  // HTML). Card content is pointer-events-none so clicks fall through to the
  // link; interactive sub-controls re-enable pointer events and sit above it —
  // no nested interactive elements.
  return (
    <Card interactive className="relative p-3">
      <Link href={`/proof/${proof.id}`} aria-label={`Proof detail for ${proof.title}`} className="absolute inset-0 z-[1] rounded-[inherit]" />
      <div className="pointer-events-none relative z-[2]">
        <div className="mb-2.5 flex items-center gap-2">
          <Link
            href={`/member/${proof.userId}`}
            className="pointer-events-auto relative z-[3] flex min-w-0 items-center gap-2 rounded-full focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label={`View ${name}'s passport`}
          >
            <Avatar name={name} avatarUrl={authorAvatarUrl} size={28} />
            <span className="truncate text-caption font-semibold text-content hover:underline">{name}</span>
          </Link>
          <span className="text-subtle">•</span>
          <span className="shrink-0 text-caption text-muted"><TimeAgo iso={proof.createdAt} /></span>
          {showDemoBadge && (
            <span className="ml-auto shrink-0 rounded-full bg-bg px-2 py-0.5 text-overline text-muted">Example</span>
          )}
        </div>
        {relation && (
          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-overline font-semibold ${
            relation === "ahead" ? "bg-surface-soft text-accent-text" : relation === "behind" ? "bg-bg text-muted" : "bg-surface-soft text-muted"
          }`}>
            {relation === "ahead" ? "▲ Learn from" : relation === "behind" ? "▼ You're ahead here" : "● Around your level"}
          </span>
        )}
        <div className="flex gap-3">
          <div className="grid h-[72px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-[16px] bg-gradient-to-br from-surface-soft to-accent-soft text-accent-text">
            {imageThumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageThumb} alt="Proof thumbnail" className="h-full w-full object-cover" />
            ) : videoThumb ? (
              // #t=0.1 nudges browsers to paint an early frame as the poster.
              <video src={`${videoThumb}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
            ) : (
              <ProofMediaIcon type={proof.mediaType} className="text-accent-text" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-body font-semibold leading-5 text-content">{proof.title}</h3>
            <p className="mt-1 text-caption text-muted">{mediaTypeLabel(proof.mediaType)}</p>
            <p className="mt-2 text-caption font-medium text-accent">{feedbackCount ? `${feedbackCount} feedback note${feedbackCount === 1 ? "" : "s"}` : "No feedback yet"}</p>
          </div>
        </div>
        <div className="pointer-events-auto">
          <ProofActions proof={proof} compact />
        </div>
        {relation && (
          <div className="pointer-events-auto mt-3 flex flex-wrap gap-2">
            {relation !== "behind" && (
              <button type="button" onClick={() => toggleLearnFrom(proof.userId)}
                className={`rounded-full px-3 py-1.5 text-caption font-semibold ${learning ? "bg-accent-soft text-accent-text" : "border border-line bg-surface text-muted"}`}>
                {learning ? "✓ Learning from" : "Learn from"}
              </button>
            )}
            {relation === "behind" && canGiveFeedback && (
              <Link href={`/proof/${proof.id}/feedback`}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-muted">
                Give feedback
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/** Collapsible composer to send a focused peer note to a proof's author. */
function PeerNoteComposer({ proof, authorName }: { proof: Proof; authorName: string }) {
  const { sendPeerNote } = useBetaApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      const id = await sendPeerNote(proof.userId, body, proof.id);
      if (id) router.push(`/notes/${id}`);
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Send {authorName} a peer note
      </Button>
    );
  }
  return (
    <Card className="space-y-3 p-4">
      <p className="text-body font-semibold text-content">Peer note to {authorName}</p>
      <p className="text-caption leading-5 text-muted">Be specific and useful — one clear observation and a kind next step.</p>
      <TextArea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What was clear, and one useful next step…" rows={3} />
      <div className="flex gap-2">
        <Button className="flex-1" onClick={send} disabled={sending || !body.trim()}>{sending ? "Sending…" : "Send note"}</Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </Card>
  );
}

export function ProofDetail({ proof, feedback }: { proof: Proof; feedback: Feedback[] }) {
  const { currentUser, snapshot, isLearningFrom, toggleLearnFrom } = useBetaApp();
  const author = snapshot.users.find((u) => u.id === proof.userId);
  const own = currentUser?.id === proof.userId;
  const learning = isLearningFrom(proof.userId);
  const [reporting, setReporting] = useState<{ type: "proof" | "feedback"; id: string } | null>(null);
  const canReport = Boolean(currentUser) && !proof.isDemo;
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-soft text-accent">
            <ProofMediaIcon type={proof.mediaType} />
          </div>
          <div>
            <p className="text-caption font-medium uppercase tracking-[0.12em] text-muted">{mediaTypeLabel(proof.mediaType)}</p>
            <h1 className="mt-1 text-title leading-tight text-content">{proof.title}</h1>
          </div>
        </div>
        {proof.body && <p className="mt-4 rounded-[18px] bg-bg p-4 text-body leading-6 text-secondary">{proof.body}</p>}
        {proof.attachments[0]?.localUrl && (proof.mediaType === "image" || proof.mediaType === "video" || proof.mediaType === "audio") && (
          <div className="mt-4 overflow-hidden rounded-[18px] border border-line bg-black/[0.02]">
            {proof.mediaType === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proof.attachments[0].localUrl} alt={proof.title} className="max-h-[420px] w-full object-contain" />
            ) : proof.mediaType === "video" ? (
              <video src={proof.attachments[0].localUrl} controls playsInline preload="metadata" className="max-h-[420px] w-full bg-black" />
            ) : (
              <audio src={proof.attachments[0].localUrl} controls className="w-full p-3" />
            )}
          </div>
        )}
        {proof.attachments[0] && <div className="mt-4"><AttachmentPreview attachment={proof.attachments[0]} /></div>}
        <ProofActions proof={proof} />
      </Card>

      {author && (
        <Card className="flex items-center gap-3 p-4">
          <Link href={`/member/${author.id}`} aria-label={`View ${author.displayName}'s passport`} className="shrink-0">
            <Avatar name={author.displayName} avatarUrl={author.avatarUrl} size={40} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/member/${author.id}`} className="hover:underline">
              <p className="truncate text-body font-semibold text-content">{author.displayName}</p>
            </Link>
            {(author.selectedBadges?.length ?? 0) > 0 && (
              <span className="mt-1 flex flex-wrap gap-1">
                {author.selectedBadges!.slice(0, 3).map((slug) => {
                  const b = DEMO_ACHIEVEMENTS.find((a) => a.slug === slug);
                  return b ? (
                    <span key={slug} className="rounded-full bg-surface-soft px-2 py-0.5 text-overline text-accent-text">{b.name}</span>
                  ) : null;
                })}
              </span>
            )}
            {author.bio && <p className="truncate text-caption text-muted">{author.bio}</p>}
          </div>
          {!own && !proof.isDemo && (
            <button
              type="button"
              onClick={() => toggleLearnFrom(proof.userId)}
              aria-pressed={learning}
              className={`shrink-0 rounded-full px-3.5 py-2 text-caption font-semibold transition ${learning ? "bg-accent text-white" : "border border-line bg-surface text-accent-text"}`}
            >
              {learning ? "Learning from" : "Learn from"}
            </button>
          )}
        </Card>
      )}

      {author && !own && !proof.isDemo && <PeerNoteComposer proof={proof} authorName={author.displayName} />}

      <Card className="p-5">
        <h2 className="text-heading text-content">Feedback</h2>
        <p className="mt-1 text-body leading-6 text-muted">Feedback helps you improve. It does not define you.</p>
        <div className="mt-4 space-y-2">
          {feedback.length ? (
            feedback.map((item) => {
              const hasNotes = item.clarityNote || item.usefulNote || item.nextStepNote;
              return (
                <div key={item.id} className="space-y-2 rounded-[16px] bg-bg p-3 text-body leading-6 text-secondary">
                  {hasNotes ? (
                    <>
                      {item.clarityNote && <FeedbackNote label="What was clear" value={item.clarityNote} />}
                      {item.usefulNote && <FeedbackNote label="What could be improved" value={item.usefulNote} />}
                      {item.nextStepNote && <FeedbackNote label="One useful next step" value={item.nextStepNote} />}
                    </>
                  ) : (
                    item.body
                  )}
                  {canReport && item.authorId !== currentUser?.id && (
                    <button type="button" onClick={() => setReporting({ type: "feedback", id: item.id })} className="text-overline text-muted hover:text-danger-text">
                      Report this note
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="rounded-[16px] bg-bg p-3 text-body leading-6 text-muted">No feedback yet. Feedback can come after proof.</p>
          )}
        </div>
      </Card>

      {canReport && !own && (
        <button type="button" onClick={() => setReporting({ type: "proof", id: proof.id })} className="w-full py-2 text-center text-caption font-medium text-muted hover:text-danger-text">
          Report this proof
        </button>
      )}

      {reporting && <ReportSheet targetType={reporting.type} targetId={reporting.id} onClose={() => setReporting(null)} />}
    </div>
  );
}

function FeedbackNote({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-overline uppercase tracking-wide text-muted">{label}</p>
      <p className="text-body leading-6 text-secondary">{value}</p>
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
