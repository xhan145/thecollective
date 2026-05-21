import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FeedbackComposer } from "@/components/FeedbackComposer";
import { ProofCard } from "@/components/ProofCard";
import { demoMediaProofSubmissions } from "@/lib/proofData";

export default async function ProofDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proof = demoMediaProofSubmissions.find((item) => item.id === id);
  if (!proof) return notFound();

  return (
    <AppShell title="Proof detail" subtitle="Respond to the practice, not the person.">
      <div className="space-y-5">
        <ProofCard proof={proof} />
        <FeedbackComposer proofId={proof.id} />
        <Link href="/" className="btn-secondary w-full">Back to feed</Link>
      </div>
    </AppShell>
  );
}
