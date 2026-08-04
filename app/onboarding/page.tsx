"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CollectiveMark } from "@/components/beta/Brand";
import { Button, Card, LoopStrip } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { CONTEXT_TAGS } from "@/lib/betaTypes";
import type { PracticeLevel, ContextTag } from "@/lib/betaTypes";
import AmbientBackdrop from "@/components/beta/AmbientBackdrop";

export default function OnboardingPage() {
  const router = useRouter();
  const { snapshot, currentUser, authReady, supabaseEnabled, completeOnboarding } = useBetaApp();
  const [step, setStep] = useState(0);
  const [directionId, setDirectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [startingLevel, setStartingLevel] = useState<PracticeLevel | null>(null);
  const [contextTags, setContextTags] = useState<ContextTag[]>([]);
  const [goalText, setGoalText] = useState("");
  const [cadence, setCadence] = useState<string | null>(null);

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
    await completeOnboarding({
      directionId,
      goalText: goalText.trim() || undefined,
      startingLevel: startingLevel ?? undefined,
      contextTags: contextTags.length ? contextTags : undefined,
      cadence: cadence ?? undefined,
    });
    router.push("/home");
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-[430px] bg-bg px-5 pb-12 pt-[calc(40px+env(safe-area-inset-top,0px))] text-content">
      <AmbientBackdrop />
      <div className="relative z-[1]">
      <CollectiveMark className="mx-auto h-[78px] w-[160px]" />

      {step === 0 && (
        <div className="mt-8 space-y-5 text-center">
          <h1 className="font-display text-title leading-tight">Welcome to Collective.</h1>
          <p className="mx-auto max-w-[320px] text-body leading-7 text-muted">
            A calm place to practice one small step, show what you practiced, and build trust over time. It does not need to be perfect.
          </p>
          <Button className="w-full" onClick={() => setStep(1)}>
            Get started <ArrowRight size={17} />
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-title">Choose a direction.</h1>
          <p className="text-body leading-6 text-muted">Pick one focus to start. You can change it anytime.</p>
          <div className="space-y-3">
            {snapshot.directions.map((d) => {
              const selected = d.id === directionId;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDirectionId(d.id)}
                  className={`w-full rounded-[22px] border p-4 text-left transition ${
                    selected ? "border-accent bg-surface shadow-[0_10px_30px_rgba(71,52,18,0.10)]" : "border-line bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-content">{d.title}</p>
                    {selected && (
                      <span className="text-accent">
                        <CheckCircle2 size={20} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-body leading-6 text-muted">{d.description}</p>
                </button>
              );
            })}
          </div>
          <div className="rounded-[20px] border border-line bg-surface p-4">
            <p className="mb-3 text-overline uppercase tracking-[0.12em] text-accent-text">How it works</p>
            <LoopStrip numbered />
          </div>
          <Button className="w-full" disabled={!directionId} onClick={() => setStep(2)}>
            Continue <ArrowRight size={17} />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-title">Where are you starting?</h1>
          <p className="text-body leading-6 text-muted">No scores here — just so practices fit you.</p>
          <div className="space-y-3">
            {([["starter", "Just starting"], ["building", "Some practice"], ["comfortable", "Fairly comfortable"]] as const).map(([val, label]) => (
              <button key={val} type="button" onClick={() => setStartingLevel(val as PracticeLevel)}
                className={`w-full rounded-[18px] border p-4 text-left text-body font-semibold transition ${startingLevel === val ? "border-accent bg-surface text-accent-text" : "border-line bg-surface text-content"}`}>
                {label}
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={!startingLevel} onClick={() => setStep(3)}>Continue <ArrowRight size={17} /></Button>
          <Button variant="quiet" className="w-full" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-title">Why now?</h1>
          <p className="text-body leading-6 text-muted">Optional — pick any that fit.</p>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_TAGS.map((tag) => {
              const on = contextTags.includes(tag.id);
              return (
                <button key={tag.id} type="button"
                  onClick={() => setContextTags((c) => on ? c.filter((x) => x !== tag.id) : [...c, tag.id])}
                  className={`rounded-full border px-4 py-2 text-body font-medium transition ${on ? "border-accent bg-surface-soft text-accent-text" : "border-line bg-surface text-muted"}`}>
                  {tag.label}
                </button>
              );
            })}
          </div>
          <Button className="w-full" onClick={() => setStep(4)}>Continue <ArrowRight size={17} /></Button>
          <Button variant="quiet" className="w-full" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        </div>
      )}

      {step === 4 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-title">What do you want to get better at?</h1>
          <p className="text-body leading-6 text-muted">One line, in your words. Optional — you can skip.</p>
          <textarea value={goalText} onChange={(e) => setGoalText(e.target.value)} rows={3}
            placeholder="e.g. Speak up in meetings without overthinking"
            className="w-full rounded-2xl border border-line bg-white p-4 text-body text-content outline-none focus:border-accent" />
          <Button className="w-full" onClick={() => setStep(5)}>Continue <ArrowRight size={17} /></Button>
          <Button variant="quiet" className="w-full" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        </div>
      )}

      {step === 5 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-title">How often feels right?</h1>
          <p className="text-body leading-6 text-muted">Low pressure. Change it anytime.</p>
          <div className="space-y-3">
            {["a few minutes a day", "a couple times a week"].map((c) => (
              <button key={c} type="button" onClick={() => setCadence(c)}
                className={`w-full rounded-[18px] border p-4 text-left text-body font-semibold transition ${cadence === c ? "border-accent bg-surface text-accent-text" : "border-line bg-surface text-content"}`}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <Button className="w-full" disabled={!cadence} onClick={() => setStep(6)}>Continue <ArrowRight size={17} /></Button>
          <Button variant="quiet" className="w-full" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        </div>
      )}

      {step === 6 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-title">How Collective works.</h1>
          <Card className="space-y-3 p-5">
            {[
              ["Practice", "Take one small step. Low pressure."],
              ["Prove", "Show what you practiced. It does not need to be perfect."],
              ["Feedback", "Feedback helps you improve. It does not define you."],
              ["Trust", "Trust is earned through practice, proof, useful feedback, and contribution."]
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-soft text-overline text-accent-text">
                  {title[0]}
                </span>
                <div>
                  <p className="text-body font-semibold text-content">{title}</p>
                  <p className="text-body leading-6 text-muted">{body}</p>
                </div>
              </div>
            ))}
          </Card>
          <p className="text-center text-caption leading-5 text-muted">
            Beginner-safe by design. No likes, followers, or leaderboards.
          </p>
          <Button className="w-full" disabled={saving} onClick={finish}>
            {saving ? "Setting up..." : "Start practicing"}
          </Button>
          <Button variant="quiet" className="w-full" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        </div>
      )}
    </div>
    </main>
  );
}
