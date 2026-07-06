"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBetaApp } from "@/components/beta/AppStateProvider";

/**
 * Silently forwards an already–signed-in member to their dashboard. Mounted on the
 * public entry points (landing page + /auth) so a returning user whose Supabase
 * session is still valid is not shown the marketing/login screen and asked to sign
 * in again — the session persists in local storage, we just need to act on it.
 *
 * Demo/seed users (ids prefixed "user-") are intentionally left alone: they have no
 * real session and should stay on whatever public page they opened.
 */
export function AuthedRedirect({ to = "/home" }: { to?: string }) {
  const router = useRouter();
  const { supabaseEnabled, authReady, currentUser } = useBetaApp();

  useEffect(() => {
    if (!supabaseEnabled || !authReady || !currentUser) return;
    if (currentUser.id.startsWith("user-")) return; // demo session, not a real login
    router.replace(to);
  }, [supabaseEnabled, authReady, currentUser, router, to]);

  return null;
}
