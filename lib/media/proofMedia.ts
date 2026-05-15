import type { MediaKind, ProofMediaRecord, ProofType } from "@/lib/types";

export const proofTypeLabels: Record<ProofType, string> = {
  text: "Text",
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "Document/PDF",
  screenshot: "Screenshot",
  link: "Link",
  checklist: "Checklist/reflection"
};

export const proofFileLimits: Partial<Record<ProofType, number>> = {
  image: 10 * 1024 * 1024,
  screenshot: 10 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  document: 25 * 1024 * 1024
};

export const documentAccept = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/markdown"
];

export function formatFileSize(bytes?: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value = value / 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

export function getMediaKind(mimeType: string): MediaKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "text/uri-list") return "link";
  return "document";
}

export function getAcceptForProofType(proofType: ProofType) {
  if (proofType === "image" || proofType === "screenshot") return "image/*";
  if (proofType === "video") return "video/*";
  if (proofType === "audio") return "audio/*";
  if (proofType === "document") return [...documentAccept, ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md"].join(",");
  return undefined;
}

export function validateProofFile(file: File, proofType: ProofType): { valid: boolean; error?: string } {
  const limit = proofFileLimits[proofType];
  if (!limit) return { valid: false, error: "This proof type does not need a file upload." };
  if (file.size > limit) {
    return { valid: false, error: `${proofTypeLabels[proofType]} proofs can be up to ${formatFileSize(limit)} in this prototype.` };
  }
  if ((proofType === "image" || proofType === "screenshot") && !file.type.startsWith("image/")) {
    return { valid: false, error: "Choose an image file for this proof type." };
  }
  if (proofType === "video" && !file.type.startsWith("video/")) {
    return { valid: false, error: "Choose a video file for this proof type." };
  }
  if (proofType === "audio" && !file.type.startsWith("audio/")) {
    return { valid: false, error: "Choose an audio file for this proof type." };
  }
  if (proofType === "document" && !documentAccept.includes(file.type)) {
    return { valid: false, error: "Use a PDF, Word, PowerPoint, text, or markdown document." };
  }
  return { valid: true };
}

export function createDemoMediaRecord(file: File, proofType: ProofType, previewUrl?: string): ProofMediaRecord {
  const mediaKind = proofType === "screenshot" ? "image" : getMediaKind(file.type);
  return {
    id: `demo-media-${Date.now()}`,
    bucket: "proof-media",
    proofType,
    mediaKind,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
    fileUrl: previewUrl,
    storagePath: prepareStoragePath("demo-user", file.name),
    uploadStatus: "demo-uploaded",
    createdAt: new Date().toISOString()
  };
}

export function prepareStoragePath(userId: string, fileName: string) {
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "-") || "demo-user";
  const safeFile = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-");
  return `${safeUser}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeFile}`;
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function proofTypeToMediaKind(proofType: ProofType): MediaKind {
  if (proofType === "screenshot") return "image";
  if (proofType === "checklist") return "checklist";
  return proofType;
}
