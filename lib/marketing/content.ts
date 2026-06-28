// Single source of marketing copy + feature flags. Real-only social proof:
// flags stay false until genuine content exists (no fabricated stats/quotes).
export const DEMO_VIDEO_URL: string | null = null; // set to a URL to reveal "Watch the 90-sec demo"
export const SHOW_METRICS = false;                 // flip on only with real beta numbers
export const SHOW_TESTIMONIALS = false;            // flip on only with real quotes

export const MARKETING = {
  hero: {
    headline: "Stop watching. Start practicing.",
    sub: "Collective turns self-improvement into reps: pick a direction, do one small practice, post proof, and get useful feedback. Real progress — no likes, no followers.",
    primaryCta: "Join the closed beta",
    secondaryCta: "Watch the 90-sec demo",
  },
  mission: "Social media rewards attention. Collective rewards progress.",
  loop: [
    { key: "discover", title: "Discover", body: "Choose a direction worth practicing." },
    { key: "practice", title: "Practice", body: "One small, low-pressure rep." },
    { key: "proof", title: "Proof", body: "Show what you actually did." },
    { key: "feedback", title: "Feedback", body: "Get useful, kind notes." },
    { key: "trust", title: "Trust", body: "Earn it by showing up." },
    { key: "contribute", title: "Contribute", body: "Help someone's next step." },
  ],
  showcase: [
    { title: "Practice", body: "A tailored next step for your direction — short and doable." },
    { title: "Upload proof", body: "Text, photo, video, or audio. Evidence of the rep, not content for clout." },
    { title: "Receive feedback", body: "Structured, encouraging notes from people a step ahead." },
    { title: "Trust profile", body: "Watch trust grow from practice, proof, useful feedback, and contribution." },
  ],
  practiceExamples: ["Interview practice", "Introductions", "Presentations", "Negotiation", "Leadership reps", "Difficult conversations"],
  trust: {
    title: "Trust is earned, never bought.",
    body: "Every rep, every useful note, every contribution adds up. Move from New to Contributor by showing up — there's no shortcut and nothing to buy.",
    tiers: ["New", "Practicing", "Reliable", "Helpful", "Contributor"],
  },
  ai: {
    title: "AI that helps you practice — never grades you.",
    body: "Optional AI assists with prep, reflection, feedback coaching, and summaries. It never decides your trust, judges your worth, or posts for you.",
    points: ["Practice prep", "Reflection help", "Feedback coaching", "Plain-language summaries"],
  },
  vision: {
    title: "Built to grow with you.",
    directions: ["Communication", "Leadership", "Career", "Business", "Relationships", "Fitness"],
  },
  // Owner-supplied. Until provided this placeholder renders with a visible marker.
  founder: {
    placeholder: true,
    body: "Collective exists because real growth comes from doing the reps, not collecting likes. [Founder story placeholder — replace in lib/marketing/content.ts]",
  },
  beta: {
    title: "Help build the future of practice.",
    body: "We're in closed beta with a small group shaping the product. Join us.",
    cta: "Join the closed beta",
  },
  footer: {
    columns: [
      { heading: "Product", links: [{ label: "How it works", href: "#how" }, { label: "Roadmap", href: "#" }] },
      { heading: "Company", links: [{ label: "Mission", href: "#mission" }, { label: "Founder", href: "#founder" }, { label: "Contact", href: "mailto:hello@thecollective.app" }] },
      { heading: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
    ],
    socials: [{ label: "X", href: "#" }, { label: "LinkedIn", href: "#" }],
  },
} as const;
