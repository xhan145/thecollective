"use client";

import type { ChangeEvent } from "react";
import { Camera, UploadCloud, Video } from "lucide-react";
import { validateMediaFile } from "@/lib/mediaUpload";
import type { MediaProofType } from "@/lib/proofModels";
import { MediaPreview } from "./MediaPreview";

export function MediaPickerCard({
  mediaUrl,
  mediaType,
  onFileSelected,
  onRemove,
  onError
}: {
  mediaUrl?: string;
  mediaType: MediaProofType;
  onFileSelected: (file: File, previewUrl: string, mediaType: Exclude<MediaProofType, "none">) => void;
  onRemove: () => void;
  onError: (message: string) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    const validation = validateMediaFile(selected);
    if (!validation.valid || !validation.mediaType) {
      onError(validation.error || "We could not use that media file.");
      event.target.value = "";
      return;
    }
    onFileSelected(selected, URL.createObjectURL(selected), validation.mediaType);
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple/15 text-purple2"><UploadCloud size={18} /></div>
        <div>
          <p className="font-black">Add a photo or short video</p>
          <p className="text-xs text-[#8f887e]">Show the work, not perfection.</p>
        </div>
      </div>
      <label className="grid min-h-[132px] cursor-pointer place-items-center rounded-[26px] border border-dashed border-white/15 bg-gradient-to-br from-white/[0.07] to-white/[0.025] p-4 text-center transition hover:border-white/20 active:scale-[.99]">
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleChange} />
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-3xl bg-white/10 text-purple2 shadow-soft">
            <Camera size={19} />
          </div>
          <p className="mt-3 text-sm font-black">Choose image or video</p>
          <p className="mt-1 text-xs text-[#8f887e]">JPG, PNG, WEBP, MP4, MOV, WEBM</p>
        </div>
      </label>
      {mediaType !== "none" && (
        <div className="mt-3">
          <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} onRemove={onRemove} />
          <div className="mt-3 flex items-center gap-2 text-xs text-[#8f887e]">
            {mediaType === "video" ? <Video size={14} /> : <Camera size={14} />}
            <span>{mediaType === "video" ? "Video selected" : "Image selected"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
