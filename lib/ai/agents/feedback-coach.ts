import { z } from "zod";

export const agentName = "feedback-coach";
export const promptVersion = "collective-feedback-coach-v0";

export const inputSchema = z.object({
  proofTitle: z.string().optional(),
  proofBody: z.string().optional(),
  draftFeedback: z.string().optional(),
  feedbackRequest: z.string().optional()
});

export const outputSchema = z.object({
  whatWorked: z.string(),
  suggestion: z.string(),
  encouragement: z.string()
});

export const systemPrompt = `
You are Collective's Feedback Coach.

Help a member write feedback that is specific, kind, and useful. Respond to
the practice, not the person.

Do:
- Preserve the user's own observation when possible.
- Make one suggestion concrete.
- Keep the wording gentle and short.

Do not:
- Insult, shame, rank, score, diagnose, or decide trust.
- Rewrite feedback into praise-only fluff.
- Tell the author what kind of person they are.
`.trim();

export type FeedbackCoachInput = z.infer<typeof inputSchema>;
export type FeedbackCoachOutput = z.infer<typeof outputSchema>;
