import type { AppFeedback, BetaAppSnapshot, Cohort, Direction, Feedback, PracticePrompt, Proof, TrustEvent, UserProfile } from "./betaTypes";

const now = "2026-06-09T13:00:00.000Z";

export const seedUsers: UserProfile[] = [
  { id: "user-alex", displayName: "Alex", initials: "A", role: "founder", cohortId: "founding-circle", directionIds: ["direction-confidence", "direction-communication"], createdAt: now },
  { id: "user-jordan", displayName: "Jordan", initials: "J", role: "member", cohortId: "founding-circle", directionIds: ["direction-momentum"], createdAt: now },
  { id: "user-taylor", displayName: "Taylor", initials: "T", role: "member", cohortId: "founding-circle", directionIds: ["direction-communication"], createdAt: now },
  { id: "user-morgan", displayName: "Morgan", initials: "M", role: "member", cohortId: "founding-circle", directionIds: ["direction-self-trust"], createdAt: now },
  { id: "user-casey", displayName: "Casey", initials: "C", role: "member", cohortId: "founding-circle", directionIds: ["direction-contribution"], createdAt: now },
  { id: "user-riley", displayName: "Riley", initials: "R", role: "member", cohortId: "founding-circle", directionIds: ["direction-confidence"], createdAt: now },
  { id: "user-sam", displayName: "Sam", initials: "S", role: "member", cohortId: "founding-circle", directionIds: ["direction-momentum"], createdAt: now },
  { id: "user-jamie", displayName: "Jamie", initials: "J", role: "member", cohortId: "founding-circle", directionIds: ["direction-self-trust"], createdAt: now },
  { id: "user-drew", displayName: "Drew", initials: "D", role: "member", cohortId: "founding-circle", directionIds: ["direction-contribution"], createdAt: now },
  { id: "user-quinn", displayName: "Quinn", initials: "Q", role: "member", cohortId: "founding-circle", directionIds: ["direction-communication"], createdAt: now },
  { id: "user-gregory", displayName: "Gregory", initials: "G", role: "admin", cohortId: "founding-circle", directionIds: ["direction-contribution"], createdAt: now }
];

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

export const seedDirections: Direction[] = [
  {
    id: "direction-confidence",
    slug: "confidence",
    title: "Confidence",
    subtitle: "Practice one clear step before it feels perfect.",
    description: "Build calm confidence through small proof-backed attempts.",
    promptIds: ["say-clear-thing", "name-one-preference"]
  },
  {
    id: "direction-communication",
    slug: "communication",
    title: "Communication",
    subtitle: "Say what matters with clarity and care.",
    description: "Practice voice notes, useful questions, and simple explanations.",
    promptIds: ["ask-useful-question", "explain-idea-simply"]
  },
  {
    id: "direction-momentum",
    slug: "momentum",
    title: "Momentum",
    subtitle: "Build consistency without pressure.",
    description: "Turn effort into a repeatable rhythm that feels safe to keep.",
    promptIds: ["five-minute-step", "close-one-loop"]
  },
  {
    id: "direction-self-trust",
    slug: "self-trust",
    title: "Self-trust",
    subtitle: "Notice evidence that you follow through.",
    description: "Capture proof of honest effort and use feedback gently.",
    promptIds: ["honest-reflection", "practice-boundary"]
  },
  {
    id: "direction-contribution",
    slug: "contribution",
    title: "Contribution",
    subtitle: "Help others safely when you have useful context.",
    description: "Give specific feedback without chasing attention or status.",
    promptIds: ["give-specific-feedback", "spot-next-step"]
  }
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

export const seedProofs: Proof[] = [
  {
    id: "proof-team-meeting",
    userId: "user-alex",
    promptId: "explain-idea-simply",
    directionId: "direction-communication",
    title: "Explained my ideas more clearly in our team meeting.",
    body: "I practiced explaining one idea with a clear example.",
    mediaType: "video",
    attachments: [],
    status: "feedback-ready",
    visibility: "cohort",
    feedbackIds: ["feedback-clearer", "feedback-example", "feedback-slow-first"],
    createdAt: "2026-06-09T10:00:00.000Z"
  },
  {
    id: "proof-useful-question",
    userId: "user-jordan",
    promptId: "ask-useful-question",
    directionId: "direction-communication",
    title: "Asked one useful question during planning.",
    body: "I focused on asking instead of proving.",
    mediaType: "text",
    attachments: [],
    status: "feedback-ready",
    visibility: "cohort",
    feedbackIds: ["feedback-question"],
    createdAt: "2026-06-08T20:00:00.000Z"
  },
  {
    id: "proof-voice-note",
    userId: "user-taylor",
    promptId: "say-clear-thing",
    directionId: "direction-confidence",
    title: "Recorded a 60-second voice note.",
    body: "I practiced saying one idea out loud.",
    mediaType: "audio",
    attachments: [],
    status: "submitted",
    visibility: "cohort",
    feedbackIds: [],
    createdAt: "2026-06-07T18:00:00.000Z"
  }
];

export const seedFeedback: Feedback[] = [
  { id: "feedback-clearer", proofId: "proof-team-meeting", authorId: "user-riley", recipientId: "user-alex", body: "Clearer than last time.", tone: "specific", helpful: true, createdAt: "2026-06-09T10:45:00.000Z" },
  { id: "feedback-example", proofId: "proof-team-meeting", authorId: "user-sam", recipientId: "user-alex", body: "Your example made the idea easier to follow.", tone: "kind", helpful: true, createdAt: "2026-06-09T11:10:00.000Z" },
  { id: "feedback-slow-first", proofId: "proof-team-meeting", authorId: "user-quinn", recipientId: "user-alex", body: "Try slowing down the first sentence.", tone: "next-step", helpful: false, createdAt: "2026-06-09T11:40:00.000Z" },
  { id: "feedback-question", proofId: "proof-useful-question", authorId: "user-casey", recipientId: "user-jordan", body: "The question made the planning goal easier to see.", tone: "specific", helpful: true, createdAt: "2026-06-08T21:00:00.000Z" }
];

export const seedTrustEvents: TrustEvent[] = [
  { id: "trust-practice-1", userId: "user-alex", type: "practice", points: 5, label: "Completed a communication practice", sourceId: "explain-idea-simply", createdAt: "2026-06-09T09:30:00.000Z" },
  { id: "trust-proof-1", userId: "user-alex", type: "proof", points: 5, label: "Submitted proof from practice", sourceId: "proof-team-meeting", createdAt: "2026-06-09T10:00:00.000Z" },
  { id: "trust-helpful-1", userId: "user-alex", type: "helpful", points: 7, label: "Used feedback for the next practice", sourceId: "feedback-clearer", createdAt: "2026-06-09T12:00:00.000Z" },
  { id: "trust-feedback-1", userId: "user-alex", type: "peer-feedback", points: 3, label: "Gave one useful feedback note", sourceId: "feedback-question", createdAt: "2026-06-08T22:00:00.000Z" }
];

export const seedAppFeedback: AppFeedback[] = [
  { id: "app-feedback-1", userId: "user-jamie", category: "confusing", body: "I wanted proof privacy explained before choosing a file.", route: "/proof/new/say-clear-thing", createdAt: "2026-06-08T15:00:00.000Z", reviewed: false },
  { id: "app-feedback-2", userId: "user-drew", category: "idea", body: "The install guide should mention Safari's Share button more clearly.", route: "/install", createdAt: "2026-06-08T16:15:00.000Z", reviewed: false }
];

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
  completedPracticeIds: ["say-clear-thing", "ask-useful-question"]
};
