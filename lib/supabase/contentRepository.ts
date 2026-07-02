"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Direction, FeedbackRubric, MasteryProofType, PracticePrompt, Skill } from "@/lib/betaTypes";
import { seedDirections, seedPrompts } from "@/lib/betaData";

export interface CollectiveContent {
  directions: Direction[];
  skills: Skill[];
  prompts: PracticePrompt[];
}

// Content-mastery (030): each active practice is one mastery level, addressed by
// its stable `slug` (e.g. "confident-communication.speaking-clearly.1"). We use
// the slug as the app-level prompt id so proofs/completions/URLs are legible and
// seed-stable. Legacy rows (no slug) fall back to their uuid.
function mapPractice(row: any): PracticePrompt {
  return {
    id: row.slug ?? row.id,
    directionId: row.direction_id,
    title: row.title,
    description: row.description ?? row.mastery_goal ?? "",
    prompt: row.instructions ?? row.description ?? "",
    type: "proof",
    estimatedMinutes: row.estimated_minutes ?? 5,
    beginnerSafe: true,
    instructions: row.instructions ?? undefined,
    proofPrompt: row.proof_prompt ?? undefined,
    // Mastery level fields.
    skillId: row.skill_id ?? undefined,
    levelNumber: row.level_number ?? undefined,
    levelName: row.level_name ?? undefined,
    masteryGoal: row.mastery_goal ?? undefined,
    proofType: (row.proof_type as MasteryProofType) ?? undefined,
    feedbackRubric: (row.feedback_rubric as FeedbackRubric) ?? undefined,
    aiPrepPrompt: row.ai_prep_prompt ?? undefined,
    aiReflectionPrompt: row.ai_reflection_prompt ?? undefined,
    nextStep: row.next_step ?? undefined,
    trustSignal: row.trust_signal ?? undefined,
    doesNotCount: row.does_not_count_as_mastery ?? undefined,
    safetyNote: row.safety_note ?? undefined,
    difficulty: row.difficulty ?? undefined,
    feedTags: row.feed_tags ?? undefined,
  };
}

/**
 * Load directions + skills + practices from Supabase. Falls back to the in-app
 * seed (lib/betaData) if the tables are empty or unreachable, so the app always
 * has content. Skills is empty in the fallback (the flat seed has no ladder).
 */
export async function loadContent(client: SupabaseClient): Promise<CollectiveContent> {
  try {
    const [dirRes, skillRes, pracRes] = await Promise.all([
      client.from("directions").select("*").eq("is_active", true).order("sort_order"),
      client.from("skills").select("*").eq("is_active", true).order("sort_order"),
      client.from("practices").select("*").eq("is_active", true).order("sort_order"),
    ]);
    const dirRows = dirRes.data ?? [];
    const skillRows = skillRes.data ?? [];
    const pracRows = pracRes.data ?? [];
    if (dirRes.error || pracRes.error || dirRows.length === 0) {
      return { directions: seedDirections, skills: [], prompts: seedPrompts };
    }

    const prompts = pracRows.map(mapPractice);

    // Group level ids by direction (for promptIds) and by skill (ordered by level).
    const promptIdsByDirection = new Map<string, string[]>();
    const levelsBySkill = new Map<string, { level: number; id: string }[]>();
    for (const row of pracRows) {
      const id = (row.slug ?? row.id) as string;
      const dirList = promptIdsByDirection.get(row.direction_id) ?? [];
      dirList.push(id);
      promptIdsByDirection.set(row.direction_id, dirList);
      if (row.skill_id) {
        const sList = levelsBySkill.get(row.skill_id) ?? [];
        sList.push({ level: row.level_number ?? 0, id });
        levelsBySkill.set(row.skill_id, sList);
      }
    }

    const skills: Skill[] = skillRows.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? undefined,
      directionId: row.direction_id,
      levelPromptIds: (levelsBySkill.get(row.id) ?? []).sort((a, b) => a.level - b.level).map((x) => x.id),
    }));

    const skillIdsByDirection = new Map<string, string[]>();
    for (const s of skills) {
      const list = skillIdsByDirection.get(s.directionId) ?? [];
      list.push(s.id);
      skillIdsByDirection.set(s.directionId, list);
    }

    const directions: Direction[] = dirRows.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.beginner_safe_prompt ?? row.description ?? "",
      description: row.description ?? "",
      promptIds: promptIdsByDirection.get(row.id) ?? [],
      beginnerSafePrompt: row.beginner_safe_prompt ?? undefined,
      skillIds: skillIdsByDirection.get(row.id) ?? [],
    }));

    return { directions, skills, prompts };
  } catch {
    return { directions: seedDirections, skills: [], prompts: seedPrompts };
  }
}
