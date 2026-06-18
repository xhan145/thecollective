import type { AppFeedback, BetaAppSnapshot, Cohort, Direction, Feedback, PracticePrompt, Proof, TrustEvent, UserProfile } from "./betaTypes";

// ---------------------------------------------------------------------------
// DEMO DATA SWITCH
// ---------------------------------------------------------------------------
// The big "active community" dataset below only fills DEMO mode (no backend).
// To go live with empty real data, set NEXT_PUBLIC_DEMO_SEED=false (and/or
// connect Supabase, which loads real data and ignores this seed's user data).
const DEMO_SEED_ENABLED = process.env.NEXT_PUBLIC_DEMO_SEED !== "false";

const now = "2026-06-09T13:00:00.000Z";
const BASE_MS = Date.parse(now);
const iso = (minutesAgo: number) => new Date(BASE_MS - minutesAgo * 60_000).toISOString();

// Deterministic PRNG so server and client render identical seed data (no hydration mismatch).
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const pick = <T,>(rng: () => number, arr: T[]) => arr[Math.floor(rng() * arr.length) % arr.length];

// ---------------------------------------------------------------------------
// Static content (kept in both demo and live modes)
// ---------------------------------------------------------------------------

export const seedDirections: Direction[] = [
  { id: "direction-confidence", slug: "confidence", title: "Confidence", subtitle: "Practice one clear step before it feels perfect.", description: "Build calm confidence through small proof-backed attempts.", promptIds: ["say-clear-thing", "name-one-preference"] },
  { id: "direction-communication", slug: "communication", title: "Communication", subtitle: "Say what matters with clarity and care.", description: "Practice voice notes, useful questions, and simple explanations.", promptIds: ["ask-useful-question", "explain-idea-simply"] },
  { id: "direction-momentum", slug: "momentum", title: "Momentum", subtitle: "Build consistency without pressure.", description: "Turn effort into a repeatable rhythm that feels safe to keep.", promptIds: ["five-minute-step", "close-one-loop"] },
  { id: "direction-self-trust", slug: "self-trust", title: "Self-trust", subtitle: "Notice evidence that you follow through.", description: "Capture proof of honest effort and use feedback gently.", promptIds: ["honest-reflection", "practice-boundary"] },
  { id: "direction-contribution", slug: "contribution", title: "Contribution", subtitle: "Help others safely when you have useful context.", description: "Give specific feedback without chasing attention or status.", promptIds: ["give-specific-feedback", "spot-next-step"] }
];

