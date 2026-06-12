import Link from "next/link";
import { BareShell } from "@/components/AppShell";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";
import { SignalFlowCard } from "@/components/ui";

export default function WaitlistPage() {
  return (
    <BareShell>
      <div className="flex min-h-[82dvh] flex-col justify-center gap-5 text-center">
        <SignalFlowLogo size={180} showWordmark />
        <SignalFlowCard>
          <p className="text-2xl font-black text-ink">SIGNAL//FLOW is invite-only right now.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The Flow is opening in controlled waves while the underground signal stays clean.
          </p>
          <Link
            href="/"
            className="mt-5 block rounded-card bg-signal px-4 py-3 text-sm font-black text-night"
          >
            Back to launch page
          </Link>
        </SignalFlowCard>
      </div>
    </BareShell>
  );
}
