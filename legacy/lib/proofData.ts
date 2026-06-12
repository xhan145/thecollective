import type { FeedbackRecord, ProofSubmissionRecord, TrustEventRecord } from "./proofModels";

export const demoMediaProofSubmissions: ProofSubmissionRecord[] = [
  {
    id: "proof-media-1",
    user_id: "demo-user-maya",
    title: "One honest sentence rehearsal",
    reflection_text: "I practiced saying the request without apologizing first. The second take sounded clearer.",
    media_url: "",
    media_type: "video",
    media_thumbnail_url: "",
    practice_area: "communication",
    visibility: "feedback-only",
    status: "submitted",
    ai_summary: "A short communication practice with a focused request for clarity feedback.",
    feedback_count: 0,
    trust_weight: 46,
    consistent_practice_count: 5,
    created_at: "2026-05-17T17:20:00.000Z",
    updated_at: "2026-05-17T17:20:00.000Z"
  },
  {
    id: "proof-media-2",
    user_id: "demo-user-sam",
    title: "Desk reset proof",
    reflection_text: "The photo made the five-minute step feel real instead of theoretical.",
    media_url: "",
    media_type: "image",
    media_thumbnail_url: "",
    practice_area: "momentum",
    visibility: "public",
    status: "feedback_received",
    ai_summary: "A low-friction momentum proof showing visible completion.",
    feedback_count: 2,
    trust_weight: 62,
    consistent_practice_count: 8,
    created_at: "2026-05-17T13:05:00.000Z",
    updated_at: "2026-05-17T15:12:00.000Z"
  },
  {
    id: "proof-media-3",
    user_id: "demo-user-rin",
    title: "Private message draft",
    reflection_text: "I wrote the message more warmly after naming what I actually wanted to say.",
    media_url: "",
    media_type: "image",
    media_thumbnail_url: "",
    practice_area: "confidence",
    visibility: "feedback-only",
    status: "submitted",
    ai_summary: "A screenshot proof asking for feedback on clarity and warmth.",
    feedback_count: 0,
    trust_weight: 28,
    consistent_practice_count: 3,
    created_at: "2026-05-16T21:40:00.000Z",
    updated_at: "2026-05-16T21:40:00.000Z"
  }
];

export const demoFeedbackRecords: FeedbackRecord[] = [
  {
    id: "feedback-1",
    proof_id: "proof-media-2",
    reviewer_id: "demo-reviewer-1",
    feedback_text: "The proof is specific. A useful next step could be choosing tomorrow's first five-minute action now.",
    feedback_type: "suggestion",
    helpful_count: 3,
    created_at: "2026-05-17T15:12:00.000Z"
  },
  {
    id: "feedback-2",
    proof_id: "proof-media-2",
    reviewer_id: "demo-reviewer-2",
    feedback_text: "The small scope is working here. Keep the next action just as visible.",
    feedback_type: "encouragement",
    helpful_count: 2,
    created_at: "2026-05-17T15:20:00.000Z"
  }
];

export const demoTrustEvents: TrustEventRecord[] = [
  { id: "trust-1", user_id: "demo-user-maya", source_type: "proof_submission", source_id: "proof-media-1", points: 8, reason: "Submitted video proof", created_at: "2026-05-17T17:20:00.000Z" },
  { id: "trust-2", user_id: "demo-user-sam", source_type: "feedback_received", source_id: "feedback-1", points: 5, reason: "Received helpful feedback", created_at: "2026-05-17T15:12:00.000Z" },
  { id: "trust-3", user_id: "demo-user-rin", source_type: "proof_submission", source_id: "proof-media-3", points: 8, reason: "Submitted screenshot proof", created_at: "2026-05-16T21:40:00.000Z" }
];

export function rankProofFeed(proofs: ProofSubmissionRecord[]) {
  return [...proofs].sort((a, b) => {
    const noFeedbackBoostA = a.feedback_count === 0 ? 1 : 0;
    const noFeedbackBoostB = b.feedback_count === 0 ? 1 : 0;
    const practiceBoostA = a.consistent_practice_count || 0;
    const practiceBoostB = b.consistent_practice_count || 0;
    const scoreA = new Date(a.created_at).getTime() / 100000000 + noFeedbackBoostA * 18 + practiceBoostA * 2;
    const scoreB = new Date(b.created_at).getTime() / 100000000 + noFeedbackBoostB * 18 + practiceBoostB * 2;
    return scoreB - scoreA;
  });
}
