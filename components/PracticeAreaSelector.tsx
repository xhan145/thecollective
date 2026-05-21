"use client";

import { MessageCircle, ShieldCheck, Sparkles, Zap } from "lucide-react";
import type { PracticeArea } from "@/lib/proofModels";
import { practiceAreaLabels } from "@/lib/proofModels";

const options: Array<{ value: PracticeArea; icon: typeof Sparkles }> = [
  { value: "confidence", icon: ShieldCheck },
  { value: "communication", icon: MessageCircle },
  { value: "momentum", icon: Zap },
  { value: "contribution", icon: Sparkles }
];

export function PracticeAreaSelector({ value, onChange }: { value: PracticeArea; onChange: (value: PracticeArea) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button key={option.value} type="button" onClick={() => onChange(option.value)} className={`chip-button rounded-[22px] border p-3.5 text-left transition ${active ? "border-purple2/50 bg-purple/15 text-white shadow-soft" : "border-white/10 bg-white/[0.04] text-[#c8c2b8]"}`}>
            <div className="flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-2xl ${active ? "bg-white/10 text-purple2" : "bg-white/[0.04] text-[#8f887e]"}`}><Icon size={16} /></span>
              <span className="text-xs font-black">{practiceAreaLabels[option.value]}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
