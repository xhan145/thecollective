"use client";

import { useMemo, useRef, useState, useActionState, useTransition } from "react";
import { Bookmark, Flag, Play, RotateCcw, Send, SkipForward, UploadCloud, Zap } from "lucide-react";
import {
  approveTrackAction,
  backTrackAction,
  createTrackAction,
  rejectTrackAction,
  reportTrackAction,
  saveTrackAction,
  skipTrackAction,
  upsertArtistProfileAction,
  upsertScoutProfileAction,
} from "@/lib/actions";
import { ArtworkBlock, BackingReceipt, First50Progress, SignalprintReport, TrackBadges, TrackCard } from "@/components/signalflow";
import { EmptyState, PrimaryButton, SecondaryButton, SignalFlowCard, StatusBadge, Tag, TextField } from "@/components/ui";
import type { ActionState, ArtistProfile, ScoutProfile, TrackWithArtist } from "@/lib/types";

const initialState: ActionState = { error: null };

export function ArtistOnboardingForm({ profile }: { profile?: ArtistProfile | null }) {
  const [state, formAction, pending] = useActionState(upsertArtistProfileAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <TextField label="Artist name" name="artist_name" required defaultValue={profile?.artist_name ?? ""} />
      <TextField label="Bio" name="bio" multiline rows={4} defaultValue={profile?.bio ?? ""} />
      <TextField label="Location" name="location" placeholder="Detroit, Lagos, bedroom internet" defaultValue={profile?.location ?? ""} />
      <TextField
        label="Genres"
        name="genres"
        placeholder="bass, experimental trap, electronic"
        defaultValue={profile?.genres.join(", ") ?? ""}
      />
      <TextField label="Website" name="website" type="url" />
      <TextField label="SoundCloud" name="soundcloud" type="url" />
      {state.error ? <FormError message={state.error} /> : null}
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? "Entering the Flow..." : "Enter the Flow"}
      </PrimaryButton>
    </form>
  );
}

export function ScoutOnboardingForm({ profile }: { profile?: ScoutProfile | null }) {
  const [state, formAction, pending] = useActionState(upsertScoutProfileAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <TextField label="Scout name" name="display_name" placeholder="Flowfinder 23" />
      <TextField
        label="Favorite genres"
        name="favorite_genres"
        placeholder="bass, club, experimental trap"
        defaultValue={profile?.favorite_genres.join(", ") ?? ""}
      />
      <TextField
        label="Favorite moods"
        name="favorite_moods"
        placeholder="dark, gritty, hypnotic"
        defaultValue={profile?.favorite_moods.join(", ") ?? ""}
      />
      {state.error ? <FormError message={state.error} /> : null}
      <PrimaryButton type="submit" disabled={pending}>
        {pending ? "Tuning your feed..." : "Become a Flowfinder"}
      </PrimaryButton>
    </form>
  );
}

export function UploadTrackForm() {
  const [state, formAction, pending] = useActionState(createTrackAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <TextField label="Track title" name="title" required placeholder="Substation Halo" />
      <TextField
        label="Description"
        name="description"
        multiline
        rows={4}
        placeholder="What should Scouts hear first?"
      />
      <TextField label="Genre tags" name="genre_tags" placeholder="bass, experimental trap, electronic" />
      <TextField label="Mood tags" name="mood_tags" placeholder="dark, gritty, hypnotic" />
      <TextField
        label="Audio URL"
        name="audio_url"
        type="url"
        help="Use a public audio URL for quick demo review, or upload a file below when Supabase Storage is configured."
      />
      <FileField label="Audio file" name="audio_file" accept="audio/*" />
      <TextField label="Artwork URL" name="artwork_url" type="url" />
      <FileField label="Artwork file" name="artwork_file" accept="image/*" />
      <TextField label="Duration seconds" name="duration_seconds" type="number" placeholder="198" />
      <label className="flex items-start gap-3 rounded-card border border-line bg-cardHi p-3">
        <input name="rights_confirmed" type="checkbox" className="mt-1 h-4 w-4 accent-signal" required />
        <span className="text-sm leading-relaxed text-ink">
          I own or control the rights to this track and authorize SIGNAL//FLOW to place it in The Flow.
        </span>
      </label>
      {state.error ? <FormError message={state.error} /> : null}
      <PrimaryButton type="submit" disabled={pending}>
        <UploadCloud size={18} />
        {pending ? "Sending signal..." : "Upload to The Flow"}
      </PrimaryButton>
    </form>
  );
}

