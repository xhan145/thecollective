import { trustLevelForPoints } from "./betaTrust";
import type { TrustSummary } from "./betaTypes";

/** The five Trust V2 tiers, lowest to highest. */
export type TierLabel = TrustSummary["levelLabel"];

/** Tier-gated capabilities. (Knowledge tips + contribute are NOT here — they keep
 *  their existing completion/behavior gates, by design.) */
export type Capability =
  | "give_feedback"
  | "host_cohort"
  | "mentor_visibility"
  | "cohort_guide"
  | "welcome_newcomers"
  | "steward";

const TIER_ORDER: TierLabel[] = ["New", "Practicing", "Reliable", "Helpful", "Contributor"];

/** Capabilities introduced AT each tier (not cumulative). */
const UNLOCKED_AT: Record<TierLabel, Capability[]> = {
  New: [],
  Practicing: [],
  Reliable: ["give_feedback", "host_cohort"],
  Helpful: ["mentor_visibility", "cohort_guide"],
  Contributor: ["welcome_newcomers", "steward"],
};

/** Cumulative capabilities available at each tier (includes all lower tiers). */
export const TIER_CAPABILITIES: Record<TierLabel, Capability[]> = (() => {
  const acc: Capability[] = [];
  const out = {} as Record<TierLabel, Capability[]>;
  for (const tier of TIER_ORDER) {
    acc.push(...UNLOCKED_AT[tier]);
    out[tier] = [...acc];
  }
  return out;
})();

export function tierForProfile(
  profile: { trustScore?: number | null } | null | undefined,
): TierLabel {
  return trustLevelForPoints(profile?.trustScore ?? 0);
}

export function capabilitiesForTier(tier: TierLabel): Capability[] {
  return TIER_CAPABILITIES[tier];
}

/** Earned, never settable: derives from trust_score -> tier. */
export function hasCapability(
  profile: { trustScore?: number | null } | null | undefined,
  cap: Capability,
): boolean {
  if (!profile) return false;
  return capabilitiesForTier(tierForProfile(profile)).includes(cap);
}

/** The next tier that unlocks at least one new capability, or null at the top. */
export function nextTierUnlocks(
  tier: TierLabel,
): { tier: TierLabel; capabilities: Capability[] } | null {
  const i = TIER_ORDER.indexOf(tier);
  for (let j = i + 1; j < TIER_ORDER.length; j++) {
    if (UNLOCKED_AT[TIER_ORDER[j]].length > 0) {
      return { tier: TIER_ORDER[j], capabilities: UNLOCKED_AT[TIER_ORDER[j]] };
    }
  }
  return null;
}

/** One-line "what you can help with" per tier (service framing, no clout). */
export const HELP_SUMMARY: Record<TierLabel, string> = {
  New: "Practice, post proof, and mark what's useful to you.",
  Practicing: "Add tips on practices you've done, and contribute to open proofs.",
  Reliable: "Give feedback and host your own cohort.",
  Helpful: "Be listed as someone to learn from, and help guide a cohort.",
  Contributor: "Welcome newcomers in your direction — you're a Steward here.",
};
