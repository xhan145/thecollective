"use client";

import { getSupabaseClient } from "@/lib/supabase/client";

const FALLBACK = "That invite code did not work. Check the code or ask for a new one.";

/**
 * Redeem a beta invite code for the signed-in user via the server route.
 * The browser never reads the invites table directly — the service-role route
 * validates + redeems. Returns { ok } or { ok:false, error }.
 */
export async function redeemInvite(code: string): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, error: "Backend is not configured." };
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, error: "Please sign in first." };
  try {
    const res = await fetch("/api/beta/redeem-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: code.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.ok) return { ok: true };
    return { ok: false, error: json.error || FALLBACK };
  } catch {
    return { ok: false, error: FALLBACK };
  }
}

/** Whether the closed-beta invite gate is enabled. */
export const REQUIRE_INVITE = process.env.NEXT_PUBLIC_REQUIRE_INVITE_CODE === "true";
