import { AppShell } from "@/components/AppShell";
import { demoPhotoProofSpotlights, demoProofSubmissions, demoVideoProofSpotlights } from "@/lib/data";
import { proofTypeLabels } from "@/lib/media/proofMedia";
import type { ProofType } from "@/lib/types";
import { ProgressMetric, SectionHeader } from "@/components/ui";

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
          <Stat label="Intent taps" value="214" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Photo lane" value={String(demoPhotoProofSpotlights.length)} />
          <Stat label="Video lane" value={String(demoVideoProofSpotlights.length)} />
          <Stat label="Flagged media" value="2" />
          <Stat label="Moderation queue" value="5" />
        </div>
        <div className="soft-card p-5">
          <SectionHeader eyebrow="Operations" title="Proof by media type" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {byType.map((row) => (
              <p key={row.type} className="surface-row px-3 py-2 text-xs text-[#c8c2b8]">
                {proofTypeLabels[row.type]} <span className="font-black text-white">{row.count}</span>
              </p>
            ))}
          </div>
        </div>
        <div className="soft-card p-5">
          <SectionHeader eyebrow="Media safety" title="Recent uploads" />
          <div className="mt-3 space-y-2">
            {demoProofSubmissions.map((proof) => (
              <p key={proof.id} className="surface-row px-3 py-2 text-sm text-[#c8c2b8]">
                {proofTypeLabels[proof.proofType]} - {proof.promptTitle} - {proof.visibility}
              </p>
            ))}
          </div>
        </div>
        <div className="soft-card p-5">
          <h2 className="font-black">Storage and moderation reminders</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#c8c2b8]">
            <li>Create a private Supabase Storage bucket named proof-media.</li>
            <li>Store storage paths in the database, not public URLs.</li>
            <li>Use signed URLs for temporary viewing later.</li>
            <li>Add media moderation before public or path-wide media sharing.</li>
            <li>Track engagement intent separately from popularity metrics.</li>
            <li>Review video proof with stricter safety boundaries than quick photo proof.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <ProgressMetric label={label} value={value} />;
}
