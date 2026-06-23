// Mirrors the "Forbidden language" + anti-clout rules in lib/collectiveAiPolicy.ts.
// Used to validate REAL model output before it can reach a user; a hit forces a
// fallback to the safe mock response.
export const FORBIDDEN: RegExp[] = [
  /\byou are bad at\b/i,
  /\byou (are|seem) (clearly )?(insecure|worthless|stupid|a failure)\b/i,
  /\bthis proves you are\b/i,
  /\bconfidence score\b/i,
  /\b(trust|skill|worth)\s+score\b/i,
  /\byou failed\b/i,
  /\byou should dominate\b/i,
  /\bmake you elite\b/i,
  /\bleaderboard\b/i,
  /\bfollowers?\b/i,
  /\blikes\b/i,
  /\bgo viral\b/i,
  /\bclout\b/i,
];

/** Throw if any rendered, user-facing string trips the brand policy. */
export function assertBrandSafe(parts: Array<string | undefined | null>): void {
  const text = parts.filter(Boolean).join("\n");
  for (const re of FORBIDDEN) {
    if (re.test(text)) throw new Error(`brand policy violation: ${re}`);
  }
}
