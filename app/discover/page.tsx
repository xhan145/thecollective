import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DiscoveryFeed } from "@/components/signalflow-client";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";
import { rankDiscoveryTracks } from "@/lib/discovery";
import { getApprovedDiscoveryTracks, getScoutProfile, getSessionUserRecord } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const user = await getSessionUserRecord("scout");
  const scout = user ? await getScoutProfile(user.id) : null;
  const tracks = rankDiscoveryTracks(await getApprovedDiscoveryTracks(user?.id), scout);

  return (
    <AppShell active="discover">
      <header className="mb-5 flex items-center justify-between">
        <SignalFlowLogo size={42} />
        <Link href="/artist/dashboard" className="text-xs font-black uppercase tracking-[0.14em] text-muted">
          Artist
        </Link>
      </header>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">The Flow</p>
        <h1 className="mt-1 text-3xl font-black text-ink">Listen first.</h1>
        <p className="mt-1 text-sm text-muted">Back this artist before they break.</p>
      </div>
      <DiscoveryFeed tracks={tracks} />
    </AppShell>
  );
}
