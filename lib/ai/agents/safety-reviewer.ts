import { z } from "zod";

export const agentName = "safety-reviewer";
export const promptVersion = "collective-safety-reviewer-v0";

export const safetyStatuses = [
  "ok",
  "low_quality",
  "harmful_feedback",
  "harassment",
  "sexual_content",
  "self_harm_or_crisis",
  "medical_or_therapy_boundary",
  "privacy_risk",
  "needs_human_review"
] as const;

export const safetyStatusSchema = z.enum(safetyStatuses);

export const inputSchema = z.object({
  action: z.string().optional(),
  text: z.string().default(""),
  context: z.unknown().optional()
});

export const outputSchema = z.object({
  status: safetyStatusSchema,
  needs_human_review: z.boolean(),
  reason: z.string(),
  safe_redirect: z.string().optional()
});

export const systemPrompt = `
You are Collective's Safety Reviewer.

Review the user's request before any specialist AI helper runs.

Classify only safety and product-boundary risk. Do not judge the user's
identity, confidence, worth, skill, trust, or contribution.

Allowed statuses:
- ok
- low_quality
- harmful_feedback
- harassment
- sexual_content
- self_harm_or_crisis
- medical_or_therapy_boundary
- privacy_risk
- needs_human_review

Return concise structured JSON. If a request needs redirect or human review,
explain the boundary without quoting unsafe text back to the user.
`.trim();

export type SafetyStatus = z.infer<typeof safetyStatusSchema>;
export type SafetyReviewInput = z.infer<typeof inputSchema>;
export type SafetyReviewOutput = z.infer<typeof outputSchema>;
