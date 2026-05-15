import { AppShell } from "@/components/AppShell";
import { demoProofSubmissions } from "@/lib/data";
import { proofTypeLabels } from "@/lib/media/proofMedia";
import type { ProofType } from "@/lib/types";

const proofTypes: ProofType[] = ["text", "image", "video", "audio", "document", "screenshot", "link", "checklist"];

export default function AdminPage() {
  const byType = proofTypes.map((type) => ({
    type,
    count: demoProofSubmissions.filter((proof) => proof.proofType === type).length
  }));

  return (
    <AppShell title="Admin" subtitle="Founder view for multimodal proof operations.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Users" value="48" />
          <Stat label="Proofs" value="126" />
          <Stat label="Media uploads" value="39" />
          <Stat label="Flagged media" value="2" />
        </div>
        <div className="card p-5">
          <h2 className="font-black">Proof by media type</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {byType.map((row) => (
              <p key={row.type} className="rounded-2xl bg-white/[0.04] px-3 py-2 text-xs text-slate-400">
                {proofTypeLabels[row.type]} <span className="font-black text-white">{row.count}</span>
              </p>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-black">Recent uploads</h2>
          <div className="mt-3 space-y-2">
            {demoProofSubmissions.map((proof) => (
              <p key={proof.id} className="rounded-2xl bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
                {proofTypeLabels[proof.proofType]} - {proof.promptTitle} - {proof.visibility}
              </p>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-black">Storage and moderation reminders</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
            <li>Create a private Supabase Storage bucket named proof-media.</li>
            <li>Store storage paths in the database, not public URLs.</li>
            <li>Use signed URLs for temporary viewing later.</li>
            <li>Add media moderation before public or path-wide media sharing.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
