import type { AppFeedback, BetaAppSnapshot, Cohort, Contribution, Direction, Feedback, PracticePrompt, Proof, TrustEvent, UserProfile } from "./betaTypes";

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
  { id: "direction-confidence", slug: "confidence", title: "Confidence", subtitle: "Practice one clear step before it feels perfect.", description: "Build calm confidence through small proof-backed attempts.", promptIds: ["conf-s1","conf-s2","conf-b1","conf-b2","conf-c1","conf-c2"] },
  { id: "direction-communication", slug: "communication", title: "Communication", subtitle: "Say what matters with clarity and care.", description: "Practice voice notes, useful questions, and simple explanations.", promptIds: ["comm-s1","comm-s2","comm-b1","comm-b2","comm-c1","comm-c2"] },
  { id: "direction-momentum", slug: "momentum", title: "Momentum", subtitle: "Build consistency without pressure.", description: "Turn effort into a repeatable rhythm that feels safe to keep.", promptIds: ["mom-s1","mom-s2","mom-b1","mom-b2","mom-c1","mom-c2"] },
  { id: "direction-self-trust", slug: "self-trust", title: "Self-trust", subtitle: "Notice evidence that you follow through.", description: "Capture proof of honest effort and use feedback gently.", promptIds: ["self-s1","self-s2","self-b1","self-b2","self-c1","self-c2"] },
  { id: "direction-contribution", slug: "contribution", title: "Contribution", subtitle: "Help others safely when you have useful context.", description: "Give specific feedback without chasing attention or status.", promptIds: ["contrib-s1","contrib-s2","contrib-b1","contrib-b2","contrib-c1","contrib-c2"] }
];

