import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

/**
 * Resolve the authenticated user from a request's Authorization: Bearer <token>
 * header (the access token the browser holds). Uses the anon key so RLS still
 * applies — this only identifies the caller; privileged work uses the service client.
 */
export async function getAuthedUser(req: Request): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** ADMIN_EMAILS=comma,separated list (server-only). */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True if the user is an admin: profile.role='admin' OR email in ADMIN_EMAILS. */
export async function isAdminUser(service: SupabaseClient, user: User): Promise<boolean> {
  if (user.email && adminEmails().includes(user.email.toLowerCase())) return true;
  const { data } = await service.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
}
