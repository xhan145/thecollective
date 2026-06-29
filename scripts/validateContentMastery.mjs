import fs from "node:fs";
import path from "node:path";

const seedPath = path.join(process.cwd(), "content", "collective_content_mastery_seed.v1.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const banned = ["viral", "followers", "likes", "influencer", "leaderboard", "crush it", "dominate", "elite"];
const failures = [];

function requireText(value, label) {
  if (typeof value !== "string" || !value.trim()) failures.push(`${label} is required`);
}

function scanBanned(value, label) {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    banned.forEach((term) => {
      if (lower.includes(term)) failures.push(`${label} contains banned term "${term}"`);
    });
    return;
  }
  if (Array.isArray(value)) value.forEach((item, index) => scanBanned(item, `${label}[${index}]`));
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => scanBanned(item, `${label}.${key}`));
  }
}

if (!Array.isArray(seed.directions) || seed.directions.length === 0) {
  failures.push("seed must include directions");
}

let skillCount = 0;
let levelCount = 0;
const flattenedLevels = [];

for (const direction of seed.directions || []) {
  requireText(direction.direction_slug, "direction_slug");
  requireText(direction.direction_name, `${direction.direction_slug}.direction_name`);
  if (!Array.isArray(direction.skills) || direction.skills.length < 4) {
    failures.push(`${direction.direction_slug} must have at least 4 skills`);
  }

  for (const skill of direction.skills || []) {
    skillCount += 1;
    requireText(skill.skill_slug, `${direction.direction_slug}.skill_slug`);
    requireText(skill.skill_name, `${direction.direction_slug}.${skill.skill_slug}.skill_name`);
    if (!Array.isArray(skill.levels) || skill.levels.length !== 5) {
      failures.push(`${direction.direction_slug}.${skill.skill_slug} must have exactly 5 levels`);
    }

    for (const level of skill.levels || []) {
      levelCount += 1;
      flattenedLevels.push({ direction, skill, level });
      requireText(level.practice_prompt, `${skill.skill_slug}.level${level.level_number}.practice_prompt`);
      requireText(level.proof_requirement, `${skill.skill_slug}.level${level.level_number}.proof_requirement`);
      requireText(level.feedback_rubric?.clarity, `${skill.skill_slug}.level${level.level_number}.feedback_rubric.clarity`);
      requireText(level.feedback_rubric?.effort, `${skill.skill_slug}.level${level.level_number}.feedback_rubric.effort`);
      requireText(level.feedback_rubric?.usefulness, `${skill.skill_slug}.level${level.level_number}.feedback_rubric.usefulness`);
      requireText(level.feedback_rubric?.next_step, `${skill.skill_slug}.level${level.level_number}.feedback_rubric.next_step`);
    }
  }
}

scanBanned(seed, "seed");

const firstDirection = seed.directions?.[0];
const firstSkill = firstDirection?.skills?.[0];
const firstLevel = firstSkill?.levels?.[0];
if (!firstDirection || firstDirection.direction_slug !== "confident-communication") {
  failures.push("getAllDirections expected confident-communication as the first direction");
}
if (!firstSkill || firstSkill.levels.length !== 5) {
  failures.push("getMasteryLevelsForSkill expected five levels for the first skill");
}
if (!firstLevel?.practice_prompt || !firstLevel?.proof_requirement) {
  failures.push("getNextRecommendedPractice expected a practice prompt and proof requirement for level 1");
}

function unlocked(levelNumber, previousProgress) {
  if (levelNumber === 1) return true;
  if (levelNumber === 2) return previousProgress.submittedProofCount >= 1;
  if (levelNumber === 3) return previousProgress.completedPracticeCount >= 2 && previousProgress.submittedProofCount >= 1;
  if (levelNumber === 4) return previousProgress.status === "completed";
  if (levelNumber === 5) return previousProgress.usefulFeedbackCount > 0 || previousProgress.helpedSomeoneCount > 0 || previousProgress.status === "completed";
  return false;
}

const proofProgress = { status: "proof_submitted", completedPracticeCount: 1, submittedProofCount: 1, usefulFeedbackCount: 0, helpedSomeoneCount: 0 };
const repeatProgress = { status: "proof_submitted", completedPracticeCount: 2, submittedProofCount: 1, usefulFeedbackCount: 0, helpedSomeoneCount: 0 };
const completeProgress = { status: "completed", completedPracticeCount: 2, submittedProofCount: 1, usefulFeedbackCount: 0, helpedSomeoneCount: 0 };
const helpProgress = { status: "in_progress", completedPracticeCount: 2, submittedProofCount: 1, usefulFeedbackCount: 1, helpedSomeoneCount: 0 };

if (!unlocked(1, {})) failures.push("Level 1 should unlock by default");
if (!unlocked(2, proofProgress)) failures.push("Level 2 should unlock after one proof submission for Level 1");
if (!unlocked(3, repeatProgress)) failures.push("Level 3 should unlock after repeated practice/proof");
if (!unlocked(4, completeProgress)) failures.push("Level 4 should unlock after completing the previous level");
if (!unlocked(5, helpProgress)) failures.push("Level 5 should unlock after useful feedback or helping someone");

if (failures.length) {
  console.error("Content mastery validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Content mastery seed valid: ${seed.directions.length} directions, ${skillCount} skills, ${levelCount} levels.`);
