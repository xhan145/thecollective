import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getPath, getPrompt } from "@/lib/data";

export default async function PracticePage({ params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  const prompt = getPrompt(promptId);
  if (!prompt) return notFound();
  const path = getPath(prompt.pathSlug);
  return (
    <AppShell title="Today's Practice" subtitle={path?.title}>
      <div className="space-y-4">
        <div className="glass-panel p-5">
          <p className="section-eyebrow">{prompt.estimatedMinutes} minute practice</p>
          <h2 className="mt-2 text-title leading-tight">{prompt.title}</h2>
          <p className="mt-4 text-heading leading-8 text-accent-on">{prompt.instruction}</p>
          <div className="mt-5 surface-row p-4">
            <p className="text-caption font-medium text-muted">Reflection question</p>
            <p className="mt-1 text-body leading-6 text-subtle">{prompt.reflectionQuestion}</p>
          </div>
        </div>
        <Link href={`/proof/new?prompt=${prompt.id}`} className="btn-primary w-full">Next: Add proof <ArrowRight size={16} /></Link>
        <Link href="/" className="btn-secondary w-full">Back to feed</Link>
      </div>
    </AppShell>
  );
}
