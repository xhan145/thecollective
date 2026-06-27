import {
  hasCapability,
  capabilitiesForTier,
  nextTierUnlocks,
  TIER_CAPABILITIES,
  HELP_SUMMARY,
} from "../lib/roles";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
const p = (trustScore: number) => ({ trustScore });

// give_feedback + host_cohort gate at Reliable (>=50), unchanged from today
assert(!hasCapability(p(49), "give_feedback"), "49 should not give_feedback");
assert(hasCapability(p(50), "give_feedback"), "50 should give_feedback");
assert(!hasCapability(p(49), "host_cohort"), "49 should not host_cohort");
assert(hasCapability(p(50), "host_cohort"), "50 should host_cohort");

// mentor_visibility + cohort_guide gate at Helpful (>=100)
assert(!hasCapability(p(99), "mentor_visibility"), "99 should not mentor_visibility");
assert(hasCapability(p(100), "mentor_visibility"), "100 should mentor_visibility");
assert(hasCapability(p(100), "cohort_guide"), "100 should cohort_guide");

// welcome_newcomers + steward gate at Contributor (>=200)
assert(!hasCapability(p(199), "welcome_newcomers"), "199 should not welcome_newcomers");
assert(hasCapability(p(200), "welcome_newcomers"), "200 should welcome_newcomers");
assert(hasCapability(p(200), "steward"), "200 should steward");

// null/undefined profile => no capabilities
assert(!hasCapability(null, "give_feedback"), "null => no capability");

// cumulative + monotonic: each tier includes all lower-tier capabilities
const order = ["New", "Practicing", "Reliable", "Helpful", "Contributor"] as const;
for (let i = 1; i < order.length; i++) {
  const lower = capabilitiesForTier(order[i - 1]);
  const higher = capabilitiesForTier(order[i]);
  assert(lower.every((c) => higher.includes(c)), `${order[i]} must include all of ${order[i - 1]}`);
}
assert(capabilitiesForTier("Contributor").length === 6, "Contributor has all 6 capabilities");
assert(capabilitiesForTier("Practicing").length === 0, "Practicing has 0 tier-gated capabilities");

// nextTierUnlocks skips tiers that unlock nothing (Practicing) and ends at Contributor
assert(nextTierUnlocks("New")?.tier === "Reliable", "New -> Reliable next");
assert(nextTierUnlocks("Reliable")?.tier === "Helpful", "Reliable -> Helpful next");
assert(nextTierUnlocks("Contributor") === null, "Contributor has no next");

// every tier has a help summary string
assert(order.every((t) => typeof HELP_SUMMARY[t] === "string" && HELP_SUMMARY[t].length > 0), "HELP_SUMMARY complete");

console.log("roles checks passed");
