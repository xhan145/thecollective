import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AdminSummary } from "@/components/signalflow";
import { PrimaryButton, SecondaryButton } from "@/components/ui";
import { getPendingTracks, getReports } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [pending, reports] = await Promise.all([getPendingTracks(), getReports()]);
  return (
    <AppShell active="admin">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Admin</p>
        <h1 className="mt-1 text-3xl font-black text-ink">Moderate The Flow.</h1>
        <p className="mt-1 text-sm text-muted">Approve tracks and review scout reports.</p>
      </div>
      <AdminSummary pending={pending.length} reports={reports.length} />
      <div className="mt-5 space-y-3">
        <PrimaryButton href="/admin/tracks">Review pending tracks</PrimaryButton>
        <SecondaryButton href="/admin/reports">View reports</SecondaryButton>
      </div>
      <Link href="/discover" className="mt-5 block text-center text-sm font-bold text-muted">
        Return to The Flow
      </Link>
    </AppShell>
  );
}
