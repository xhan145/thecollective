import { levelRank } from "@/lib/betaTrust";

/** Reliable+ (rank >= 2) may create cohorts. Mirrors the SQL create_cohort gate (trust_score >= 50). */
export function canCreateCohort(profile: { trustScore?: number | null } | null | undefined): boolean {
  return !!profile && levelRank(profile) >= 2;
}
