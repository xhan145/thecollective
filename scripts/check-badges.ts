import { evaluateLocalBadges, type Achievement, type BadgeProfileCounts } from "../lib/badges/types";

function ach(slug: string, rule: Achievement["unlockRule"]): Achievement {
  return { id: slug, slug, name: slug, description: "", category: "Practice", stage: "Started", rarity: "Common", unlockRule: rule, isHidden: false, isActive: true };
}

const ACH: Achievement[] = [
  ach("direction_chosen", { type: "flag", metric: "has_direction" }),
  ach("first_practice", { type: "count", metric: "practice_count", gte: 1 }),
  ach("practice_builder", { type: "count", metric: "practice_count", gte: 10 }),
  ach("first_proof", { type: "count", metric: "proof_count", gte: 1 }),
  ach("trust_started", { type: "count", metric: "trust_score", gte: 1 }),
  ach("trusted_contributor", { type: "count", metric: "trust_score", gte: 200 }),
];

function counts(partial: Partial<BadgeProfileCounts>): BadgeProfileCounts {
  return { practiceCount: 0, proofCount: 0, feedbackGivenCount: 0, feedbackReceivedCount: 0, trustScore: 0, hasDirection: false, ...partial };
}

function expect(label: string, got: string[], want: string[]) {
  const g = [...got].sort().join(",");
  const w = [...want].sort().join(",");
  if (g !== w) throw new Error(`${label}: expected [${w}], got [${g}]`);
}

// New user, nothing done → no badges.
expect("empty", evaluateLocalBadges(counts({}), ACH, new Set()), []);

// Direction chosen flag.
expect("direction", evaluateLocalBadges(counts({ hasDirection: true }), ACH, new Set()), ["direction_chosen"]);

// 9 practices → first_practice only (not builder at 10).
expect("9 practices", evaluateLocalBadges(counts({ practiceCount: 9 }), ACH, new Set()), ["first_practice"]);

// 10 practices → first_practice + practice_builder.
expect("10 practices", evaluateLocalBadges(counts({ practiceCount: 10 }), ACH, new Set()), ["first_practice", "practice_builder"]);

// Already-unlocked are excluded (idempotent — never unlock twice).
expect("idempotent", evaluateLocalBadges(counts({ practiceCount: 10 }), ACH, new Set(["first_practice", "practice_builder"])), []);

// Trust thresholds: 199 → trust_started only; 200 → + trusted_contributor.
expect("trust 199", evaluateLocalBadges(counts({ trustScore: 199 }), ACH, new Set()), ["trust_started"]);
expect("trust 200", evaluateLocalBadges(counts({ trustScore: 200 }), ACH, new Set()), ["trust_started", "trusted_contributor"]);

// Inactive/hidden never unlock.
const hidden = [{ ...ACH[1], slug: "secret", isHidden: true }, { ...ACH[1], slug: "off", isActive: false }];
expect("hidden/inactive", evaluateLocalBadges(counts({ practiceCount: 5 }), hidden, new Set()), []);

console.log("badges checks passed");
