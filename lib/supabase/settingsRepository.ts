import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_USER_SETTINGS, mergeSettings, type UserSettings } from "@/lib/settings/userSettings";

// user_settings is read-own/write-own (034). These helpers only touch the
// signed-in user's row.

export async function getUserSettings(client: SupabaseClient, userId: string): Promise<UserSettings> {
  const { data, error } = await client.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
  if (error || !data) return DEFAULT_USER_SETTINGS;
  const row = data as Record<string, unknown>;
  return mergeSettings({
    profileVisibility: (row.profile_visibility as UserSettings["profileVisibility"]) ?? undefined,
    proofVisibilityDefault: (row.proof_visibility_default as UserSettings["proofVisibilityDefault"]) ?? undefined,
    notifications: (row.notifications as UserSettings["notifications"]) ?? undefined,
    feedback: (row.feedback as Partial<UserSettings["feedback"]>) as UserSettings["feedback"],
    content: (row.content as Partial<UserSettings["content"]>) as UserSettings["content"],
  });
}

export async function saveUserSettings(client: SupabaseClient, userId: string, s: Partial<UserSettings>): Promise<void> {
  const patch: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
  if (s.profileVisibility !== undefined) patch.profile_visibility = s.profileVisibility;
  if (s.proofVisibilityDefault !== undefined) patch.proof_visibility_default = s.proofVisibilityDefault;
  if (s.notifications !== undefined) patch.notifications = s.notifications;
  if (s.feedback !== undefined) patch.feedback = s.feedback;
  if (s.content !== undefined) patch.content = s.content;
  await client.from("user_settings").upsert(patch, { onConflict: "user_id" });
}

export type BlockedRow = { blockedId: string; reason: string | null; createdAt: string };

export async function listBlockedUsers(client: SupabaseClient, userId: string): Promise<BlockedRow[]> {
  const { data, error } = await client
    .from("blocked_users")
    .select("blocked_id, reason, created_at")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => {
    const row = r as { blocked_id: string; reason: string | null; created_at: string };
    return { blockedId: row.blocked_id, reason: row.reason ?? null, createdAt: row.created_at };
  });
}

export async function blockUser(client: SupabaseClient, blockerId: string, blockedId: string, reason?: string): Promise<void> {
  await client.from("blocked_users").insert({ blocker_id: blockerId, blocked_id: blockedId, reason: reason ?? null });
}

export async function unblockUser(client: SupabaseClient, blockerId: string, blockedId: string): Promise<void> {
  await client.from("blocked_users").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
}
