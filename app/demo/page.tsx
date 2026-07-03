"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/beta/ui";
import { CollectiveWordmark } from "@/components/beta/Brand";
import { MARKETING, ROUTES } from "@/lib/marketing/content";
import { trackEvent } from "@/lib/analytics";

const PROOF = [
  { key: "video", label: "Short video", hint: "Record ~60 seconds on your phone." },
  { key: "audio", label: "Audio clip", hint: "Just your voice — no camera needed." },
  { key: "written", label: "Written version", hint: "Type what you'd say." },
  { key: "reflection", label: "Reflection", hint: "A few private notes on how it went." },
];

export default function DemoPage() {
  const { card } = MARKETING.tryFirst;
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("demo_practice_started", { source: "demo_page" });
  }, []);

  function pick(key: string) {
    // Fire once, on the first selection — toggling options shouldn't inflate it.
    if (picked === null) trackEvent("demo_proof_started", { proof_type: key });
    setPicked(key);
  }

  return (
    <main className="min-h-screen w-full bg-[#FFF8EE] text-[#111111]">
      <header className="sticky top-0 z-40 border-b border-[#EFE7D8]/70 bg-[#FFF8EE]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/" aria-label="Collective home"><CollectiveWordmark /></Link>
          <span className="rounded-full bg-[#FFF1C7] px-3 py-1 text-xs font-extrabold text-[#7A5300]">Demo &middot; no account needed</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 py-10">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#F2A900]">Try this first</p>
        <h1 className="mt-2 font-display text-[30px] font-bold leading-tight lg:text-[38px]">{card.title}</h1>

        <section aria-labelledby="demo-step-1" className="mt-6 rounded-3xl border border-[#EFE7D8] bg-[#FFFDF8] p-6">
          <p id="demo-step-1" className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#B6AE9F]">Step 1 &middot; The prompt</p>
          <p className="mt-2 text-[16px] font-bold leading-7">{card.prompt}</p>
          <p className="mt-3 text-sm text-[#6E6E6E]">Take a breath. It doesn&rsquo;t need to be perfect — this is practice.</p>
        </section>

        <section aria-labelledby="demo-step-2" className="mt-4 rounded-3xl border border-[#EFE7D8] bg-[#FFFDF8] p-6">
          <p id="demo-step-2" className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#B6AE9F]">Step 2 &middot; Choose how to show your proof</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {PROOF.map((o) => {
              const on = picked === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => pick(o.key)}
                  aria-pressed={on}
                  className={`rounded-2xl border p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-[#F2A900]/40 ${on ? "border-[#F2A900]/60 bg-[#FFF1C7]/60" : "border-[#EFE7D8] bg-[#FFF8EE] hover:border-[#F2A900]/30"}`}
                >
                  <span className="block text-sm font-extrabold text-[#111111]">{o.label}</span>
                  <span className="mt-0.5 block text-xs text-[#6E6E6E]">{o.hint}</span>
                </button>
              );
            })}
          </div>
          {picked && (
            <p className="mt-3 text-sm font-bold text-[#7A5300]">Nice — that&rsquo;s exactly how it works in the app. In the beta, you&rsquo;d capture it right here.</p>
          )}
        </section>

        <section aria-labelledby="demo-step-3" className="mt-4 rounded-3xl border border-[#EFE7D8] bg-[#FFFDF8] p-6">
          <p id="demo-step-3" className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#B6AE9F]">Step 3 &middot; Feedback you&rsquo;d get</p>
          <ul className="mt-3 space-y-1.5">
            {card.feedbackPreview.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#38322A]"><span aria-hidden className="text-[#22C55E]">✓</span>{f}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-[#6E6E6E]">Feedback helps you improve. It does not define you.</p>
        </section>

        <section className="mt-8 rounded-3xl bg-[#FFF1C7] p-6 text-center">
          <p className="font-display text-[20px] font-bold">Ready to do it for real?</p>
          <p className="mx-auto mt-2 max-w-[420px] text-sm text-[#6E6E6E]">Join the closed beta to submit proof, get feedback, and build trust over time.</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={ROUTES.beta} onClick={() => trackEvent("demo_signup_clicked")} className="w-full sm:w-auto">Join the closed beta</ButtonLink>
            <Link href="/" className="text-sm font-bold text-[#6E6E6E] hover:text-[#111111]">Back to home</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
