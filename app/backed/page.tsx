import { AppShell } from "@/components/AppShell";
import { BackedList } from "@/components/signalflow-client";
import { getBackedTracks, getSessionUserRecord } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function BackedPage() {
  const user = await getSessionUserRecord("scout");
  const backs = user ? await getBackedTracks(user.id) : [];
  return (
    <AppShell active="backed">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Co-Signs</p>
        <h1 className="mt-1 text-3xl font-black text-ink">Backed before they broke.</h1>
        <p className="mt-1 text-sm text-muted">Your permanent backing receipts.</p>
      </div>
      <BackedList backs={backs} />
    </AppShell>
  );
}
