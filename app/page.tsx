import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Headphones, Radio, Sparkles, Zap } from "lucide-react";
import { BareShell } from "@/components/AppShell";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";
import { SignalFlowCard } from "@/components/ui";

export default function LandingPage() {
  return (
    <BareShell>
      <section className="relative -mx-[18px] -mt-[18px] min-h-[92dvh] overflow-hidden px-[18px] pb-8 pt-6">
        <img
          src="/brand/signal_flow_cover_page.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-42"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night/30 via-night/72 to-night" />
        <div className="relative z-10 flex min-h-[86dvh] flex-col">
          <header className="flex items-center justify-between">
            <SignalFlowLogo size={44} />
            <Link href="/about" className="text-sm font-bold text-muted">
              About
            </Link>
          </header>
          <div className="mt-auto max-w-[420px] pb-4">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-signal">
              SIGNAL//FLOW
            </p>
            <h1 className="text-5xl font-black leading-[0.94] text-ink">
              Find them before they break.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted">
              SIGNAL//FLOW is an AI-powered discovery network for underrated artists. Upload your track, receive a Signalprint from the Mekhane Engine, and reach your first real matched listeners.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/auth?mode=signup&role=artist"
                className="inline-flex items-center justify-center gap-2 rounded-card bg-signal px-5 py-3.5 text-sm font-black text-night shadow-warmLg"
              >
                Enter the Flow
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/auth?mode=signup&role=scout"
                className="inline-flex items-center justify-center gap-2 rounded-card border border-line bg-card/80 px-5 py-3.5 text-sm font-black text-ink backdrop-blur"
              >
                Become a Flowfinder
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 pt-2">
        <FeatureCard
          icon={<Headphones size={19} />}
          title="For artists"
          body="Get your first 50 real listeners and a mock Mekhane Engine Signalprint before the track leaves review."
        />
        <FeatureCard
          icon={<Zap size={19} />}
          title="For Scouts"
          body="Build reputation by discovering artists early, saving signals, and backing tracks after real listening."
        />
        <FeatureCard
          icon={<Radio size={19} />}
          title="No Clout Mode"
          body="Listen first. Judge the sound, not the follower count."
        />
        <FeatureCard
          icon={<Sparkles size={19} />}
          title="Powered by the Mekhane Engine"
          body="Discovery intelligence for the underground: mood, genre, strongest moments, and promo angles."
        />
      </section>
    </BareShell>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <SignalFlowCard>
      <div className="mb-3 text-signal">{icon}</div>
      <p className="text-lg font-black text-ink">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
    </SignalFlowCard>
  );
}
