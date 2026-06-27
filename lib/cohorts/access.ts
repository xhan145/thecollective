import { hasCapability } from "@/lib/roles";

/** Reliable+ may create cohorts. Mirrors the SQL create_cohort gate (trust_score >= 50). */
export function canCreateCohort(
  profile: { trustScore?: number | null } | null | undefined,
): boolean {
  return hasCapability(profile, "host_cohort");
}
