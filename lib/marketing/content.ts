// Single source of marketing copy + feature flags. Real-only social proof:
// flags stay false until genuine content exists (no fabricated stats/quotes).
export const DEMO_VIDEO_URL: string | null = null; // set to a URL to reveal "Watch the 90-sec demo"
export const SHOW_METRICS = false;                 // flip on only with real beta numbers
export const SHOW_TESTIMONIALS = false;            // flip on only with real quotes

// Where the primary/secondary CTAs go. Primary = the no-account demo practice.
export const ROUTES = {
  demo: "/demo",
  beta: "/auth",
} as const;

export const MARKETING = {
  hero: {
    eyebrow: "Small steps. Real progress.",
    headline: "Practice confidence in real life.",
    sub: "Collective gives you small communication reps, a place to show proof, and useful feedback from people who want you to improve.",
    support: "No likes. No followers. No fake status. Just practice, proof, feedback, and trust.",
    primaryCta: "Try a 3-minute practice",
    secondaryCta: "Join the closed beta",
  },
  pain: {
    title: "You do not need more advice. You need reps.",
    body: "Most self-improvement apps give you more content to watch, save, or scroll through. Collective gives you something to do: choose one small practice, try it in real life, submit proof, get feedback, and build trust over time.",
  },
  loopSteps: [
    { n: 1, title: "Discover", body: "Choose a direction that matters to you." },
    { n: 2, title: "Practice", body: "Take one small real-world action." },
    { n: 3, title: "Prove", body: "Show what you tried with video, audio, writing, notes, or reflection." },
    { n: 4, title: "Get Feedback", body: "Receive useful notes focused on improvement." },
    { n: 5, title: "Build Trust", body: "Earn trust through real proof and helpful contribution." },
    { n: 6, title: "Contribute", body: "Help others once you have a history of practice and useful feedback." },
  ],
  tryFirst: {
    sectionTitle: "Try this first",
    sectionSub: "One small communication rep. No pressure. No perfect performance required.",
    card: {
      title: "Introduce yourself in 60 seconds",
      prompt: "Say your name, what you are working on, and one thing you want to get better at.",
      proofOptions: ["Short video", "Audio clip", "Written version", "Reflection"],
      feedbackPreview: ["What was clear", "What felt strong", "One useful next step"],
      cta: "Start this practice",
      secondaryText: "You can try the demo before creating an account.",
    },
  },
  // "See it in action" — four sequential product states (not a feature grid).
  showcaseTitle: "See it in action",
  showcaseSteps: [
    { n: 1, title: "Practice selected", body: "Choose a small communication rep, like introducing yourself in 60 seconds." },
    { n: 2, title: "Proof submitted", body: "Upload a video, audio clip, written response, or short reflection showing what you tried." },
    { n: 3, title: "Feedback received", body: "Get specific notes focused on what was clear, what improved, and what to try next." },
    { n: 4, title: "Trust updated", body: "Your profile grows through completed practice, real proof, useful feedback, and contribution." },
  ],
  launchWedge: {
    title: "Start with communication and confidence",
    body: "Collective begins with practical reps that help people speak more clearly, ask better questions, and show up with more confidence.",
    examples: [
      "Introduce yourself",
      "Prepare for an interview",
      "Ask a better question",
      "Handle a difficult conversation",
      "Explain an idea clearly",
      "Give useful feedback",
      "Speak up in a meeting",
      "Reflect after a real conversation",
    ],
  },
  feedbackExplainer: {
    title: "Feedback is not a score.",
    body: "Good feedback on Collective is kind, specific, useful, based on the proof submitted, and focused on the next small step.",
    bullets: [
      "What was clear?",
      "What felt stronger than before?",
      "What could improve next?",
      "What is one small thing to try again?",
    ],
    footer: "Feedback helps you improve. It does not define you.",
  },
  trust: {
    title: "Trust is earned through contribution.",
    body: "Trust grows when people complete practices, submit real proof, give useful feedback, and help others improve.",
    rules: [
      "Trust cannot be bought.",
      "AI cannot grant trust.",
      "Popularity does not decide trust.",
      "Likes and follower counts do not determine trust.",
      "Helpful contribution matters more than attention.",
    ],
    // Display labels for the landing page. The app keeps its internal tier
    // values (…Reliable…); this shows the friendlier "Consistent".
    tiers: ["New", "Practicing", "Consistent", "Helpful", "Contributor"],
  },
  ai: {
    title: "AI can support practice. It cannot decide your worth.",
    can: [
      "Prepare before a practice",
      "Turn nervous thoughts into a simple plan",
      "Reflect after submitting proof",
      "Rewrite feedback to be kinder and more useful",
      "Summarize feedback into one next step",
    ],
    cannot: [
      "Decide your trust level",
      "Grade your confidence",
      "Judge your worth",
      "Replace human feedback",
      "Post proof for you",
    ],
  },
  notFeed: {
    title: "Not an endless feed.",
    body: "Collective prioritizes your active practice, proof from people working on similar skills, feedback requests you can actually help with, and your next useful rep.",
    avoid: ["Trending posts", "Most liked posts", "Follower-based ranking", "Public leaderboards"],
  },
  mission: "Social media rewards attention. Collective rewards progress.",
  founder: {
    eyebrow: "Why Collective exists",
    paragraphs: [
      "Most self-improvement apps give people more content to watch, save, or scroll through. Collective is built around a different idea: confidence grows through small reps, honest proof, and useful feedback.",
      "We are starting with communication and confidence because those skills change how people show up in interviews, conversations, teams, classrooms, and everyday life.",
      "This is an early beta. The goal is simple: help people practice one useful step, show what they tried, learn from feedback, and build trust over time.",
    ],
    cta: "Start with one practice",
  },
  vision: {
    title: "More directions over time.",
    body: "Communication and confidence come first. As the beta grows, Collective will add more directions to practice — one honest step at a time.",
    directions: ["Communication", "Confidence", "Interview prep", "Everyday conversations"],
  },
  finalCta: {
    title: "Take one small step today.",
    body: "Start with a simple communication practice. Submit proof when you are ready. Build trust through real progress.",
    primaryCta: "Try a 3-minute practice",
    secondaryCta: "Join the closed beta",
  },
  footer: {
    columns: [
      { heading: "Product", links: [{ label: "How it works", href: "#how" }, { label: "Trust", href: "#trust" }] },
      { heading: "Company", links: [{ label: "Why Collective", href: "#founder" }, { label: "Contact", href: "mailto:hello@thecollective.app" }] },
      { heading: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
    ],
    socials: [{ label: "X", href: "#" }, { label: "LinkedIn", href: "#" }],
  },
} as const;
