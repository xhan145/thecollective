"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Avatar } from "@/components/beta/Avatar";
import { Button, Card, PageHeader, TextArea, TextInput } from "@/components/beta/ui";

export default function EditProfilePage() {
  const router = useRouter();
  const { currentUser, updateProfile } = useBetaApp();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [focusSkill, setFocusSkill] = useState("");
  const [introSummary, setIntroSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setDisplayName(currentUser.displayName ?? "");
    setUsername(currentUser.username ?? "");
    setHeadline(currentUser.headline ?? "");
    setFocusSkill(currentUser.currentFocusSkill ?? "");
    setIntroSummary(currentUser.introductionSummary ?? currentUser.bio ?? "");
  }, [currentUser]);

  async function handleSave() {
    setSaving(true);
    await updateProfile({
      displayName: displayName.trim() || undefined,
      username: username.trim() || undefined,
      headline: headline.trim() || null,
      currentFocusSkill: focusSkill.trim() || null,
      introductionSummary: introSummary.trim() || null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/passport"), 600);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Edit profile" subtitle="How you show up on your Passport." />

        <Card className="flex items-center gap-4 p-5">
          <span className="inline-grid rounded-full p-[3px] ring-2 ring-[#F2A900]/45">
            <Avatar name={displayName || currentUser?.displayName} avatarUrl={currentUser?.avatarUrl} size={56} />
          </span>
          <p className="text-sm text-[#6E6E6E]">Photo uploads are coming soon. For now, your initials keep things calm and consistent.</p>
        </Card>

        <Card className="space-y-3 p-5">
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold text-[#9B958B]">Display name</span>
            <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold text-[#9B958B]">Username</span>
            <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold text-[#9B958B]">Headline</span>
            <TextInput value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Practicing clearer communication through proof." />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold text-[#9B958B]">Current focus skill</span>
            <TextInput value={focusSkill} onChange={(e) => setFocusSkill(e.target.value)} placeholder="Clear introductions" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-extrabold text-[#9B958B]">Introduction summary</span>
            <TextArea value={introSummary} onChange={(e) => setIntroSummary(e.target.value)} placeholder="A sentence on what you're building and how you can help." rows={3} />
          </label>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saved ? "Saved ✓" : saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </AppShell>
  );
}
