"use client";

import { AppShell } from "@/components/beta/AppShell";
import { InstallPwaCard } from "@/components/beta/InstallPwaCard";
import { PageHeader } from "@/components/beta/ui";

export default function InstallPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Install" subtitle="Add Collective to your iPhone Home Screen from Safari." />
        <InstallPwaCard />
      </div>
    </AppShell>
  );
}
