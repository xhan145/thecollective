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
        earned ? "elev-2 border-[#EFE7D8] bg-[#FFFDF8]" : "border-dashed border-[#EFE7D8] bg-[#FFF8EE]"
      }`}
    >
      <div
        className={`grid h-14 w-14 place-items-center rounded-2xl ${
          earned ? "bg-[#FFF1C7] text-[#F2A900]" : "bg-[#F1ECE1] text-[#B6AE9F]"
        }`}
      >
        <Icon size={26} strokeWidth={earned ? 2.4 : 2} />
      </div>
      <p className={`mt-3 text-sm font-extrabold ${earned ? "text-[#111111]" : "text-[#8D877F]"}`}>{badge.name}</p>
      <p className="mt-1 text-[11px] leading-4 text-[#6E6E6E]">
        {earned ? badge.description : nextAction ?? "Keep practicing."}
      </p>
      <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[#B6AE9F]">
        {earned ? badge.rarity : "Locked"}
      </span>
    </motion.div>
  );
}
