// Shared demo constants + deterministic generators for the second-tier demo layer.
// Imported by generate-demo-assets.ts and seed-demo-data.ts.

export const DEMO_COHORT = "second-tier-demo-v1";

export const COLORS = {
  gold: "#F2A900",
  goldBright: "#FFB000",
  soft: "#FFF1C7",
  cream: "#FFF8EE",
  card: "#FFFDF8",
  ink: "#111111",
  muted: "#6E6E6E",
  success: "#22C55E",
  line: "#EFE7D8"
};

export const DIRECTIONS = [
  { slug: "confident-communication", title: "Confident Communication" },
  { slug: "momentum", title: "Momentum" },
  { slug: "clearer-thinking", title: "Clearer Thinking" }
] as const;

export type SizeName = "small" | "standard" | "large";

export const SIZES: Record<SizeName, {
  profiles: number; proofs: number; practiceLogs: number; feedback: number; trustPerUser: number;
  usefulPerProof: number; savedPerUser: number; learnFromPerUser: number; conversations: number;
}> = {
  small: { profiles: 24, proofs: 80, practiceLogs: 80, feedback: 60, trustPerUser: 4, usefulPerProof: 2, savedPerUser: 3, learnFromPerUser: 2, conversations: 18 },
  standard: { profiles: 60, proofs: 250, practiceLogs: 250, feedback: 180, trustPerUser: 6, usefulPerProof: 2, savedPerUser: 3, learnFromPerUser: 3, conversations: 36 },
  large: { profiles: 90, proofs: 400, practiceLogs: 500, feedback: 350, trustPerUser: 8, usefulPerProof: 3, savedPerUser: 4, learnFromPerUser: 3, conversations: 60 }
};

// Engagement content (approved vocabulary only).
export const USEFUL_REASONS = ["clear", "actionable", "encouraging", "worth_practicing", "helped_me_reflect", "other"] as const;

export const FEEDBACK_REQUEST_OPENERS = [
  "Could you give me feedback on whether this explanation is clear enough?",
  "Would you tell me if my main point lands in the first sentence?",
  "Is there one part of this I could make simpler?"
];
export const PEER_NOTE_OPENERS = [
  "Quick peer note — the way you opened with the main point really worked.",
  "This was clear and calm. The example helped me picture it.",
  "Nice rep. Your first line did the heavy lifting."
];
export const PEER_REPLIES = [
  "Yes — the main idea is clear. I'd shorten the second sentence and add one concrete example.",
  "It reads well. One small thing: name the outcome first, then the example.",
  "Clear to me. Maybe end with the single thing you want remembered."
];

// Persona labels per direction (from spec §7).
const PERSONAS: Record<string, string[]> = {
  "confident-communication": [
    "beginner communicator", "concise speaker", "question asker", "voice note learner",
    "meeting confidence builder", "calm conversation learner", "explanation practice member", "feedback receiver"
  ],
  momentum: [
    "small steps builder", "consistency learner", "restart learner", "daily action member",
    "task finisher", "habit resetter", "proof-of-progress member", "momentum builder"
  ],
  "clearer-thinking": [
    "reflective thinker", "decision clarity learner", "assumption checker", "note maker",
    "prioritization learner", "tradeoff thinker", "next-question learner", "clarity journal member"
  ]
};

const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Jamie", "Drew", "Quinn",
  "Avery", "Parker", "Reese", "Skyler", "Devon", "Harper", "Rowan", "Emerson", "Finley", "Sage",
  "Kai", "Noor", "Luca", "Mateo", "Priya", "Aisha", "Diego", "Lena", "Omar", "Yuki",
  "Maya", "Tariq", "Ines", "Sofia", "Hana", "Leo", "Mira", "Ravi", "Ada", "Theo",
  "Nadia", "Bo", "Imani", "Caleb", "Zoe", "Elias", "Nina", "Pax", "Remy", "Coral",
  "Dani", "Ezra", "Faye", "Gil", "Hugo", "Iris", "Juno", "Kira", "Lance", "Mona",
  "Nico", "Opal", "Pia", "Rune", "Suri", "Tess", "Uma", "Vera", "Wren", "Xan",
  "Yara", "Zane", "Beau", "Cleo", "Dax", "Elle", "Fern", "Gia", "Hank", "Isla",
  "Jett", "Kade", "Lux", "Milo", "Nell", "Otis", "Posy", "Rafe", "Sol", "Tova"
];

const BIOS = [
  "Practicing clearer explanations and calmer conversations.",
  "Building small actions into visible progress.",
  "Working on better questions, better notes, and better decisions.",
  "Practicing speaking up without overthinking.",
  "Small steps, steady proof.",
  "Learning to give feedback that is specific and useful.",
  "Building momentum without waiting for motivation.",
  "Practicing one honest reflection at a time.",
  "Turning vague ideas into one clear next step.",
  "Showing up for small reps, not perfect ones.",
  "Learning to explain things simply.",
  "Practicing calm, clear decisions."
];

