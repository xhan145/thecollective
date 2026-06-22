"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CollectiveMark } from "@/components/beta/Brand";
import { Button, Card, LoopStrip } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";

export default function OnboardingPage() {
  const router = useRouter();
  const { snapshot, currentUser, authReady, supabaseEnabled, completeOnboarding } = useBetaApp();
  const [step, setStep] = useState(0);
  const [directionId, setDirectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Must be signed in (Supabase mode) to onboard.
  useEffect(() => {
    if (supabaseEnabled && authReady && !currentUser) router.replace("/auth");
  }, [supabaseEnabled, authReady, currentUser, router]);

  // Default to Confident Communication when directions load.
  useEffect(() => {
    if (directionId || snapshot.directions.length === 0) return;
    const preferred =
      snapshot.directions.find((d) => d.slug === "confident-communication" || d.slug === "communication") ||
      snapshot.directions[0];
    setDirectionId(preferred.id);
  }, [snapshot.directions, directionId]);

  async function finish() {
    if (!directionId) return;
    setSaving(true);
    await completeOnboarding(directionId);
    router.push("/home");
  }

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#FFF8EE] px-5 pb-12 pt-[calc(40px+env(safe-area-inset-top,0px))] text-[#111111]">
      <CollectiveMark className="mx-auto h-[78px] w-[160px]" />

      {step === 0 && (
        <div className="mt-8 space-y-5 text-center">
          <h1 className="font-display text-[30px] font-bold leading-tight">Welcome to Collective.</h1>
          <p className="mx-auto max-w-[320px] text-[15px] leading-7 text-[#6E6E6E]">
            A calm place to practice one small step, show what you practiced, and build trust over time. It does not need to be perfect.
          </p>
          <Button className="w-full" onClick={() => setStep(1)}>
            Get started <ArrowRight size={17} />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-2xl font-bold">Choose a direction.</h1>
          <p className="text-sm leading-6 text-[#6E6E6E]">Pick one focus to start. You can change it anytime.</p>
          <div className="space-y-3">
            {snapshot.directions.map((d) => {
              const selected = d.id === directionId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDirectionId(d.id)}
                  className={`w-full rounded-[22px] border p-4 text-left transition ${
                    selected ? "border-[#F2A900] bg-[#FFFDF8] shadow-[0_10px_30px_rgba(71,52,18,0.10)]" : "border-[#EFE7D8] bg-[#FFFDF8]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-extrabold text-[#111111]">{d.title}</p>
                    {selected && (
                      <span className="text-[#F2A900]">
                        <CheckCircle2 size={20} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">{d.description}</p>
                </button>
              );
            })}
          </div>
          <div className="rounded-[20px] border border-[#EFE7D8] bg-[#FFFDF8] p-4">
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#B07A00]">How it works</p>
            <LoopStrip numbered />
          </div>
          <Button className="w-full" disabled={!directionId} onClick={() => setStep(2)}>
            Continue <ArrowRight size={17} />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-2xl font-bold">How Collective works.</h1>
          <Card className="space-y-3 p-5">
            {[
              ["Practice", "Take one small step. Low pressure."],
              ["Prove", "Show what you practiced. It does not need to be perfect."],
              ["Feedback", "Feedback helps you improve. It does not define you."],
              ["Trust", "Trust is earned through practice, proof, useful feedback, and contribution."]
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#FFF1C7] text-[11px] font-black text-[#7A5300]">
                  {title[0]}
                </span>
                <div>
                  <p className="text-sm font-extrabold text-[#111111]">{title}</p>
                  <p className="text-sm leading-6 text-[#6E6E6E]">{body}</p>
                </div>
              </div>
            ))}
          </Card>
          <p className="text-center text-xs leading-5 text-[#9B958B]">
            Beginner-safe by design. No likes, followers, or leaderboards.
          </p>
          <Button className="w-full" disabled={saving} onClick={finish}>
            {saving ? "Setting up..." : "Start practicing"}
          </Button>
        </div>
      )}
    </main>
  );
}
