import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const seedPath = path.join(process.cwd(), "content", "collective_content_mastery_seed.v1.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const summary = {
  directions: 0,
  skills: 0,
  levels: 0,
  rubrics: 0
};

async function upsertOne(table, payload, onConflict) {
  const { data, error } = await supabase.from(table).upsert(payload, { onConflict }).select("id").single();
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return data.id;
}

for (const [directionIndex, direction] of seed.directions.entries()) {
  const directionId = await upsertOne(
    "content_directions",
    {
      slug: direction.direction_slug,
      name: direction.direction_name,
      description: direction.description,
      sort_order: directionIndex,
      is_active: true
    },
    "slug"
  );
  summary.directions += 1;

  for (const [skillIndex, skill] of direction.skills.entries()) {
    const skillId = await upsertOne(
      "content_skills",
      {
        direction_id: directionId,
        slug: skill.skill_slug,
        name: skill.skill_name,
        description: skill.description,
        sort_order: skillIndex,
        is_active: true
      },
      "direction_id,slug"
    );
    summary.skills += 1;

    for (const level of skill.levels) {
      const levelId = await upsertOne(
        "content_mastery_levels",
        {
          skill_id: skillId,
          level_number: level.level_number,
          level_name: level.level_name,
          mastery_goal: level.mastery_goal,
          practice_prompt: level.practice_prompt,
          proof_requirement: level.proof_requirement,
          proof_type: level.proof_type,
          ai_prep_prompt: level.ai_prep_prompt,
          ai_reflection_prompt: level.ai_reflection_prompt,
          next_step: level.next_step,
          feed_tags: level.feed_tags,
          trust_signal: level.trust_signal,
          estimated_minutes: level.estimated_minutes,
          difficulty: level.difficulty,
          safety_note: level.safety_note,
          does_not_count_as_mastery: level.does_not_count_as_mastery,
          sort_order: level.level_number,
          is_active: true
        },
        "skill_id,level_number"
      );
      summary.levels += 1;

      await upsertOne(
        "content_feedback_rubrics",
        {
          mastery_level_id: levelId,
          clarity: level.feedback_rubric.clarity,
          effort: level.feedback_rubric.effort,
          usefulness: level.feedback_rubric.usefulness,
          next_step: level.feedback_rubric.next_step
        },
        "mastery_level_id"
      );
      summary.rubrics += 1;
    }
  }
}

console.log("Content mastery seed complete:");
console.log(`- directions inserted/updated: ${summary.directions}`);
console.log(`- skills inserted/updated: ${summary.skills}`);
console.log(`- levels inserted/updated: ${summary.levels}`);
console.log(`- rubrics inserted/updated: ${summary.rubrics}`);

