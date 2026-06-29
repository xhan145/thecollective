"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CollectiveMark } from "@/components/beta/Brand";
import { Button, Card, TextInput } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { createSupabaseBrowserClient } from "@/lib/supabaseVoiceClient";

function profileNameFromEmail(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Collective member";
}

export default function AuthPage() {
  const router = useRouter();
  const { enterDemoBeta, snapshot, firebaseMode } = useBetaApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function ensureProfile(userId: string, userEmail: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    const fullName = displayName.trim() || profileNameFromEmail(userEmail);

    await supabase.from("profiles").upsert({
      id: userId,
      username: userEmail,
      full_name: fullName
    });

    await supabase
      .from("profiles")
      .update({
        learner_name: fullName,
        cohort: "second-tier-demo-v1",
        current_skill: "communication",
        current_challenge: "say-clear-thing",
        mastery_level: "beginner"
      })
      .eq("id", userId);
  }

  async function signInWithSupabase(mode: "sign-in" | "sign-up") {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase is not configured yet.");
      return;
    }

    if (!email.trim() || password.length < 6) {
      setMessage("Use an email and a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const auth =
        mode === "sign-up"
          ? await supabase.auth.signUp({ email: email.trim(), password })
          : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (auth.error) {
        setMessage(auth.error.message);
        return;
      }

      if (auth.data.user) {
        await ensureProfile(auth.data.user.id, auth.data.user.email || email.trim());
        enterDemoBeta("user-alex");
        router.push("/practice");
        return;
      }

      setMessage("Check your email to finish signing in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#FFF8EE] px-5 pb-10 pt-[calc(58px+env(safe-area-inset-top,0px))] text-[#111111]">
      <div className="text-center">
        <CollectiveMark className="mx-auto h-[92px] w-[190px]" />
        <h1 className="mt-5 text-[32px] font-extrabold leading-tight">Welcome to Collective beta.</h1>
        <p className="mt-3 text-sm leading-6 text-[#6E6E6E]">Use a Supabase beta account for the voice coach, or keep using the local demo to preview the app.</p>
      </div>
      <Card className="mt-8 space-y-4 p-5">
        <div>
          <h2 className="text-xl font-extrabold text-[#111111]">Supabase beta session</h2>
          <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">This creates the browser session the voice coach uses.</p>
        </div>
        <TextInput value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Name, optional" />
        <TextInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" autoComplete="email" />
        <TextInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" autoComplete="current-password" />
        {message && <p className="rounded-[18px] bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">{message}</p>}
        <div className="grid gap-2">
          <Button className="w-full" disabled={loading} onClick={() => signInWithSupabase("sign-in")}>
            {loading ? "Working..." : "Sign in"}
          </Button>
          <Button className="w-full" variant="secondary" disabled={loading} onClick={() => signInWithSupabase("sign-up")}>
            Create beta account
          </Button>
        </div>
      </Card>
      <Card className="mt-8 space-y-4 p-5">
        <p className="rounded-2xl bg-[#FFF8EE] p-3 text-sm leading-6 text-[#6E6E6E]">{firebaseMode}. The default beta member is Alex from the founding circle.</p>
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
    </main>
  );
}
