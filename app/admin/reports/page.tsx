import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState, SignalFlowCard, StatusBadge } from "@/components/ui";
import { getReports } from "@/lib/signalflow-data";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await getReports();
  return (
    <AppShell active="admin">
      <Link href="/admin" className="text-sm font-bold text-muted">
        Admin
      </Link>
      <div className="mb-5 mt-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-signal">Reports</p>
        <h1 className="mt-1 text-3xl font-black text-ink">Moderation queue.</h1>
      </div>
      {reports.length === 0 ? (
        <EmptyState title="No open reports." body="Scout reports will appear here." />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <SignalFlowCard key={report.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-ink">{report.reason}</p>
                  <p className="mt-1 text-xs text-muted">
                    {report.target_type} / {report.target_id}
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </div>
            </SignalFlowCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}
