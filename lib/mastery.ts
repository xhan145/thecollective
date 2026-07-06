// Pure mastery-progress helpers (content-mastery Tasks B+C).
// No React, no IO — unit-checked by scripts/check-mastery.ts.
//
// Rules (parent spec §4): a level is complete when its practice completion
// exists (proof submitted). Level 1 is always unlocked; level N unlocks when
// level N−1 of the same skill is complete. Prompts without mastery fields
// (fallback/demo content) are always available.

import type { Direction, PracticePrompt, Skill } from "@/lib/betaTypes";

export type LevelStatus = "complete" | "available" | "locked";

export type MasteryData = {
  directions: Direction[];
  skills: Skill[];
  prompts: PracticePrompt[];
  completedPracticeIds: string[];
};

function isMasteryLevel(p: PracticePrompt): boolean {
  return Boolean(p.skillId && typeof p.levelNumber === "number");
}

export function levelStatus(
  prompt: PracticePrompt,
  completedIds: string[],
  prompts: PracticePrompt[],
): LevelStatus {
  if (completedIds.includes(prompt.id)) return "complete";
  if (!isMasteryLevel(prompt)) return "available";
  if ((prompt.levelNumber ?? 1) <= 1) return "available";
  const prev = prompts.find(
    (p) => p.skillId === prompt.skillId && p.levelNumber === (prompt.levelNumber ?? 0) - 1,
  );
  // Defensive: a gap in the ladder should never lock a level forever.
  if (!prev) return "available";
  return completedIds.includes(prev.id) ? "available" : "locked";
}

/** The previous level's display name — used for the gentle lock hint. */
export function previousLevelName(prompt: PracticePrompt, prompts: PracticePrompt[]): string | null {
  if (!isMasteryLevel(prompt) || (prompt.levelNumber ?? 1) <= 1) return null;
  const prev = prompts.find(
    (p) => p.skillId === prompt.skillId && p.levelNumber === (prompt.levelNumber ?? 0) - 1,
  );
  return prev?.levelName ?? null;
}

export type SkillProgress = {
  done: number;
  total: number;
  levels: { id: string; levelName: string; status: LevelStatus }[];
};

export function skillProgress(skill: Skill, prompts: PracticePrompt[], completedIds: string[]): SkillProgress {
  const levels = skill.levelPromptIds
    .map((id) => prompts.find((p) => p.id === id))
    .filter((p): p is PracticePrompt => Boolean(p))
    .map((p) => ({ id: p.id, levelName: p.levelName ?? p.title, status: levelStatus(p, completedIds, prompts) }));
  return { done: levels.filter((l) => l.status === "complete").length, total: levels.length, levels };
}

export function directionProgress(
  direction: Direction,
  skills: Skill[],
  prompts: PracticePrompt[],
  completedIds: string[],
): { done: number; total: number } {
  const mine = skills.filter((s) => s.directionId === direction.id);
  let done = 0;
  let total = 0;
  for (const s of mine) {
    const p = skillProgress(s, prompts, completedIds);
    done += p.done;
    total += p.total;
  }
  return { done, total };
}

/**
 * The user's next mastery step: the lowest unlocked, incomplete level —
 * preferring the current direction, then the remaining directions in order.
 * Returns undefined when no mastery content is loaded (fallback mode).
 */
export function nextMasteryStep(
  currentDirectionId: string | null | undefined,
  data: MasteryData,
): PracticePrompt | undefined {
  if (data.skills.length === 0) return undefined;
  const ordered = [
    ...data.directions.filter((d) => d.id === currentDirectionId),
    ...data.directions.filter((d) => d.id !== currentDirectionId),
  ];
  for (const direction of ordered) {
    for (const skill of data.skills.filter((s) => s.directionId === direction.id)) {
      for (const id of skill.levelPromptIds) {
        const prompt = data.prompts.find((p) => p.id === id);
        if (!prompt) continue;
        const status = levelStatus(prompt, data.completedPracticeIds, data.prompts);
        if (status === "available") return prompt;
        // complete → keep climbing; locked → the rest of this skill is locked too.
        if (status === "locked") break;
      }
    }
  }
  return undefined;
}

export type ViewerTagContext = { directionSlug: string | null; activeSkillSlugs: string[] };

/**
 * The viewer's level-matching context for the feed (spec §6.2): their current
 * direction's slug plus the skills they're actively climbing (some but not
 * all levels complete — or, when fresh, the skill of their next step). These
 * match the vocabulary of the levels' feed_tags denormalized onto proofs.
 */
export function viewerTagContext(
  currentDirectionId: string | null | undefined,
  data: MasteryData,
): ViewerTagContext {
  const direction = data.directions.find((d) => d.id === currentDirectionId);
  const directionSlug = direction ? String(direction.slug) : null;
  const active: string[] = [];
  if (direction) {
    for (const skill of data.skills.filter((s) => s.directionId === direction.id)) {
      const p = skillProgress(skill, data.prompts, data.completedPracticeIds);
      if (p.done > 0 && p.done < p.total) active.push(skill.slug);
    }
    if (active.length === 0) {
      const next = nextMasteryStep(currentDirectionId, data);
      const nextSkill = next?.skillId ? data.skills.find((s) => s.id === next.skillId) : undefined;
      if (nextSkill) active.push(nextSkill.slug);
    }
  }
  return { directionSlug, activeSkillSlugs: active };
}

/**
 * The id every "Submit proof" starter action should target. Never returns a
 * dead id: falls back to the first loaded prompt, then the seed default.
 */
export function resolveStarterPromptId(
  currentDirectionId: string | null | undefined,
  data: MasteryData,
): string {
  const next = nextMasteryStep(currentDirectionId, data);
  if (next) return next.id;
  return data.prompts[0]?.id ?? "conf-s1";
}
