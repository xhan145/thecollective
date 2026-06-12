"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateMockSignalprint, parseTags } from "@/lib/mekhane";
import { isDemoMode } from "@/lib/signalflow-data";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  TRACK_ARTWORK_BUCKET,
  TRACK_AUDIO_BUCKET,
  uploadTrackAsset,
} from "@/lib/supabase/storage";
import type { ActionState, Back, ProofType, UserRole } from "@/lib/types";

async function getRequiredSignalFlowUser(roleHint: UserRole = "scout") {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?mode=signin");

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing;

  const { data } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        role: roleHint,
        display_name: user.email?.split("@")[0] ?? "Flowfinder",
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();
  return data;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function linksFromForm(formData: FormData): Record<string, string> | null {
  const links: Record<string, string> = {};
  for (const key of ["website", "soundcloud", "instagram", "tiktok"]) {
    const value = text(formData, key);
    if (value) links[key] = value;
  }
  return Object.keys(links).length > 0 ? links : null;
}

async function upsertUserRole(userId: string, role: UserRole, displayName?: string) {
  const supabase = await createServerSupabase();
  await supabase
    .from("users")
    .update({
      role,
      display_name: displayName || undefined,
    })
    .eq("id", userId);
}

export async function upsertArtistProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (isDemoMode()) redirect("/artist/dashboard?demo=1");
  const user = await getRequiredSignalFlowUser("artist");
  const artistName = text(formData, "artist_name");
  if (!artistName) return { error: "Add your artist name." };

  const supabase = await createServerSupabase();
  const payload = {
    user_id: user.id,
    artist_name: artistName,
    bio: text(formData, "bio") || null,
    location: text(formData, "location") || null,
    genres: parseTags(formData.get("genres")),
    links: linksFromForm(formData),
  };
  const { error } = await supabase
    .from("artist_profiles")
    .upsert(payload, { onConflict: "user_id" });
  if (error) return { error: error.message };

  await upsertUserRole(user.id, "artist", artistName);
  revalidatePath("/artist/dashboard");
  redirect("/artist/dashboard");
}

export async function upsertScoutProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (isDemoMode()) redirect("/discover?demo=1");
  const user = await getRequiredSignalFlowUser("scout");
  const displayName = text(formData, "display_name") || user.display_name || "Flowfinder";
  const favoriteGenres = parseTags(formData.get("favorite_genres"));
  const favoriteMoods = parseTags(formData.get("favorite_moods"));

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("scout_profiles")
    .upsert(
      {
        user_id: user.id,
        favorite_genres: favoriteGenres,
        favorite_moods: favoriteMoods,
        scout_level: "Flowfinder",
      },
      { onConflict: "user_id" },
    );
  if (error) return { error: error.message };

  await upsertUserRole(user.id, "scout", displayName);
  revalidatePath("/scout/profile");
  redirect("/discover");
}

export async function createTrackAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (isDemoMode()) redirect("/artist/dashboard?demo=track-created");
  const user = await getRequiredSignalFlowUser("artist");
  const supabase = await createServerSupabase();
  const { data: artist } = await supabase
    .from("artist_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!artist) return { error: "Create your artist profile before uploading a track." };

  const title = text(formData, "title");
  const description = text(formData, "description");
  const genreTags = parseTags(formData.get("genre_tags"));
  const moodTags = parseTags(formData.get("mood_tags"));
  const audioUrlInput = text(formData, "audio_url");
  const artworkUrlInput = text(formData, "artwork_url");
  const duration = Number(text(formData, "duration_seconds")) || null;
  const rightsConfirmed = formData.get("rights_confirmed") === "on";
  const audioFile = formData.get("audio_file") as File | null;
  const artworkFile = formData.get("artwork_file") as File | null;

  if (!title) return { error: "Add a track title." };
  if (!rightsConfirmed) return { error: "Confirm you own or control the rights." };
  if (!audioUrlInput && (!audioFile || audioFile.size === 0)) {
    return { error: "Add an audio URL or upload an audio file." };
  }

  const { data: track, error } = await supabase
    .from("tracks")
    .insert({
      artist_id: artist.id,
      title,
      description: description || null,
      genre_tags: genreTags,
      mood_tags: moodTags,
      audio_url: audioUrlInput || "upload-pending",
      artwork_url: artworkUrlInput || null,
      duration_seconds: duration,
      status: "pending_review",
      discovery_stage: "uploaded",
      rights_confirmed: rightsConfirmed,
    })
    .select("id")
    .single();
  if (error || !track) return { error: error?.message ?? "Could not create track." };

  let audioUrl = audioUrlInput;
  let artworkUrl = artworkUrlInput;
  if (audioFile && audioFile.size > 0) {
    const upload = await uploadTrackAsset(
      supabase,
      TRACK_AUDIO_BUCKET,
      user.id,
      track.id,
      audioFile,
    );
    if (upload.error) return { error: upload.error };
    audioUrl = upload.publicUrl ?? audioUrl;
  }
  if (artworkFile && artworkFile.size > 0) {
    const upload = await uploadTrackAsset(
      supabase,
      TRACK_ARTWORK_BUCKET,
      user.id,
      track.id,
      artworkFile,
    );
    if (upload.error) return { error: upload.error };
    artworkUrl = upload.publicUrl ?? artworkUrl;
  }
  await supabase
    .from("tracks")
    .update({
      audio_url: audioUrl,
      artwork_url: artworkUrl || null,
    })
    .eq("id", track.id);

  const signalprint = generateMockSignalprint({
    title,
    description,
    genre_tags: genreTags,
    mood_tags: moodTags,
  });
  await supabase.from("track_analysis").insert({
    track_id: track.id,
    ...signalprint,
  });

  revalidatePath("/artist/dashboard");
  redirect(`/artist/tracks/${track.id}`);
}