export const seedPrompts: PracticePrompt[] = [
  { id: "say-clear-thing", directionId: "direction-confidence", title: "Say one clear thing", description: "Record or write one idea in plain language.", prompt: "Say one idea out loud as if you were sharing it with a teammate.", type: "voice-note", estimatedMinutes: 5, beginnerSafe: true },
  { id: "name-one-preference", directionId: "direction-confidence", title: "Name one preference", description: "Practice stating a preference without apologizing for it.", prompt: "Write one sentence that names what you prefer and why.", type: "reflection", estimatedMinutes: 4, beginnerSafe: true },
  { id: "ask-useful-question", directionId: "direction-communication", title: "Ask one useful question", description: "Turn pressure to perform into curiosity.", prompt: "Ask one question that would help a teammate move forward.", type: "conversation", estimatedMinutes: 5, beginnerSafe: true },
  { id: "explain-idea-simply", directionId: "direction-communication", title: "Explain your idea simply", description: "Use one example and one next step.", prompt: "Explain a current idea in three short sentences.", type: "proof", estimatedMinutes: 7, beginnerSafe: true },
  { id: "five-minute-step", directionId: "direction-momentum", title: "Five-minute useful step", description: "Make progress small enough to begin.", prompt: "Pick one useful five-minute action and capture proof when it is done.", type: "proof", estimatedMinutes: 5, beginnerSafe: true },
  { id: "close-one-loop", directionId: "direction-momentum", title: "Close one loop", description: "Finish one small open item today.", prompt: "Choose one unfinished thing and make it visibly more complete.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true },
  { id: "honest-reflection", directionId: "direction-self-trust", title: "Honest reflection", description: "Notice effort without turning it into judgment.", prompt: "Write what you tried, what changed, and what you will try next.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true },
  { id: "practice-boundary", directionId: "direction-self-trust", title: "Practice a boundary", description: "Prepare a respectful no or not-yet.", prompt: "Draft one boundary sentence that is clear and calm.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true },
  { id: "give-specific-feedback", directionId: "direction-contribution", title: "Give specific feedback", description: "Respond to the practice, not the person.", prompt: "Write one thing that worked and one useful next step.", type: "reflection", estimatedMinutes: 7, beginnerSafe: true },
  { id: "spot-next-step", directionId: "direction-contribution", title: "Spot the next step", description: "Help someone choose one safe next action.", prompt: "Read a proof and suggest one small next step inside their request.", type: "conversation", estimatedMinutes: 7, beginnerSafe: true }
];

// ---------------------------------------------------------------------------
// Demo community generator
// ---------------------------------------------------------------------------

const NAMES: [string, string][] = [
  ["Alex", "A"], ["Jordan", "J"], ["Taylor", "T"], ["Morgan", "M"], ["Casey", "C"],
  ["Riley", "R"], ["Sam", "S"], ["Jamie", "J"], ["Drew", "D"], ["Quinn", "Q"],
  ["Avery", "A"], ["Parker", "P"], ["Reese", "R"], ["Skyler", "S"], ["Devon", "D"],
  ["Harper", "H"], ["Rowan", "R"], ["Emerson", "E"], ["Finley", "F"], ["Sage", "S"],
  ["Kai", "K"], ["Noor", "N"], ["Luca", "L"], ["Mateo", "M"], ["Priya", "P"],
  ["Aisha", "A"], ["Diego", "D"], ["Lena", "L"], ["Omar", "O"], ["Gregory", "G"]
];

const DIRECTION_IDS = seedDirections.map((d) => d.id);
const PROMPTS_BY_DIRECTION: Record<string, string[]> = seedDirections.reduce((acc, d) => {
  acc[d.id] = d.promptIds;
  return acc;
}, {} as Record<string, string[]>);

const PROOF_LINES: Record<string, { title: string; body: string }[]> = {
  "direction-confidence": [
    { title: "Said one clear thing in standup.", body: "I shared a single idea without softening it first. It felt awkward but clean." },
    { title: "Named a preference out loud.", body: "I said which option I actually preferred instead of 'whatever works'." },
    { title: "Recorded a 60-second intro.", body: "First take was shaky, second take was calmer. Kept the second one." }
  ],
  "direction-communication": [
    { title: "Asked one useful question in planning.", body: "Instead of proving I understood, I asked what would unblock the team." },
    { title: "Explained my idea in three sentences.", body: "Point, example, next step. People nodded instead of looking confused." },
    { title: "Rewrote a rambly message.", body: "Cut it from a paragraph to two clear lines before sending." }
  ],
  "direction-momentum": [
    { title: "Did one five-minute step.", body: "Opened the doc I was avoiding and wrote the first heading. That was enough." },
    { title: "Closed one open loop.", body: "Replied to the email that had been sitting for a week." },
    { title: "Kept a tiny streak honest.", body: "Three small steps, three days. No pressure, just showing up." }
  ],
  "direction-self-trust": [
    { title: "Wrote an honest reflection.", body: "What I tried, what changed, what I'll try next. No judgment, just notes." },
    { title: "Practiced a calm boundary.", body: "Drafted a clear 'not yet' instead of an apology." },
    { title: "Noticed I followed through.", body: "Logged proof that I did the thing I said I would." }
  ],
  "direction-contribution": [
    { title: "Gave specific feedback to a teammate.", body: "One thing that worked, one useful next step. Responded to the work, not the person." },
    { title: "Spotted a small next step for someone.", body: "Suggested one safe action inside what they actually asked for." },
    { title: "Helped without taking over.", body: "Offered context, then let them decide." }
  ]
};

const FEEDBACK_BY_TONE: Record<string, string[]> = {
  kind: ["This took courage — nice work showing up.", "Your example made it click for me.", "Calm and clear. Easy to follow.", "I can tell you practiced this."],
  specific: ["The second sentence was the clearest part.", "Naming the preference up front made it land.", "The structure (point, example, step) really worked.", "Cutting the intro made it stronger."],
  "next-step": ["Try slowing down the first line next time.", "One concrete number would make it even clearer.", "Maybe end with the single thing you want remembered.", "Next time, ask the question before explaining."]
};

const TONES: Feedback["tone"][] = ["kind", "specific", "next-step"];
const MEDIA: Proof["mediaType"][] = ["text", "audio", "video", "image", "text", "text"];

// Brand-safe, dark-mode-safe SVG demo assets live in /public/demo (see
// scripts/generate-demo-assets.ts). Wiring them into the local seed makes the
// no-account demo path show real thumbnails + avatars, not text-only cards.
const DEMO_BIOS = [
  "Practicing clearer explanations and calmer conversations.",
  "Building small actions into visible progress.",
  "Working on better questions and better notes.",
  "Practicing speaking up without overthinking.",
  "Small steps, steady proof.",
  "Learning to give feedback that is specific and useful."
];
const TEXT_THUMB_KINDS = ["text", "note", "question"];
const ASSET_POOL = 8;

/** Deterministic /demo/proof SVG path for a proof's media type. */
function thumbForMedia(mediaType: Proof["mediaType"], idx: number, rng: () => number): string {
  const kind = mediaType === "text" ? pick(rng, TEXT_THUMB_KINDS) : mediaType; // image|audio|video map 1:1
  return `/demo/proof/${kind}-${idx % ASSET_POOL}.svg`;
}

function buildDemoUsers(): UserProfile[] {
  return NAMES.map(([displayName, initials], i) => ({
    id: `user-${displayName.toLowerCase()}`,
    displayName,
    initials,
    role: i === 0 ? "founder" : displayName === "Gregory" ? "admin" : "member",
    cohortId: "founding-circle",
    directionIds: [DIRECTION_IDS[i % DIRECTION_IDS.length]],
    bio: DEMO_BIOS[i % DEMO_BIOS.length],
    avatarUrl: `/demo/avatars/${displayName.toLowerCase()}.svg`,
    createdAt: iso(60 * 24 * (NAMES.length - i))
  }));
}

interface GeneratedCommunity {
  users: UserProfile[];
  proofs: Proof[];
  feedback: Feedback[];
  trustEvents: TrustEvent[];
  appFeedback: AppFeedback[];
}

function generateCommunity(): GeneratedCommunity {
  const rng = makeRng(20260609);
  const users = buildDemoUsers();
  const proofs: Proof[] = [];
  const feedback: Feedback[] = [];
  const trustEvents: TrustEvent[] = [];

  let proofIdx = 0;
  let fbIdx = 0;
  let teIdx = 0;

  users.forEach((user, ui) => {
    const directionId = user.directionIds[0];
    const count = 1 + Math.floor(rng() * 3); // 1..3 proofs each
    for (let p = 0; p < count; p++) {
      const promptId = pick(rng, PROMPTS_BY_DIRECTION[directionId]);
      const line = pick(rng, PROOF_LINES[directionId]);
      const proofId = `proof-${proofIdx++}`;
      const createdMin = 30 + proofIdx * 137 + Math.floor(rng() * 90);
      const mediaType = pick(rng, MEDIA);
      const proof: Proof = {
        id: proofId,
        userId: user.id,
        promptId,
        directionId,
        title: line.title,
        body: line.body,
        mediaType,
        thumbnailUrl: thumbForMedia(mediaType, proofIdx, rng),
        attachments: [],
        status: "submitted",
        visibility: "cohort",
        feedbackIds: [],
        createdAt: iso(createdMin)
      };

      trustEvents.push({ id: `te-${teIdx++}`, userId: user.id, type: "proof", points: 5, label: "Submitted proof from practice", sourceId: proofId, createdAt: proof.createdAt });

      const fbCount = Math.floor(rng() * 4); // 0..3 feedback notes
      for (let f = 0; f < fbCount; f++) {
        const author = users[(ui + 1 + Math.floor(rng() * (users.length - 1))) % users.length];
        if (author.id === user.id) continue;
        const tone = TONES[(f + proofIdx) % TONES.length];
        const helpful = rng() > 0.5;
        const fbId = `fb-${fbIdx++}`;
        feedback.push({
          id: fbId,
          proofId,
          authorId: author.id,
          recipientId: user.id,
          body: pick(rng, FEEDBACK_BY_TONE[tone]),
          tone,
          helpful,
          createdAt: iso(Math.max(5, createdMin - 20 - f * 7))
        });
        proof.feedbackIds.push(fbId);
        proof.status = "feedback-ready";
        trustEvents.push({ id: `te-${teIdx++}`, userId: author.id, type: "peer-feedback", points: 3, label: "Gave one useful feedback note", sourceId: fbId, createdAt: iso(Math.max(4, createdMin - 21 - f * 7)) });
        if (helpful) trustEvents.push({ id: `te-${teIdx++}`, userId: author.id, type: "helpful", points: 7, label: "Feedback marked helpful", sourceId: fbId, createdAt: iso(Math.max(3, createdMin - 25 - f * 7)) });
      }

      trustEvents.push({ id: `te-${teIdx++}`, userId: user.id, type: "practice", points: 5, label: "Completed a practice", sourceId: promptId, createdAt: iso(createdMin + 15) });
      proofs.push(proof);
    }
  });

  proofs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const appCats: AppFeedback["category"][] = ["bug", "confusing", "idea", "safety", "other"];
  const appBodies = [
    "Loved how calm the home screen feels.",
    "Wanted proof privacy explained before choosing a file.",
    "The sliding nav looks great on my phone.",
    "Could the trust snapshot show a small streak?",
    "Install guide should mention Safari's Share button.",
    "Feedback form felt safe and structured.",
    "Animations make it feel like a real app now.",
    "Would love a dark mode later.",
    "Practice prompts are the right size.",
    "Maybe a way to save a proof as draft."
  ];
  const appFeedback: AppFeedback[] = appBodies.map((body, i) => ({
    id: `app-fb-${i}`,
    userId: users[(i + 2) % users.length].id,
    category: appCats[i % appCats.length],
    body,
    route: pick(rng, ["/home", "/practice", "/feed", "/proof/new/say-clear-thing", "/install"]),
    createdAt: iso(120 + i * 95),
    reviewed: i % 4 === 0
  }));

  return { users, proofs, feedback, trustEvents, appFeedback };
}

// ---------------------------------------------------------------------------
// Minimal seed (DEMO off): static content only, no fake people.
// ---------------------------------------------------------------------------

const minimalUser: UserProfile = {
  id: "user-alex", displayName: "Alex", initials: "A", role: "founder",
  cohortId: "founding-circle", directionIds: ["direction-confidence", "direction-communication"], createdAt: now
};

const community = DEMO_SEED_ENABLED ? generateCommunity() : null;

export const seedUsers: UserProfile[] = community ? community.users : [minimalUser];

export const seedCohorts: Cohort[] = [
  {
    id: "founding-circle",
    name: "Founding Circle",
    description: "A closed beta cohort practicing confidence, communication, and contribution.",
    status: "closed",
    memberIds: seedUsers.map((user) => user.id),
    createdAt: now
  }
];

export const seedProofs: Proof[] = community ? community.proofs : [];
export const seedFeedback: Feedback[] = community ? community.feedback : [];
export const seedTrustEvents: TrustEvent[] = community ? community.trustEvents : [];
export const seedAppFeedback: AppFeedback[] = community ? community.appFeedback : [];

export const seedSnapshot: BetaAppSnapshot = {
  currentUserId: null,
  users: seedUsers,
  cohorts: seedCohorts,
  directions: seedDirections,
  prompts: seedPrompts,
  proofs: seedProofs,
  feedback: seedFeedback,
  trustEvents: seedTrustEvents,
  appFeedback: seedAppFeedback,
  aiInteractions: [],
  aiUserFeedback: [],
  completedPracticeIds: DEMO_SEED_ENABLED ? ["say-clear-thing", "ask-useful-question", "five-minute-step", "honest-reflection"] : [],
  usefulMarks: [],
  usefulCountByProof: {},
  savedItems: [],
  connections: [],
  conversations: [],
  messagesByConversation: {},
  notifications: []
};

/** Demo seed status, for badges / debug. */
export const demoSeedEnabled = DEMO_SEED_ENABLED;
