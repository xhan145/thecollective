import Link from "next/link";

export const metadata = { title: "Privacy — Collective" };

// Beta-grade privacy notice: honest about what the product actually does.
// DRAFT for founder/counsel review before public launch (marked below).
const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "What we collect",
    body: [
      "Your account basics (email, display name), the content you create (practices completed, proof, feedback, notes, introductions), and your settings. Optional media proof (photos, audio, video) is stored only when you attach it.",
      "Basic product analytics (which screens and actions are used) may be collected to improve the beta. We do not run ads and we do not sell personal data.",
    ],
  },
  {
    h: "How your content is shared",
    body: [
      "Proof is private by default or visible to your practice community, per your settings. Your guided introduction is shown to other members only at the visibility you choose. Blocking a member hides your proof from them and stops requests both ways.",
      "Trust levels come only from your activity — practice, proof, useful feedback, contribution. They can't be bought, and AI never decides them.",
    ],
  },
  {
    h: "AI features",
    body: [
      "Optional AI helpers (practice prep, reflection, feedback coaching) send the relevant text to our AI provider to generate a suggestion. AI output is always editable and never judges your worth or changes your trust.",
    ],
  },
  {
    h: "Storage & deletion",
    body: [
      "Data is stored with our infrastructure provider (Supabase). You can request deletion of your account and content at any time by contacting us; we'll remove it from live systems promptly.",
    ],
  },
  {
    h: "Contact",
    body: ["Questions or requests: hello@thecollective.app"],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen w-full bg-[#FFF8EE] text-[#111111]">
      <div className="mx-auto w-full max-w-2xl px-5 py-12">
        <Link href="/" className="text-sm font-bold text-[#6E6E6E] hover:text-[#111111]">← Back to home</Link>
        <h1 className="mt-6 font-display text-[34px] font-bold">Privacy</h1>
        <p className="mt-2 text-sm text-[#9B958B]">Closed beta · last updated July 2026 · draft — under review before public launch.</p>
        <div className="mt-8 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-extrabold">{s.h}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-2 text-[15px] leading-7 text-[#38322A]">{p}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
