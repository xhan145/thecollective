"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CollectiveMark } from "@/components/beta/Brand";
import { Button, Card } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { redeemInvite } from "@/lib/beta/redeemInvite";

const field =
  "w-full rounded-2xl border border-[#EFE7D8] bg-white px-4 py-3 text-center text-lg font-extrabold tracking-[0.18em] text-[#111111] outline-none focus:border-[#F2A900]";

export default function AccessPage() {
  const router = useRouter();
  const { currentUser, authReady, supabaseEnabled } = useBetaApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Must be signed in to redeem. Already-granted members skip this screen.
  useEffect(() => {
    if (!supabaseEnabled || !authReady) return;
    if (!currentUser) router.replace("/auth");
    else if (currentUser.betaAccess) router.replace("/onboarding");
  }, [supabaseEnabled, authReady, currentUser, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await redeemInvite(code);
      if (!result.ok) {
        setError(result.error || "That invite code did not work. Check the code or ask for a new one.");
        return;
      }
      // Hard navigation reloads the profile (beta_access now true) so guards pass.
      window.location.assign("/onboarding");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#FFF8EE] px-5 pb-12 pt-[calc(58px+env(safe-area-inset-top,0px))] text-[#111111]">
      <div className="text-center">
        <CollectiveMark className="mx-auto h-[88px] w-[180px]" />
        <h1 className="mt-5 text-[28px] font-extrabold leading-tight">You’re almost in.</h1>
        <p className="mt-3 text-sm leading-6 text-[#6E6E6E]">
          Collective is in closed beta. Enter your invite code to join. Small steps. Real progress.
        </p>
      </div>
      <Card className="mt-8 space-y-4 p-5">
        <form onSubmit={submit} className="space-y-3">
          <input
            className={field}
            placeholder="INVITE CODE"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="one-time-code"
            aria-label="Invite code"
          />
          {error && <p className="rounded-2xl bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
            {loading ? "Checking…" : "Join the beta"}
          </Button>
        </form>
        <p className="text-center text-xs leading-5 text-[#9B958B]">
          Don’t have a code? Ask whoever invited you for a new one.
        </p>
      </Card>
    </main>
  );
}
