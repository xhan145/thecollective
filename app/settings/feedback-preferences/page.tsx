"use client";

import { AppShell } from "@/components/beta/AppShell";
import { Card, PageHeader, SectionLabel } from "@/components/beta/ui";
import { PreferenceChip, RadioOptionCard, ToggleRow } from "@/components/beta/SettingsKit";
import { useUserSettings } from "@/lib/settings/useUserSettings";
import { FEEDBACK_FOCUS, type FeedbackFrom, type FeedbackStyle } from "@/lib/settings/userSettings";

const STYLES: { value: FeedbackStyle; label: string; hint: string }[] = [
  { value: "gentle", label: "Gentle", hint: "Encouraging first, soft on the edges." },
  { value: "balanced", label: "Balanced", hint: "Warm but honest — the default." },
  { value: "direct", label: "Direct", hint: "Straight to what would help most." },
];

const FROM: { value: FeedbackFrom; label: string; hint: string }[] = [
  { value: "anyone", label: "Anyone", hint: "Any member can give you feedback." },
  { value: "trusted_members", label: "Trusted members", hint: "Only members who’ve earned trust." },
  { value: "same_direction", label: "Same direction", hint: "Only people practicing what you are." },
];

export default function FeedbackPreferencesPage() {
  const { settings, update } = useUserSettings();
  const fb = settings.feedback;

  function toggleFocus(area: string) {
    const has = fb.focusAreas.includes(area);
    update({ feedback: { ...fb, focusAreas: has ? fb.focusAreas.filter((a) => a !== area) : [...fb.focusAreas, area] } });
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Feedback preferences" subtitle="How you’d like feedback to land." />

        <SectionLabel title="Preferred style" />
        <div className="space-y-2">
          {STYLES.map((s) => (
            <RadioOptionCard key={s.value} label={s.label} hint={s.hint} active={fb.style === s.value} onSelect={() => update({ feedback: { ...fb, style: s.value } })} />
          ))}
        </div>

        <SectionLabel title="Default focus areas" />
        <Card className="p-5 pixel-card">
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_FOCUS.map((area) => (
              <PreferenceChip key={area} label={area} active={fb.focusAreas.includes(area)} onToggle={() => toggleFocus(area)} />
            ))}
          </div>
        </Card>

        <SectionLabel title="Who can give feedback" />
        <div className="space-y-2">
          {FROM.map((f) => (
            <RadioOptionCard key={f.value} label={f.label} hint={f.hint} active={fb.from === f.value} onSelect={() => update({ feedback: { ...fb, from: f.value } })} />
          ))}
        </div>

        <Card className="p-5 pixel-card">
          <ToggleRow label="Allow anonymous feedback" hint="Hide the giver’s name on feedback you receive." checked={fb.allowAnonymous} onChange={(v) => update({ feedback: { ...fb, allowAnonymous: v } })} />
        </Card>
      </div>
    </AppShell>
  );
}