export async function approveTrackAction(trackId: string) {
  if (isDemoMode()) return { ok: true };
  await getRequiredSignalFlowUser("admin");
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("tracks")
    .update({
      status: "approved",
      discovery_stage: "first_50",
      rejection_reason: null,
    })
    .eq("id", trackId);
  revalidatePath("/admin/tracks");
  revalidatePath("/discover");
  return { ok: !error, error: error?.message };
}

export async function rejectTrackAction(trackId: string, reason = "Not approved for the Flow yet.") {
  if (isDemoMode()) return { ok: true };
  await getRequiredSignalFlowUser("admin");
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("tracks")
    .update({
      status: "rejected",
      rejection_reason: reason,
    })
    .eq("id", trackId);
  revalidatePath("/admin/tracks");
  return { ok: !error, error: error?.message };
}

export async function saveTrackAction(trackId: string, secondsPlayed = 0) {
  if (isDemoMode()) return { ok: true };
  const user = await getRequiredSignalFlowUser("scout");
  const supabase = await createServerSupabase();
  await supabase.from("saves").upsert(
    {
      user_id: user.id,
      track_id: trackId,
    },
    { onConflict: "user_id,track_id" },
  );
  await supabase.from("listen_events").insert({
    track_id: trackId,
    user_id: user.id,
    seconds_played: Math.round(secondsPlayed),
    saved: true,
  });
  revalidatePath("/saved");
  return { ok: true };
}

export async function skipTrackAction(trackId: string, secondsPlayed = 0) {
  if (isDemoMode()) return { ok: true };
  const user = await getRequiredSignalFlowUser("scout");
  const supabase = await createServerSupabase();
  await supabase.from("listen_events").insert({
    track_id: trackId,
    user_id: user.id,
    seconds_played: Math.round(secondsPlayed),
    skipped: true,
  });
  revalidatePath("/discover");
  return { ok: true };
}

export async function backTrackAction(trackId: string, artistId: string, secondsPlayed = 0) {
  if (secondsPlayed < 15) {
    return { ok: false, error: "Listen a little longer before you Back this artist." };
  }
  if (isDemoMode()) return { ok: true, listenerNumber: 23 };
  const user = await getRequiredSignalFlowUser("scout");
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase
    .from("backs")
    .select("*")
    .eq("track_id", trackId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    return { ok: true, listenerNumber: (existing as Back).listener_number };
  }

  const { count } = await supabase
    .from("backs")
    .select("id", { count: "exact", head: true })
    .eq("track_id", trackId);
  const listenerNumber = (count ?? 0) + 1;

  await supabase.from("listen_events").insert({
    track_id: trackId,
    user_id: user.id,
    seconds_played: Math.round(secondsPlayed),
    backed: true,
    completed: secondsPlayed >= 30,
  });
  const { error } = await supabase.from("backs").insert({
    user_id: user.id,
    track_id: trackId,
    artist_id: artistId,
    listener_number: listenerNumber,
    artist_followers_at_backing: 0,
  });
  if (error) return { ok: false, error: error.message };

  await supabase
    .from("scout_profiles")
    .update({
      backed_count: listenerNumber,
      flowfinder_score: listenerNumber * 12,
    })
    .eq("user_id", user.id);
  revalidatePath("/backed");
  revalidatePath("/scout/profile");
  return { ok: true, listenerNumber };
}

export async function commentTrackAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (isDemoMode()) return { error: null, message: "Demo comment noted locally." };
  const user = await getRequiredSignalFlowUser("scout");
  const trackId = text(formData, "track_id");
  const body = text(formData, "body");
  if (!trackId || !body) return { error: "Add a comment before sending." };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    track_id: trackId,
    body,
  });
  if (error) return { error: error.message };
  revalidatePath(`/artist/tracks/${trackId}`);
  return { error: null, message: "Comment sent." };
}

export async function reportTrackAction(trackId: string, reason: string) {
  if (isDemoMode()) return { ok: true };
  const user = await getRequiredSignalFlowUser("scout");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: "track",
    target_id: trackId,
    reason,
    status: "open",
  });
  revalidatePath("/admin/reports");
  return { ok: !error, error: error?.message };
}

export async function signOut() {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}

// Compatibility stubs for inherited inactive components.
export async function chooseDirection(..._args: unknown[]) {
  redirect("/scout/onboarding");
}
export async function logPractice(..._args: unknown[]): Promise<{ logId: string | null }> {
  return { logId: null };
}
export interface SubmitProofState {
  error: string | null;
  proofId?: string;
}
export async function submitProof(..._args: unknown[]): Promise<SubmitProofState> {
  return { error: "This beta flow has moved to SIGNAL//FLOW track upload." };
}
export interface GiveFeedbackState {
  error: string | null;
}
export async function giveFeedback(..._args: unknown[]): Promise<GiveFeedbackState> {
  return { error: "Feedback has moved to track comments and reports." };
}
export async function markFeedbackHelpful(..._args: unknown[]) {}
export interface BetaFeedbackState {
  error: string | null;
  done?: boolean;
}
export async function submitBetaFeedback(..._args: unknown[]): Promise<BetaFeedbackState> {
  return { error: null, done: true };
}
export async function markNotificationRead(..._args: unknown[]) {}
export interface WaitlistState {
  error: string | null;
  done?: boolean;
}
export async function requestWaitlistAccess(..._args: unknown[]): Promise<WaitlistState> {
  return { error: null, done: true };
}

void (null as ProofType | null);
