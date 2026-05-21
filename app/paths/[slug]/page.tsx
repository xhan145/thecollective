import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getFirstPromptForPath, getPath, prompts } from "@/lib/data";

export default async function PathDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = getPath(slug);
  if (!path) return notFound();
  const first = getFirstPromptForPath(path.slug);
  const pathPrompts = prompts.filter((p) => p.pathSlug === path.slug);
  return (
    <AppShell title={path.title} subtitle={path.promise}>
      <div className="space-y-4">
        <div className={`glass-panel min-h-32 bg-gradient-to-br ${path.color} p-5`}>
          <p className="text-sm font-bold text-white/80">{path.estimatedDays}-day starter path</p>
          <h2 className="mt-2 text-2xl font-black">{path.description}</h2>
        </div>
        <Link href={`/practice/${first.id}`} className="btn-primary w-full">Start first practice <ArrowRight size={16} /></Link>
        <div className="space-y-3">
          {pathPrompts.map((prompt) => (
            <Link key={prompt.id} href={`/practice/${prompt.id}`} className="soft-card block p-4 transition active:scale-[.99]">
              <p className="text-xs font-bold text-purple2">Step {prompt.order} - {prompt.estimatedMinutes} min</p>
              <h3 className="mt-1 font-black">{prompt.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">{prompt.instruction}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
