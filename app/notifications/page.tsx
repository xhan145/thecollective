"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MessageCircle, ThumbsUp, UserPlus, FileText } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Card, EmptyState, PageHeader } from "@/components/beta/ui";
import type { AppNotification } from "@/lib/betaTypes";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function iconFor(type: string) {
  if (type === "feedback") return <MessageCircle size={16} />;
  if (type === "useful") return <ThumbsUp size={16} />;
  if (type === "learn_from") return <UserPlus size={16} />;
  if (type === "message") return <MessageCircle size={16} />;
  return <FileText size={16} />;
}

function hrefFor(n: AppNotification): string {
  if (n.sourceType === "proof" && n.sourceId) return `/proof/${n.sourceId}`;
  if (n.sourceType === "conversation" && n.sourceId) return `/notes/${n.sourceId}`;
  if (n.sourceType === "profile") return "/profile/learning";
  return "/feed";
}

export default function NotificationsPage() {
  const { getNotifications, markNotificationRead, markAllNotificationsRead, unreadNotificationCount, snapshot } = useBetaApp();
  const notifications = getNotifications();
  const unread = unreadNotificationCount();
  const actorFor = (id?: string | null) => (id ? snapshot.users.find((u) => u.id === id) : undefined);

  // Mark everything read shortly after opening the center.
  useEffect(() => {
    if (unread === 0) return;
    const t = setTimeout(() => markAllNotificationsRead(), 1200);
    return () => clearTimeout(t);
  }, [unread, markAllNotificationsRead]);

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Notifications"
          subtitle="When members engage with your practice, it shows up here."
          action={
            unread > 0 ? (
              <button onClick={() => markAllNotificationsRead()} className="text-sm font-extrabold text-[#F2A900]">
                Mark all read
              </button>
            ) : undefined
          }
        />
        {notifications.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            body="Submit proof and connect with members — their feedback and reactions will land here."
          />
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => {
              const actor = actorFor(n.actorId);
              return (
                <Link key={n.id} href={hrefFor(n)} onClick={() => markNotificationRead(n.id)}>
                  <Card interactive className={`flex items-center gap-3 p-4 ${!n.readAt ? "ring-1 ring-[#F2A900]/40" : ""}`}>
                    <div className="relative">
                      <Avatar name={actor?.displayName} avatarUrl={actor?.avatarUrl} size={40} />
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[#FFF1C7] text-[#7A5300]">
                        {iconFor(String(n.type))}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-[var(--ink,#111111)]">{n.title}</p>
                      {n.body && <p className="truncate text-xs text-[var(--muted,#6E6E6E)]">{n.body}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] text-[var(--muted,#6E6E6E)]">{timeAgo(n.createdAt)}</span>
                      {!n.readAt && <span className="h-2 w-2 rounded-full bg-[#F2A900]" />}
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
