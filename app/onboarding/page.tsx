import { BareShell } from "@/components/AppShell";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

export default function OnboardingPage() {
  return (
    <BareShell>
      <div className="flex min-h-[82dvh] flex-col justify-center gap-6">
        <SignalFlowLogo size={190} showWordmark />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Choose your path</p>
          <h1 className="mt-2 text-3xl font-black text-ink">How do you enter The Flow?</h1>
        </div>
        <PrimaryButton href="/artist/onboarding">Artist</PrimaryButton>
        <SecondaryButton href="/scout/onboarding">Scout / Flowfinder</SecondaryButton>
      </div>
    </BareShell>
  );
}
