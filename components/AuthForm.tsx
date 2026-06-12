"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

export function AuthForm({
  initialMode,
  initialRole = "scout",
}: {
  initialMode: "signin" | "signup";
  initialRole?: UserRole;
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-3 rounded-card border border-signal/30 bg-signal/10 p-4 text-sm text-ink">
        <p className="font-bold">Demo mode is active.</p>
        <p className="text-muted">
          Add Supabase values to `.env.local` to enable real sign in. For now, every route renders with seed data.
        </p>
        <a className="block rounded-card bg-signal px-4 py-3 text-center font-black text-night" href="/discover">
          Enter demo Flow
        </a>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback?role=${role}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(role === "artist" ? "/artist/onboarding" : "/scout/onboarding");
          router.refresh();
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/discover");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-card border border-line bg-night/60 px-4 py-3 text-[15px] text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal/15";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {mode === "signup" ? (
        <div className="grid grid-cols-2 gap-2 rounded-card border border-line bg-card p-1">
          {(["scout", "artist"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={`rounded-card px-3 py-2 text-sm font-black capitalize ${
                role === value ? "bg-signal text-night" : "text-muted"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      ) : null}
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
      {error ? (
        <p className="rounded-card border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-bold text-danger">{error}</p>
      ) : null}
      {notice ? (
        <p className="rounded-card border border-line bg-cardHi px-4 py-2 text-sm font-bold text-ink">{notice}</p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-card bg-signal py-3.5 font-black text-night shadow-warmLg disabled:opacity-50"
      >
        {loading ? "One moment..." : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
          setNotice(null);
        }}
        className="py-2 text-sm font-bold text-muted"
      >
        {mode === "signup" ? "I already have an account" : "I need an account"}
      </button>
    </form>
  );
}
