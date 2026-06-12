import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ArtistDashboardStats, First50Progress, TrackCard } from "@/components/signalflow";
import { EmptyState, PrimaryButton, SectionLabel } from "@/components/ui";
import { getArtistProfile, getArtistTracks, getSessionUserRecord } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function ArtistDashboardPage() {
  const user = await getSessionUserRecord("artist");
  const artist = user ? await getArtistProfile(user.id) : null;
  const tracks = artist ? await getArtistTracks(artist.id) : [];

  return (
    <AppShell active="upload">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Artist cockpit</p>
          <h1 className="mt-1 text-3xl font-black text-ink">
            {artist?.artist_name ?? "Your signal"}
          </h1>
        </div>
        <Link href="/discover" className="text-sm font-bold text-muted">
          Scout
        </Link>
      </div>

      <div className="mt-5">
        <ArtistDashboardStats tracks={tracks} />
      </div>

      <div className="mt-5">
        <PrimaryButton href="/artist/upload">Upload track</PrimaryButton>
      </div>

      <SectionLabel>First 50</SectionLabel>
      {tracks.length === 0 ? (
        <EmptyState
          title="No tracks in The Flow yet."
          body="Upload your first track and the Mekhane Engine will create a Signalprint."
          actionLabel="Upload track"
          actionHref="/artist/upload"
        />
      ) : (
        <div className="space-y-4">
          {tracks.map((track) => (
            <div key={track.id} className="space-y-3">
              <TrackCard track={track} href={`/artist/tracks/${track.id}`} />
              <First50Progress count={track.stats.unique_listens} />
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
