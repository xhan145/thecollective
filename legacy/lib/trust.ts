import type { TrustEventRecord } from "./proofModels";

export type TrustLevel = "New" | "Practicing" | "Reliable" | "Contributor";

export function calculateTrustLevel(score: number): TrustLevel {
  if (score >= 150) return "Contributor";
  if (score >= 75) return "Reliable";
  if (score >= 25) return "Practicing";
  return "New";
}

export function calculateTrustScore(events: TrustEventRecord[]) {
  return events.reduce((total, event) => total + event.points, 0);
}

export function createProofTrustEvent(userId: string, proofId: string, points = 8): TrustEventRecord {
  return {
    id: `trust-${Date.now()}`,
    user_id: userId,
    source_type: "proof_submission",
    source_id: proofId,
    points,
    reason: "Submitted practice proof",
    created_at: new Date().toISOString()
  };
}
