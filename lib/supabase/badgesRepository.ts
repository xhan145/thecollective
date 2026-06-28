import type { SupabaseClient } from "@supabase/supabase-js";
import type { Achievement, UserAchievement } from "@/lib/badges/types";

function mapAchievement(row: any): Achievement {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    stage: row.stage,
    rarity: row.rarity,
    icon: row.icon ?? null,
    unlockRule: row.unlock_rule ?? {},
    isHidden: row.is_hidden ?? false,
    isActive: row.is_active ?? true,
  };
}

/** All active badge definitions (public to signed-in users). */
export async function listAchievements(client: SupabaseClient): Promise<Achievement[]> {
  const { data } = await client
    .from("achievements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return (data ?? []).map(mapAchievement);
}

/** The caller's unlocked badges (RLS scopes to own rows). */
export async function listMyAchievements(client: SupabaseClient): Promise<UserAchievement[]> {
  const { data } = await client
    .from("user_achievements")
    .select("achievement_id, unlocked_at, achievements(slug)")
    .order("unlocked_at", { ascending: false });
  return (data ?? []).map((r: any) => ({
    achievementId: r.achievement_id,
    slug: r.achievements?.slug ?? "",
    unlockedAt: r.unlocked_at,
  }));
}

/** Run the server-side evaluator; returns slugs of newly-unlocked badges. */
export async function evaluateAchievements(client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client.rpc("evaluate_achievements");
  if (error) return [];
  return (data as string[]) ?? [];
}

/** Persist the user's up-to-6 selected identity badges (own-row profile update). */
export async function setSelectedBadges(
  client: SupabaseClient,
  userId: string,
  slugs: string[],
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("profiles")
    .update({ selected_badges: slugs.slice(0, 6) })
    .eq("id", userId);
  return { error: error ? error.message : null };
}
