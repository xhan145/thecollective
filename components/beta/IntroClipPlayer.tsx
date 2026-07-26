"use client";

import { INTRO_CLIP_BUCKET } from "@/lib/supabase/client";
import { useSignedMediaUrl } from "@/lib/media/useSignedMediaUrl";
import { formatClipLength } from "@/lib/introClip";

/**
 * Plays a member's intro clip from the private bucket via a short-lived signed
 * URL. Renders nothing when there is no clip or the viewer isn't authorized
 * (signing fails) — so a visitor never sees a broken player.
 */
export function IntroClipPlayer({
  path,
  kind,
  durationSeconds,
  className,
}: {
  path: string | null | undefined;
  kind: "audio" | "video" | null | undefined;
  durationSeconds?: number | null;
  className?: string;
}) {
  const { url, isError } = useSignedMediaUrl(INTRO_CLIP_BUCKET, path ?? null);
  if (!path || !kind || isError) return null;

  const lengthLabel = durationSeconds ? ` · ${formatClipLength(durationSeconds)}` : "";

  return (
    <div className={`rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] p-3.5 ${className ?? ""}`}>
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#7A5300]">
        Introduction{lengthLabel}
      </p>
      {!url ? (
        <p className="text-sm text-[#6E6E6E]">Loading…</p>
      ) : kind === "video" ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- user-recorded intro; captions not available
        <video controls playsInline preload="metadata" src={url} className="w-full rounded-xl bg-black" />
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- user-recorded intro; captions not available
        <audio controls preload="metadata" src={url} className="w-full" />
      )}
    </div>
  );
}
