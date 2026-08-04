"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/beta/ui";
import { CollectiveWordmark } from "@/components/beta/Brand";
import { MARKETING, ROUTES } from "@/lib/marketing/content";
import { trackEvent } from "@/lib/analytics";
import AmbientBackdrop from "@/components/beta/AmbientBackdrop";

const PROOF = [
  { key: "video", label: "Short video", hint: "Record ~60 seconds on your phone." },
  { key: "audio", label: "Audio clip", hint: "Just your voice — no camera needed." },
  { key: "written", label: "Written version", hint: "Type what you'd say." },
  { key: "reflection", label: "Reflection", hint: "A few private notes on how it went." },
];

export default function DemoPage() {
  const { card } = MARKETING.tryFirst;
  const [picked, setPicked] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const writable = picked === "written" || picked === "reflection";

  useEffect(() => {
    trackEvent("demo_practice_started", { source: "demo_page" });
  }, []);

  function pick(key: string) {
    // Fire once, on the first selection — toggling options shouldn't inflate it.
    if (picked === null) trackEvent("demo_proof_started", { proof_type: key });
    setPicked(key);
  }

  return (
    <main className="relative min-h-screen w-full bg-bg text-content">
      <AmbientBackdrop />
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/" aria-label="Collective home"><CollectiveWordmark /></Link>
          <span className="rounded-full bg-surface-soft px-3 py-1 text-caption font-semibold text-accent-text">Demo &middot; no account needed</span>
        </div>
      </header>

      <div className="relative z-[1] mx-auto w-full max-w-2xl px-5 py-10">
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-accent">Try this first</p>
        <h1 className="mt-2 font-display text-title leading-tight lg:text-display">{card.title}</h1>

        <section aria-labelledby="demo-step-1" className="mt-6 elev-1 elev-hover rounded-3xl border border-line bg-surface p-6">
          <p id="demo-step-1" className="text-caption font-semibold uppercase tracking-[0.14em] text-subtle">Step 1 &middot; The prompt</p>
          <p className="mt-2 text-body-lg font-medium leading-7">{card.prompt}</p>
          <p className="mt-3 text-body text-muted">Take a breath. It doesn&rsquo;t need to be perfect — this is practice.</p>
        </section>

        <section aria-labelledby="demo-step-2" className="mt-4 elev-1 elev-hover rounded-3xl border border-line bg-surface p-6">
          <p id="demo-step-2" className="text-caption font-semibold uppercase tracking-[0.14em] text-subtle">Step 2 &middot; Choose how to show your proof</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {PROOF.map((o) => {
              const on = picked === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => pick(o.key)}
                  aria-pressed={on}
                  className={`rounded-2xl border p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${on ? "border-accent/60 bg-surface-soft/60" : "border-line bg-bg hover:border-accent/30"}`}
                >
                  <span className="block text-body font-semibold text-content">{o.label}</span>
                  <span className="mt-0.5 block text-caption text-muted">{o.hint}</span>
                </button>
              );
            })}
          </div>
          {picked && !writable && (
            <p className="mt-3 text-body font-medium text-accent-text">Nice — that&rsquo;s exactly how it works in the app. In the beta, you&rsquo;d record it right here.</p>
          )}
          {writable && (
            <div className="mt-3">
              <label htmlFor="demo-reflection" className="block text-body font-medium text-secondary">
                Write a short reflection
              </label>
              <textarea
                id="demo-reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={4}
                placeholder="I introduced myself to… It felt… Next time I want to…"
                className="mt-2 w-full resize-none rounded-2xl border border-line bg-bg px-4 py-3 text-body text-content outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent/40"
              />
              <p className="mt-2 text-caption text-muted">Demo only — nothing is saved. Create an account to keep your proof.</p>
            </div>
          )}
        </section>

        <section aria-labelledby="demo-step-3" className="mt-4 elev-1 elev-hover rounded-3xl border border-line bg-surface p-6">
          <p id="demo-step-3" className="text-caption font-semibold uppercase tracking-[0.14em] text-subtle">Step 3 &middot; Feedback you&rsquo;d get</p>
          <ul className="mt-3 space-y-1.5">
            {card.feedbackPreview.map((f) => (
              <li key={f} className="flex items-center gap-2 text-body text-secondary"><span aria-hidden className="text-success">✓</span>{f}</li>
            ))}
          </ul>
          <p className="mt-3 text-body text-muted">Feedback helps you improve. It does not define you.</p>
        </section>

        <section className="mt-8 rounded-3xl bg-surface-soft p-6 text-center">
          <p className="font-display text-heading">Ready to do it for real?</p>
          <p className="mx-auto mt-2 max-w-[420px] text-body text-muted">Join the closed beta to submit proof, get feedback, and build trust over time.</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={ROUTES.beta} onClick={() => trackEvent("demo_signup_clicked")} className="w-full sm:w-auto">Create an account to save your proof</ButtonLink>
            <Link href="/" className="text-body font-medium text-muted hover:text-content">Back to home</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
