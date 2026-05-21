import { HelpCircle, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProofTypeBadge } from "@/components/ProofMediaCard";
import { Pill, SectionHeader } from "@/components/ui";
import { proofNeedsFeedback } from "@/lib/data";

export default function ContributePage() {
  return (
    <AppShell title="Feedback circle" subtitle="Choose proof you can review kindly and specifically.">
      <div className="space-y-5">
        <section className="glass-panel p-5">
          <Pill tone="accent">Contribution pathway</Pill>
          <h2 className="mt-4 text-2xl font-black leading-tight">Help them take the next step.</h2>
          <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">Useful feedback is specific, bounded, and grounded in the practice request.</p>
        </section>

        <SectionHeader eyebrow="Feedback needed" title="Proof awaiting support" />
        <div className="space-y-3">
          {proofNeedsFeedback.map((item) => (
            <article key={item.id} className="soft-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Pill tone="accent">{item.path}</Pill>
                  <h2 className="mt-3 font-black">{item.prompt}</h2>
                </div>
                <ProofTypeBadge proofType={item.proofType} mediaKind={item.mediaKind} />
              </div>
              <p className="mt-4 rounded-[22px] bg-white/[0.04] p-3 text-sm leading-6 text-[#e5ded4]">{item.feedbackRequest}</p>
              <p className="mt-3 text-xs text-[#8f887e]">Visibility: {item.visibility}</p>
              <p className="mt-2 text-xs leading-5 text-orange">{item.safetyNote}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button className="intent-button border-white/10 bg-white/[0.05] text-[#c8c2b8]" type="button"><HelpCircle size={14} /> Context</button>
                <button className="intent-button border-orange/25 bg-orange/10 text-orange" type="button"><ShieldCheck size={14} /> Review</button>
                <button className="intent-button border-green/25 bg-green/10 text-green" type="button"><Sparkles size={14} /> Next step</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
