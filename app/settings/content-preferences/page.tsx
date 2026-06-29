"use client";

import { AppShell } from "@/components/beta/AppShell";
import { Card, PageHeader, SectionLabel } from "@/components/beta/ui";
import { PreferenceChip, ToggleRow } from "@/components/beta/SettingsKit";
import { useUserSettings } from "@/lib/settings/useUserSettings";
import { CONTENT_TOPICS } from "@/lib/settings/userSettings";

export default function ContentPreferencesPage() {
  const { settings, update } = useUserSettings();
  const c = settings.content;

  function toggleTopic(topic: string) {
    const has = c.topics.includes(topic);
    update({ content: { ...c, topics: has ? c.topics.filter((t) => t !== topic) : [...c.topics, topic] } });
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Content preferences" subtitle="Shape what you see more of. Calm by default." />

        <SectionLabel title="Show more about" />
        <Card className="p-5 pixel-card">
          <div className="flex flex-wrap gap-2">
            {CONTENT_TOPICS.map((topic) => (
              <PreferenceChip key={topic} label={topic} active={c.topics.includes(topic)} onToggle={() => toggleTopic(topic)} />
            ))}
          </div>
        </Card>

        <SectionLabel title="Tone" />
        <Card className="space-y-4 p-5 pixel-card">
          <ToggleRow label="Beginner-safe language" hint="Gentler, simpler wording across the app." checked={c.beginnerSafe} onChange={(v) => update({ content: { ...c, beginnerSafe: v } })} />
          <ToggleRow label="Hide advanced practices" hint="Keep practice focused on the basics." checked={c.hideAdvanced} onChange={(v) => update({ content: { ...c, hideAdvanced: v } })} />
        </Card>
      </div>
    </AppShell>
  );
}
