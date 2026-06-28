"use client";

import { AppShell } from "@/components/beta/AppShell";
import { Card, PageHeader, SectionLabel } from "@/components/beta/ui";
import { CollectiveMiniMark } from "@/components/beta/Brand";
import { useCustomization } from "@/components/beta/CustomizationProvider";
import type { Customization } from "@/lib/settings/customization";

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-[#38322A]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition-colors focus-visible:ring-2 focus-visible:ring-[#F2A900]/40 ${
                active ? "bg-[#FFF1C7] text-[#7A5300]" : "bg-[#FFFDF8] text-[#8D877F] hover:text-[#111111]"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span>
        <span className="block text-sm font-bold text-[#38322A]">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-[#6E6E6E]">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-[#F2A900]"
        aria-label={label}
      />
    </label>
  );
}

export default function CustomizationPage() {
  const { customization: c, setCustomization } = useCustomization();
  const set = <K extends keyof Customization>(key: K, value: Customization[K]) => setCustomization({ [key]: value } as Partial<Customization>);

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Customization" subtitle="Make Collective feel the way you like. Calm by default." />

        {/* Live preview */}
        <Card className="pixel-card pixel-corner p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#B6AE9F]">Preview</p>
          <div className="mt-3 flex items-center gap-3">
            <CollectiveMiniMark className="h-9 w-9" />
            <div>
              <p className={`text-sm font-extrabold text-[#111111] ${c.fontMode === "retroLabels" ? "pixel-soft" : ""}`}>Your Passport</p>
              <p className="text-xs text-[#6E6E6E]">Confident Communication · Level 2</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#6E6E6E]">
            This card reflects your pixel style, grid, and roundness so you can see changes instantly.
          </p>
        </Card>

        <SectionLabel title="Visual feel" />
        <Card className="space-y-4 p-5">
          <OptionGroup
            label="Pixel style"
            value={c.pixelStyle}
            onChange={(v) => set("pixelStyle", v)}
            options={[
              { value: "off", label: "Off" },
              { value: "soft", label: "Soft" },
              { value: "medium", label: "Medium" },
            ]}
          />
          <ToggleRow label="Pixel grid" hint="A faint retro grid behind screens." checked={c.pixelGrid} onChange={(v) => set("pixelGrid", v)} />
          <OptionGroup
            label="Icon style"
            value={c.iconStyle}
            onChange={(v) => set("iconStyle", v)}
            options={[
              { value: "soft", label: "Soft" },
              { value: "pixelSoft", label: "Pixel soft" },
            ]}
          />
          <OptionGroup
            label="Font mode"
            value={c.fontMode}
            onChange={(v) => set("fontMode", v)}
            options={[
              { value: "system", label: "System" },
              { value: "friendly", label: "Friendly" },
              { value: "retroLabels", label: "Retro labels" },
            ]}
          />
        </Card>

        <SectionLabel title="Layout" />
        <Card className="space-y-4 p-5">
          <OptionGroup
            label="Density"
            value={c.density}
            onChange={(v) => set("density", v)}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
          <OptionGroup
            label="Card roundness"
            value={c.cardRoundness}
            onChange={(v) => set("cardRoundness", v)}
            options={[
              { value: "soft", label: "Soft" },
              { value: "rounded", label: "Rounded" },
              { value: "extra", label: "Extra" },
            ]}
          />
        </Card>

        <SectionLabel title="Motion" />
        <Card className="p-5">
          <OptionGroup
            label="Motion"
            value={c.motion}
            onChange={(v) => set("motion", v)}
            options={[
              { value: "full", label: "Full motion" },
              { value: "reduced", label: "Reduced motion" },
            ]}
          />
          <p className="mt-2 text-xs text-[#6E6E6E]">Reduced motion is also honored automatically from your device settings.</p>
        </Card>

        <SectionLabel title="Tone" />
        <Card className="space-y-4 p-5">
          <ToggleRow
            label="Beginner-safe language"
            hint="Gentler, simpler wording across the app."
            checked={c.beginnerSafeLanguage}
            onChange={(v) => set("beginnerSafeLanguage", v)}
          />
          <ToggleRow
            label="Hide advanced practices"
            hint="Keep the practice list focused on the basics."
            checked={c.hideAdvancedPractices}
            onChange={(v) => set("hideAdvancedPractices", v)}
          />
        </Card>

        <p className="px-1 text-xs leading-5 text-[#9B958B]">
          Light / dark color mode lives in Settings → Theme. These preferences are saved on this device.
        </p>
      </div>
    </AppShell>
  );
}
