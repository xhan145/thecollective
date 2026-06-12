"use client";

import { AppShell } from "@/components/beta/AppShell";
import { AppFeedbackForm } from "@/components/beta/AppFeedbackForm";
import { Card, PageHeader } from "@/components/beta/ui";

export default function AppFeedbackPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Beta feedback" subtitle="Tell us what to fix before the closed beta grows." />
        <Card className="p-4">
          <p className="text-sm font-extrabold text-[#111111]">Was this about the AI?</p>
          <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">
            Use the small helpfulness controls inside each AI response card. Those notes go to AI Feedback Review and never affect trust.
          </p>
        </Card>
        <AppFeedbackForm />
      </div>
    </AppShell>
  );
}
