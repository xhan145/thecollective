"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { Card, PageHeader } from "@/components/beta/ui";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { listBlockedUsers, unblockUser, type BlockedRow } from "@/lib/supabase/settingsRepository";

export default function BlockedUsersPage() {
  const { currentUser, snapshot, supabaseEnabled } = useBetaApp();
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const client = useMemo(() => (supabaseEnabled ? getSupabaseClient() : null), [supabaseEnabled]);

  useEffect(() => {
    if (!client || !currentUser?.id) return;
    void listBlockedUsers(client, currentUser.id).then(setRows);
  }, [client, currentUser?.id]);

  const nameFor = (id: string) => snapshot.users.find((u) => u.id === id)?.displayName ?? "Member";
  const avatarFor = (id: string) => snapshot.users.find((u) => u.id === id)?.avatarUrl;

  async function unblock(id: string) {
    if (!client || !currentUser?.id) return;
    await unblockUser(client, currentUser.id, id).catch(() => {});
    setRows((rs) => rs.filter((r) => r.blockedId !== id));
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Blocked members" subtitle="Blocked members can’t see your profile or proof, or send you requests." />
        {!client ? (
          <Card className="p-5 text-body text-muted">Blocking is available once your account is connected.</Card>
        ) : rows.length === 0 ? (
          <Card className="p-5 text-body text-muted">You haven’t blocked anyone. You can block a member from their passport or proof.</Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.blockedId} className="flex items-center gap-3 rounded-2xl bg-surface p-3 pixel-card">
                <Avatar name={nameFor(r.blockedId)} avatarUrl={avatarFor(r.blockedId)} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-content">{nameFor(r.blockedId)}</p>
                  <p className="text-caption text-muted">{[r.reason ?? "Blocked", new Date(r.createdAt).toLocaleDateString()].join(" · ")}</p>
                </div>
                <button type="button" onClick={() => unblock(r.blockedId)} className="rounded-full bg-surface-soft px-4 py-2 text-caption font-semibold text-accent-text hover:bg-accent-soft">
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
