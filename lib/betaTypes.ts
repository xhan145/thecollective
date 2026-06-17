export type UserRole = "member" | "founder" | "admin";
export type CohortStatus = "open" | "closed" | "archived";
export type DirectionCategory = "confidence" | "communication" | "momentum" | "self-trust" | "contribution";
export type PromptType = "reflection" | "voice-note" | "conversation" | "proof";
export type ProofMediaType = "text" | "image" | "video" | "audio";
export type ProofStatus = "draft" | "submitted" | "feedback-ready" | "used-for-practice";
export type FeedbackTone = "kind" | "specific" | "next-step";
export type TrustEventType = "practice" | "proof" | "peer-feedback" | "helpful" | "accepted-contribution";
export type AppFeedbackCategory = "bug" | "confusing" | "idea" | "safety" | "other";

export type UserProfile = {
  id: string;
  displayName: string;
  initials: string;
  role: UserRole;
  cohortId: string;
  directionIds: string[];
  createdAt: string;
  // Closed-beta profile fields (optional so demo seed literals stay valid).
  username?: string;
  bio?: string;
  avatarUrl?: string;
  currentDirectionId?: string | null;
  onboardingCompleted?: boolean;
  trustScore?: number;
  practiceCount?: number;
  proofCount?: number;
  feedbackGivenCount?: number;
  feedbackReceivedCount?: number;
  contributionCount?: number;
};

export type Cohort = {
  id: string;
  name: string;
  description: string;
  status: CohortStatus;
  memberIds: string[];
  createdAt: string;
};

export type Direction = {
  id: string;
  slug: DirectionCategory | string;
  title: string;
  subtitle: string;
  description: string;
  promptIds: string[];
  beginnerSafePrompt?: string;
};

export type PracticePrompt = {
  id: string;
  directionId: string;
  title: string;
  description: string;
  prompt: string;
  type: PromptType;
  estimatedMinutes: number;
  beginnerSafe: boolean;
  instructions?: string;
  proofPrompt?: string;
};

export type ProofAttachment = {
  id: string;
  mediaType: ProofMediaType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  localUrl?: string;
  storagePath?: string;
};

export type Proof = {
  id: string;
  userId: string;
  promptId: string;
  directionId: string;
  title: string;
  body: string;
  mediaType: ProofMediaType;
  attachments: ProofAttachment[];
  status: ProofStatus;
  visibility: "private" | "cohort";
  feedbackIds: string[];
  createdAt: string;
};

export type Feedback = {
  id: string;
  proofId: string;
  authorId: string;
  recipientId: string;
  body: string;
  tone: FeedbackTone;
  helpful: boolean;
  createdAt: string;
  // Structured beginner-safe feedback (optional; body stays as a joined summary).
  clarityNote?: string;
  usefulNote?: string;
  nextStepNote?: string;
};

export type TrustEvent = {
  id: string;
  userId: string;
  type: TrustEventType;
  points: number;
  label: string;
  sourceId?: string;
  createdAt: string;
};

export type TrustSummary = {
  userId: string;
  totalPoints: number;
  levelLabel: "New" | "Practicing" | "Reliable" | "Helpful" | "Contributor";
  practicesCompleted: number;
  proofsSubmitted: number;
  feedbackGiven: number;
  helpfulFeedback: number;
  acceptedContributions: number;
};

export type AppFeedback = {
  id: string;
  userId: string;
  category: AppFeedbackCategory;
  body: string;
  route?: string;
  rating?: number;
  status?: string;
  createdAt: string;
  reviewed: boolean;
};

export type BetaAppSnapshot = {
  currentUserId: string | null;
  users: UserProfile[];
  cohorts: Cohort[];
  directions: Direction[];
  prompts: PracticePrompt[];
  proofs: Proof[];
  feedback: Feedback[];
  trustEvents: TrustEvent[];
  appFeedback: AppFeedback[];
  aiInteractions: AiInteraction[];
  aiUserFeedback: AiUserFeedback[];
  completedPracticeIds: string[];
};

export type ProofDraftInput = {
  promptId: string;
  body: string;
  mediaType: ProofMediaType;
  attachment?: Omit<ProofAttachment, "id" | "storagePath"> & { file?: File };
};

export type FeedbackDraftInput = {
  proofId: string;
  tone?: FeedbackTone;
  // Either pass a single body, or the three structured notes (preferred).
  body?: string;
  clarityNote?: string;
  usefulNote?: string;
  nextStepNote?: string;
};

export type AppFeedbackDraftInput = {
  category: AppFeedbackCategory;
  body: string;
  route?: string;
  rating?: number;
};
import type { AiInteraction, AiUserFeedback } from "./aiTypes";
