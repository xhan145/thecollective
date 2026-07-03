"use client";

import { motion } from "framer-motion";
import { CollectiveMiniMark } from "@/components/beta/Brand";

// A stylized phone showing the product's look (cream cards, gold, the loop).
// Pure CSS/markup so it ships without screenshot capture; swap for a real
// screenshot <img> later if desired.
export default function PhoneMockup({ className = "" }: { className?: string }) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative mx-auto w-[280px] rounded-[40px] border border-[#EFE7D8] bg-[#FFFDF8] p-3 shadow-[0_30px_80px_rgba(71,52,18,0.18)] ${className}`}
    >
      <div className="overflow-hidden rounded-[30px] bg-[#FFF8EE] p-4">
        <div className="flex items-center justify-between">
          <CollectiveMiniMark className="h-7 w-7" />
          <span className="h-7 w-7 rounded-full bg-[#FFF1C7]" />
        </div>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#FFF1C7] to-[#FFFDF8] p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#B07A00]">Your next step</p>
          <p className="mt-1 font-display text-base font-bold text-[#111111]">Introduce yourself in 60 seconds</p>
          <p className="mt-1 text-[11px] text-[#6E6E6E]">3 min · low pressure</p>
          <div className="mt-3 h-9 w-full rounded-full bg-[#F2A900]" />
        </div>
        <div className="mt-3 space-y-2">
          {["Proof posted", "Useful feedback +1", "Trust growing"].map((t) => (
            <div key={t} className="flex items-center gap-2 rounded-xl bg-[#FFFDF8] p-2 shadow-[0_6px_16px_rgba(71,52,18,0.06)]">
              <span className="h-6 w-6 rounded-lg bg-[#E8F8EE]" />
              <span className="text-[11px] font-bold text-[#38322A]">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
