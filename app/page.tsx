"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CollectiveMark, CollectiveWordmark } from "@/components/beta/Brand";
import { InstallPwaCard } from "@/components/beta/InstallPwaCard";
import { ButtonLink, Card } from "@/components/beta/ui";
import { useBetaApp } from "@/components/beta/AppStateProvider";

export default function LandingPage() {
  const { currentUser, enterDemoBeta, firebaseMode, supabaseEnabled } = useBetaApp();

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#FFF8EE] px-5 pb-10 pt-[calc(26px+env(safe-area-inset-top,0px))] text-[#111111]">
      <div className="flex items-center justify-between">
        <CollectiveWordmark />
        <Link href="/install" className="rounded-full bg-[#FFF1C7] px-3 py-2 text-xs font-extrabold text-[#7A5300]">
          Install
        </Link>
      </div>

      <section className="pt-14 text-center">
        <CollectiveMark className="mx-auto h-[92px] w-[190px]" />
        <h1 className="mt-5 text-[38px] font-extrabold leading-[1.02] tracking-tight">Small steps. Real progress.</h1>
        <p className="mx-auto mt-4 max-w-[330px] text-[15px] leading-7 text-[#6E6E6E]">
          Collective helps beta members practice, submit proof, receive useful feedback, and build trust through contribution.
        </p>
        <div className="mt-7 grid gap-3">
          {currentUser ? (
            <ButtonLink href="/home" className="w-full">
              Open Collective <ArrowRight size={17} />
            </ButtonLink>
          ) : supabaseEnabled ? (
            <ButtonLink href="/auth" className="w-full">
              Start closed beta <ArrowRight size={17} />
            </ButtonLink>
          ) : (
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F2A900] px-5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(242,169,0,0.24)]"
              onClick={() => enterDemoBeta()}
            >
              Enter demo beta <ArrowRight size={17} />
            </button>
          )}
          <ButtonLink href="/auth" variant="secondary" className="w-full">
            {supabaseEnabled ? "Beta sign in" : "Beta sign in"}
          </ButtonLink>
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F2A900]">{firebaseMode}</p>
          <h2 className="mt-2 text-xl font-extrabold">Built for the local product loop</h2>
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Discover, practice, prove, get feedback, build trust, and contribute without social clout mechanics.</p>
        </Card>
        <InstallPwaCard />
      </section>
    </main>
  );
}
