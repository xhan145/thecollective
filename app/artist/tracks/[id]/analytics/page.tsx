import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { First50Progress } from "@/components/signalflow";
import { SignalFlowCard } from "@/components/ui";
import { getSessionUserRecord, getTrackById } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function TrackAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUserRecord("artist");
  const track = await getTrackById(id, user?.id);
  if (!track) notFound();
  const completion = Math.round(track.stats.completion_rate * 100);

  return (
    <AppShell active="upload">
      <Link href={`/artist/tracks/${track.id}`} className="text-sm font-bold text-muted">
        Back to track
      </Link>
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">First 50 analytics</p>
          <h1 className="mt-1 text-3xl font-black text-ink">{track.title}</h1>
          <p className="mt-1 text-sm text-muted">The Flow is listening.</p>
        </div>
        <SignalFlowCard>
          <First50Progress count={track.stats.unique_listens} />
        </SignalFlowCard>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Unique listens" value={track.stats.unique_listens} />
          <Metric label="Completion" value={`${completion}%`} />
          <Metric label="Saves" value={track.stats.saves} />
          <Metric label="Backs" value={track.stats.backs} />
        </div>
        <SignalFlowCard>
          <p className="text-sm font-black text-ink">After 50 listens</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Show summary metrics and audience fit. TODO: graduate strong signals into First 250 or Rising after human review.
          </p>
        </SignalFlowCard>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <SignalFlowCard>
      <p className="text-2xl font-black text-ink">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
    </SignalFlowCard>
  );
}
