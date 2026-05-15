export type PathSlug = "speak-up" | "social-momentum" | "daily-momentum" | "give-better-feedback";

export type GrowthPath = {
  slug: PathSlug;
  title: string;
  description: string;
  promise: string;
  color: string;
  estimatedDays: number;
};

export type ProofType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "screenshot"
  | "link"
  | "checklist";

export type MediaKind = "text" | "image" | "video" | "audio" | "document" | "link" | "checklist";
export type UploadStatus = "idle" | "validating" | "ready" | "uploading" | "uploaded" | "demo-uploaded" | "error";
export type ProofVisibility = "private" | "reviewers" | "path" | "public";

export type PracticePrompt = {
  id: string;
  pathSlug: PathSlug;
  title: string;
  instruction: string;
  proofType: ProofType;
  reflectionQuestion: string;
  feedbackQuestion: string;
  estimatedMinutes: number;
  order: number;
};

export type ProofMediaRecord = {
  id: string;
  proofSubmissionId?: string;
  userId?: string;
  bucket?: "proof-media";
  proofType: ProofType;
  mediaKind: MediaKind;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  storagePath?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  uploadStatus: UploadStatus;
  createdAt: string;
};

export type ProofSubmission = {
  id: string;
  userId?: string;
  pathSlug?: PathSlug;
  pathTitle: string;
  promptId?: string;
  promptTitle: string;
  promptInstruction?: string;
  proofType: ProofType;
  mediaKind: MediaKind;
  textResponse?: string;
  linkUrl?: string;
  checklistItems?: string[];
  media?: ProofMediaRecord;
  uploadStatus: UploadStatus;
  visibility: ProofVisibility;
  feedbackRequest?: string;
  reflection: string;
  status: "draft" | "submitted" | "needs-feedback" | "feedback-ready";
  feedbackStatus: "not-requested" | "requested" | "ready";
  createdAt: string;
};

export type MediaAwareFeedback = {
  summary: string;
  whatWorked: string;
  whatCouldImprove: string;
  nextStep: string;
  reflectionQuestion: string;
  riskLevel: "low" | "medium" | "high";
  confidenceScore: number;
  mediaNotes: string;
};

export type FeedMode = "passive" | "bridge" | "active";
export type FeedType = "practice" | "proof" | "reflection" | "feedback" | "milestone" | "prompt" | "lesson" | "question" | "contribution";

export type FeedItem = {
  id: string;
  type: FeedType;
  mode: FeedMode;
  title: string;
  body: string;
  pathSlug?: PathSlug;
  actor?: string;
  trustSignal?: string;
  actionLabel?: string;
  actionHref?: string;
  proofType?: ProofType;
  mediaKind?: MediaKind;
  mediaLabel?: string;
  usefulness: number;
  actionability: number;
  proofStrength: number;
  trustWeight: number;
  recency: number;
  friction: number;
};

export type DemoUser = {
  goal: PathSlug;
  stage: "new" | "practicing" | "contributor";
  completedPromptIds: string[];
};
