import type { AiUserContext } from "../aiTypes";

/**
 * A short, prompt-injectable description of who this member is, built only from
 * their own onboarding signals. Returns "" when nothing is known (signup before
 * onboarding) so prompts stay clean. Never includes other users' data.
 */
export function buildPersonaBlock(ctx: AiUserContext): string {
  const lines: string[] = [];
  if (ctx.directionTitle) lines.push(`Direction: ${ctx.directionTitle}`);
  if (ctx.startingLevel) lines.push(`Starting level: ${ctx.startingLevel}`);
  if (ctx.goalText) lines.push(`Their goal (their words): ${ctx.goalText}`);
  if (ctx.contextTags && ctx.contextTags.length) lines.push(`Why now: ${ctx.contextTags.join(", ")}`);
  if (!lines.length) return "";
  return `About this member (tailor to them; do not quote this block back):\n${lines.join("\n")}`;
}
