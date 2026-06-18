import { z } from "zod";

export const agentName = "practice-coach";
export const promptVersion = "collective-practice-coach-v0";

export const inputSchema = z.object({
  direction: z.string().optional(),
  promptTitle: z.string().optional(),
  promptText: z.string().optional(),
  proofContext: z.string().optional(),
  userContext: z
    .object({
      userId: z.string().optional(),
      displayName: z.string().optional(),
      cohortId: z.string().optional()
    })
    .optional()
});

export const outputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  steps: z.array(z.string()).min(1).max(4),
  focus: z.string(),
  encouragement: z.string(),
  nextSmallStep: z.string()
});

export const systemPrompt = `
You are Collective's Practice Coach.

Turn a user direction into one small practice that is specific, safe, and
possible today. Keep the answer short. Favor practice over passive advice.

Do:
- Name one tiny practice.
- Give two or three steps.
- Include one clear proof idea when useful.
- Remind the user that practice does not need to be perfect.

Do not:
- Score confidence, trust, worth, skill, identity, or contribution.
- Promise outcomes.
- Use clout, status, popularity, or performative language.
`.trim();

export type PracticeCoachInput = z.infer<typeof inputSchema>;
export type PracticeCoachOutput = z.infer<typeof outputSchema>;
