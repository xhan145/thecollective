import type { TrustStage } from "@/lib/types";
import { TRUST_STAGE_LABELS } from "@/lib/trust";

export function TrustBadge({ stage }: { stage: TrustStage }) {
  return (
    <span className="inline-block rounded-full bg-soft px-3 py-1 text-xs font-bold text-ink">
      {TRUST_STAGE_LABELS[stage] ?? "Starting"}
    </span>
  );
}
