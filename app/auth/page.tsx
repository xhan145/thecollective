"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CollectiveMark } from "@/components/beta/Brand";
import { Button, Card } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";

export default function AuthPage() {
  const router = useRouter();
  const { enterDemoBeta, snapshot, firebaseMode, supabaseEnabled, signInWithEmail, signUpWithEmail } = useBetaApp();

  const [mode, setMode] = useState<"signin" | "signup">("signup");
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
      const result = mode === "signup" ? await signUpWithEmail(email, password) : await signInWithEmail(email, password);
      if (result.error) {
        setError(result.error);
      } else if (result.needsConfirmation) {
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        router.push("/home");
      }
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-2xl border border-[#EFE7D8] bg-white px-4 py-3 text-[15px] text-[#111111] outline-none focus:border-[#F2A900]";

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#FFF8EE] px-5 pb-10 pt-[calc(58px+env(safe-area-inset-top,0px))] text-[#111111]">
      <div className="text-center">
        <CollectiveMark className="mx-auto h-[92px] w-[190px]" />
        <h1 className="mt-5 text-[32px] font-extrabold leading-tight">
          {supabaseEnabled ? "Welcome to Collective." : "Welcome to Collective beta."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6E6E6E]">
          {supabaseEnabled
            ? "Sign in to practice, submit proof, and build trust. Your progress saves to your account."
            : "Use the local demo account while a backend is not configured. No backend is required for the beta prototype to render."}
        </p>
      </div>

      {supabaseEnabled ? (
        <Card className="mt-8 space-y-4 p-5">
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
            />
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
              setMode(mode === "signup" ? "signin" : "signup");
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "signup" ? "I already have an account" : "I need an account"}
          </button>
        </Card>
      ) : (
        <Card className="mt-8 space-y-4 p-5">
          <p className="rounded-2xl bg-[#FFF8EE] p-3 text-sm leading-6 text-[#6E6E6E]">
            {firebaseMode}. The default beta member is Alex from the founding circle.
          </p>
          <Button
            className="w-full"
            onClick={() => {
              enterDemoBeta("user-alex");
              router.push("/home");
            }}
          >
            Enter demo beta
          </Button>
          <div className="grid grid-cols-2 gap-2">
            {snapshot.users.slice(1, 5).map((user) => (
              <button
                key={user.id}
                className="min-h-11 rounded-full border border-[#EFE7D8] bg-white px-3 text-sm font-extrabold text-[#38322A]"
                onClick={() => {
                  enterDemoBeta(user.id);
                  router.push("/home");
                }}
              >
                {user.displayName}
              </button>
            ))}
          </div>
        </Card>
      )}
    </main>
  );
}
