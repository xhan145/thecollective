export type MasteryLevelName = "Try it" | "Repeat it" | "Explain it" | "Apply it" | "Help someone else with it";

export type MasteryProgressStatus = "not_started" | "unlocked" | "in_progress" | "proof_submitted" | "completed";

export type MasteryProgressEvent =
  | "practice_started"
  | "practice_completed"
  | "proof_submitted"
  | "feedback_received"
  | "useful_feedback_given"
  | "helped_someone";

export type FeedbackRubric = {
  clarity: string;
  effort: string;
  usefulness: string;
  nextStep: string;
};

export type ContentMasterySeed = {
  version: string;
  product: string;
  content_system: string;
  notes: string;
  level_template: Record<string, MasteryLevelName>;
  feedback_rubric_fields: Array<keyof Omit<FeedbackRubric, "nextStep"> | "next_step">;
  directions: SeedDirection[];
};

export type SeedDirection = {
  direction_slug: string;
  direction_name: string;
  description: string;
  skills: SeedSkill[];
};

export type SeedSkill = {
  skill_slug: string;
  skill_name: string;
  description: string;
  levels: SeedMasteryLevel[];
};

export type SeedMasteryLevel = {
  level_number: number;
  level_name: MasteryLevelName;
  mastery_goal: string;
  practice_prompt: string;
  proof_requirement: string;
  proof_type: string;
  feedback_rubric: {
    clarity: string;
    effort: string;
    usefulness: string;
    next_step: string;
  };
  ai_prep_prompt: string;
  ai_reflection_prompt: string;
  next_step: string;
  feed_tags: string[];
  trust_signal: string;
  estimated_minutes: number;
  difficulty: string;
  safety_note: string;
  does_not_count_as_mastery: string;
};

export type Direction = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  skills: Skill[];
};

export type Skill = {
  id: string;
  directionId: string;
  directionSlug: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  levels: MasteryLevel[];
};

export type MasteryLevel = {
  id: string;
  directionId: string;
  directionSlug: string;
  skillId: string;
  skillSlug: string;
  levelNumber: number;
  levelName: MasteryLevelName;
  masteryGoal: string;
  practicePrompt: string;
  proofRequirement: string;
  proofType: string;
  feedbackRubric: FeedbackRubric;
  aiPrepPrompt: string;
  aiReflectionPrompt: string;
  nextStep: string;
  feedTags: string[];
  trustSignal: string;
  estimatedMinutes: number;
  difficulty: string;
  safetyNote: string;
  doesNotCountAsMastery: string;
  sortOrder: number;
};

export type ContentPracticePrompt = {
  id: string;
  directionSlug: string;
  skillSlug: string;
  masteryLevelId: string;
  title: string;
  masteryGoal: string;
  prompt: string;
  proofRequirement: string;
  proofType: string;
  estimatedMinutes: number;
  safetyNote: string;
};

export type UserMasteryProgress = {
  userId: string;
  directionId: string;
  skillId: string;
  masteryLevelId: string;
  status: MasteryProgressStatus;
  completedPracticeCount: number;
  submittedProofCount: number;
  usefulFeedbackCount: number;
  helpedSomeoneCount: number;
  lastPracticedAt?: string;
  completedAt?: string;
  updatedAt: string;
};

export type ContentMasteryCatalog = {
  version: string;
  directions: Direction[];
  skills: Skill[];
  masteryLevels: MasteryLevel[];
};

