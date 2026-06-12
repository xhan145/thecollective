import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-only admin client using the service role key.
 * Bypasses RLS — use ONLY for trusted server-side writes
 * (cross-user trust events, notifications, invite checks).
 *
 * The `server-only` import makes any client-component import
 * a build-time error.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
