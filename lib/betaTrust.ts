import type { TrustEvent, TrustSummary } from "./betaTypes";

export const TRUST_POINTS = {
  proof: 5,
  "peer-feedback": 3,
  helpful: 7,
  practice: 5,
  "accepted-contribution": 15
} as const;

export function trustLevelForPoints(points: number): TrustSummary["levelLabel"] {
  if (points >= 200) return "Contributor";
  if (points >= 100) return "Helpful";
  if (points >= 50) return "Reliable";
  if (points >= 20) return "Practicing";
  return "New";
}

const TRUST_TIERS = ["New", "Practicing", "Reliable", "Helpful", "Contributor"] as const;

/** 0–4 earned-level rank from a profile's trust points. Missing score => 0 (New). */
export function levelRank(profile: { trustScore?: number | null }): number {
  const label = trustLevelForPoints(profile.trustScore ?? 0);
  const i = TRUST_TIERS.indexOf(label as (typeof TRUST_TIERS)[number]);
  return i < 0 ? 0 : i;
}

export function summarizeTrust(userId: string, events: TrustEvent[]): TrustSummary {
  const userEvents = events.filter((event) => event.userId === userId);
  const totalPoints = userEvents.reduce((sum, event) => sum + event.points, 0);

  return {
    userId,
    totalPoints,
    levelLabel: trustLevelForPoints(totalPoints),
    practicesCompleted: userEvents.filter((event) => event.type === "practice").length,
    proofsSubmitted: userEvents.filter((event) => event.type === "proof").length,
    feedbackGiven: userEvents.filter((event) => event.type === "peer-feedback").length,
    helpfulFeedback: userEvents.filter((event) => event.type === "helpful").length,
    acceptedContributions: userEvents.filter((event) => event.type === "accepted-contribution").length
  };
}

export function makeTrustEvent(
  userId: string,
  type: TrustEvent["type"],
  label: string,
  sourceId?: string
): TrustEvent {
  return {
    id: `trust-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId,
    type,
    points: TRUST_POINTS[type],
    label,
    sourceId,
    createdAt: new Date().toISOString()
  };
}
