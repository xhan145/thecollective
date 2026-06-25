/** Regex patterns for private/sensitive information to exclude from tips. */
const PRIVATE_INFO_PATTERNS: RegExp[] = [
  // Email addresses
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  // Phone numbers (various formats)
  /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/,
  // Social security numbers
  /\b\d{3}-\d{2}-\d{4}\b/,
  // Credit card patterns
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
];

export type SafetyCheckResult = {
  ok: boolean;
  reason?: string;
};

/** Check if a tip body is safe to share (no private info). */
export function coachSafetyPrecheck(body: string): SafetyCheckResult {
  for (const pattern of PRIVATE_INFO_PATTERNS) {
    if (pattern.test(body)) {
      return {
        ok: false,
        reason: "contains private information",
      };
    }
  }
  return { ok: true };
}
