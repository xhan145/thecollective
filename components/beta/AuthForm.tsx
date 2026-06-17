"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CollectiveMark } from "@/components/beta/Brand";
import { Button, Card } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";

const field =
  "w-full rounded-2xl border border-[#EFE7D8] bg-white px-4 py-3 text-[15px] text-[#111111] outline-none focus:border-[#F2A900]";

export function AuthForm({ initialMode }: { initialMode: "signup" | "login" }) {
  const router = useRouter();
  const { supabaseEnabled, signUpWithEmail, signInWithEmail, enterDemoBeta } = useBetaApp();

  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const result = await signUpWithEmail(email, password, {
          displayName: displayName.trim() || undefined,
          username: username.trim().replace(/\s+/g, "").toLowerCase() || undefined
        });
        if (result.error) setError(result.error);
        else if (result.needsConfirmation) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("login");
        } else {
          router.push("/onboarding");
        }
      } else {
        const result = await signInWithEmail(email, password);
        if (result.error) setError(result.error);
        else router.push("/home");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#FFF8EE] px-5 pb-10 pt-[calc(58px+env(safe-area-inset-top,0px))] text-[#111111]">
      <div className="text-center">
        <CollectiveMark className="mx-auto h-[92px] w-[190px]" />
        <h1 className="mt-5 text-[32px] font-extrabold leading-tight">
          {mode === "signup" ? "Join the closed beta." : "Welcome back."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6E6E6E]">Small steps. Real progress.</p>
      </div>

      {supabaseEnabled ? (
        <Card className="mt-8 space-y-4 p-5">
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <>
                <input className={field} placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
                <input className={field} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
              </>
            )}
            <input className={field} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <input className={field} type="password" required minLength={8} placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            {error && <p className="rounded-2xl bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">{error}</p>}
            {notice && <p className="rounded-2xl bg-[#FFF8EE] p-3 text-sm font-bold leading-6 text-[#38322A]">{notice}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "One moment..." : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
          <button
            type="button"
            className="w-full py-2 text-sm font-extrabold text-[#6E6E6E]"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "signup" ? "I already have an account" : "I need an account"}
          </button>
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-[#EFE7D8]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9B958B]">or</span>
            <span className="h-px flex-1 bg-[#EFE7D8]" />
          </div>
          <Button variant="secondary" className="w-full" onClick={() => { enterDemoBeta("user-alex"); router.push("/home"); }}>
            Explore the demo (no account)
          </Button>
        </Card>
      ) : (
        <Card className="mt-8 space-y-4 p-5">
          <p className="rounded-2xl bg-[#FFF8EE] p-3 text-sm leading-6 text-[#6E6E6E]">
            A backend is not configured. Explore the local demo to see the full loop.
          </p>
          <Button className="w-full" onClick={() => { enterDemoBeta("user-alex"); router.push("/home"); }}>
            Explore the demo
          </Button>
        </Card>
      )}

      <p className="mt-6 text-center text-xs text-[#9B958B]">
        {mode === "signup" ? (
          <Link href="/login" className="font-bold text-[#6E6E6E]">Have an account? Log in</Link>
        ) : (
          <Link href="/signup" className="font-bold text-[#6E6E6E]">New here? Create an account</Link>
        )}
      </p>
    </main>
  );
}
