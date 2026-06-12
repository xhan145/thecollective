import type { SupabaseClient } from "@supabase/supabase-js";

export const PROOF_BUCKET = "proof-media";
export const BETA_BUCKET = "beta-feedback-media";
export const TRACK_AUDIO_BUCKET = "track-audio";
export const TRACK_ARTWORK_BUCKET = "track-artwork";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB closed-beta cap
const MAX_AUDIO_BYTES = 120 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface UploadResult {
  path: string | null;
  error: string | null;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
}

export async function uploadTrackAsset(
  supabase: SupabaseClient,
  bucket: typeof TRACK_AUDIO_BUCKET | typeof TRACK_ARTWORK_BUCKET,
  userId: string,
  trackId: string,
  file: File,
): Promise<UploadResult & { publicUrl: string | null }> {
  const limit = bucket === TRACK_AUDIO_BUCKET ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return {
      path: null,
      publicUrl: null,
      error:
        bucket === TRACK_AUDIO_BUCKET
          ? "Audio file is larger than 120 MB."
          : "Artwork file is larger than 8 MB.",
    };
  }

  const path = `${userId}/${trackId}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) return { path: null, publicUrl: null, error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl, error: null };
}

/**
 * Upload a proof attachment to proof-media/{userId}/{proofId}/{filename}.
 * Returns the storage path (not a URL — use getSignedUrl to read).
 */
export async function uploadProofMedia(
  supabase: SupabaseClient,
  userId: string,
  proofId: string,
  file: File,
): Promise<UploadResult> {
  if (file.size > MAX_FILE_BYTES) {
    return { path: null, error: "File is larger than 50 MB." };
  }
  const path = `${userId}/${proofId}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

/** Upload a beta-feedback screenshot to beta-feedback-media/{userId}/{rowId}/. */
export async function uploadBetaMedia(
  supabase: SupabaseClient,
  userId: string,
  rowId: string,
  file: File,
): Promise<UploadResult> {
  if (file.size > MAX_FILE_BYTES) {
    return { path: null, error: "File is larger than 50 MB." };
  }
  const path = `${userId}/${rowId}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(BETA_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) return { path: null, error: error.message };
  return { path, error: null };
}

/** Signed URL (1 hour) for closed-beta media. Null if unavailable. */
export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
