// Pure helpers for the 30-second voice/video introduction clip. No DOM/Supabase
// deps except an optional injected MediaRecorder.isTypeSupported, so this module
// is unit-testable in Node (scripts/check-intro-clip.ts).

export type IntroClipKind = "audio" | "video";

export const MAX_INTRO_CLIP_SECONDS = 30;
export const MAX_INTRO_CLIP_BYTES = 20 * 1024 * 1024; // matches the bucket file_size_limit (050)
// Small tolerance so a clip the recorder auto-stops at ~30.2s isn't rejected on re-measure.
export const DURATION_TOLERANCE_SECONDS = 0.5;

// Mime types the collective-intro-clips bucket accepts (must match migration 050).
export const ALLOWED_CLIP_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "video/webm",
  "video/mp4",
  "video/quicktime",
] as const;

const MIME_EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

// Recorder mime candidates in preference order (best-supported/broadly-playable first).
const AUDIO_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
const VIDEO_CANDIDATES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

/** Strip any `;codecs=…` parameter and normalise. */
export function baseMimeType(mime: string): string {
  return (mime || "").split(";")[0].trim().toLowerCase();
}

/** Round to whole seconds, bounded to 1..30. NaN/±Inf collapse to 1. */
export function clampDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return 1;
  return Math.min(Math.max(Math.round(seconds), 1), MAX_INTRO_CLIP_SECONDS);
}

/** An uploaded file's measured duration is acceptable if it's within 30s (+tolerance). */
export function isAcceptableUploadDuration(seconds: number): boolean {
  return Number.isFinite(seconds) && seconds > 0 && seconds <= MAX_INTRO_CLIP_SECONDS + DURATION_TOLERANCE_SECONDS;
}

/** File extension for a mime type; falls back to webm. */
export function extForMimeType(mime: string): string {
  const base = baseMimeType(mime);
  if (MIME_EXT[base]) return MIME_EXT[base];
  return base.startsWith("video/") ? "webm" : "webm";
}

/** "0:09", "1:15". */
export function formatClipLength(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Bucket accepts this mime? (matches migration 050 allowed_mime_types). */
export function isAllowedClipMimeType(mime: string): boolean {
  return (ALLOWED_CLIP_MIME_TYPES as readonly string[]).includes(baseMimeType(mime));
}

/** audio/* -> "audio", video/* -> "video", else null. */
export function clipKindForMimeType(mime: string): IntroClipKind | null {
  const base = baseMimeType(mime);
  if (base.startsWith("audio/")) return "audio";
  if (base.startsWith("video/")) return "video";
  return null;
}

export function recorderCandidates(kind: IntroClipKind): string[] {
  return kind === "video" ? VIDEO_CANDIDATES : AUDIO_CANDIDATES;
}

/**
 * Pick a MediaRecorder mime type the browser supports for this kind, or null if
 * none are. `isSupported` is injectable so this is testable without a browser.
 */
export function pickRecorderMimeType(
  kind: IntroClipKind,
  isSupported?: (t: string) => boolean,
): string | null {
  const check =
    isSupported ??
    ((t: string) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
  for (const c of recorderCandidates(kind)) {
    try {
      if (check(c)) return c;
    } catch {
      /* isTypeSupported can throw on some engines — treat as unsupported */
    }
  }
  return null;
}
