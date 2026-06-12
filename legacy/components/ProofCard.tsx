import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { ProofSubmissionRecord } from "@/lib/proofModels";
import { practiceAreaLabels, proofStatusLabels, proofVisibilityLabels } from "@/lib/proofModels";
import { MediaPreview } from "./MediaPreview";
import { TrustBadge } from "./TrustBadge";
import { Pill } from "./ui";

export function ProofCard({ proof }: { proof: ProofSubmissionRecord }) {
  const statusTone = proof.status === "feedback_received" ? "success" : proof.status === "draft" ? "muted" : "accent";
  return (
    <article className="soft-card feed-card p-4 transition active:scale-[.995]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">{practiceAreaLabels[proof.practice_area]}</Pill>
            <Pill tone={statusTone}>{proofStatusLabels[proof.status]}</Pill>
          </div>
          <h2 className="mt-3 text-[17px] font-black leading-6 tracking-tight">{proof.title}</h2>
          <p className="mt-1 text-[11px] text-[#8f887e]">{proofVisibilityLabels[proof.visibility]} · proof from practice</p>
        </div>
        <TrustBadge score={proof.trust_weight} />
      </div>
      <MediaPreview mediaUrl={proof.media_url || proof.media_thumbnail_url} mediaType={proof.media_type} title={proof.title} />
      <p className="mt-4 text-[15px] leading-7 text-[#e5ded4]">{proof.reflection_text}</p>
      {proof.ai_summary && <p className="mt-3 rounded-[22px] bg-white/[0.045] p-3 text-xs leading-5 text-[#c8c2b8]">{proof.ai_summary}</p>}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-[#8f887e]"><MessageCircle size={14} /> {proof.feedback_count === 0 ? "Waiting for useful feedback" : `${proof.feedback_count} useful feedback`}</p>
        <Link href={`/proof/${proof.id}`} className="rounded-full bg-white/[0.08] px-4 py-2 text-xs font-black text-[#d8d4ff] transition active:scale-95">Give feedback</Link>
      </div>
    </article>
  );
}
