"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/beta/ui";
import {
  MAX_INTRO_CLIP_BYTES,
  MAX_INTRO_CLIP_SECONDS,
  clampDuration,
  clipKindForMimeType,
  formatClipLength,
  isAcceptableUploadDuration,
  isAllowedClipMimeType,
  pickRecorderMimeType,
  type IntroClipKind,
} from "@/lib/introClip";
import { removeIntroClipObject, setIntroClip, uploadIntroClip } from "@/lib/supabase/introClipRepository";

type Phase = "idle" | "recording" | "preview" | "saving";
type Staged = { blob: Blob; mimeType: string; kind: IntroClipKind; durationSeconds: number };

export type SavedIntroClip = { path: string; kind: IntroClipKind; durationSeconds: number };

function measureDuration(blob: Blob, kind: IntroClipKind): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement(kind === "video" ? "video" : "audio");
    el.preload = "metadata";
    const url = URL.createObjectURL(blob);
    const done = (d: number) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : NaN);
    el.onerror = () => done(NaN);
    el.src = url;
  });
}

/**
 * Records (or uploads) one voice/video introduction, capped at 30s. On save it
 * uploads to the private bucket and records the clip via set_intro_clip, then
 * calls onSaved so the parent can refresh the snapshot. Degrades to upload-only
 * when in-browser recording is unavailable.
 */
