import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ScoutProfileCard, TrackCard } from "@/components/signalflow";
import { SecondaryButton, SectionLabel } from "@/components/ui";
import { getBackedTracks, getScoutProfile, getSessionUserRecord } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function ScoutProfilePage() {
  const user = await getSessionUserRecord("scout");
  const profile = user ? await getScoutProfile(user.id) : null;
  const backed = user ? await getBackedTracks(user.id) : [];
  return (
    <AppShell active="profile">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Scout profile</p>
          <h1 className="mt-1 text-3xl font-black text-ink">{user?.display_name ?? "Flowfinder"}</h1>
        </div>
        <Link href="/artist/dashboard" className="text-sm font-bold text-muted">
          Artist
        </Link>
      </div>
      <div className="mt-5">
        <ScoutProfileCard profile={profile} />
      </div>
      <div className="mt-4">
        <SecondaryButton href="/scout/onboarding">Edit preferences</SecondaryButton>
      </div>
      <SectionLabel>Backed artists</SectionLabel>
      <div className="space-y-3">
        {backed.slice(0, 3).map((back) => (
          <TrackCard key={back.id} track={back.track} href={`/artist/tracks/${back.track.id}`} />
        ))}
      </div>
    </AppShell>
  );
}