function FileField({
  label,
  name,
  accept,
}: {
  label: string;
  name: string;
  accept: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink">{label}</span>
      <input
        name={name}
        type="file"
        accept={accept}
        className="w-full rounded-card border border-line bg-night/60 px-3.5 py-3 text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-signal file:px-3 file:py-1.5 file:text-xs file:font-black file:text-night"
      />
    </label>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p className="rounded-card border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
      {message}
    </p>
  );
}

export function AudioPlayer({
  track,
  onProgress,
}: {
  track: TrackWithArtist;
  onProgress?: (seconds: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [seconds, setSeconds] = useState(0);
  return (
    <div className="rounded-card border border-line bg-night/70 p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted">
        <span>The Flow is listening.</span>
        <span>{Math.floor(seconds)}s</span>
      </div>
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={track.audio_url}
        onTimeUpdate={(event) => {
          const next = event.currentTarget.currentTime;
          setSeconds(next);
          onProgress?.(next);
        }}
      />
    </div>
  );
}

export function SaveButton({
  trackId,
  seconds,
  initiallySaved = false,
}: {
  trackId: string;
  seconds: number;
  initiallySaved?: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || saved}
      onClick={() =>
        startTransition(async () => {
          await saveTrackAction(trackId, seconds);
          setSaved(true);
        })
      }
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-card border border-line bg-cardHi px-4 py-3 text-sm font-black text-ink disabled:opacity-70"
    >
      <Bookmark size={18} className={saved ? "fill-signal text-signal" : "text-signal"} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}

export function SkipButton({
  trackId,
  seconds,
  onSkip,
}: {
  trackId: string;
  seconds: number;
  onSkip?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await skipTrackAction(trackId, seconds);
          onSkip?.();
        })
      }
      className="inline-flex flex-1 items-center justify-center gap-2 rounded-card border border-line bg-cardHi px-4 py-3 text-sm font-black text-ink"
    >
      <SkipForward size={18} className="text-muted" />
      Skip
    </button>
  );
}

export function BackButton({
  track,
  seconds,
}: {
  track: TrackWithArtist;
  seconds: number;
}) {
  const [listenerNumber, setListenerNumber] = useState<number | null>(
    track.backed_by_viewer?.listener_number ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const unlocked = seconds >= 15 || Boolean(listenerNumber);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending || !unlocked || Boolean(listenerNumber)}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await backTrackAction(track.id, track.artist_id, seconds);
            if (result.ok) setListenerNumber(result.listenerNumber ?? null);
            else setError(result.error ?? "Could not Back this artist.");
          })
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-card bg-signal px-4 py-3 text-sm font-black text-night shadow-warmLg disabled:bg-cardHi disabled:text-muted"
      >
        <Zap size={18} />
        {listenerNumber ? `Listener #${listenerNumber}` : unlocked ? "Back this artist" : "Back unlocks after 15s"}
      </button>
      {error ? <p className="text-sm font-bold text-danger">{error}</p> : null}
      {listenerNumber ? <BackingReceipt track={track} listenerNumber={listenerNumber} /> : null}
    </div>
  );
}

