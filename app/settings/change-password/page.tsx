"use client";

import { useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { Button, Card, PageHeader, TextInput } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { getSupabaseClient } from "@/lib/supabase/client";

const RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /[0-9]/.test(p) },
  { label: "A symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ChangePasswordPage() {
  const { supabaseEnabled } = useBetaApp();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const allPass = RULES.every((r) => r.test(pw));
  const match = pw.length > 0 && pw === confirm;

  async function submit() {
    if (!allPass || !match) return;
    const client = supabaseEnabled ? getSupabaseClient() : null;
    if (!client) {
      setStatus("Password changes are available once your account is connected.");
      return;
    }
    setBusy(true);
    const { error } = await client.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setStatus("We couldn’t update your password. Please try again.");
      return;
    }
    setStatus("Password updated ✓");
    setPw("");
    setConfirm("");
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Change password" subtitle="Choose a strong, memorable password." />
        <Card className="space-y-3 p-5 pixel-card">
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold text-[#9B958B]">New password</span>
            <TextInput type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold text-[#9B958B]">Confirm new password</span>
            <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          </label>
          <ul className="space-y-1 pt-1">
            {RULES.map((r) => {
              const ok = r.test(pw);
              return (
                <li key={r.label} className={`flex items-center gap-2 text-xs font-bold ${ok ? "text-[#15803D]" : "text-[#9B958B]"}`}>
                  <span aria-hidden>{ok ? "✓" : "○"}</span> {r.label}
                </li>
              );
            })}
            <li className={`flex items-center gap-2 text-xs font-bold ${match ? "text-[#15803D]" : "text-[#9B958B]"}`}>
              <span aria-hidden>{match ? "✓" : "○"}</span> Passwords match
            </li>
          </ul>
        </Card>
        {status && <p className="px-1 text-sm font-bold text-[#7A5300]">{status}</p>}
        <Button onClick={submit} disabled={busy || !allPass || !match} className="w-full">
          {busy ? "Updating…" : "Update password"}
        </Button>
      </div>
    </AppShell>
  );
}
