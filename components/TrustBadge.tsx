import { ShieldCheck } from "lucide-react";
import { calculateTrustLevel } from "@/lib/trust";

export function TrustBadge({ score }: { score: number }) {
  const level = calculateTrustLevel(score);
  const tone = level === "Contributor" ? "text-purple2 bg-purple/15" : level === "Reliable" ? "text-green bg-green/10" : level === "Practicing" ? "text-orange bg-orange/10" : "text-[#c8c2b8] bg-white/[0.06]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${tone}`}>
      <ShieldCheck size={13} />
      {level}
      <span className="opacity-70">{score}</span>
    </span>
  );
}
