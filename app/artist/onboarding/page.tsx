import { BareShell } from "@/components/AppShell";
import { ArtistOnboardingForm } from "@/components/signalflow-client";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";
import { getArtistProfile, getSessionUserRecord } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function ArtistOnboardingPage() {
  const user = await getSessionUserRecord("artist");
  const profile = user ? await getArtistProfile(user.id) : null;
  return (
    <BareShell>
      <div className="space-y-6">
        <SignalFlowLogo size={170} showWordmark />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Artist onboarding</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Send your signal.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Create your artist profile before uploading into The Flow.
          </p>
        </div>
        <ArtistOnboardingForm profile={profile} />
      </div>
    </BareShell>
  );
}
