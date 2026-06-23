import type { PracticeLevel, PracticePrompt, UserProfile } from "./betaTypes";

const LEVEL_ORDER: PracticeLevel[] = ["starter", "building", "comfortable"];

type PersonaInput = Pick<UserProfile, "currentDirectionId" | "startingLevel" | "contextTags">;

function levelScore(practice: PracticePrompt, level: PracticeLevel | null | undefined): number {
  if (!practice.level || !level) return 0;
  if (practice.level === level) return 3;
  const d = Math.abs(LEVEL_ORDER.indexOf(practice.level) - LEVEL_ORDER.indexOf(level));
  return d === 1 ? 1 : 0;
}

function contextScore(practice: PracticePrompt, tags: PersonaInput["contextTags"]): number {
  if (!practice.contextTags?.length || !tags?.length) return 0;
  return practice.contextTags.filter((t) => tags.includes(t)).length * 2;
}

/** Rank a direction's practices for a person (most relevant first). Never empties. */
export function getPersonalizedPractices(user: PersonaInput, prompts: PracticePrompt[]): PracticePrompt[] {
  const pool = user.currentDirectionId
    ? prompts.filter((p) => p.directionId === user.currentDirectionId)
    : prompts.slice();
  const ranked = (pool.length ? pool : prompts.slice());
  return ranked
    .map((p, i) => ({ p, i, s: levelScore(p, user.startingLevel) + contextScore(p, user.contextTags) }))
    .sort((a, b) => (b.s - a.s) || (a.i - b.i))
    .map((x) => x.p);
}

/** The single next practice for "Your next step" — first non-completed of the ranked list. */
export function getNextPractice(
  user: PersonaInput,
  prompts: PracticePrompt[],
  completedIds: string[],
): PracticePrompt | undefined {
  const ranked = getPersonalizedPractices(user, prompts);
  return ranked.find((p) => !completedIds.includes(p.id)) || ranked[0];
}
