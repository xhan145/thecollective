"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/beta/AppShell";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Button, Card, PageHeader, SectionLabel, TextArea } from "@/components/beta/ui";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const { currentUser, updateProfile, signOut, supabaseEnabled } = useBetaApp();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName ?? "");
      setUsername(currentUser.username ?? "");
      setBio(currentUser.bio ?? "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const client = getSupabaseClient();
    if (!client) return;
    void client.auth.getUser().then((res) => setEmail(res.data.user?.email ?? null));
  }, [supabaseEnabled]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({ displayName: displayName.trim(), username: username.trim(), bio: bio.trim() });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const field =
    "min-h-12 w-full rounded-2xl border border-[#EFE7D8] bg-white px-4 text-sm text-[#111111] outline-none focus:border-[#F2A900]";

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Account" subtitle="Your name, handle, and a short bio." />

        <Card className="flex items-center gap-4 p-5">
          <Avatar name={displayName || currentUser?.displayName} avatarUrl={currentUser?.avatarUrl} size={56} />
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold text-[#111111]">{displayName || "You"}</p>
            {email && <p className="truncate text-sm text-[#6E6E6E]">{email}</p>}
          </div>
        </Card>

        <SectionLabel title="Profile" />
        <Card className="space-y-3 p-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold text-[#111111]">Display name</span>
            <input className={field} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold text-[#111111]">Username</span>
            <input className={field} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-extrabold text-[#111111]">Bio</span>
            <TextArea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="What you're practicing right now." />
          </label>
          <Button className="w-full" onClick={save} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </Button>
        </Card>

        {supabaseEnabled && (
          <button onClick={() => void signOut()} className="w-full rounded-full px-4 py-3 text-sm font-extrabold text-[#C2413F]">
            Sign out
          </button>
        )}
        <Link href="/settings" className="block rounded-full px-4 py-3 text-center text-sm font-extrabold text-[#6E6E6E]">
          Back to settings
        </Link>
      </div>
    </AppShell>
  );
}
