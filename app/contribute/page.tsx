import { AppShell } from "@/components/AppShell";
import { ProofTypeBadge } from "@/components/ProofMediaCard";
import { proofNeedsFeedback } from "@/lib/data";

export default function ContributePage() {
  return (
    <AppShell title="Contribution Hub" subtitle="Choose proof you can review kindly and specifically.">
      <div className="space-y-4">
        {proofNeedsFeedback.map((item) => (
          <article key={item.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-purple2">{item.path}</p>
                <h2 className="mt-1 font-black">{item.prompt}</h2>
              </div>
              <ProofTypeBadge proofType={item.proofType} mediaKind={item.mediaKind} />
            </div>
            <p className="mt-3 rounded-2xl bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">{item.feedbackRequest}</p>
            <p className="mt-3 text-xs text-slate-500">Visibility: {item.visibility}</p>
            <p className="mt-2 text-xs leading-5 text-orange">{item.safetyNote}</p>
            <button className="btn-primary mt-4 w-full" type="button">Review proof</button>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
