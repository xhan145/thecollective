"use client";

import type { MvpProofVisibility } from "@/lib/proofModels";
import { proofVisibilityLabels } from "@/lib/proofModels";

const options: MvpProofVisibility[] = ["private", "feedback-only", "public"];

export function VisibilitySelector({ value, onChange }: { value: MvpProofVisibility; onChange: (value: MvpProofVisibility) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <button key={option} type="button" onClick={() => onChange(option)} className={`chip-button min-h-[48px] rounded-full border px-2 text-xs font-black transition ${active ? "border-purple2/50 bg-purple/15 text-white shadow-soft" : "border-white/10 bg-white/[0.04] text-[#8f887e]"}`}>
            {proofVisibilityLabels[option]}
          </button>
        );
      })}
    </div>
  );
}
