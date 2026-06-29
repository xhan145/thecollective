"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { Card, PageHeader } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { getSupabaseClient } from "@/lib/supabase/client";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#EFE7D8]/60 py-3 last:border-b-0">
      <span className="text-xs font-bold text-[#9B958B]">{label}</span>
      <span className="text-right text-sm font-extrabold text-[#111111]">{value}</span>
    </div>
  );
}

export default function AccountInformationPage() {
  const { currentUser, trustSummary, supabaseEnabled } = useBetaApp();
  const [email, setEmail] = useState<string | null>(null);
  const isDemo = !!currentUser && currentUser.id.startsWith("user-");

  useEffect(() => {
    const client = supabaseEnabled ? getSupabaseClient() : null;
    if (!client) return;
    void client.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabaseEnabled]);

  const joined = currentUser?.betaJoinedAt ?? currentUser?.createdAt;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Account information" subtitle="Your account at a glance." />
        <Card className="px-5 py-2 pixel-card">
          <Row label="Display name" value={currentUser?.displayName ?? "—"} />
          <Row label="Username" value={currentUser?.username ?? "—"} />
          <Row label="Email" value={email ?? (isDemo ? "Demo session" : "—")} />
          <Row label="Trust level" value={trustSummary.levelLabel} />
          <Row label="Account type" value={isDemo ? "Demo explorer" : "Member"} />
          <Row label="Beta access" value={currentUser?.betaAccess ? "Active" : "—"} />
          <Row label="Joined" value={joined ? new Date(joined).toLocaleDateString() : "—"} />
        </Card>
        <p className="px-1 text-xs leading-5 text-[#9B958B]">Update your password under Settings → Change password.</p>
      </div>
    </AppShell>
  );
}
