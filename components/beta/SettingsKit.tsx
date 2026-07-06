"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#B6AE9F]">{title}</p>
      <div className="elev-1 overflow-hidden rounded-3xl bg-[#FFFDF8] pixel-card">{children}</div>
    </div>
  );
}

export function SettingsRow({ icon, title, subtitle, href }: { icon: ReactNode; title: string; subtitle?: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 border-b border-[#EFE7D8]/60 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-[#FFF1C7]/40">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFF1C7] text-[#C8861A] pixel-icon-tile">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-[#111111]">{title}</span>
        {subtitle && <span className="block truncate text-xs text-[#6E6E6E]">{subtitle}</span>}
      </span>
      <span className="text-[#C9C2B5]" aria-hidden>›</span>
    </Link>
  );
}

export function ToggleRow({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-3 ${disabled ? "opacity-60" : ""}`}>
      <span>
        <span className="block text-sm font-bold text-[#38322A]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-[#6E6E6E]">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="h-5 w-5 shrink-0 accent-[#F2A900]"
      />
    </label>
  );
}

export function RadioOptionCard({ label, hint, active, onSelect }: { label: string; hint?: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
        active ? "border-[#F2A900]/60 bg-[#FFF1C7]/50" : "border-[#EFE7D8] bg-[#FFFDF8] hover:border-[#F2A900]/30"
      }`}
    >
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${active ? "border-[#F2A900]" : "border-[#D6CDBC]"}`}>
        {active && <span className="h-2.5 w-2.5 rounded-full bg-[#F2A900]" />}
      </span>
      <span>
        <span className="block text-sm font-extrabold text-[#111111]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-snug text-[#6E6E6E]">{hint}</span>}
      </span>
    </button>
  );
}

export function PreferenceChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-2 text-xs font-extrabold transition-colors ${
        active ? "bg-[#FFF1C7] text-[#7A5300]" : "bg-[#FFFDF8] text-[#8D877F] hover:text-[#111111]"
      }`}
    >
      {label}
    </button>
  );
}
