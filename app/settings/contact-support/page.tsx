"use client";

import { AppShell } from "@/components/beta/AppShell";
import { ButtonLink, Card, PageHeader } from "@/components/beta/ui";

const OPTIONS: { title: string; body: string }[] = [
  { title: "Send a message", body: "General questions about your account or how Collective works." },
  { title: "Report a bug", body: "Something not working as expected? Tell us what you saw." },
  { title: "Feature request", body: "An idea that would make Collective more useful." },
  { title: "Safety or moderation concern", body: "Report behavior that doesn’t feel safe or kind." },
];

export default function ContactSupportPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Contact support" subtitle="We read everything. Real people, calm replies." />
        <div className="space-y-3">
          {OPTIONS.map((o) => (
            <Card key={o.title} className="p-5 pixel-card">
              <h3 className="text-sm font-extrabold text-[#111111]">{o.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">{o.body}</p>
            </Card>
          ))}
        </div>
        <ButtonLink href="/app-feedback" className="w-full">Send us a message</ButtonLink>
      </div>
    </AppShell>
  );
}
