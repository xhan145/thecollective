"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { PageHeader } from "@/components/beta/ui";
import { BadgeCard } from "@/components/beta/BadgeCard";
import { getSupabaseClient } from "@/lib/supabase/client";
import { listAchievements, listMyAchievements, evaluateAchievements } from "@/lib/supabase/badgesRepository";
import { DEMO_ACHIEVEMENTS, nextActionFor, metricValue } from "@/lib/badges/demo";
import { evaluateLocalBadges, type Achievement } from "@/lib/badges/types";

export default function BadgesPage() {
  const { currentUser, snapshot, trustSummary } = useBetaApp();
  const [achievements, setAchievements] = useState<Achievement[]>(DEMO_ACHIEVEMENTS);
  const [earnedSlugs, setEarnedSlugs] = useState<Set<string>>(new Set());
  const [justUnlocked, setJustUnlocked] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("All");

  const counts = useMemo(() => {
    const myId = currentUser?.id ?? snapshot.currentUserId;
    const myProofIds = new Set(snapshot.proofs.filter((p) => p.userId === myId).map((p) => p.id));
    return {
      practiceCount: trustSummary.practicesCompleted,
      proofCount: trustSummary.proofsSubmitted,
      feedbackGivenCount: trustSummary.feedbackGiven,
      feedbackReceivedCount: snapshot.feedback.filter((f) => myProofIds.has(f.proofId)).length,
      trustScore: trustSummary.totalPoints,
      hasDirection: !!currentUser?.currentDirectionId,
    };
  }, [snapshot, trustSummary, currentUser]);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setAchievements(DEMO_ACHIEVEMENTS);
      setEarnedSlugs(new Set(evaluateLocalBadges(counts, DEMO_ACHIEVEMENTS, new Set())));
      return;
    }
    let cancelled = false;
    void (async () => {
      const defs = await listAchievements(client);
      const newly = await evaluateAchievements(client); // unlock anything newly satisfied
      const mine = await listMyAchievements(client);
      if (cancelled) return;
      setAchievements(defs.length ? defs : DEMO_ACHIEVEMENTS);
      setEarnedSlugs(new Set(mine.map((m) => m.slug)));
      if (newly.length) setJustUnlocked(newly);
    })();
    return () => {
      cancelled = true;
    };
    // Evaluate once per mount; counts only seeds the demo path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(achievements.map((a) => a.category)))],
    [achievements],
  );

  const visible = achievements
    .filter((a) => !a.isHidden && a.isActive)
    .filter((a) => filter === "All" || a.category === filter)
    .map((a) => ({ badge: a, earned: earnedSlugs.has(a.slug) }))
    .sort((x, y) => Number(y.earned) - Number(x.earned));

  const earnedCount = achievements.filter((a) => earnedSlugs.has(a.slug)).length;
  const unlockedNames = justUnlocked
    .map((s) => achievements.find((a) => a.slug === s)?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Badges" subtitle="A record of what you've practiced — not a trophy wall." />

        {unlockedNames && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#F2A900]/30 bg-[#FFF1C7] p-4">
            <Sparkles size={20} className="shrink-0 text-[#F2A900]" />
            <p className="text-sm font-bold text-[#7A5300]">Just earned: {unlockedNames}.</p>
          </div>
        )}

        <p className="text-sm text-[#6E6E6E]">{earnedCount} of {achievements.length} earned.</p>

        <div className="-mx-1 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition-colors ${
                filter === cat ? "bg-[#FFF1C7] text-[#7A5300]" : "bg-[#FFFDF8] text-[#8D877F] hover:text-[#111111]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map(({ badge, earned }) => (
            <BadgeCard
              key={badge.slug}
              badge={badge}
              earned={earned}
              nextAction={earned ? undefined : nextActionFor(badge, metricValue(badge, counts))}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
