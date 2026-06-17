"use client";

import Link from "next/link";
import { AppShell } from "@/components/beta/AppShell";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/beta/ui";

export default function NotesPage() {
  const { getConversations, getMessages, currentUser, snapshot } = useBetaApp();
  const conversations = getConversations();
  const userFor = (id: string) => snapshot.users.find((u) => u.id === id);

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Peer notes & requests" subtitle="Useful, focused notes between members. No DMs, no noise." />
        {conversations.length === 0 ? (
          <EmptyState
            title="No notes yet"
            body="Open a proof and request feedback, or leave a peer note, to start a thread."
            cta={<ButtonLink href="/feed">Open feed</ButtonLink>}
          />
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => {
              const otherId = c.initiatorId === currentUser?.id ? c.recipientId : c.initiatorId;
              const other = userFor(otherId);
              const msgs = getMessages(c.id);
              const last = msgs[msgs.length - 1];
              return (
                <Link key={c.id} href={`/notes/${c.id}`}>
                  <Card interactive className="flex items-center gap-3 p-4">
                    <Avatar name={other?.displayName} avatarUrl={other?.avatarUrl} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-extrabold text-[#111111]">{other?.displayName || "A member"}</span>
                        <Badge tone={c.kind === "feedback_request" ? "gold" : "muted"}>
                          {c.kind === "feedback_request" ? "Feedback request" : "Peer note"}
                        </Badge>
                      </div>
                      {last && <p className="mt-0.5 truncate text-xs text-[#6E6E6E]">{last.body}</p>}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
