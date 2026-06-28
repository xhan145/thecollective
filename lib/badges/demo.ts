import type { Achievement } from "./types";

// Demo-mode badge definitions (mirror the seed in migration 032) so /badges
// renders without Supabase. In Supabase mode the real definitions are fetched.
function a(slug: string, name: string, description: string, category: string, stage: string, rarity: string, rule: Achievement["unlockRule"]): Achievement {
  return { id: slug, slug, name, description, category, stage, rarity, unlockRule: rule, isHidden: false, isActive: true };
}

export const DEMO_ACHIEVEMENTS: Achievement[] = [
  a("direction_chosen", "Direction Chosen", "You chose a growth direction to practice.", "Direction", "Started", "Common", { type: "flag", metric: "has_direction" }),
  a("first_practice", "First Practice", "You completed your first practice rep.", "Practice", "Started", "Common", { type: "count", metric: "practice_count", gte: 1 }),
  a("practice_builder", "Practice Builder", "You completed 10 practice reps.", "Practice", "Practicing", "Common", { type: "count", metric: "practice_count", gte: 10 }),
  a("real_reps", "Real Reps", "You completed 25 practice reps.", "Practice", "Practicing", "Uncommon", { type: "count", metric: "practice_count", gte: 25 }),
  a("strong_foundation", "Strong Foundation", "You completed 50 practice reps.", "Practice", "Identity", "Rare", { type: "count", metric: "practice_count", gte: 50 }),
  a("first_proof", "First Proof", "You submitted your first proof.", "Proof", "Started", "Common", { type: "count", metric: "proof_count", gte: 1 }),
  a("proof_builder", "Proof Builder", "You submitted 10 proofs.", "Proof", "Practicing", "Uncommon", { type: "count", metric: "proof_count", gte: 10 }),
  a("proof_library", "Proof Library", "You submitted 50 proofs into your archive.", "Proof", "Identity", "Rare", { type: "count", metric: "proof_count", gte: 50 }),
  a("first_feedback_given", "First Feedback Given", "You gave feedback to another member.", "Feedback", "Started", "Common", { type: "count", metric: "feedback_given_count", gte: 1 }),
  a("first_feedback_received", "First Feedback Received", "You received feedback on a proof.", "Feedback", "Started", "Common", { type: "count", metric: "feedback_received_count", gte: 1 }),
  a("trust_started", "Trust Started", "You earned your first trust through real practice.", "Trust", "Trusted", "Common", { type: "count", metric: "trust_score", gte: 1 }),
  a("trusted_contributor", "Trusted Contributor", "You reached Contributor through repeated useful help.", "Contribution", "Identity", "Epic", { type: "count", metric: "trust_score", gte: 200 }),
];

/** Human "what unlocks this" line for a locked badge, given current metric value. */
export function nextActionFor(badge: Achievement, current: number): string {
  const rule = badge.unlockRule as { type: string; metric?: string; gte?: number };
  if (rule.type === "flag") return "Choose a direction to begin.";
  if (rule.type === "count" && typeof rule.gte === "number") {
    const remaining = Math.max(0, rule.gte - current);
    const noun =
      rule.metric === "practice_count" ? "practice rep" :
      rule.metric === "proof_count" ? "proof" :
      rule.metric === "feedback_given_count" ? "piece of feedback to give" :
      rule.metric === "feedback_received_count" ? "piece of feedback to receive" :
      rule.metric === "trust_score" ? "trust point" : "step";
    return remaining <= 0 ? "Almost there." : `${remaining} more ${noun}${remaining === 1 ? "" : "s"}.`;
  }
  return "Keep practicing.";
}

/** Which profile metric a badge keys off (for showing progress on locked badges). */
export function metricValue(badge: Achievement, counts: { practiceCount: number; proofCount: number; feedbackGivenCount: number; feedbackReceivedCount: number; trustScore: number }): number {
  const rule = badge.unlockRule as { metric?: string };
  switch (rule.metric) {
    case "practice_count": return counts.practiceCount;
    case "proof_count": return counts.proofCount;
    case "feedback_given_count": return counts.feedbackGivenCount;
    case "feedback_received_count": return counts.feedbackReceivedCount;
    case "trust_score": return counts.trustScore;
    default: return 0;
  }
}
