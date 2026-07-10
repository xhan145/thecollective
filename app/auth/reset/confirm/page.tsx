"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

// Set-new-password (R6). The recovery email link lands here; the Supabase client
// exchanges the token for a temporary session (PASSWORD_RECOVERY event). We then
// let the user set a new password via updateUser.
export default function ResetConfirmPage() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "expired">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const field = "w-full rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] p-3 text-[#111111] placeholder:text-[#9B958B]";

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) { setReady("expired"); return; }
    let settled = false;
    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") { settled = true; setReady("ok"); }
    });
    // Fallback: a recovery link may already have set the session before this ran.
    void client.auth.getSession().then(({ data }) => {
      if (data.session) { settled = true; setReady("ok"); }
      else setTimeout(() => { if (!settled) setReady("expired"); }, 2500);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirm) { setError("Those passwords don't match."); return; }
    setBusy(true);
    const client = getSupabaseClient();
    const { error: err } = client ? await client.auth.updateUser({ password }) : { error: { message: "unavailable" } as { message: string } };
    setBusy(false);
    if (err) { setError("Couldn't update your password. The link may have expired — request a new one."); return; }
    setDone(true);
    setTimeout(() => router.replace("/home"), 1200);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-center bg-[#FFF8EE] px-5 text-[#111111]">
      <div className="rounded-[28px] bg-[#FFFDF8] p-6 shadow-[0_10px_40px_rgba(71,52,18,0.08)]">
        <h1 className="font-display text-2xl font-bold">Set a new password</h1>
        {ready === "checking" && <p className="mt-2 text-sm text-[#6E6E6E]">Checking your reset link…</p>}
        {ready === "expired" && (
          <>
            <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">This reset link is invalid or has expired. Request a new one.</p>
            <Link href="/auth/reset" className="mt-5 block rounded-full bg-[#111111] px-4 py-3 text-center text-sm font-extrabold text-white">Request a new link</Link>
          </>
        )}
        {ready === "ok" && (done ? (
          <p className="mt-3 text-sm font-bold text-[#15803D]">Password updated. Taking you in…</p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input className={field} type="password" required minLength={8} placeholder="New password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            <input className={field} type="password" required minLength={8} placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            {error && <p className="text-sm font-bold text-[#B4443F]">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-full bg-[#F2A900] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40">
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