export function DiscoveryFeed({ tracks }: { tracks: TrackWithArtist[] }) {
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const track = tracks[index];
  const nextTrack = () => {
    setSeconds(0);
    setIndex((value) => Math.min(value + 1, Math.max(0, tracks.length - 1)));
  };

  if (!track) {
    return (
      <EmptyState
        title="No fresh signal right now."
        body="You have cleared this queue. New approved tracks will appear here."
        actionLabel="View saved"
        actionHref="/saved"
      />
    );
  }

  return (
    <div className="space-y-4">
      <ArtworkBlock track={track} />
      <TrackBadges track={track} />
      <div>
        <p className="text-3xl font-black leading-tight text-ink">{track.title}</p>
        <p className="mt-1 text-lg font-bold text-muted">{track.artist?.artist_name ?? "Unknown artist"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[...track.genre_tags, ...track.mood_tags].map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      <First50Progress count={track.stats.unique_listens} />
      <AudioPlayer track={track} onProgress={setSeconds} />
      <div className="flex gap-2">
        <SkipButton trackId={track.id} seconds={seconds} onSkip={nextTrack} />
        <SaveButton trackId={track.id} seconds={seconds} initiallySaved={track.saved_by_viewer} />
      </div>
      <BackButton track={track} seconds={seconds} />
      <SignalprintReport analysis={track.analysis} />
      <ReportTrackButton trackId={track.id} />
      <div className="flex items-center justify-between text-xs font-bold text-muted">
        <span>{index + 1} of {tracks.length}</span>
        <button
          type="button"
          onClick={nextTrack}
          className="inline-flex items-center gap-1 text-signal"
        >
          <RotateCcw size={14} />
          Next signal
        </button>
      </div>
    </div>
  );
}

function ReportTrackButton({ trackId }: { trackId: string }) {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || sent}
      onClick={() =>
        startTransition(async () => {
          await reportTrackAction(trackId, "Scout reported this track for admin review.");
          setSent(true);
        })
      }
      className="inline-flex items-center gap-2 text-xs font-bold text-muted"
    >
      <Flag size={14} />
      {sent ? "Report sent" : "Report track"}
    </button>
  );
}

export function AdminTrackReviewTable({ tracks }: { tracks: TrackWithArtist[] }) {
  if (tracks.length === 0) {
    return (
      <EmptyState
        title="Review queue clear."
        body="No pending tracks are waiting for admin approval."
      />
    );
  }
  return (
    <div className="space-y-3">
      {tracks.map((track) => (
        <SignalFlowCard key={track.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-black text-ink">{track.title}</p>
              <p className="text-sm text-muted">{track.artist?.artist_name ?? "Unknown artist"}</p>
            </div>
            <StatusBadge status={track.status} />
          </div>
          <audio controls src={track.audio_url} />
          <div className="flex gap-2">
            <ReviewButton trackId={track.id} mode="approve" />
            <ReviewButton trackId={track.id} mode="reject" />
          </div>
        </SignalFlowCard>
      ))}
    </div>
  );
}

function ReviewButton({ trackId, mode }: { trackId: string; mode: "approve" | "reject" }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending || done}
      onClick={() =>
        startTransition(async () => {
          if (mode === "approve") await approveTrackAction(trackId);
          else await rejectTrackAction(trackId);
          setDone(true);
        })
      }
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-card px-3 py-2.5 text-sm font-black ${
        mode === "approve"
          ? "bg-signal text-night"
          : "border border-line bg-cardHi text-ink"
      }`}
    >
      {mode === "approve" ? <Play size={16} /> : <Send size={16} />}
      {done ? "Done" : mode === "approve" ? "Approve" : "Reject"}
    </button>
  );
}

export function SavedList({ tracks }: { tracks: TrackWithArtist[] }) {
  if (tracks.length === 0) {
    return (
      <EmptyState
        title="No saved signals yet."
        body="Save tracks in The Flow to build your listening shelf."
        actionLabel="Enter The Flow"
        actionHref="/discover"
      />
    );
  }
  return (
    <div className="space-y-3">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} href={`/artist/tracks/${track.id}`} />
      ))}
    </div>
  );
}

export function BackedList({
  backs,
}: {
  backs: Array<{ id: string; listener_number: number; track: TrackWithArtist }>;
}) {
  const rows = useMemo(() => backs, [backs]);
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No co-signs yet."
        body="Back artists after listening long enough to earn a permanent receipt."
        actionLabel="Find a signal"
        actionHref="/discover"
      />
    );
  }
  return (
    <div className="space-y-3">
      {rows.map((back) => (
        <SignalFlowCard key={back.id} className="space-y-3">
          <TrackCard track={back.track} compact href={`/artist/tracks/${back.track.id}`} />
          <BackingReceipt track={back.track} listenerNumber={back.listener_number} />
        </SignalFlowCard>
      ))}
    </div>
  );
}
