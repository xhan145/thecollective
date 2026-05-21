import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DashboardProofs } from "@/components/DashboardProofs";
import { Pill, ProgressMetric, SectionHeader } from "@/components/ui";
import { TrustBadge } from "@/components/TrustBadge";

export default function DashboardPage() {
  return (
    <AppShell title="Progress" subtitle="A private view of practice, proof, feedback, and earned trust.">
      <div className="space-y-6">
        <section className="glass-panel p-6">
          <Pill tone="success">Your practice</Pill>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black leading-none tracking-tight">Practicing</h2>
              <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">Trust grows from consistency and usefulness, not attention.</p>
            </div>
            <TrustBadge score={62} />
          </div>
          <div className="mt-5 h-2.5 rounded-full bg-white/10">
            <div className="h-2.5 w-[62%] rounded-full bg-gradient-to-r from-green via-teal to-purple" />
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <ProgressMetric label="Proof submitted" value="7" helper="practice evidence" />
          <ProgressMetric label="Feedback given" value="5" helper="useful support" />
          <ProgressMetric label="Feedback received" value="4" helper="next-step help" />
          <ProgressMetric label="Consistency" value="3 days" helper="current rhythm" />
        </div>

        <section className="soft-card p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple/15 text-purple2"><Sparkles size={18} /></div>
            <div>
              <h2 className="font-black">Next contribution step</h2>
              <p className="text-xs text-[#8f887e]">Give one specific, kind, useful response.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#c8c2b8]">You are ready to help someone take the next step when you can stay inside their feedback request.</p>
          <Link href="/contribute" className="btn-secondary mt-4 w-full">Open feedback circle <ArrowRight size={16} /></Link>
        </section>

        <section className="space-y-3">
          <SectionHeader eyebrow="Recent trust events" title="Trust earned" />
          <TrustEvent icon={<CheckCircle2 size={16} />} title="Submitted proof consistently" points="+8" />
          <TrustEvent icon={<MessageCircle size={16} />} title="Received helpful feedback" points="+5" />
          <TrustEvent icon={<ShieldCheck size={16} />} title="Gave specific feedback" points="+6" />
        </section>

        <section>
          <SectionHeader eyebrow="Proof journal" title="Recent proof" action={<Link href="/proof/new" className="pill pill-accent">Add proof</Link>} />
          <div className="mt-3">
            <DashboardProofs />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function TrustEvent({ icon, title, points }: { icon: React.ReactNode; title: string; points: string }) {
  return (
    <div className="surface-row flex items-center justify-between gap-3 p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/[0.06] text-purple2">{icon}</div>
        <p className="text-sm font-bold text-[#e5ded4]">{title}</p>
      </div>
      <span className="pill pill-success">{points}</span>
    </div>
  );
}