export function IntroClipRecorder({
  client,
  userId,
  existingPath,
  onSaved,
}: {
  client: SupabaseClient;
  userId: string;
  existingPath: string | null;
  onSaved: (clip: SavedIntroClip) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [staged, setStaged] = useState<Staged | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const kindRef = useRef<IntroClipKind>("audio");
  // Latest elapsed seconds, read by recorder.onstop without a stale closure.
  const elapsedRef = useRef(0);
  const mountedRef = useRef(true);
  const startingRef = useRef(false); // reentrancy guard for the getUserMedia await window

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetPreview = useCallback(() => {
    setPreviewUrl((cur) => {
      if (cur) URL.revokeObjectURL(cur);
      return null;
    });
    setStaged(null);
  }, []);

  // Cleanup on unmount: tear the recorder down first so a stream-end doesn't fire
  // onstop (allocating a leaked blob URL) after we've gone.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
      const rec = recorderRef.current;
      if (rec) {
        rec.onstop = null;
        rec.ondataavailable = null;
        if (rec.state !== "inactive") {
          try {
            rec.stop();
          } catch {
            /* already stopping */
          }
        }
        recorderRef.current = null;
      }
      stopStream();
      setPreviewUrl((cur) => {
        if (cur) URL.revokeObjectURL(cur);
        return null;
      });
    };
  }, [clearTimer, stopStream]);

  const stopRecording = useCallback(() => {
    clearTimer();
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, [clearTimer]);

  const startRecording = useCallback(
    async (kind: IntroClipKind) => {
      if (startingRef.current) return; // ignore rapid re-clicks during the getUserMedia await
      startingRef.current = true;
      setError(null);
      resetPreview();
      const mimeType = pickRecorderMimeType(kind);
      if (!mimeType) {
        setError("Recording isn't supported in this browser. You can upload a clip instead.");
        startingRef.current = false;
        return;
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(
          kind === "video" ? { audio: true, video: true } : { audio: true },
        );
      } catch {
        setError("We couldn't reach your microphone or camera. Check permissions, or upload a clip instead.");
        startingRef.current = false;
        return;
      }
      // Unmounted during the await? Stop the fresh stream and bail.
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        startingRef.current = false;
        return;
      }
      streamRef.current = stream;
      kindRef.current = kind;
      chunksRef.current = [];

      // Cap bitrate so 30s stays well under the 20 MB bucket limit (~9 MB video).
      // isTypeSupported doesn't guarantee the constructor accepts these options.
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 128_000,
          ...(kind === "video" ? { videoBitsPerSecond: 2_500_000 } : {}),
        });
      } catch {
        stopStream();
        setError("Recording isn't supported in this browser. You can upload a clip instead.");
        startingRef.current = false;
        return;
      }
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        clearTimer();
        const seconds = elapsedRef.current;
        stopStream();
        if (!mountedRef.current) return; // unmounted mid-recording: don't allocate a leaked URL
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          setError("That recording was empty. Please try again.");
          setPhase("idle");
          return;
        }
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStaged({ blob, mimeType, kind: kindRef.current, durationSeconds: clampDuration(seconds) });
        setPhase("preview");
      };

      setElapsed(0);
      elapsedRef.current = 0;
      setPhase("recording");
      if (kind === "video") {
        // show a live self-view
        requestAnimationFrame(() => {
          if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = stream;
            void liveVideoRef.current.play().catch(() => {});
          }
        });
      }
      recorder.start();
      const started = Date.now();
      timerRef.current = setInterval(() => {
        const s = (Date.now() - started) / 1000;
        elapsedRef.current = s;
        setElapsed(s);
        if (s >= MAX_INTRO_CLIP_SECONDS) stopRecording();
      }, 200);
      startingRef.current = false;
    },
    [clearTimer, resetPreview, stopRecording, stopStream],
  );

  const onPickFile = useCallback(
    async (file: File | null) => {
      setError(null);
      if (!file) return;
      const kind = clipKindForMimeType(file.type);
      if (!kind || !isAllowedClipMimeType(file.type)) {
        setError("Please choose an audio or video file (mp3, m4a, mp4, webm, or mov).");
        return;
      }
      if (file.size > MAX_INTRO_CLIP_BYTES) {
        setError("That file is too large. Please keep it short — 30 seconds or less.");
        return;
      }
      const seconds = await measureDuration(file, kind);
      if (!isAcceptableUploadDuration(seconds)) {
        setError(
          Number.isFinite(seconds)
            ? "That clip is longer than 30 seconds. Please trim it and try again."
            : "We couldn't read that file. Please try a different one.",
        );
        return;
      }
      resetPreview();
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setStaged({ blob: file, mimeType: file.type, kind, durationSeconds: clampDuration(seconds) });
      setPhase("preview");
    },
    [resetPreview],
  );

  const save = useCallback(async () => {
    if (!staged) return;
    setPhase("saving");
    setError(null);
    const up = await uploadIntroClip(client, userId, staged.blob, staged.mimeType);
    if (up.error || !up.path) {
      setError(up.error ?? "That clip couldn't be saved. Please try again.");
      setPhase("preview");
      return;
    }
    const res = await setIntroClip(client, up.path, staged.kind, staged.durationSeconds);
    if (res.error) {
      await removeIntroClipObject(client, up.path); // don't leave an orphan we didn't record
      setError(res.error);
      setPhase("preview");
      return;
    }
    // Replaced an older clip — best-effort delete of the previous object.
    if (existingPath && existingPath !== up.path) await removeIntroClipObject(client, existingPath);
    onSaved({ path: up.path, kind: staged.kind, durationSeconds: staged.durationSeconds });
    resetPreview();
    setPhase("idle");
  }, [client, userId, staged, existingPath, onSaved, resetPreview]);

  const remaining = Math.max(0, MAX_INTRO_CLIP_SECONDS - Math.floor(elapsed));

  return (
    <div className="space-y-3">
      {phase === "idle" && (
        <>
          <div className="flex flex-wrap gap-2">
            {recordSupported && (
              <>
                <Button variant="secondary" onClick={() => void startRecording("audio")}>
                  🎙️ Record voice
                </Button>
                <Button variant="secondary" onClick={() => void startRecording("video")}>
                  🎥 Record video
                </Button>
              </>
            )}
            <label className="inline-flex cursor-pointer items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8] px-4 py-2.5 text-sm font-extrabold text-[#7A5300] transition-colors hover:bg-[#FFF1C7] focus-within:ring-2 focus-within:ring-[#F2A900]/40">
              Upload a clip
              <input
                type="file"
                accept="audio/*,video/*"
                className="sr-only"
                onChange={(e) => {
                  void onPickFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="text-xs leading-5 text-[#6E6E6E]">
            Up to 30 seconds. Say who you are and what you&rsquo;re practicing — it doesn&rsquo;t need to be perfect.
          </p>
        </>
      )}

      {phase === "recording" && (
        <div className="space-y-3 rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] p-4">
          {kindRef.current === "video" && (
            <video ref={liveVideoRef} muted playsInline className="w-full rounded-xl bg-black" />
          )}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-extrabold text-[#B4443F]">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#B4443F]" aria-hidden />
              Recording · {remaining}s left
            </span>
            <Button onClick={stopRecording}>Stop</Button>
          </div>
        </div>
      )}

      {phase !== "idle" && phase !== "recording" && staged && previewUrl && (
        <div className="space-y-3 rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] p-4">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#7A5300]">
            Preview · {formatClipLength(staged.durationSeconds)}
          </p>
          {staged.kind === "video" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption -- user-recorded intro
            <video controls playsInline src={previewUrl} className="w-full rounded-xl bg-black" />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption -- user-recorded intro
            <audio controls src={previewUrl} className="w-full" />
          )}
          <div className="flex gap-2">
            <Button className="flex-1" disabled={phase === "saving"} onClick={() => void save()}>
              {phase === "saving" ? "Saving…" : "Use this clip"}
            </Button>
            <Button
              variant="secondary"
              disabled={phase === "saving"}
              onClick={() => {
                resetPreview();
                setPhase("idle");
              }}
            >
              Start over
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-bold text-[#B4443F]">{error}</p>}
    </div>
  );
}
