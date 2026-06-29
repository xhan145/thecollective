"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { Button, PageHeader } from "@/components/beta/ui";
import { RadioOptionCard } from "@/components/beta/SettingsKit";
import { useUserSettings } from "@/lib/settings/useUserSettings";
import { PROOF_VISIBILITY_OPTIONS, type ProofVisibility } from "@/lib/settings/userSettings";

export default function ProofVisibilityPage() {
  const { settings, update, loading } = useUserSettings();
  const [choice, setChoice] = useState<ProofVisibility>(settings.proofVisibilityDefault);
  const [saved, setSaved] = useState(false);

  useEffect(() => setChoice(settings.proofVisibilityDefault), [settings.proofVisibilityDefault]);

  function save() {
    update({ proofVisibilityDefault: choice });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Proof visibility" subtitle="The default for new proof. You can still change it per proof." />
        <div className="space-y-2">
          {PROOF_VISIBILITY_OPTIONS.map((o) => (
            <RadioOptionCard key={o.value} label={o.label} hint={o.hint} active={choice === o.value} onSelect={() => setChoice(o.value)} />
          ))}
        </div>
        <Button onClick={save} disabled={loading || choice === settings.proofVisibilityDefault} className="w-full">
          {saved ? "Saved ✓" : "Save changes"}
        </Button>
      </div>
    </AppShell>
  );
}
