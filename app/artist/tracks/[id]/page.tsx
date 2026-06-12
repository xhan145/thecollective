import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ArtworkBlock, First50Progress, SignalprintReport, TrackBadges } from "@/components/signalflow";
import { SignalFlowCard, StatusBadge, Tag } from "@/components/ui";
import { getSessionUserRecord, getTrackById } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function ArtistTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUserRecord("artist");
  const track = await getTrackById(id, user?.id);
  if (!track) notFound();

  return (
    <AppShell active="upload">
      <Link href="/artist/dashboard" className="text-sm font-bold text-muted">
        Back to dashboard
      </Link>
      <div className="mt-5 space-y-4">
        <ArtworkBlock track={track} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <TrackBadges track={track} />
            <h1 className="mt-3 text-3xl font-black text-ink">{track.title}</h1>
            <p className="mt-1 text-lg font-bold text-muted">
              {track.artist?.artist_name ?? "Unknown artist"}
            </p>
          </div>
          <StatusBadge status={track.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[...track.genre_tags, ...track.mood_tags].map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
        {track.description ? (
          <p className="text-sm leading-relaxed text-muted">{track.description}</p>
        ) : null}
        <audio controls src={track.audio_url} />
        <SignalFlowCard>
          <First50Progress count={track.stats.unique_listens} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Mini label="Saves" value={track.stats.saves} />
            <Mini label="Backs" value={track.stats.backs} />
            <Mini label="Skips" value={track.stats.skips} />
          </div>
        </SignalFlowCard>
        <SignalprintReport analysis={track.analysis} />
        <Link
          href={`/artist/tracks/${track.id}/analytics`}
          className="block rounded-card border border-line bg-cardHi px-4 py-3 text-center text-sm font-black text-ink"
        >
          View analytics
        </Link>
      </div>
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card bg-night/50 p-3">
      <p className="text-xl font-black text-ink">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
    </div>
  );
}
