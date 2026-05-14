import { FileAudio, FileText, Image, Link as LinkIcon, ListChecks, Monitor, PlaySquare, UploadCloud } from "lucide-react";
import type { MediaKind, ProofMediaRecord, ProofSubmission, ProofType } from "@/lib/types";
import { formatFileSize, proofTypeLabels } from "@/lib/media/proofMedia";

const mediaIcon: Record<MediaKind, typeof FileText> = {
  text: FileText,
  image: Image,
  video: PlaySquare,
  audio: FileAudio,
  document: FileText,
  link: LinkIcon,
  checklist: ListChecks
};

export function ProofTypeBadge({ proofType, mediaKind }: { proofType: ProofType; mediaKind?: MediaKind }) {
  const Icon = mediaIcon[mediaKind || (proofType === "screenshot" ? "image" : proofType === "checklist" ? "checklist" : proofType === "link" ? "link" : proofType === "text" ? "text" : proofType)];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-purple2">
      <Icon size={13} />
      {proofTypeLabels[proofType]}
    </span>
  );
}

export function ProofMediaCard({ proof, media }: { proof?: ProofSubmission; media?: ProofMediaRecord }) {
  const activeMedia = media || proof?.media;
  const proofType = proof?.proofType || activeMedia?.proofType || "text";
  const mediaKind = proof?.mediaKind || activeMedia?.mediaKind || "text";
  const Icon = mediaIcon[mediaKind];
  const title = activeMedia?.fileName || proof?.linkUrl || proof?.promptTitle || proofTypeLabels[proofType];
  const fileType = activeMedia?.fileType || (proof?.linkUrl ? "URL" : proofTypeLabels[proofType]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/10 text-purple2">
            {proofType === "screenshot" ? <Monitor size={17} /> : <Icon size={17} />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{title}</p>
            <p className="text-xs text-slate-500">{fileType}{activeMedia?.fileSize ? ` - ${formatFileSize(activeMedia.fileSize)}` : ""}</p>
          </div>
        </div>
        <ProofTypeBadge proofType={proofType} mediaKind={mediaKind} />
      </div>

      {mediaKind === "image" && activeMedia?.fileUrl && (
        <img src={activeMedia.fileUrl} alt="Proof preview" className="max-h-64 w-full rounded-2xl object-cover" />
      )}
      {mediaKind === "video" && activeMedia?.fileUrl && (
        <video src={activeMedia.fileUrl} controls className="max-h-64 w-full rounded-2xl bg-black" />
      )}
      {mediaKind === "audio" && activeMedia?.fileUrl && (
        <audio src={activeMedia.fileUrl} controls className="w-full" />
      )}
      {mediaKind === "document" && (
        <div className="flex items-center gap-3 rounded-2xl bg-ink/70 p-3 text-sm text-slate-300">
          <UploadCloud size={18} className="text-purple2" />
          <span>Document preview will use signed URLs after storage is connected.</span>
        </div>
      )}
      {mediaKind === "link" && proof?.linkUrl && (
        <div className="rounded-2xl bg-ink/70 p-3">
          <p className="text-xs font-bold text-slate-500">Link proof</p>
          <p className="mt-1 break-all text-sm text-slate-300">{proof.linkUrl}</p>
        </div>
      )}
      {mediaKind === "checklist" && proof?.checklistItems?.length ? (
        <div className="space-y-2">
          {proof.checklistItems.map((item) => (
            <p key={item} className="rounded-2xl bg-ink/70 px-3 py-2 text-sm text-slate-300">{item}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
