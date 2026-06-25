"use client";

import { useEffect, useState } from "react";
import type { PracticeTip } from "@/lib/betaTypes";
import { levelRank } from "@/lib/betaTrust";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Card } from "@/components/beta/ui";

function timeAgo(iso: string): string {
  const diff = Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  const m = Math.floor(diff / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(timeAgo(iso));
  }, [iso]);
  return <>{label}</>;
}

export function TipCard({ tip }: { tip: PracticeTip }) {
  const { snapshot, currentUser, isUseful, toggleUseful } = useBetaApp();
  const [reported, setReported] = useState(false);

  const author = snapshot.users.find((u) => u.id === tip.authorId);
  const authorName = author?.displayName ?? "A member";
  const useful = isUseful(tip.id);
  const isOwn = currentUser?.id === tip.authorId;

  // Relative-level chip: compare author rank to viewer rank
  const authorRank = author ? levelRank(author) : 0;
  const viewerRank = currentUser ? levelRank(currentUser) : 0;
  const relation: "ahead" | "same" | "behind" =
    authorRank > viewerRank ? "ahead" : authorRank === viewerRank ? "same" : "behind";

  async function handleReport() {
    if (reported) return;
    // Fire-and-forget — attach bearer so the route can identify the reporter.
    const supabase = getSupabaseClient();
    const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
    fetch("/api/tips/report", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ tipId: tip.id, reason: "reported" }),
    }).catch(() => {});
    setReported(true);
  }

  const base = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition";

  return (
    <Card className="p-4 space-y-3">
      {/* Author row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-extrabold text-[#111111]">{authorName}</span>
        <span className="text-[#D9CDB8]">·</span>
        <span className="text-xs text-[#9B958B]">
          <TimeAgo iso={tip.createdAt} />
        </span>

        {/* Level chip — only shown if author is ahead or at same level */}
        {relation === "ahead" && (
          <span className="inline-flex w-fit items-center rounded-full bg-[#FFF1C7] px-2.5 py-0.5 text-[10px] font-extrabold text-[#7A5300]">
            ▲ Learn from
          </span>
        )}
        {relation === "same" && (
          <span className="inline-flex w-fit items-center rounded-full bg-[#F1F0EC] px-2.5 py-0.5 text-[10px] font-extrabold text-[#6E6E6E]">
            ● Around your level
          </span>
        )}
        {/* No chip if author is behind (muted / no signal) */}
      </div>

      {/* Tip body */}
      <p className="text-sm leading-6 text-[#38322A]">{tip.body}</p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {!isOwn && !tip.isDemo && (
          <button
            type="button"
            onClick={() => toggleUseful(tip.id, "clear", "tip")}
            aria-pressed={useful}
            className={`${base} ${useful ? "bg-[#F2A900] text-white" : "bg-[#FFF1C7] text-[#7A5300]"}`}
          >
            {useful ? "Marked useful" : "Useful"}
          </button>
        )}

        {!isOwn && !tip.isDemo && !reported && (
          <button
            type="button"
            onClick={handleReport}
            className={`${base} border border-[#EFE7D8] bg-[#FFFDF8] text-[#9B958B]`}
          >
            Report
          </button>
        )}
        {reported && (
          <span className="text-xs text-[#9B958B] py-1.5 px-3">Reported</span>
        )}
      </div>
    </Card>
  );
}
