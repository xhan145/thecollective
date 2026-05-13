export type PathSlug = "speak-up" | "social-momentum" | "daily-momentum" | "give-better-feedback";
export type GrowthPath = { slug: PathSlug; title: string; description: string; promise: string; color: string; estimatedDays: number };
export type PracticePrompt = { id: string; pathSlug: PathSlug; title: string; instruction: string; proofType: string; reflectionQuestion: string; feedbackQuestion: string; estimatedMinutes: number; order: number };
export type FeedMode = "passive" | "bridge" | "active";
export type FeedType = "practice" | "proof" | "reflection" | "feedback" | "milestone" | "prompt" | "lesson" | "question" | "contribution";
export type FeedItem = { id: string; type: FeedType; mode: FeedMode; title: string; body: string; pathSlug?: PathSlug; actor?: string; trustSignal?: string; actionLabel?: string; actionHref?: string; usefulness: number; actionability: number; proofStrength: number; trustWeight: number; recency: number; friction: number };
export type DemoUser = { goal: PathSlug; stage: "new" | "practicing" | "contributor"; completedPromptIds: string[] };
