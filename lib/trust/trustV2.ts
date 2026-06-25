// Canonical Trust V2 scoring (Node). Migration 027's SQL functions mirror this —
// keep the two in parity. Pure, no I/O.
export const TRUST_POINTS_V2: Record<string, number> = {
  proof: 5,
  practice: 5,
  "peer-feedback": 1,
  helpful: 6,
  "accepted-contribution": 15,
};

// Daily soft caps for self-triggered actions; helpful + accepted-contribution uncapped.
export const DAILY_CAPS: Record<string, number> = {
  proof: 3,
  practice: 3,
  "peer-feedback": 5,
};

/** Points for the Nth action of a type today (todayCountSoFar = how many already counted today). */
export function cappedPoints(type: string, todayCountSoFar: number): number {
  const base = TRUST_POINTS_V2[type] ?? 0;
  const cap = DAILY_CAPS[type];
  if (cap === undefined) return base; // uncapped type
  return todayCountSoFar < cap ? base : 0;
}

/** Rolling consistency: active weeks (0..8) in the last 8 -> 0..32. */
export function consistencyScore(activeWeeksInLast8: number): number {
  return Math.min(Math.max(activeWeeksInLast8, 0), 8) * 4;
}

/** Weighted rollup -> overall trust_score. */
export function weightedTrustScore(d: { practice: number; feedback: number; consistency: number; contribution: number }): number {
  return Math.round(d.practice * 1 + d.feedback * 1.5 + d.consistency * 1 + d.contribution * 2);
}

// Spam enforcement thresholds. Mirror the SQL trigger (>=70 holds) + recompute (<40 releases).
export const SPAM_FLAG = 40;
export const SPAM_QUARANTINE = 70;

export function isFlagged(signal: number): boolean {
  return signal >= SPAM_FLAG;
}
export function isQuarantined(signal: number): boolean {
  return signal >= SPAM_QUARANTINE;
}
export function shouldAutoRelease(signal: number): boolean {
  return signal < SPAM_FLAG;
}
