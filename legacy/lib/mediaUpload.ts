import { prepareStoragePath } from "./media/proofMedia";

export type UploadMediaType = "image" | "video";

export type MediaUploadResult = {
  url: string;
  mediaType: UploadMediaType;
  storagePath: string;
  thumbnailUrl?: string;
  isMockUpload: boolean;
};

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const videoTypes = ["video/mp4", "video/quicktime", "video/webm"];
const maxImageSize = 10 * 1024 * 1024;
const maxVideoSize = 100 * 1024 * 1024;

export function getMediaType(file: File): UploadMediaType | "unsupported" {
  if (imageTypes.includes(file.type)) return "image";
  if (videoTypes.includes(file.type)) return "video";
  return "unsupported";
}

export function validateMediaFile(file: File): { valid: boolean; mediaType?: UploadMediaType; error?: string } {
  const mediaType = getMediaType(file);
  if (mediaType === "unsupported") {
    return { valid: false, error: "That file type is not supported yet. Try a JPG, PNG, WEBP, MP4, MOV, or WEBM file." };
  }
  if (mediaType === "image" && file.size > maxImageSize) {
    return { valid: false, mediaType, error: "This image is too large for the prototype. Images can be up to 10 MB." };
  }
  if (mediaType === "video" && file.size > maxVideoSize) {
    return { valid: false, mediaType, error: "This video is too large for the prototype. Videos can be up to 100 MB." };
  }
  return { valid: true, mediaType };
}

export async function pickMedia() {
  if (typeof document === "undefined") return null;
  return new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}

export async function createVideoThumbnail(file: File) {
  const mediaType = getMediaType(file);
  if (mediaType !== "video") return undefined;
  // Future Supabase/worker integration can generate durable thumbnails server-side.
  return undefined;
}

export async function uploadProofMedia(file: File, options?: { userId?: string; previewUrl?: string; onProgress?: (progress: number) => void }): Promise<MediaUploadResult> {
  const validation = validateMediaFile(file);
  if (!validation.valid || !validation.mediaType) {
    throw new Error(validation.error || "We could not use that media file.");
  }

  const storagePath = prepareStoragePath(options?.userId || "demo-user", file.name);
  const hasStorageConfig = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!hasStorageConfig) {
    for (const progress of [18, 42, 68, 100]) {
      options?.onProgress?.(progress);
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    return {
      url: options?.previewUrl || URL.createObjectURL(file),
      mediaType: validation.mediaType,
      storagePath,
      thumbnailUrl: await createVideoThumbnail(file),
      isMockUpload: true
    };
  }

  // TODO: Upload to the private Supabase Storage `proof-media` bucket here.
  // Keep the bucket private and store `storagePath` in the database, not a public URL.
  options?.onProgress?.(100);
  return {
    url: options?.previewUrl || "",
    mediaType: validation.mediaType,
    storagePath,
    thumbnailUrl: await createVideoThumbnail(file),
    isMockUpload: true
  };
}
