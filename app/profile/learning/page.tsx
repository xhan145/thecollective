"use client";

import { AppShell } from "@/components/beta/AppShell";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/beta/ui";

export default function LearningPage() {
  const { getTeachers, toggleLearnFrom } = useBetaApp();
  const teachers = getTeachers();

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="People you learn from" subtitle="Members whose practice helps your own. Their proof ranks higher in your feed." />
        {teachers.length === 0 ? (
          <EmptyState
            title="No one yet"
            body="Open a proof and choose ‘Learn from’ to follow someone’s practice."
            cta={<ButtonLink href="/feed">Open feed</ButtonLink>}
          />
        ) : (
          <div className="space-y-3">
            {teachers.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 p-4">
                <Avatar name={t.displayName} avatarUrl={t.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-[#111111]">{t.displayName}</p>
                  {t.bio && <p className="truncate text-xs text-[#6E6E6E]">{t.bio}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => toggleLearnFrom(t.id)}
                  className="shrink-0 rounded-full border border-[#EFE7D8] bg-[#FFFDF8] px-3.5 py-2 text-xs font-extrabold text-[#6E6E6E]"
                >
                  Stop learning from
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
