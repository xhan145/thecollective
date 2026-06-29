/**
 * Offline validator for the Content Mastery seed JSON.
 * Asserts structure + 6/24/120 counts and required fields. No DB required.
 * Run: npm run content:check
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROOF_TYPES = new Set(["text", "image", "video", "audio", "mixed"]);
const LEVEL_NAMES = ["Try it", "Repeat it", "Explain it", "Apply it", "Help someone else with it"];

type Level = {
  level_number: number; level_name: string; mastery_goal: string;
  practice_prompt: string; proof_requirement: string; proof_type: string;
  feedback_rubric: { clarity: string; effort: string; usefulness: string; next_step: string };
  ai_prep_prompt: string; ai_reflection_prompt: string; next_step: string;
  trust_signal: string; estimated_minutes: number; difficulty: string;
  safety_note: string; does_not_count_as_mastery: string; feed_tags: string[];
};
type Skill = { skill_slug: string; skill_name: string; description: string; levels: Level[] };
type Direction = { direction_slug: string; direction_name: string; description: string; skills: Skill[] };
type Seed = { version: string; directions: Direction[] };

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

const path = resolve(process.cwd(), "content/collective_content_mastery_seed.v1.json");
const seed = JSON.parse(readFileSync(path, "utf8")) as Seed;

let skills = 0;
let levels = 0;
const slugs = new Set<string>();

if (seed.directions.length !== 6) fail(`expected 6 directions, got ${seed.directions.length}`);

for (const d of seed.directions) {
  if (!d.direction_slug || !d.direction_name) fail(`direction missing slug/name`);
  if (d.skills.length !== 4) fail(`direction ${d.direction_slug}: expected 4 skills, got ${d.skills.length}`);
  for (const s of d.skills) {
    skills++;
    if (!s.skill_slug || !s.skill_name) fail(`skill missing slug/name in ${d.direction_slug}`);
    if (s.levels.length !== 5) fail(`skill ${s.skill_slug}: expected 5 levels, got ${s.levels.length}`);
    s.levels.forEach((lv, i) => {
      levels++;
      const where = `${d.direction_slug}.${s.skill_slug}.${lv.level_number}`;
      if (lv.level_number !== i + 1) fail(`${where}: level_number should be ${i + 1}`);
      if (lv.level_name !== LEVEL_NAMES[i]) fail(`${where}: level_name should be "${LEVEL_NAMES[i]}"`);
      if (!PROOF_TYPES.has(lv.proof_type)) fail(`${where}: bad proof_type "${lv.proof_type}"`);
      for (const f of ["mastery_goal", "practice_prompt", "proof_requirement", "ai_prep_prompt", "ai_reflection_prompt", "next_step", "trust_signal", "safety_note", "does_not_count_as_mastery"] as const) {
        if (!lv[f] || String(lv[f]).trim() === "") fail(`${where}: empty ${f}`);
      }
      for (const r of ["clarity", "effort", "usefulness", "next_step"] as const) {
        if (!lv.feedback_rubric?.[r]) fail(`${where}: missing feedback_rubric.${r}`);
      }
      if (typeof lv.estimated_minutes !== "number" || lv.estimated_minutes < 2 || lv.estimated_minutes > 15) {
        fail(`${where}: estimated_minutes must be 2..15, got ${lv.estimated_minutes}`);
      }
      const slug = `${d.direction_slug}.${s.skill_slug}.${lv.level_number}`;
      if (slugs.has(slug)) fail(`duplicate slug ${slug}`);
      slugs.add(slug);
    });
  }
}

if (skills !== 24) fail(`expected 24 skills, got ${skills}`);
if (levels !== 120) fail(`expected 120 levels, got ${levels}`);

console.log(`OK: ${seed.directions.length} directions, ${skills} skills, ${levels} levels (version ${seed.version})`);
