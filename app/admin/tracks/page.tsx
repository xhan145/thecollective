import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AdminTrackReviewTable } from "@/components/signalflow-client";
import { getPendingTracks } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function AdminTracksPage() {
  const tracks = await getPendingTracks();
  return (
    <AppShell active="admin">
      <Link href="/admin" className="text-sm font-bold text-muted">
        Admin
      </Link>
      <div className="mb-5 mt-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Track review</p>
        <h1 className="mt-1 text-3xl font-black text-ink">Pending signals.</h1>
      </div>
      <AdminTrackReviewTable tracks={tracks} />
    </AppShell>
  );
}