export interface Persona {
  index: number;
  displayName: string;
  username: string;
  initials: string;
  bio: string;
  persona: string;
  directionSlug: string;
  sortOrder: number;
}

export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic persona list of `count` members spread across the 3 directions. */
export function buildPersonas(count: number): Persona[] {
  const rng = mulberry32(424242);
  const used = new Set<string>();
  const out: Persona[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const directionSlug = DIRECTIONS[i % DIRECTIONS.length].slug;
    const personaList = PERSONAS[directionSlug];
    const persona = personaList[Math.floor(rng() * personaList.length)];
    let username = first.toLowerCase();
    let n = 0;
    while (used.has(username)) {
      n += 1;
      username = `${first.toLowerCase()}${n}`;
    }
    used.add(username);
    out.push({
      index: i,
      displayName: n > 0 ? `${first} ${String.fromCharCode(65 + (n % 26))}.` : first,
      username,
      initials: first.slice(0, 2).toUpperCase(),
      bio: BIOS[Math.floor(rng() * BIOS.length)],
      persona,
      directionSlug,
      sortOrder: i
    });
  }
  return out;
}

// Proof content (spec §10). proofKind drives which thumbnail pool is used.
export type ProofKind = "text" | "image" | "audio" | "video" | "question" | "note";

export const PROOF_TEMPLATES: { kind: ProofKind; proofType: string; title: string; caption: string; directionSlug: string }[] = [
  { kind: "text", proofType: "text", directionSlug: "confident-communication", title: "60-second explanation practice", caption: "I practiced explaining why small steps are easier to repeat. I was clearer when I started with the main point first." },
  { kind: "question", proofType: "text", directionSlug: "confident-communication", title: "Better question rewrite", caption: "Original: 'Why am I stuck?' Better: 'What is one part I can make easier to start today?'" },
  { kind: "audio", proofType: "audio", directionSlug: "confident-communication", title: "Short voice note reflection", caption: "I tried explaining one idea without over-explaining. Next time I want to pause more and use fewer filler words." },
  { kind: "video", proofType: "video", directionSlug: "confident-communication", title: "Short explanation clip", caption: "Recorded a 40-second take explaining one idea. Second take was calmer than the first." },
  { kind: "note", proofType: "text", directionSlug: "confident-communication", title: "Feedback practice", caption: "I rewrote my feedback to be more specific — one clear observation and one useful next step instead of 'good job'." },
  { kind: "text", proofType: "text", directionSlug: "momentum", title: "Momentum proof", caption: "I picked one five-minute task and finished it before checking anything else. Small, but it helped me restart." },
  { kind: "image", proofType: "image", directionSlug: "momentum", title: "Before / after of one small step", caption: "Cleared one corner of my desk in five minutes. Easier to start the next thing." },
  { kind: "note", proofType: "text", directionSlug: "momentum", title: "Restart note", caption: "Missed two days. Instead of restarting big, I did the smallest version today. That counted." },
  { kind: "audio", proofType: "audio", directionSlug: "momentum", title: "Daily action check-in", caption: "Said out loud what one finished thing was today. Hearing it made the progress feel real." },
  { kind: "text", proofType: "text", directionSlug: "clearer-thinking", title: "Clarity note", caption: "I separated what I know from what I'm assuming. That made the next step feel less overwhelming." },
  { kind: "question", proofType: "text", directionSlug: "clearer-thinking", title: "Next-question practice", caption: "Instead of trying to solve it all, I wrote the one question that would unblock me next." },
  { kind: "image", proofType: "image", directionSlug: "clearer-thinking", title: "Decision map", caption: "Wrote the two options and one tradeoff each. Choosing felt calmer once it was on paper." },
  { kind: "note", proofType: "text", directionSlug: "clearer-thinking", title: "Assumption check", caption: "Listed three assumptions and checked one. One was wrong, which saved me time." }
];

export const FEEDBACK_NOTES = {
  clarity: [
    "Your main point was easy to understand because you started with the outcome.",
    "The first sentence made it clear what you practiced.",
    "I could follow your idea without re-reading it.",
    "Naming the change up front made this clear."
  ],
  useful: [
    "The example made it easier to see how someone else could practice this.",
    "Showing the before and after made the improvement concrete.",
    "The specific wording you used is something I could borrow.",
    "Breaking it into one small step made it feel doable."
  ],
  nextStep: [
    "Next time, try making the first sentence even simpler.",
    "You could add one concrete example to make it land faster.",
    "Maybe end with the single thing you want remembered.",
    "Try pausing once in the middle to let it breathe."
  ]
};

// Proof type distribution (spec §9): 45% text, 25% image, 15% audio, 15% video.
export function pickProofKind(rng: () => number): ProofKind {
  const r = rng();
  if (r < 0.30) return "text";
  if (r < 0.45) return "note";       // text-based
  if (r < 0.70) return "image";
  if (r < 0.85) return "audio";
  return "video";
}

export const ASSET_POOL_PER_KIND = 8;
export const PROOF_KINDS: ProofKind[] = ["text", "image", "audio", "video", "question", "note"];
