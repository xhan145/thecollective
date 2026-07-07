// Pure moderation vocabulary + decision helpers. No imports, no side effects —
// mirrors the server-side submit_report RPC logic so the UI and tests agree.

export type ReportSeverity = "severe" | "mild";
export type ReportReason =
  | "harassment" | "unsafe" | "sexual_or_violent"   // severe
  | "spam" | "low_quality" | "off_topic" | "other"; // mild
export type ModerationStatus = "clear" | "limited" | "pending" | "removed";
export type ReportTargetType = "proof" | "feedback";

const SEVERE: ReportReason[] = ["harassment", "unsafe", "sexual_or_violent"];

/** Distinct reporters needed to hide MILD-reason content (severe hides at 1). */
export const MILD_THRESHOLD = 3;
/** A reporter is credible (can trigger a severe instant-hide) when not spam-flagged. */
export const CREDIBLE_SPAM_CEILING = 40;

export function severityOf(reason: ReportReason): ReportSeverity {
  return SEVERE.includes(reason) ? "severe" : "mild";
}

export function isCredibleReporter(spamSignal: number): boolean {
  return spamSignal < CREDIBLE_SPAM_CEILING;
}

/** Server-mirror of the hide decision: severe hides on 1 credible report;
 *  mild hides once distinct reporters reach the threshold. */
export function shouldHide(reason: ReportReason, credible: boolean, distinctReporters: number): boolean {
  if (severityOf(reason) === "severe") return credible;
  return distinctReporters >= MILD_THRESHOLD;
}

export const REPORT_REASONS: { id: ReportReason; label: string; severity: ReportSeverity; help: string }[] = [
  { id: "harassment", label: "Harassment or bullying", severity: "severe", help: "Attacks the person, not the attempt." },
  { id: "unsafe", label: "Unsafe or harmful", severity: "severe", help: "Threats, self-harm, or dangerous advice." },
  { id: "sexual_or_violent", label: "Sexual or violent", severity: "severe", help: "Explicit or graphic content." },
  { id: "spam", label: "Spam or self-promotion", severity: "mild", help: "Ads, links, or repeated noise." },
  { id: "low_quality", label: "Not a real attempt", severity: "mild", help: "No practice, proof, or effort." },
  { id: "off_topic", label: "Off-topic", severity: "mild", help: "Unrelated to the practice." },
  { id: "other", label: "Something else", severity: "mild", help: "Tell us in a note below." },
];
