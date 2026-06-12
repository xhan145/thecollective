import { redirect } from "next/navigation";
import { demoUsers } from "@/lib/demoData";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, SignalFlowUser, UserRole } from "@/lib/types";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSignalFlowUser(
  roleHint: UserRole = "scout",
): Promise<SignalFlowUser | null> {
  if (!isSupabaseConfigured()) return demoUsers[roleHint];
  const authUser = await getCurrentUser();
  if (!authUser) return null;
  return createUserIfMissing(authUser.id, authUser.email ?? null, roleHint);
}

export async function requireUser(roleHint: UserRole = "scout") {
  const user = await getCurrentUser();
  if (!user && isSupabaseConfigured()) redirect("/auth?mode=signin");
  return user;
}

export async function requireSignalFlowUser(
  roleHint: UserRole = "scout",
): Promise<SignalFlowUser> {
  const user = await getCurrentSignalFlowUser(roleHint);
  if (!user) redirect("/auth?mode=signin");
  return user;
}

export async function createUserIfMissing(
  userId: string,
  email: string | null,
  role: UserRole = "scout",
): Promise<SignalFlowUser | null> {
  const supabase = await createServerSupabase();
  const displayName = email ? email.split("@")[0] : role === "artist" ? "Artist" : "Flowfinder";
  const { data } = await supabase
    .from("users")
    .upsert(
      {
        id: userId,
        email,
        role,
        display_name: displayName,
      },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("*")
    .maybeSingle();
  if (data) return data as SignalFlowUser;
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return (existing as SignalFlowUser) ?? null;
}

export async function isInvited(email: string | null): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_CLOSED_BETA_MODE !== "true") return true;
  if (!email) return false;
  const admin = createAdminClient();
  if (!admin) return true;
  const { data } = await admin
    .from("beta_invites")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return Boolean(data);
}

// Compatibility shim for inherited inactive pages/components.
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentSignalFlowUser();
  if (!user) return null;
  return {
    id: user.id,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    current_direction_id: null,
    trust_stage: "starting",
    created_at: user.created_at,
    updated_at: user.created_at,
  };
}
