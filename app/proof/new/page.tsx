import { AppShell } from "@/components/AppShell";
import { ProofComposer } from "@/components/ProofComposer";

export default function NewProofPage() {
  return (
    <AppShell title="Submit proof" subtitle="Show the practice, not perfection. Your proof can stay private.">
      <ProofComposer />
    </AppShell>
  );
}
