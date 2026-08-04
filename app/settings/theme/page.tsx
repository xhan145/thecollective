"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { PageHeader } from "@/components/beta/ui";
import { useTheme, type ThemePref } from "@/components/beta/ThemeProvider";

const THEMES: { key: ThemePref; label: string; hint: string; icon: typeof Sun }[] = [
  { key: "light", label: "Light", hint: "Warm cream and gold.", icon: Sun },
  { key: "dark", label: "Dark", hint: "Easy on the eyes at night.", icon: Moon },
  { key: "system", label: "System", hint: "Follows your device setting.", icon: Monitor },
];

export default function ThemePage() {
  const { pref, setTheme } = useTheme();
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Theme" subtitle="Color mode. For pixel style and feel, see Customization." />
        <div className="space-y-2">
          {THEMES.map((t) => {
            const Icon = t.icon;
            const active = pref === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  active ? "border-accent/60 bg-surface-soft/50" : "border-line bg-surface hover:border-accent/30"
                }`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-soft text-accent-text pixel-icon-tile">
                  <Icon size={16} />
                </span>
                <span>
                  <span className="block text-body font-semibold text-content">{t.label}</span>
                  <span className="block text-caption text-muted">{t.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
