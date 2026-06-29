"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { Button, PageHeader } from "@/components/beta/ui";
import { RadioOptionCard } from "@/components/beta/SettingsKit";
import { useUserSettings } from "@/lib/settings/useUserSettings";
import { PROFILE_VISIBILITY_OPTIONS, type ProfileVisibility } from "@/lib/settings/userSettings";

export default function ProfileVisibilityPage() {
  const { settings, update, loading } = useUserSettings();
  const [choice, setChoice] = useState<ProfileVisibility>(settings.profileVisibility);
  const [saved, setSaved] = useState(false);

  useEffect(() => setChoice(settings.profileVisibility), [settings.profileVisibility]);

  function save() {
    update({ profileVisibility: choice });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Profile visibility" subtitle="Who can see your passport." />
        <div className="space-y-2">
          {PROFILE_VISIBILITY_OPTIONS.map((o) => (
            <RadioOptionCard key={o.value} label={o.label} hint={o.hint} active={choice === o.value} onSelect={() => setChoice(o.value)} />
          ))}
        </div>
        <Button onClick={save} disabled={loading || choice === settings.profileVisibility} className="w-full">
          {saved ? "Saved ✓" : "Save changes"}
        </Button>
      </div>
    </AppShell>
  );
}
