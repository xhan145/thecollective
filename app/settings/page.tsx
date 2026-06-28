"use client";

import Link from "next/link";
import { Monitor, Moon, Sun } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { useTheme, type ThemePref } from "@/components/beta/ThemeProvider";
import { ButtonLink, Card, PageHeader, SectionLabel } from "@/components/beta/ui";

const THEMES: { key: ThemePref; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor }
];

export default function SettingsPage() {
  const { pref, setTheme } = useTheme();
  const { signOut, supabaseEnabled } = useBetaApp();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Settings" subtitle="Make Collective comfortable for you." />

        <SectionLabel title="Appearance" />
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = pref === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-xs font-extrabold transition ${
                    active ? "border-[#F2A900] bg-[#FFF1C7] text-[#7A5300]" : "border-[#EFE7D8] bg-[#FFFDF8] text-[#6E6E6E]"
                  }`}
                >
                  <Icon size={18} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-5 text-[#6E6E6E]">System follows your device's light/dark setting.</p>
        </Card>

        <SectionLabel title="Account" />
        <div className="space-y-2">
          <ButtonLink href="/account" variant="secondary" className="w-full">Edit account</ButtonLink>
          <ButtonLink href="/settings/customization" variant="secondary" className="w-full">Customization &amp; pixel style</ButtonLink>
          <ButtonLink href="/notifications" variant="secondary" className="w-full">Notifications</ButtonLink>
          <ButtonLink href="/app-feedback" variant="secondary" className="w-full">Help shape Collective</ButtonLink>
        </div>

        {supabaseEnabled && (
          <button
            onClick={() => void signOut()}
            className="w-full rounded-full px-4 py-3 text-sm font-extrabold text-[#C2413F]"
          >
            Sign out
          </button>
        )}
        <Link href="/profile" className="block rounded-full px-4 py-3 text-center text-sm font-extrabold text-[#6E6E6E]">
          Back to profile
        </Link>
      </div>
    </AppShell>
  );
}
