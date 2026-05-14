import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DashboardProofs } from "@/components/DashboardProofs";

export default function DashboardPage() {
  return (
    <AppShell title="Your Progress" subtitle="Action, feedback, trust, and proof across media types.">
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-purple2">Level 3 - Growing</p>
              <h2 className="mt-1 text-2xl font-black">Participant</h2>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-purple/20 text-xl font-black">62</div>
          </div>
          <div className="mt-4 h-3 rounded-full bg-white/10"><div className="h-3 w-[62%] rounded-full bg-gradient-to-r from-purple to-purple2" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Practices" value="12" />
          <Stat label="Proofs" value="7" />
          <Stat label="Media types" value="7" />
          <Stat label="Streak" value="3 days" />
        </div>
        <div className="card p-5">
          <h2 className="font-black">Next recommended action</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Complete One Clear Preference in the Speak Up path. Try audio or screenshot proof if text does not capture the attempt.</p>
          <Link href="/practice/speak-up-2" className="btn-primary mt-4 w-full">Start next practice</Link>
        </div>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Recent proofs</h2>
            <Link href="/proof/new" className="text-xs font-bold text-purple2">Add proof</Link>
          </div>
          <DashboardProofs />
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
