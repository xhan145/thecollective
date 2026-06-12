import { AppShell } from "@/components/AppShell";
import { SavedList } from "@/components/signalflow-client";
import { getSavedTracks, getSessionUserRecord } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await getSessionUserRecord("scout");
  const tracks = user ? await getSavedTracks(user.id) : [];
  return (
    <AppShell active="saved">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Saved</p>
        <h1 className="mt-1 text-3xl font-black text-ink">Signals to replay.</h1>
        <p className="mt-1 text-sm text-muted">Tracks you saved from The Flow.</p>
      </div>
      <SavedList tracks={tracks} />
    </AppShell>
  );
}
