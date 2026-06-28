// Achievement badge types + a pure client/demo evaluator that mirrors the SQL
// `evaluate_achievements()` rules (so badges work in demo mode without Supabase).

export type BadgeMetric =
  | "practice_count"
  | "proof_count"
  | "feedback_given_count"
  | "feedback_received_count"
  | "trust_score";

export type UnlockRule =
  | { type: "flag"; metric: "has_direction" }
  | { type: "count"; metric: BadgeMetric; gte: number };

export type Achievement = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  stage: string;
  rarity: string; // Common | Uncommon | Rare | Epic
  icon?: string | null;
  unlockRule: UnlockRule | Record<string, never>;
  isHidden: boolean;
  isActive: boolean;
};

export type UserAchievement = {
  achievementId: string;
  slug: string;
  unlockedAt: string;
};

export type BadgeProfileCounts = {
  practiceCount: number;
  proofCount: number;
  feedbackGivenCount: number;
  feedbackReceivedCount: number;
  trustScore: number;
  hasDirection: boolean;
};

const BADGE_CATEGORIES = [
  "Core Loop",
  "Practice",
  "Proof",
  "Feedback",
  "Trust",
  "Communication",
  "Contribution",
] as const;
export type BadgeFilter = "All" | (typeof BADGE_CATEGORIES)[number];
export const BADGE_FILTERS: BadgeFilter[] = ["All", ...BADGE_CATEGORIES];

/** Pure evaluator: returns slugs of badges newly satisfied (not already unlocked). */
export function evaluateLocalBadges(
  counts: BadgeProfileCounts,
  achievements: Achievement[],
  unlockedSlugs: Set<string>,
): string[] {
  const newly: string[] = [];
  for (const a of achievements) {
    if (!a.isActive || a.isHidden) continue;
    if (unlockedSlugs.has(a.slug)) continue;
    const rule = a.unlockRule as UnlockRule;
    let ok = false;
    if (rule && rule.type === "flag" && rule.metric === "has_direction") {
      ok = counts.hasDirection;
    } else if (rule && rule.type === "count") {
      const val =
        rule.metric === "practice_count" ? counts.practiceCount :
        rule.metric === "proof_count" ? counts.proofCount :
        rule.metric === "feedback_given_count" ? counts.feedbackGivenCount :
        rule.metric === "feedback_received_count" ? counts.feedbackReceivedCount :
        rule.metric === "trust_score" ? counts.trustScore : 0;
      ok = val >= rule.gte;
    }
    if (ok) newly.push(a.slug);
  }
  return newly;
}
