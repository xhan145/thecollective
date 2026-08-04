"use client";

import { motion } from "framer-motion";
import { BookOpen, Camera, Compass, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import type { Achievement } from "@/lib/badges/types";

const CATEGORY_ICON: Record<string, typeof BookOpen> = {
  Direction: Compass,
  Practice: BookOpen,
  Proof: Camera,
  Feedback: MessageSquare,
  Trust: ShieldCheck,
  Communication: MessageSquare,
  Contribution: Sparkles,
};

export function BadgeCard({ badge, earned, nextAction }: { badge: Achievement; earned: boolean; nextAction?: string }) {
  const Icon = CATEGORY_ICON[badge.category] ?? BookOpen;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`flex flex-col items-center rounded-3xl border p-4 text-center transition-colors ${
        earned ? "elev-2 border-line bg-surface" : "border-dashed border-line bg-bg"
      }`}
    >
      <div
        className={`grid h-14 w-14 place-items-center rounded-2xl ${
          earned ? "bg-surface-soft text-accent" : "bg-surface-soft text-subtle"
        }`}
      >
        <Icon size={26} strokeWidth={earned ? 2.4 : 2} />
      </div>
      <p className={`mt-3 text-body font-semibold ${earned ? "text-content" : "text-muted"}`}>{badge.name}</p>
      <p className="mt-1 text-overline leading-4 text-muted">
        {earned ? badge.description : nextAction ?? "Keep practicing."}
      </p>
      <span className="mt-2 text-overline uppercase tracking-[0.14em] text-subtle">
        {earned ? badge.rarity : "Locked"}
      </span>
    </motion.div>
  );
}
