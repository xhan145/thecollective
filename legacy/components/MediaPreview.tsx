import { Camera, Play, X } from "lucide-react";
import type { MediaProofType } from "@/lib/proofModels";

export function MediaPreview({ mediaUrl, mediaType, title, onRemove }: { mediaUrl?: string; mediaType: MediaProofType; title?: string; onRemove?: () => void }) {
  if (mediaType === "none") {
    return (
      <div className="rounded-[26px] border border-dashed border-white/15 bg-white/[0.035] p-5 text-sm leading-6 text-[#c8c2b8]">
        No media selected yet. Your reflection can still be enough proof.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] shadow-soft">
      {onRemove && (
        <button type="button" onClick={onRemove} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-ink/80 text-white shadow-soft transition active:scale-95" aria-label="Remove selected media">
          <X size={16} />
        </button>
      )}
      {mediaType === "image" && mediaUrl ? (
        <img src={mediaUrl} alt={title || "Proof media preview"} className="max-h-72 w-full object-cover" />
      ) : mediaType === "video" && mediaUrl ? (
        <video src={mediaUrl} controls className="max-h-72 w-full bg-black" />
      ) : (
        <div className="grid min-h-[180px] place-items-center bg-gradient-to-br from-purple/25 via-panel2 to-teal/15 p-6 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white/10 text-purple2 shadow-soft">
            {mediaType === "video" ? <Play size={24} /> : <Camera size={24} />}
          </div>
          <p className="mt-3 text-sm font-black">{mediaType === "video" ? "Video proof" : "Image proof"}</p>
          <p className="mt-1 text-xs text-[#8f887e]">Preview appears here in demo mode.</p>
        </div>
      )}
    </div>
  );
}
