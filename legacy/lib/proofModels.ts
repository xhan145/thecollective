export type MediaProofType = "image" | "video" | "none";
export type MvpProofVisibility = "private" | "feedback-only" | "public";
export type MvpProofStatus = "draft" | "submitted" | "feedback_received" | "archived";
export type PracticeArea = "confidence" | "communication" | "momentum" | "contribution";

export type ProofSubmissionRecord = {
  id: string;
  user_id: string;
  title: string;
  reflection_text: string;
  media_url?: string;
  media_type: MediaProofType;
  media_thumbnail_url?: string;
  practice_area: PracticeArea;
  visibility: MvpProofVisibility;
  status: MvpProofStatus;
  ai_summary?: string;
  feedback_count: number;
  trust_weight: number;
  created_at: string;
  updated_at: string;
  consistent_practice_count?: number;
};

export type FeedbackType = "encouragement" | "suggestion" | "correction" | "question";

export type FeedbackRecord = {
  id: string;
  proof_id: string;
  reviewer_id: string;
  feedback_text: string;
  feedback_type: FeedbackType;
  helpful_count: number;
  created_at: string;
};

export type TrustEventSource = "proof_submission" | "feedback_given" | "feedback_received" | "contribution";

export type TrustEventRecord = {
  id: string;
  user_id: string;
  source_type: TrustEventSource;
  source_id: string;
  points: number;
  reason: string;
  created_at: string;
};

export const practiceAreaLabels: Record<PracticeArea, string> = {
  confidence: "Confidence",
  communication: "Communication",
  momentum: "Momentum",
  contribution: "Contribution"
};

export const proofVisibilityLabels: Record<MvpProofVisibility, string> = {
  private: "Private",
  "feedback-only": "Feedback only",
  public: "Public"
};

export const proofStatusLabels: Record<MvpProofStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  feedback_received: "Feedback received",
  archived: "Archived"
};
