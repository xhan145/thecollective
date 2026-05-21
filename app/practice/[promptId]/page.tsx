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
          <h2 className="mt-2 text-2xl font-black leading-tight">{prompt.title}</h2>
          <p className="mt-4 text-lg leading-8 text-white">{prompt.instruction}</p>
          <div className="mt-5 surface-row p-4">
            <p className="text-xs font-bold text-[#8f887e]">Reflection question</p>
            <p className="mt-1 text-sm leading-6 text-[#c8c2b8]">{prompt.reflectionQuestion}</p>
          </div>
        </div>
        <Link href={`/proof/new?prompt=${prompt.id}`} className="btn-primary w-full">Next: Add proof <ArrowRight size={16} /></Link>
        <Link href="/" className="btn-secondary w-full">Back to feed</Link>
      </div>
    </AppShell>
  );
}
