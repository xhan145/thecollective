"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { CollectiveMark } from "@/components/beta/Brand";
import { Button, Card, LoopStrip } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { CONTEXT_TAGS } from "@/lib/betaTypes";
import type { PracticeLevel, ContextTag } from "@/lib/betaTypes";
import { resolveStarterPromptId } from "@/lib/mastery";
import AmbientBackdrop from "@/components/beta/AmbientBackdrop";

const ONBOARDING_DRAFT_KEY = "collective.onboarding.draft.v1";

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

  // Resume: restore an in-progress draft once on mount so a refresh or return
  // picks up where the user left off.
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (restored) return;
    setRestored(true);
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(ONBOARDING_DRAFT_KEY) : null;
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<{ step: number; directionId: string; startingLevel: PracticeLevel; contextTags: ContextTag[]; goalText: string; cadence: string }>;
      if (typeof d.step === "number") setStep(d.step);
      if (d.directionId) setDirectionId(d.directionId);
      if (d.startingLevel) setStartingLevel(d.startingLevel);
      if (Array.isArray(d.contextTags)) setContextTags(d.contextTags);
      if (typeof d.goalText === "string") setGoalText(d.goalText);
      if (d.cadence) setCadence(d.cadence);
    } catch { /* ignore malformed draft */ }
  }, [restored]);

  // Persist the draft as the user progresses.
  useEffect(() => {
    if (!restored || typeof window === "undefined") return;
    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ step, directionId, startingLevel, contextTags, goalText, cadence }));
  }, [restored, step, directionId, startingLevel, contextTags, goalText, cadence]);

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
    // Onboarding must open a real practice (beta success #4/#5), not /home.
    const starterId = resolveStarterPromptId(directionId, {
      directions: snapshot.directions,
      skills: snapshot.skills,
      prompts: snapshot.prompts,
      completedPracticeIds: snapshot.completedPracticeIds,
    });
    if (typeof window !== "undefined") window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    router.push(`/proof/new/${starterId}`);
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-[430px] bg-[#FFF8EE] px-5 pb-12 pt-[calc(40px+env(safe-area-inset-top,0px))] text-[#111111]">
      <AmbientBackdrop />
      <div className="relative z-[1]">
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
          <h1 className="font-display text-2xl font-bold">Where are you starting?</h1>
          <p className="text-sm leading-6 text-[#6E6E6E]">No scores here — just so practices fit you.</p>
          <div className="space-y-3">
            {([["starter", "Just starting"], ["building", "Some practice"], ["comfortable", "Fairly comfortable"]] as const).map(([val, label]) => (
              <button key={val} type="button" onClick={() => setStartingLevel(val as PracticeLevel)}
                className={`w-full rounded-[18px] border p-4 text-left text-sm font-extrabold transition ${startingLevel === val ? "border-[#F2A900] bg-[#FFFDF8] text-[#7A5300]" : "border-[#EFE7D8] bg-[#FFFDF8] text-[#111111]"}`}>
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
          <h1 className="font-display text-2xl font-bold">Why now?</h1>
          <p className="text-sm leading-6 text-[#6E6E6E]">Optional — pick any that fit.</p>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_TAGS.map((tag) => {
              const on = contextTags.includes(tag.id);
              return (
                <button key={tag.id} type="button"
                  onClick={() => setContextTags((c) => on ? c.filter((x) => x !== tag.id) : [...c, tag.id])}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${on ? "border-[#F2A900] bg-[#FFF1C7] text-[#7A5300]" : "border-[#EFE7D8] bg-[#FFFDF8] text-[#6E6E6E]"}`}>
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
          <h1 className="font-display text-2xl font-bold">What do you want to get better at?</h1>
          <p className="text-sm leading-6 text-[#6E6E6E]">One line, in your words. Optional — you can skip.</p>
          <textarea value={goalText} onChange={(e) => setGoalText(e.target.value)} rows={3}
            placeholder="e.g. Speak up in meetings without overthinking"
            className="w-full rounded-2xl border border-[#EFE7D8] bg-white p-4 text-sm text-[#111111] outline-none focus:border-[#F2A900]" />
          <Button className="w-full" onClick={() => setStep(5)}>Continue <ArrowRight size={17} /></Button>
          <Button variant="quiet" className="w-full" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        </div>
      )}

      {step === 5 && (
        <div className="mt-8 space-y-4">
          <h1 className="font-display text-2xl font-bold">How often feels right?</h1>
          <p className="text-sm leading-6 text-[#6E6E6E]">Low pressure. Change it anytime.</p>
          <div className="space-y-3">
            {["a few minutes a day", "a couple times a week"].map((c) => (
              <button key={c} type="button" onClick={() => setCadence(c)}
                className={`w-full rounded-[18px] border p-4 text-left text-sm font-extrabold transition ${cadence === c ? "border-[#F2A900] bg-[#FFFDF8] text-[#7A5300]" : "border-[#EFE7D8] bg-[#FFFDF8] text-[#111111]"}`}>
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
          <Button variant="quiet" className="w-full" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
        </div>
      )}
    </div>
    </main>
  );
}
