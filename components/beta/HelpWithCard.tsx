"use client";

import { useBetaApp } from "./AppStateProvider";
import { Card, SectionLabel, Badge } from "./ui";
import { tierForProfile, capabilitiesForTier, HELP_SUMMARY, nextTierUnlocks, type Capability } from "@/lib/roles";

const CAP_LABEL: Record<Capability, string> = {
  give_feedback: "Give feedback",
  host_cohort: "Host a cohort",
  mentor_visibility: "Be someone to learn from",
  cohort_guide: "Guide a cohort",
  welcome_newcomers: "Welcome newcomers",
  steward: "Steward",
};

export function HelpWithCard() {
  const { currentUser } = useBetaApp();
  if (!currentUser) return null;
  const tier = tierForProfile(currentUser);
  const caps = capabilitiesForTier(tier);
  const next = nextTierUnlocks(tier);
  const isSteward = caps.includes("steward");

  return (
    <Card className="p-5">
      <SectionLabel
        title="What you can help with"
        action={
          isSteward ? (
            <span className="rounded-full bg-surface-soft px-2.5 py-1 text-overline text-accent-text">
              ★ Steward
            </span>
          ) : undefined
        }
      />
      <p className="mt-2 text-body text-secondary">{HELP_SUMMARY[tier]}</p>
      {caps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {caps.filter((c) => c !== "steward").map((c) => (
            <Badge key={c} tone="muted">{CAP_LABEL[c]}</Badge>
          ))}
        </div>
      )}
      {next && (
        <p className="mt-3 text-caption text-muted">
          At <span className="font-medium">{next.tier}</span>, you can also{" "}
          {next.capabilities.map((c) => CAP_LABEL[c].toLowerCase()).join(" and ")}.
        </p>
      )}
    </Card>
  );
}
