"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

// Forgot-password request (R6). Sends a recovery email; the link lands on
// /auth/reset/confirm. We always show the same confirmation so we never reveal
// whether an email is registered.
export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const field = "w-full rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] p-3 text-[#111111] placeholder:text-[#9B958B]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const client = getSupabaseClient();
    if (client) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin}/auth/reset/confirm` }).catch(() => {});
    }
    setBusy(false);
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-center bg-[#FFF8EE] px-5 text-[#111111]">
      <div className="rounded-[28px] bg-[#FFFDF8] p-6 shadow-[0_10px_40px_rgba(71,52,18,0.08)]">
        <h1 className="font-display text-2xl font-bold">Reset your password</h1>
        {sent ? (
          <>
            <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">
              If an account uses <span className="font-bold text-[#111111]">{email.trim()}</span>, we&rsquo;ve sent a link to set a new password. Check your inbox (and spam).
            </p>
            <Link href="/auth" className="mt-5 block rounded-full bg-[#111111] px-4 py-3 text-center text-sm font-extrabold text-white">Back to sign in</Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Enter your email and we&rsquo;ll send a link to set a new one. Small steps.</p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <input className={field} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <button type="submit" disabled={busy || !email.trim()} className="w-full rounded-full bg-[#F2A900] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40">
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <Link href="/auth" className="mt-3 block py-2 text-center text-sm font-extrabold text-[#6E6E6E]">Back to sign in</Link>
          </>
        )}
      </div>
    </main>
  );
}
