import seed from "@/content/collective_content_mastery_seed.v1.json";
import type { ContentMasteryCatalog, ContentMasterySeed, Direction, MasteryLevel, Skill } from "./contentMasteryTypes";

export const bannedContentMasteryTerms = ["viral", "followers", "likes", "influencer", "leaderboard", "crush it", "dominate", "elite"];

function stableId(...parts: Array<string | number>) {
  return parts
    .join("__")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function assertText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Content mastery seed is missing ${label}.`);
  }
}

export function validateContentMasterySeed(rawSeed: ContentMasterySeed = seed as ContentMasterySeed) {
  if (!rawSeed.directions?.length) throw new Error("Content mastery seed has no directions.");

  const bannedHits: string[] = [];
  const visit = (value: unknown, path: string) => {
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      bannedContentMasteryTerms.forEach((term) => {
        if (lower.includes(term)) bannedHits.push(`${path}: ${term}`);
      });
      return;
    }
    if (Array.isArray(value)) value.forEach((item, index) => visit(item, `${path}[${index}]`));
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, item]) => visit(item, `${path}.${key}`));
    }
  };

  rawSeed.directions.forEach((direction, directionIndex) => {
    assertText(direction.direction_slug, `directions[${directionIndex}].direction_slug`);
    assertText(direction.direction_name, `directions[${directionIndex}].direction_name`);
    if (direction.skills.length < 4) throw new Error(`${direction.direction_slug} must have at least 4 skills.`);

    direction.skills.forEach((skill, skillIndex) => {
      assertText(skill.skill_slug, `${direction.direction_slug}.skills[${skillIndex}].skill_slug`);
      assertText(skill.skill_name, `${direction.direction_slug}.${skill.skill_slug}.skill_name`);
      if (skill.levels.length !== 5) throw new Error(`${direction.direction_slug}.${skill.skill_slug} must have 5 levels.`);

      skill.levels.forEach((level) => {
        if (!level.level_number) throw new Error(`${skill.skill_slug} has a level without level_number.`);
        assertText(level.practice_prompt, `${skill.skill_slug}.level${level.level_number}.practice_prompt`);
        assertText(level.proof_requirement, `${skill.skill_slug}.level${level.level_number}.proof_requirement`);
        assertText(level.feedback_rubric?.clarity, `${skill.skill_slug}.level${level.level_number}.feedback_rubric.clarity`);
        assertText(level.feedback_rubric?.effort, `${skill.skill_slug}.level${level.level_number}.feedback_rubric.effort`);
        assertText(level.feedback_rubric?.usefulness, `${skill.skill_slug}.level${level.level_number}.feedback_rubric.usefulness`);
        assertText(level.feedback_rubric?.next_step, `${skill.skill_slug}.level${level.level_number}.feedback_rubric.next_step`);
      });
    });
  });

  visit(rawSeed, "seed");
  if (bannedHits.length) throw new Error(`Banned content language found: ${bannedHits.join(", ")}`);

  return rawSeed;
}

export function loadContentMasteryCatalog(rawSeed: ContentMasterySeed = seed as ContentMasterySeed): ContentMasteryCatalog {
  const validSeed = validateContentMasterySeed(rawSeed);
  const directions: Direction[] = [];
  const skills: Skill[] = [];
  const masteryLevels: MasteryLevel[] = [];

  validSeed.directions.forEach((seedDirection, directionIndex) => {
    const directionId = stableId("direction", seedDirection.direction_slug);
    const directionSkills: Skill[] = [];

    const direction: Direction = {
      id: directionId,
      slug: seedDirection.direction_slug,
      name: seedDirection.direction_name,
      description: seedDirection.description,
      sortOrder: directionIndex,
      skills: directionSkills
    };

    seedDirection.skills.forEach((seedSkill, skillIndex) => {
      const skillId = stableId(direction.id, seedSkill.skill_slug);
      const skillLevels: MasteryLevel[] = [];

      const skill: Skill = {
        id: skillId,
        directionId,
        directionSlug: direction.slug,
        slug: seedSkill.skill_slug,
        name: seedSkill.skill_name,
        description: seedSkill.description,
        sortOrder: skillIndex,
        levels: skillLevels
      };

      seedSkill.levels.forEach((seedLevel) => {
        const level: MasteryLevel = {
          id: stableId(skillId, seedLevel.level_number),
          directionId,
          directionSlug: direction.slug,
          skillId,
          skillSlug: skill.slug,
          levelNumber: seedLevel.level_number,
          levelName: seedLevel.level_name,
          masteryGoal: seedLevel.mastery_goal,
          practicePrompt: seedLevel.practice_prompt,
          proofRequirement: seedLevel.proof_requirement,
          proofType: seedLevel.proof_type,
          feedbackRubric: {
            clarity: seedLevel.feedback_rubric.clarity,
            effort: seedLevel.feedback_rubric.effort,
            usefulness: seedLevel.feedback_rubric.usefulness,
            nextStep: seedLevel.feedback_rubric.next_step
          },
          aiPrepPrompt: seedLevel.ai_prep_prompt,
          aiReflectionPrompt: seedLevel.ai_reflection_prompt,
          nextStep: seedLevel.next_step,
          feedTags: seedLevel.feed_tags,
          trustSignal: seedLevel.trust_signal,
          estimatedMinutes: seedLevel.estimated_minutes,
          difficulty: seedLevel.difficulty,
          safetyNote: seedLevel.safety_note,
          doesNotCountAsMastery: seedLevel.does_not_count_as_mastery,
          sortOrder: seedLevel.level_number
        };
        skillLevels.push(level);
        masteryLevels.push(level);
      });

      directionSkills.push(skill);
      skills.push(skill);
    });

    directions.push(direction);
  });

  return {
    version: validSeed.version,
    directions,
    skills,
    masteryLevels
  };
}

export const contentMasteryCatalog = loadContentMasteryCatalog();

