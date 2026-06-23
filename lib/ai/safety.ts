import type { SafetyReviewInput, SafetyReviewOutput, SafetyStatus } from "./agents/safety-reviewer";

const crisisPatterns = [
  /\bkill myself\b/i,
  /\bsuicide\b/i,
  /\bend my life\b/i,
  /\bhurt myself\b/i,
  /\bcan't go on\b/i
];

const harassmentPatterns = [
  /\bstupid\b/i,
  /\bidiot\b/i,
  /\bworthless\b/i,
  /\bshut up\b/i,
  /\bcringe\b/i
];

const sexualPatterns = [
  /\bexplicit sexual\b/i,
  /\bnude\b/i,
  /\bporn\b/i
];

const medicalBoundaryPatterns = [
  /\bdiagnose\b/i,
  /\btherapy plan\b/i,
  /\bmedical advice\b/i,
  /\bpanic attack\b/i
];

const privateInfoPatterns = [
  /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:password|api key|secret key|service role)\b/i,
  /\bphone number and email\b/i,
  /\bprivate contact\b/i
];

const harmfulFeedbackPatterns = [
  /\byou failed\b/i,
  /\byou are bad\b/i,
  /\bjust do better\b/i,
  /\bnobody cares\b/i,
  /\bnobody should listen\b/i,
  /\bcareless and unhelpful\b/i
];

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function result(status: SafetyStatus, reason: string, safeRedirect?: string): SafetyReviewOutput {
  const needsHumanReview = !["ok", "low_quality"].includes(status);
  return {
    status,
    needs_human_review: needsHumanReview,
    reason,
    safe_redirect: safeRedirect
  };
}

export function reviewTextSafety(input: SafetyReviewInput): SafetyReviewOutput {
  const text = input.text.trim();

  if (!text) {
    return result("low_quality", "The request is empty or too thin to help with yet.", "Add one sentence about what you want to practice.");
  }

  if (hasAny(text, crisisPatterns)) {
    return result(
      "self_harm_or_crisis",
      "The request may involve crisis or self-harm risk.",
      "This needs human support. If there is immediate danger, contact local emergency services or a trusted person now."
    );
  }

  if (hasAny(text, privateInfoPatterns)) {
    return result(
      "privacy_risk",
      "The request appears to include private contact details or secrets.",
      "Remove private details first, then ask for help with the general situation."
    );
  }

  if (hasAny(text, sexualPatterns)) {
    return result(
      "sexual_content",
      "The request may include sexual content outside this product helper's scope.",
      "Keep the practice focused on confidence, communication, momentum, proof, or feedback."
    );
  }

  if (hasAny(text, medicalBoundaryPatterns)) {
    return result(
      "medical_or_therapy_boundary",
      "The request asks for medical or therapy-like judgment.",
      "A person with the right professional context should handle that. I can still help turn a safe communication goal into a small practice."
    );
  }

  if (hasAny(text, harmfulFeedbackPatterns)) {
    return result(
      "harmful_feedback",
      "The draft feedback may shame the person instead of helping the practice.",
      "Rewrite it around one observation and one useful next step."
    );
  }

  if (hasAny(text, harassmentPatterns)) {
    return result(
      "harassment",
      "The request includes language that could target or demean a person.",
      "Respond to the practice, not the person."
    );
  }

  if (text.length < 12) {
    return result("low_quality", "The request is very short.", "Add one detail so the help can be specific.");
  }

  return result("ok", "No safety boundary detected.");
}
