import { BareShell } from "@/components/AppShell";
import { ScoutOnboardingForm } from "@/components/signalflow-client";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";
import { getScoutProfile, getSessionUserRecord } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function ScoutOnboardingPage() {
  const user = await getSessionUserRecord("scout");
  const profile = user ? await getScoutProfile(user.id) : null;
  return (
    <BareShell>
      <div className="space-y-6">
        <SignalFlowLogo size={170} showWordmark />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Scout onboarding</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Tune your current.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Choose genres and moods so The Flow can surface matched underground tracks.
          </p>
        </div>
        <ScoutOnboardingForm profile={profile} />
      </div>
    </BareShell>
  );
}
