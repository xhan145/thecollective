/**
 * Collective — Content Mastery seed.
 * Idempotently upserts directions -> skills -> levels (as practices) from the
 * canonical JSON, then deactivates content not in the seed (greenfield
 * reconciliation). Addressing is stable: practices.slug = prompt_id.
 *
 * Usage:
 *   npm run content:seed:dry   # plan only, no writes, no key required
 *   npm run content:seed       # writes (needs SUPABASE_SERVICE_ROLE_KEY)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnv({ path: ".env.local" });
loadEnv();

const DRY = process.argv.slice(2).includes("--dry-run");
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

type Level = {
  level_number: number; level_name: string; mastery_goal: string;
  practice_prompt: string; proof_requirement: string; proof_type: string;
  feedback_rubric: Record<string, string>;
  ai_prep_prompt: string; ai_reflection_prompt: string; next_step: string;
  trust_signal: string; estimated_minutes: number; difficulty: string;
  safety_note: string; does_not_count_as_mastery: string; feed_tags: string[];
};
type Skill = { skill_slug: string; skill_name: string; description: string; levels: Level[] };
type Direction = { direction_slug: string; direction_name: string; description: string; skills: Skill[] };
type Seed = { directions: Direction[] };

function admin(): SupabaseClient {
  if (!URL || !SERVICE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Service role key is required for writes.");
  }
  return createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const path = resolve(process.cwd(), "content/collective_content_mastery_seed.v1.json");
  const seed = JSON.parse(readFileSync(path, "utf8")) as Seed;

  const dirCount = seed.directions.length;
  const skillCount = seed.directions.reduce((n, d) => n + d.skills.length, 0);
  const levelCount = seed.directions.reduce((n, d) => n + d.skills.reduce((m, s) => m + s.levels.length, 0), 0);
  console.log(`Plan: ${dirCount} directions, ${skillCount} skills, ${levelCount} levels`);
  if (DRY) { console.log("Dry run — no writes."); return; }

  const db = admin();
  const dirSlugs: string[] = [];
  const levelSlugs: string[] = [];

  for (let di = 0; di < seed.directions.length; di++) {
    const d = seed.directions[di];
    dirSlugs.push(d.direction_slug);

    const dir = await db.from("directions").upsert(
      { slug: d.direction_slug, title: d.direction_name, description: d.description, is_active: true, sort_order: di },
      { onConflict: "slug" }
    ).select("id").single();
    if (dir.error) throw dir.error;
    const directionId = dir.data!.id as string;

    for (let si = 0; si < d.skills.length; si++) {
      const s = d.skills[si];
      const sk = await db.from("skills").upsert(
        { direction_id: directionId, slug: s.skill_slug, name: s.skill_name, description: s.description, is_active: true, sort_order: si },
        { onConflict: "direction_id,slug" }
      ).select("id").single();
      if (sk.error) throw sk.error;
      const skillId = sk.data!.id as string;

      for (const lv of s.levels) {
        const slug = `${d.direction_slug}.${s.skill_slug}.${lv.level_number}`;
        levelSlugs.push(slug);
        const pr = await db.from("practices").upsert(
          {
            direction_id: directionId,
            skill_id: skillId,
            slug,
            title: `${s.skill_name} — ${lv.level_name}`,
            description: lv.mastery_goal,
            instructions: lv.practice_prompt,
            proof_prompt: lv.proof_requirement,
            estimated_minutes: lv.estimated_minutes,
            level_number: lv.level_number,
            level_name: lv.level_name,
            mastery_goal: lv.mastery_goal,
            proof_type: lv.proof_type,
            feedback_rubric: lv.feedback_rubric,
            ai_prep_prompt: lv.ai_prep_prompt,
            ai_reflection_prompt: lv.ai_reflection_prompt,
            next_step: lv.next_step,
            trust_signal: lv.trust_signal,
            does_not_count_as_mastery: lv.does_not_count_as_mastery,
            safety_note: lv.safety_note,
            difficulty: lv.difficulty,
            feed_tags: lv.feed_tags,
            is_active: true,
          },
          { onConflict: "slug" }
        );
        if (pr.error) throw pr.error;
      }
    }
  }

  // Reconcile: deactivate directions not in the seed (mirror the practices pattern below;
  // avoids fragile PostgREST in-list string building).
  const allDirs = await db.from("directions").select("id,slug");
  if (allDirs.error) throw allDirs.error;
  const keepDirs = new Set(dirSlugs);
  const staleDirs = (allDirs.data ?? []).filter((d) => !keepDirs.has(d.slug)).map((d) => d.id);
  if (staleDirs.length) {
    const dDeact = await db.from("directions").update({ is_active: false }).in("id", staleDirs);
    if (dDeact.error) throw dDeact.error;
  }

  // Reconcile: deactivate practices not in the seed (legacy flat practices have slug = null).
  const all = await db.from("practices").select("id,slug");
  if (all.error) throw all.error;
  const keep = new Set(levelSlugs);
  const stale = (all.data ?? []).filter((p) => !p.slug || !keep.has(p.slug)).map((p) => p.id);
  if (stale.length) {
    const pDeact = await db.from("practices").update({ is_active: false }).in("id", stale);
    if (pDeact.error) throw pDeact.error;
  }

  console.log(`Seeded ${dirSlugs.length} directions, ${skillCount} skills, ${levelSlugs.length} levels. Deactivated ${stale.length} stale practices.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
