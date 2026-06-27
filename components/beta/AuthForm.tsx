"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CollectiveMark } from "@/components/beta/Brand";
import { Button, Card, LoopStrip } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { REQUIRE_INVITE, redeemInvite } from "@/lib/beta/redeemInvite";

const field =
  "w-full rounded-2xl border border-[#EFE7D8] bg-white px-4 py-3 text-[15px] text-[#111111] outline-none focus:border-[#F2A900]";

const GOOGLE_LOGO_URL = "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg";
const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured yet.",
  google_denied: "Google sign-in was cancelled.",
  google_state_invalid: "Google sign-in expired. Please try again.",
  google_token_failed: "Google sign-in failed. Please try again.",
  google_signin_failed: "Could not sign in with Google. Confirm Google is enabled in Supabase Auth.",
  google_session_failed: "Google sign-in almost worked, but the session could not be saved.",
};

function googleErrorMessage(code: string | null, detail: string | null): string | null {
  if (!code) return null;
  if (code === "google_signin_failed" && detail) return detail;
  if (code === "google_token_failed" && detail) return detail;
  return GOOGLE_ERROR_MESSAGES[code] || "Google sign-in failed. Please try again.";
}

export function AuthForm({ initialMode }: { initialMode: "signup" | "login" }) {
  const router = useRouter();
  const { supabaseEnabled, signUpWithEmail, signInWithEmail, enterDemoBeta } = useBetaApp();

  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = googleErrorMessage(params.get("error"), params.get("detail"));
    if (oauthError) setError(oauthError);
  }, []);

  function startGoogleAuth() {
    setError(null);
    setNotice(null);
    if (mode === "signup" && REQUIRE_INVITE && !inviteCode.trim()) {
      setError("An invite code is required to join the closed beta.");
      return;
    }
    setGoogleLoading(true);
    const params = new URLSearchParams({ mode });
    if (mode === "signup" && inviteCode.trim()) {
      params.set("invite", inviteCode.trim());
    }
    window.location.assign(`/api/google/start?${params.toString()}`);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        if (REQUIRE_INVITE && !inviteCode.trim()) {
          setError("An invite code is required to join the closed beta.");
          return;
        }
        const result = await signUpWithEmail(email, password, {
          displayName: displayName.trim() || undefined,
          username: username.trim().replace(/\s+/g, "").toLowerCase() || undefined
        });
        if (result.error) {
          setError(result.error);
        } else if (result.needsConfirmation) {
          // No session yet — they confirm, sign in, then redeem at /access.
          setNotice("Check your email to confirm your account, then sign in to enter your code.");
          setMode("login");
        } else if (REQUIRE_INVITE) {
          const redeemed = await redeemInvite(inviteCode);
          if (redeemed.ok) window.location.assign("/onboarding");
          else {
            // Account exists; let them retry the code on the access screen.
            router.push("/access");
          }
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
        <CollectiveMark className="mx-auto h-[88px] w-[180px]" />
        <h1 className="mt-5 font-display text-[32px] font-bold leading-tight text-[#111111]">
          {mode === "signup" ? "Small steps. Real progress." : "Welcome back."}
        </h1>
        <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-[#6E6E6E]">
          {mode === "signup"
            ? "Practice one small thing. Show your proof. Get useful feedback. Build trust over time — no likes, no followers."
            : "Small steps. Real progress."}
        </p>
        {mode === "signup" && (
          <div className="mt-4 flex justify-center">
            <LoopStrip />
          </div>
        )}
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
            {mode === "signup" && REQUIRE_INVITE && (
              <input className={field} placeholder="Invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} autoComplete="one-time-code" aria-label="Invite code" />
            )}
            {error && <p className="rounded-2xl bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">{error}</p>}
            {notice && <p className="rounded-2xl bg-[#FFF8EE] p-3 text-sm font-bold leading-6 text-[#38322A]">{notice}</p>}
            <Button type="submit" className="w-full" disabled={loading || googleLoading}>
              {loading ? "One moment..." : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={loading || googleLoading}
            onClick={startGoogleAuth}
          >
            {!googleLoading && (
              <img src={GOOGLE_LOGO_URL} alt="" aria-hidden className="h-5 w-5 shrink-0" width={20} height={20} />
            )}
            {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
          </Button>
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
