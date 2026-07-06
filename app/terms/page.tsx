import Link from "next/link";

export const metadata = { title: "Terms — Collective" };

// Beta-grade terms: plain-language, honest to how the product works.
// DRAFT for founder/counsel review before public launch (marked below).
const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "The service",
    body: [
      "Collective is a practice-and-proof platform in closed beta. Features may change, break, or be removed while we build. We'll treat your content with care, but you should keep copies of anything important.",
    ],
  },
  {
    h: "Your content",
    body: [
      "You own the proof, reflections, and feedback you create. By posting to shared spaces you let other members see it per your visibility settings. Don't post content you don't have the right to share.",
    ],
  },
  {
    h: "Community rules",
    body: [
      "Collective is beginner-safe by design. Feedback must be kind, specific, and useful — it responds to the practice, not the person. No harassment, shaming, spam, or attempts to game trust. Trust is earned through contribution and can be reduced or removed for abuse.",
      "There are no likes, followers, or leaderboards here — please don't try to rebuild them.",
    ],
  },
  {
    h: "AI helpers",
    body: [
      "AI features assist with preparation and reflection. Their output is suggestion, not judgment, and may be imperfect — you're responsible for what you post.",
    ],
  },
  {
    h: "Accounts & termination",
    body: [
      "We may suspend accounts that break these rules or harm other members, and you can delete your account at any time (see Privacy). The beta is provided as-is, without warranties, to the extent allowed by law.",
    ],
  },
  {
    h: "Contact",
    body: ["Questions: hello@thecollective.app"],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full bg-[#FFF8EE] text-[#111111]">
      <div className="mx-auto w-full max-w-2xl px-5 py-12">
        <Link href="/" className="text-sm font-bold text-[#6E6E6E] hover:text-[#111111]">← Back to home</Link>
        <h1 className="mt-6 font-display text-[34px] font-bold">Terms of use</h1>
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
