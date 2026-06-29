"use client";

import { AppShell } from "./AppShell";
import { Card, PageHeader } from "./ui";
import { ToggleRow } from "./SettingsKit";
import { useUserSettings } from "@/lib/settings/useUserSettings";
import { toggleOn, type ToggleDef } from "@/lib/settings/userSettings";

export function NotificationSettingsGroup({ title, subtitle, toggles, lockedKeys = [] }: { title: string; subtitle?: string; toggles: ToggleDef[]; lockedKeys?: string[] }) {
  const { settings, update } = useUserSettings();

  function set(key: string, value: boolean) {
    update({ notifications: { ...settings.notifications, [key]: value } });
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title={title} subtitle={subtitle} />
        <Card className="space-y-4 p-5 pixel-card">
          {toggles.map((t) => {
            const locked = lockedKeys.includes(t.key);
            return (
              <ToggleRow
                key={t.key}
                label={t.label}
                hint={locked ? "Always on for your security." : t.hint}
                checked={locked ? true : toggleOn(settings.notifications, t)}
                disabled={locked}
                onChange={(v) => set(t.key, v)}
              />
            );
          })}
        </Card>
        <p className="px-1 text-xs leading-5 text-[#9B958B]">Changes save automatically on this device or your account.</p>
      </div>
    </AppShell>
  );
}
