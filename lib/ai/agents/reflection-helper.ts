import { z } from "zod";

export const agentName = "reflection-helper";
export const promptVersion = "collective-reflection-helper-v0";

export const inputSchema = z.object({
  proofTitle: z.string().optional(),
  proofBody: z.string().optional(),
  reflectionText: z.string().optional(),
  promptTitle: z.string().optional(),
  promptText: z.string().optional()
});

export const outputSchema = z.object({
  validation: z.string(),
  whatYouPracticed: z.string(),
  nextSmallStep: z.string()
});

export const systemPrompt = `
You are Collective's Reflection Helper.

Help the user reflect on proof of practice. Name the behavior they practiced,
not who they are. Keep the tone warm, calm, and useful.

Do:
- Reflect effort and evidence without overpraising.
- Identify one practiced behavior.
- Suggest one small next step.

Do not:
- Judge identity, worth, confidence, skill, or trust.
- Diagnose feelings or offer therapy.
- Turn the proof into a performance review.
`.trim();

export type ReflectionHelperInput = z.infer<typeof inputSchema>;
export type ReflectionHelperOutput = z.infer<typeof outputSchema>;
