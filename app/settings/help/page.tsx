"use client";

import { AppShell } from "@/components/beta/AppShell";
import { Card, PageHeader } from "@/components/beta/ui";

const TOPICS: { title: string; body: string }[] = [
  { title: "Getting started", body: "Pick a direction, try a practice, and submit your first proof. Small steps count." },
  { title: "How Collective works", body: "Discover → Practice → Prove → Get feedback → Build trust → Contribute." },
  { title: "Practice & proof", body: "Proof is anything that shows you tried — a note, photo, audio, or video. No performance needed." },
  { title: "Feedback", body: "Give and receive useful, kind feedback. Applying feedback completes a loop — the clearest sign of growth." },
  { title: "Trust & community", body: "Trust is earned through practice, proof, and helping others. It’s never bought or boosted." },
  { title: "Account & privacy", body: "You control who sees your passport and proof, and who can reach you. Defaults are private-leaning." },
  { title: "FAQ", body: "No likes, no followers, no leaderboards. Collective is about progress you can prove, not popularity." },
];

export default function HelpCenterPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Help center" subtitle="Calm answers to common questions." />
        <div className="space-y-3">
          {TOPICS.map((t) => (
            <Card key={t.title} className="p-5 pixel-card">
              <h3 className="text-sm font-extrabold text-[#111111]">{t.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">{t.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
