"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/beta/AppShell";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Badge, Button, EmptyState, TextArea } from "@/components/beta/ui";

export default function NoteThreadPage() {
  const params = useParams<{ id: string }>();
  const { getConversations, getMessages, replyToConversation, currentUser, snapshot } = useBetaApp();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const convo = getConversations().find((c) => c.id === params.id);
  const messages = getMessages(params.id);
  const userFor = (id: string) => snapshot.users.find((u) => u.id === id);

  if (!convo) {
    return (
      <AppShell>
        <EmptyState title="Note not found" body="This thread is not available in your account." />
      </AppShell>
    );
  }

  const otherId = convo.initiatorId === currentUser?.id ? convo.recipientId : convo.initiatorId;
  const other = userFor(otherId);

  async function send() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await replyToConversation(convo!.id, reply);
      setReply("");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <Link href="/notes" className="text-sm font-extrabold text-[#6E6E6E]">← Notes</Link>
        <div className="flex items-center gap-3">
          <Avatar name={other?.displayName} avatarUrl={other?.avatarUrl} size={40} />
          <div>
            <p className="text-sm font-extrabold text-[#111111]">{other?.displayName || "A member"}</p>
            <Badge tone={convo.kind === "feedback_request" ? "gold" : "muted"}>
              {convo.kind === "feedback_request" ? "Feedback request" : "Peer note"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2.5">
          {messages.map((m) => {
            const mine = m.senderId === currentUser?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[80%] rounded-[18px] px-4 py-2.5 text-sm leading-6 ${
                    mine ? "bg-[#F2A900] text-white" : "bg-[#FFFDF8] text-[#38322A] border border-[#EFE7D8]"
                  }`}
                >
                  {m.body}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <TextArea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a useful, specific reply…" rows={3} />
          <Button className="w-full" onClick={send} disabled={sending || !reply.trim()}>
            {sending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
