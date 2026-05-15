import Link from "next/link";
import { ArrowRight, Brain, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FeedCard } from "@/components/FeedCard";
import { demoFeedItems } from "@/lib/data";
import { feedOperatingPrinciples, rankHomeFeed } from "@/lib/feedAlgorithm";
import type { DemoUser } from "@/lib/types";

const demoUser: DemoUser = { goal: "speak-up", stage: "new", completedPromptIds: [] };

export default function HomePage() {
  const feed = rankHomeFeed(demoFeedItems, demoUser);
  const principles = feedOperatingPrinciples();
  return (
    <AppShell>
      <section className="space-y-5">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-purple/25 to-transparent p-5 shadow-glow">
          <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-purple2">Collective v8 demo</p>
          <h1 className="text-4xl font-black leading-[1.02] tracking-tight">Practice real growth. Prove it. Get feedback. Help others.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">Collective is a progress-and-contribution platform. The homepage feed intentionally turns passive scrolling into meaningful action and multimodal proof.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/onboarding" className="btn-primary">Start <ArrowRight size={16} /></Link>
            <Link href="/setup" className="btn-secondary">Setup</Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Metric icon={<Sparkles size={17} />} label="Practice" value="Small" />
          <Metric icon={<Brain size={17} />} label="Feedback" value="Useful" />
          <Metric icon={<ShieldCheck size={17} />} label="Trust" value="Earned" />
        </div>
        <section className="card p-4">
          <h2 className="text-lg font-black">The passive feed matters</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">People will scroll. The product decision is whether scrolling drains them or moves them. Collective's feed rhythm is: relatable proof, bridge to reflection, then action.</p>
          <div className="mt-4 space-y-2">
            {principles.slice(0, 3).map((p) => <p key={p} className="rounded-2xl bg-white/5 p-3 text-xs leading-5 text-slate-300">{p}</p>)}
          </div>
        </section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Home feed</h2>
            <p className="text-xs text-slate-500">Algorithm: passive - bridge - active</p>
          </div>
          <Link href="/feed-system" className="text-xs font-bold text-purple2">View logic</Link>
        </div>
        <section className="space-y-4">{feed.map((item) => <FeedCard key={item.id} item={item} />)}</section>
      </section>
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-2xl bg-white/10 text-purple2">{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}
