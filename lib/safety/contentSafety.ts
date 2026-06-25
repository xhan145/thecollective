// Deterministic content-safety pre-gate for short user text (tips, and reusable elsewhere).
// Pure, no I/O. Blocks crisis, harassment, and private-info before any model/storage.

const CRISIS: RegExp[] = [
  /\bkill myself\b/i,
  /\bsuicide\b/i,
  /\bend my life\b/i,
  /\bhurt myself\b/i,
  /\bself[-\s]?harm\b/i,
];

const HARASSMENT: RegExp[] = [
  /\bworthless\b/i,
  /\bstupid\b/i,
  /\bidiot\b/i,
  /\bshut up\b/i,
  /\byou are (clearly )?(insecure|a failure)\b/i,
];

const PRIVATE_INFO: RegExp[] = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/,
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
];

export type SafetyCheckResult = { ok: boolean; reason?: string };

/** True-pass only when clean. reason names the first failing category. */
export function contentSafetyPrecheck(text: string): SafetyCheckResult {
  if (CRISIS.some((re) => re.test(text))) return { ok: false, reason: "crisis" };
  if (PRIVATE_INFO.some((re) => re.test(text))) return { ok: false, reason: "private information" };
  if (HARASSMENT.some((re) => re.test(text))) return { ok: false, reason: "harassment" };
  return { ok: true };
}
