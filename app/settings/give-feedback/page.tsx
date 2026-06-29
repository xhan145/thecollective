"use client";

import { AppShell } from "@/components/beta/AppShell";
import { ButtonLink, Card, PageHeader } from "@/components/beta/ui";

const PROMPTS = [
  "Share an idea you’d love to see",
  "Report something that feels confusing",
  "Tell us what you love so far",
  "Suggest what we should build next",
];

export default function GiveFeedbackPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Give feedback" subtitle="Feedback about Collective itself — you’re shaping it." />
        <Card className="p-5 pixel-card">
          <ul className="space-y-2">
            {PROMPTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm leading-6 text-[#38322A]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F2A900]" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </Card>
        <ButtonLink href="/app-feedback" className="w-full">Share your thoughts</ButtonLink>
      </div>
    </AppShell>
  );
}
