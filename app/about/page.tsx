import Link from "next/link";
import { BareShell } from "@/components/AppShell";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";
import { PrimaryButton, SignalFlowCard } from "@/components/ui";

export default function AboutPage() {
  return (
    <BareShell>
      <header className="mb-8 flex items-center justify-between">
        <SignalFlowLogo size={42} />
        <Link href="/" className="text-sm font-bold text-muted">
          Home
        </Link>
      </header>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-signal">Mission</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-ink">
            Every artist sends a signal. Scouts hear it first.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            SIGNAL//FLOW exists for music that has taste, pressure, and direction before it has numbers. Artists enter The Flow, Scouts listen in No Clout Mode, and the best early co-signs become permanent receipts.
          </p>
        </div>
        <SignalFlowCard>
          <p className="text-lg font-black text-ink">Signalprint</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The Mekhane Engine creates a mock AI report for each uploaded track: mood, genre lane, sonic description, strongest moment, mix notes, and a clean promo angle.
          </p>
        </SignalFlowCard>
        <SignalFlowCard>
          <p className="text-lg font-black text-ink">First 50</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Approved tracks enter a focused discovery stage where real matched listeners matter more than public clout. Artists see progress and basic analytics as the first current forms.
          </p>
        </SignalFlowCard>
        <PrimaryButton href="/auth?mode=signup&role=scout">Become a Flowfinder</PrimaryButton>
      </div>
    </BareShell>
  );
}
