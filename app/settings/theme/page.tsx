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
                  active ? "border-[#F2A900]/60 bg-[#FFF1C7]/50" : "border-[#EFE7D8] bg-[#FFFDF8] hover:border-[#F2A900]/30"
                }`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFF1C7] text-[#C8861A] pixel-icon-tile">
                  <Icon size={16} />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-[#111111]">{t.label}</span>
                  <span className="block text-xs text-[#6E6E6E]">{t.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
