"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CollectiveMark } from "@/components/beta/Brand";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function GoogleCompletePage() {
  const router = useRouter();

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      router.replace("/auth?error=not_configured");
      return;
    }

    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const nextPath = params.get("next") || "/home";

    if (!accessToken || !refreshToken) {
      router.replace("/auth?error=google_session_failed");
      return;
    }

    window.history.replaceState(null, "", "/auth/google-complete");

    void client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (error) {
        router.replace(`/auth?error=google_session_failed&detail=${encodeURIComponent(error.message)}`);
        return;
      }
      router.replace(nextPath);
    });
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center bg-[#FFF8EE] px-5 text-[#111111]">
      <CollectiveMark className="h-[88px] w-[180px]" />
      <p className="mt-6 text-sm font-bold text-[#6E6E6E]">Finishing Google sign-in…</p>
    </main>
  );
}
