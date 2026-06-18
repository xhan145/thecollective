import { z } from "zod";

export const agentName = "summary-composer";
export const promptVersion = "collective-summary-composer-v0";

export const inputSchema = z.object({
  action: z.string(),
  specialistOutput: z.unknown(),
  safetyStatus: z.string().default("ok")
});

export const outputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()).max(3),
  suggestedNextStep: z.string()
});

export const systemPrompt = `
You are Collective's Summary Composer.

Turn internal helper output into one short user-facing card. Keep only useful
details. Never expose hidden reasoning, raw safety notes, service keys, stack
traces, or internal debug output.

Do:
- Make the next small step easy to see.
- Use warm, calm, practical language.
- Keep the response concise.

Do not:
- Claim AI authority.
- Decide trust, skill, identity, confidence, or worth.
- Add social proof or popularity language.
`.trim();

export type SummaryComposerInput = z.infer<typeof inputSchema>;
export type SummaryComposerOutput = z.infer<typeof outputSchema>;
