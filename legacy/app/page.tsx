import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FeedCard } from "@/components/FeedCard";
import { MediaProofSwipe } from "@/components/MediaProofSwipe";
import { ProofCard } from "@/components/ProofCard";
import { EmptyProofState } from "@/components/EmptyProofState";
import { Pill, ProgressMetric, SectionHeader } from "@/components/ui";
import { demoFeedItems, demoPhotoProofSpotlights, demoVideoProofSpotlights } from "@/lib/data";
import { feedOperatingPrinciples, rankHomeFeed } from "@/lib/feedAlgorithm";
import { demoMediaProofSubmissions, rankProofFeed } from "@/lib/proofData";
import type { DemoUser } from "@/lib/types";

const demoUser: DemoUser = { goal: "speak-up", stage: "new", completedPromptIds: [] };

export default function HomePage() {
  const feed = rankHomeFeed(demoFeedItems, demoUser);
  const proofFeed = rankProofFeed(demoMediaProofSubmissions);
  const principles = feedOperatingPrinciples();

  return (
    <AppShell>
      <section className="space-y-7">
        <div className="glass-panel p-6">
          <Pill tone="accent">Collective v9 demo</Pill>
          <h1 className="mt-5 text-[36px] font-black leading-[1.02] tracking-tight">Real progress over appearance.</h1>
          <p className="mt-4 text-[15px] leading-7 text-[#c8c2b8]">Practice in small steps, prove what happened, ask for useful feedback, and build trust through contribution.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/proof/new" className="btn-primary">Submit proof <ArrowRight size={16} /></Link>
            <Link href="/paths" className="btn-secondary">Find practice</Link>
          </div>
        </div>

        <section className="soft-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-eyebrow">Today’s momentum</p>
              <h2 className="section-title">One proof, one next step</h2>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-3xl bg-green/10 text-green">
              <CheckCircle2 size={21} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <ProgressMetric label="Practiced" value="1x" helper="today" />
            <ProgressMetric label="Feedback" value="2" helper="useful" />
            <ProgressMetric label="Trust" value="62" helper="earned" />
          </div>
          <p className="mt-4 rounded-[22px] bg-white/[0.04] p-3 text-xs leading-5 text-[#c8c2b8]">The feed is a practice stream. It nudges from passive proof into reflection, then action.</p>
        </section>

        <section className="space-y-3">
          <SectionHeader
            eyebrow="Proof from practice"
            title="Recent submissions"
            action={<Link href="/proof/new" className="pill pill-accent">Add proof</Link>}
          />
          {proofFeed.length ? proofFeed.map((proof) => <ProofCard key={proof.id} proof={proof} />) : <EmptyProofState />}
        </section>

        <MediaProofSwipe photos={demoPhotoProofSpotlights} videos={demoVideoProofSpotlights} />

        <section className="soft-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple/15 text-purple2"><Sparkles size={18} /></div>
            <div>
              <h2 className="font-black">Practice stream logic</h2>
              <p className="text-xs text-[#8f887e]">Passive → Bridge → Active</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {principles.slice(0, 3).map((p) => <p key={p} className="surface-row p-3 text-xs leading-5 text-[#c8c2b8]">{p}</p>)}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            eyebrow="Guided feed"
            title="Next useful actions"
            action={<Link href="/feed-system" className="text-xs font-black text-purple2">View logic</Link>}
          />
          <div className="grid grid-cols-2 gap-3">
            <SmallSignal icon={<MessageCircle size={16} />} label="Feedback needed" value="3 proofs" />
            <SmallSignal icon={<ShieldCheck size={16} />} label="Contribution ready" value="Kind review" />
          </div>
          {feed.map((item) => <FeedCard key={item.id} item={item} />)}
        </section>
      </section>
    </AppShell>
  );
}

function SmallSignal({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="surface-row p-3">
      <div className="mb-2 grid h-8 w-8 place-items-center rounded-2xl bg-white/[0.06] text-purple2">{icon}</div>
      <p className="text-[11px] text-[#8f887e]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}
