import { AppShell } from "@/components/AppShell";
import { ProofComposer } from "@/components/ProofComposer";

export default function NewProofPage() {
  return (
    <AppShell title="Add Proof" subtitle="Text, media, links, and reflections. Keep it private if you want.">
      <ProofComposer />
    </AppShell>
  );
}
