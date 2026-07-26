import type { SupabaseClient } from "@supabase/supabase-js";
import { INTRO_CLIP_BUCKET } from "@/lib/supabase/client";
import { baseMimeType, extForMimeType, type IntroClipKind } from "@/lib/introClip";

// Data layer for the 30s intro clip. Uploads mirror uploadProofFile; profile
// writes go only through the SECURITY DEFINER RPCs (set_intro_clip /
// clear_intro_clip, migration 050) because intro_clip_* is not in the 036
// client-write allowlist. RLS errors are translated to calm copy.

export type UploadedClip = { path: string; error: null } | { path: null; error: string };

/** Upload the caller's clip to {userId}/intro/{timestamp}.{ext}. */
export async function uploadIntroClip(
  client: SupabaseClient,
  userId: string,
  blob: Blob,
  mimeType: string,
): Promise<UploadedClip> {
  const contentType = baseMimeType(mimeType); // strip codecs so it matches the bucket allowlist
  const ext = extForMimeType(mimeType);
  const path = `${userId}/intro/${Date.now()}.${ext}`;
  const { error } = await client.storage
    .from(INTRO_CLIP_BUCKET)
    .upload(path, blob, { upsert: false, contentType: contentType || undefined });
  if (error) return { path: null, error: "That clip couldn't be saved. Please try again." };
  return { path, error: null };
}

/** Record the uploaded clip on the profile. The RPC clamps duration to 1..30. */
export async function setIntroClip(
  client: SupabaseClient,
  path: string,
  kind: IntroClipKind,
  durationSeconds: number,
): Promise<{ error: string | null }> {
  const { error } = await client.rpc("set_intro_clip", {
    p_path: path,
    p_kind: kind,
    p_duration: Math.round(durationSeconds),
  });
  return { error: error ? "That clip couldn't be saved. Please try again." : null };
}

/**
 * Delete a clip object (best-effort; own-folder only). A leftover orphan is
 * unreadable regardless: migration 051's read policy only authorizes the object
 * the profile currently points at (intro_clip_path), so a swallowed failure here
 * can't leave a "removed"/replaced clip retrievable.
 */
export async function removeIntroClipObject(client: SupabaseClient, path: string | null): Promise<void> {
  if (!path) return;
  try {
    await client.storage.from(INTRO_CLIP_BUCKET).remove([path]);
  } catch {
    /* ignore — the 051 current-path read policy makes any orphan unreadable */
  }
}

/** Remove the current object (best-effort) then clear the profile columns. */
export async function clearIntroClip(
  client: SupabaseClient,
  currentPath: string | null,
): Promise<{ error: string | null }> {
  await removeIntroClipObject(client, currentPath);
  const { error } = await client.rpc("clear_intro_clip");
  return { error: error ? "That didn't work. Please try again." : null };
}
