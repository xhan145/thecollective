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
  const { currentUser, trustSummary, supabaseEnabled, signOut } = useBetaApp();
  const [email, setEmail] = useState<string | null>(null);
  const isDemo = !!currentUser && currentUser.id.startsWith("user-");
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      const client = getSupabaseClient();
      const token = client ? (await client.auth.getSession()).data.session?.access_token : null;
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) { setDeleteError("Could not delete your account. Please try again or contact support."); setDeleting(false); return; }
      await signOut().catch(() => {});
      if (typeof window !== "undefined") window.location.href = "/";
    } catch {
      setDeleteError("Could not delete your account. Please try again or contact support.");
      setDeleting(false);
    }
  }

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

        {!isDemo && (
          <Card className="border border-[#F3D6D2] bg-[#FFFBFA] p-5">
            <h2 className="text-sm font-extrabold text-[#B4443F]">Delete account</h2>
            <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">
              This removes your profile details, practices, proof, and personal data, and signs you out for good. It can&rsquo;t be undone. To confirm, type <span className="font-extrabold text-[#111111]">DELETE</span> below.
            </p>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type DELETE"
              aria-label="Type DELETE to confirm account deletion"
              className="mt-3 w-full rounded-2xl border border-[#EFE7D8] bg-white p-3 text-sm text-[#111111] placeholder:text-[#9B958B]"
            />
            {deleteError && <p className="mt-2 text-sm font-bold text-[#B4443F]">{deleteError}</p>}
            <button
              type="button"
              disabled={confirm !== "DELETE" || deleting}
              onClick={deleteAccount}
              className="mt-3 w-full rounded-full bg-[#B4443F] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-40"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