export const seedPrompts: PracticePrompt[] = [
  // direction-confidence
  { id: "conf-s1", directionId: "direction-confidence", title: "Say one clear thing", description: "Share a single idea in plain language.", prompt: "Say or write one idea as if to a teammate — no softening.", type: "voice-note", estimatedMinutes: 5, beginnerSafe: true, level: "starter", contextTags: ["speaking_up_at_work"], proofPrompt: "Capture the one clear thing you said. What felt different about not softening it?" },
  { id: "conf-s2", directionId: "direction-confidence", title: "Name one preference", description: "State a preference without apologizing.", prompt: "Write one sentence naming what you prefer and why.", type: "reflection", estimatedMinutes: 4, beginnerSafe: true, level: "starter", contextTags: ["personal_growth"], proofPrompt: "Show the preference you named. Where did you notice the urge to apologize?" },
  { id: "conf-b1", directionId: "direction-confidence", title: "Ask for what you need", description: "Make one small, direct ask.", prompt: "Make one clear request today and note the response.", type: "proof", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["speaking_up_at_work", "relationships"], proofPrompt: "What did you ask for, and how did it land? Keep it factual, not self-judging." },
  { id: "conf-b2", directionId: "direction-confidence", title: "Hold a pause", description: "Let a silence sit before answering.", prompt: "In one conversation, pause two seconds before responding.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "building", contextTags: ["upcoming_situation"], proofPrompt: "Describe the moment you paused. What changed when you didn't rush?" },
  { id: "conf-c1", directionId: "direction-confidence", title: "Disagree kindly", description: "Voice a different view, calmly.", prompt: "Share one respectful disagreement and your reason.", type: "proof", estimatedMinutes: 7, beginnerSafe: true, level: "comfortable", contextTags: ["speaking_up_at_work"], proofPrompt: "What did you disagree with, and how did you keep it kind and clear?" },
  { id: "conf-c2", directionId: "direction-confidence", title: "Own a decision out loud", description: "State a choice you're making and why.", prompt: "Tell someone a decision you've made, with one reason.", type: "conversation", estimatedMinutes: 6, beginnerSafe: true, level: "comfortable", contextTags: ["upcoming_situation", "clearer_thinking"], proofPrompt: "Show the decision you owned. What made it easier (or harder) to say plainly?" },

  // direction-communication
  { id: "comm-s1", directionId: "direction-communication", title: "Ask one useful question", description: "Trade proving for curiosity.", prompt: "Ask one question that helps a teammate move forward.", type: "conversation", estimatedMinutes: 5, beginnerSafe: true, level: "starter", contextTags: ["speaking_up_at_work"], proofPrompt: "Share the question you asked. What did it open up?" },
  { id: "comm-s2", directionId: "direction-communication", title: "Rewrite a rambly message", description: "Cut to two clear lines.", prompt: "Take a draft and trim it to two clear sentences.", type: "reflection", estimatedMinutes: 4, beginnerSafe: true, level: "starter", contextTags: ["clearer_thinking"], proofPrompt: "Show before/after. What did you cut, and what got clearer?" },
  { id: "comm-b1", directionId: "direction-communication", title: "Explain it in three sentences", description: "Point, example, next step.", prompt: "Explain one idea in exactly three sentences.", type: "proof", estimatedMinutes: 7, beginnerSafe: true, level: "building", contextTags: ["clearer_thinking", "personal_growth"], proofPrompt: "Share your three sentences. Did the structure make it land?" },
  { id: "comm-b2", directionId: "direction-communication", title: "Reflect back what you heard", description: "Confirm before responding.", prompt: "In one chat, summarize the other person before replying.", type: "conversation", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["relationships"], proofPrompt: "What did you reflect back, and how did the conversation shift?" },
  { id: "comm-c1", directionId: "direction-communication", title: "Give a hard update simply", description: "Bad news, no padding, with a next step.", prompt: "Deliver one difficult update plainly + one next step.", type: "proof", estimatedMinutes: 8, beginnerSafe: true, level: "comfortable", contextTags: ["speaking_up_at_work", "upcoming_situation"], proofPrompt: "Show how you said the hard thing clearly and kindly. What was the next step you offered?" },
  { id: "comm-c2", directionId: "direction-communication", title: "Lead with the outcome", description: "Headline first, detail after.", prompt: "Send one message that states the outcome in line one.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "comfortable", contextTags: ["clearer_thinking"], proofPrompt: "Share the opening line. Did leading with the outcome help the reader?" },

  // direction-momentum
  { id: "mom-s1", directionId: "direction-momentum", title: "One five-minute step", description: "Make progress small enough to begin.", prompt: "Do one useful five-minute action and capture proof.", type: "proof", estimatedMinutes: 5, beginnerSafe: true, level: "starter", contextTags: ["rebuilding_habit"], proofPrompt: "Show the small thing you finished. What made starting easier?" },
  { id: "mom-s2", directionId: "direction-momentum", title: "Close one open loop", description: "Finish one lingering item.", prompt: "Complete one thing that's been sitting too long.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true, level: "starter", contextTags: ["personal_growth"], proofPrompt: "What loop did you close? How did finishing it feel?" },
  { id: "mom-b1", directionId: "direction-momentum", title: "Restart small after a miss", description: "The smallest version counts.", prompt: "After a gap, do the tiniest version of your habit.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "building", contextTags: ["rebuilding_habit"], proofPrompt: "Show your restart. What was the smallest version that still counted?" },
  { id: "mom-b2", directionId: "direction-momentum", title: "Protect one focused block", description: "Guard 15 minutes from distraction.", prompt: "Take 15 distraction-free minutes on one task.", type: "proof", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["clearer_thinking"], proofPrompt: "What did you protect the time for, and what got done?" },
  { id: "mom-c1", directionId: "direction-momentum", title: "Ship something unfinished", description: "Progress over polish.", prompt: "Share one thing before it feels perfect.", type: "proof", estimatedMinutes: 7, beginnerSafe: true, level: "comfortable", contextTags: ["upcoming_situation"], proofPrompt: "Show what you shipped early. What did 'good enough' unlock?" },
  { id: "mom-c2", directionId: "direction-momentum", title: "Set one honest deadline", description: "A date you'll actually keep.", prompt: "Commit to one realistic deadline and tell someone.", type: "conversation", estimatedMinutes: 5, beginnerSafe: true, level: "comfortable", contextTags: ["personal_growth"], proofPrompt: "What did you commit to, by when, and to whom?" },

  // direction-self-trust
  { id: "self-s1", directionId: "direction-self-trust", title: "Honest reflection", description: "Notice effort without judgment.", prompt: "Write what you tried, what changed, what's next.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true, level: "starter", contextTags: ["personal_growth"], proofPrompt: "Share your reflection. Where did you catch judgment creeping in?" },
  { id: "self-s2", directionId: "direction-self-trust", title: "Log a follow-through", description: "Proof you did what you said.", prompt: "Note one thing you said you'd do — and did.", type: "reflection", estimatedMinutes: 4, beginnerSafe: true, level: "starter", contextTags: ["rebuilding_habit"], proofPrompt: "Show the follow-through. What does it tell you about yourself?" },
  { id: "self-b1", directionId: "direction-self-trust", title: "Practice a calm boundary", description: "A clear not-yet, no apology.", prompt: "Draft one calm boundary sentence.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "building", contextTags: ["relationships"], proofPrompt: "Share the boundary you drafted. What made it feel clear and kind?" },
  { id: "self-b2", directionId: "direction-self-trust", title: "Separate fact from story", description: "What happened vs. what you assumed.", prompt: "Write the fact, then the story you added.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["clearer_thinking"], proofPrompt: "Show the fact vs. the story. What changed once you split them?" },
  { id: "self-c1", directionId: "direction-self-trust", title: "Keep a hard promise to yourself", description: "Small, but you kept it.", prompt: "Make and keep one small promise to yourself today.", type: "proof", estimatedMinutes: 6, beginnerSafe: true, level: "comfortable", contextTags: ["personal_growth", "rebuilding_habit"], proofPrompt: "What did you promise and keep? How did keeping it land?" },
  { id: "self-c2", directionId: "direction-self-trust", title: "Decide without over-checking", description: "Trust one call.", prompt: "Make one small decision without seeking reassurance.", type: "reflection", estimatedMinutes: 5, beginnerSafe: true, level: "comfortable", contextTags: ["clearer_thinking", "upcoming_situation"], proofPrompt: "Show the call you made solo. What did trusting yourself feel like?" },

  // direction-contribution
  { id: "contrib-s1", directionId: "direction-contribution", title: "Give specific feedback", description: "Respond to the work, not the person.", prompt: "Write one thing that worked + one useful next step.", type: "reflection", estimatedMinutes: 7, beginnerSafe: true, level: "starter", contextTags: ["relationships"], proofPrompt: "Share the feedback you gave. Was it specific and kind?" },
  { id: "contrib-s2", directionId: "direction-contribution", title: "Spot the next step", description: "Help someone choose one safe action.", prompt: "Read a proof and suggest one small next step.", type: "conversation", estimatedMinutes: 7, beginnerSafe: true, level: "starter", contextTags: ["clearer_thinking"], proofPrompt: "What next step did you suggest, and why that one?" },
  { id: "contrib-b1", directionId: "direction-contribution", title: "Offer context, not control", description: "Share what helps; let them decide.", prompt: "Give one piece of useful context without taking over.", type: "reflection", estimatedMinutes: 6, beginnerSafe: true, level: "building", contextTags: ["relationships", "speaking_up_at_work"], proofPrompt: "Show the context you offered. How did you leave the choice with them?" },
  { id: "contrib-b2", directionId: "direction-contribution", title: "Ask before advising", description: "Find out what help they want.", prompt: "Ask 'what would help?' before offering a fix.", type: "conversation", estimatedMinutes: 5, beginnerSafe: true, level: "building", contextTags: ["relationships"], proofPrompt: "What did asking first change about the help you gave?" },
  { id: "contrib-c1", directionId: "direction-contribution", title: "Share what you learned", description: "Turn one lesson into help.", prompt: "Write one thing you learned that could help someone.", type: "proof", estimatedMinutes: 8, beginnerSafe: true, level: "comfortable", contextTags: ["personal_growth"], proofPrompt: "Share the lesson. Who might it help, and how?" },
  { id: "contrib-c2", directionId: "direction-contribution", title: "Encourage one person", description: "Specific, earned encouragement.", prompt: "Tell one person a specific thing they did well.", type: "conversation", estimatedMinutes: 5, beginnerSafe: true, level: "comfortable", contextTags: ["relationships"], proofPrompt: "What did you notice and name for them? Keep it specific, not flattery." },
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

/** Deterministic /demo/proof image path for a proof's media type. */
function thumbForMedia(mediaType: Proof["mediaType"], idx: number, rng: () => number): string {
  const kind = mediaType === "text" ? pick(rng, TEXT_THUMB_KINDS) : mediaType; // image|audio|video map 1:1
  return `/demo/proof/${kind}-${idx % ASSET_POOL}.jpg`;
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
    avatarUrl: `/demo/avatars/${displayName.toLowerCase()}.jpg`,
    createdAt: iso(60 * 24 * (NAMES.length - i)),
    ...(i === 0 ? { currentDirectionId: "direction-confidence", startingLevel: "building" as const, contextTags: ["speaking_up_at_work" as const], goalText: "Speak up in meetings without overthinking", cadence: "a few minutes a day" } : {}),
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
        createdAt: iso(createdMin),
        isDemo: true
      };

      trustEvents.push({ id: `te-${teIdx++}`, userId: user.id, type: "proof", points: 0, label: "Demo proof example", sourceId: proofId, createdAt: proof.createdAt });

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
        trustEvents.push({ id: `te-${teIdx++}`, userId: author.id, type: "peer-feedback", points: 0, label: "Demo feedback example", sourceId: fbId, createdAt: iso(Math.max(4, createdMin - 21 - f * 7)) });
        if (helpful) trustEvents.push({ id: `te-${teIdx++}`, userId: author.id, type: "helpful", points: 0, label: "Demo helpful feedback example", sourceId: fbId, createdAt: iso(Math.max(3, createdMin - 25 - f * 7)) });
      }

      trustEvents.push({ id: `te-${teIdx++}`, userId: user.id, type: "practice", points: 0, label: "Demo practice example", sourceId: promptId, createdAt: iso(createdMin + 15) });
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
    route: pick(rng, ["/home", "/practice", "/feed", "/proof/new/conf-s1", "/install"]),
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
  cohortId: "founding-circle", directionIds: ["direction-confidence", "direction-communication"], createdAt: now,
  currentDirectionId: "direction-confidence", startingLevel: "building" as const, contextTags: ["speaking_up_at_work" as const], goalText: "Speak up in meetings without overthinking", cadence: "a few minutes a day"
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

// Phase B (Contribute): open a few non-Alex demo proofs so the Contribute queue
// is populated in the no-account demo path, and seed a couple of pending
// contributions so the owner view (ReceivedContributions) isn't empty.
const seedOpenProofs = community ? community.proofs.filter((p) => p.userId !== "user-alex").slice(0, 5) : [];
seedOpenProofs.forEach((p) => {
  p.openForContributions = true;
  p.contributionFocus = "Help me make the first line clearer";
});
export const seedContributions: Contribution[] = seedOpenProofs.slice(0, 3).map((p, i) => {
  // Vary the contributor per proof so the seed doesn't look like one author wrote all.
  const pool = (community?.users ?? []).map((u) => u.id).filter((id) => id !== "user-alex" && id !== p.userId);
  const contributorId = pool.length ? pool[i % pool.length] : "user-jordan";
  return {
    id: `contribution-seed-${i}`,
    proofId: p.id,
    contributorId,
    ownerId: p.userId,
    observation: "Your opening states the point before the detail — that lands well.",
    nextStep: "Try trimming the second sentence so the first idea stands alone.",
    status: "pending",
    createdAt: iso(140 + i * 25),
    acceptedAt: null
  };
});

export const seedSnapshot: BetaAppSnapshot = {
  currentUserId: null,
  users: seedUsers,
  cohorts: seedCohorts,
  directions: seedDirections,
  skills: [],
  prompts: seedPrompts,
  proofs: seedProofs,
  feedback: seedFeedback,
  trustEvents: seedTrustEvents,
  appFeedback: seedAppFeedback,
  aiInteractions: [],
  aiUserFeedback: [],
  completedPracticeIds: DEMO_SEED_ENABLED ? ["conf-s1", "comm-s1", "mom-s1", "self-s1"] : [],
  usefulMarks: [],
  usefulCountByProof: {},
  savedItems: [],
  connections: [],
  conversations: [],
  messagesByConversation: {},
  notifications: [],
  contributions: seedContributions,
  practiceTips: [],
  usefulCountByTip: {},
  myCohorts: []
};

/** Demo seed status, for badges / debug. */
export const demoSeedEnabled = DEMO_SEED_ENABLED;
