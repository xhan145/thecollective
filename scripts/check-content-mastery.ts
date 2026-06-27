/**
 * Integration check: verifies the Content Mastery seed landed in Supabase.
 * Asserts 6 active directions, 24 skills, 120 active level-practices with
 * slug + skill_id + level_number, and that legacy directions are deactivated.
 * Run: npm run content:verify
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

async function main() {
  if (!URL || !SERVICE_KEY) fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  const db = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  const activeDirs = await db.from("directions").select("slug").eq("is_active", true);
  if (activeDirs.error) fail(activeDirs.error.message);
  if (activeDirs.data!.length !== 6) fail(`expected 6 active directions, got ${activeDirs.data!.length}`);

  const skills = await db.from("skills").select("id").eq("is_active", true);
  if (skills.error) fail(skills.error.message);
  if (skills.data!.length !== 24) fail(`expected 24 skills, got ${skills.data!.length}`);

  const levels = await db.from("practices")
    .select("slug,skill_id,level_number")
    .eq("is_active", true)
    .not("slug", "is", null);
  if (levels.error) fail(levels.error.message);
  if (levels.data!.length !== 120) fail(`expected 120 active level-practices, got ${levels.data!.length}`);
  for (const p of levels.data!) {
    if (!p.skill_id) fail(`practice ${p.slug} has no skill_id`);
    if (!p.level_number || p.level_number < 1 || p.level_number > 5) fail(`practice ${p.slug} bad level_number ${p.level_number}`);
  }

  const legacy = await db.from("directions").select("slug,is_active").in("slug", ["momentum", "clearer-thinking"]);
  if (legacy.error) fail(legacy.error.message);
  for (const d of legacy.data!) {
    if (d.is_active) fail(`legacy direction ${d.slug} should be deactivated`);
  }

  console.log("OK: 6 directions, 24 skills, 120 levels seeded; legacy directions deactivated.");
}

main().catch((e) => { console.error(e); process.exit(1); });
