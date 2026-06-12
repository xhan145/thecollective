import type { Feedback, PracticePrompt, Proof, UserProfile } from "./betaTypes";

export type AiFeature = "PRACTICE_PREP" | "REFLECTION_HELPER" | "FEEDBACK_COACH" | "FEEDBACK_SUMMARY";
export type AiSourceType = "PRACTICE_PROMPT" | "PROOF" | "PEER_FEEDBACK" | "FEEDBACK_LIST" | "APP_CONTEXT";
export type AiHelpfulness = "YES" | "KIND_OF" | "NO";
export type AiIssueType =
  | "TOO_GENERIC"
  | "TOO_MUCH_TEXT"
  | "NOT_CLEAR"
  | "FELT_JUDGMENTAL"
  | "WRONG_CONTEXT"
  | "ACTUALLY_USEFUL"
  | "OTHER";

export type PracticePrepResponse = {
  title: string;
  steps: string[];
  focus: string;
  encouragement: string;
};

export type ReflectionHelpResponse = {
  validation: string;
  whatYouPracticed: string;
  nextSmallStep: string;
};

export type FeedbackCoachResponse = {
  whatWorked: string;
  suggestion: string;
  encouragement: string;
};

export type FeedbackSummaryResponse = {
  commonTheme: string;
  usefulSuggestion: string;
  nextPracticeStep: string;
};

export type AiResponse = {
  id: string;
  feature: AiFeature;
  title: string;
  summary: string;
  bullets: string[];
  suggestedNextStep: string;
  caution?: string;
  structured:
    | { kind: "practicePrep"; data: PracticePrepResponse }
    | { kind: "reflectionHelp"; data: ReflectionHelpResponse }
    | { kind: "feedbackCoach"; data: FeedbackCoachResponse }
    | { kind: "feedbackSummary"; data: FeedbackSummaryResponse };
  createdAt: string;
};

export type AiInteraction = {
  id: string;
  userId: string;
  cohortId: string;
  feature: AiFeature;
  sourceType: AiSourceType;
  sourceId: string;
  promptId?: string;
  proofId?: string;
  inputSummary: string;
  output: AiResponse;
  createdAt: string;
};

export type AiUserFeedback = {
  id: string;
  userId: string;
  userDisplayName: string;
  cohortId: string;
  aiInteractionId: string;
  feature: AiFeature;
  helpfulness: AiHelpfulness;
  issueType?: AiIssueType;
  comment?: string;
  createdAt: string;
};

export type AiUserContext = {
  userId: string;
  displayName: string;
  cohortId: string;
  trustLevelLabel?: string;
};

export type AiService = {
  generatePracticePrep(prompt: PracticePrompt, userContext: AiUserContext): Promise<AiResponse>;
  generateReflectionHelp(proof: Proof | null, reflectionText: string, prompt: PracticePrompt | undefined, userContext: AiUserContext): Promise<AiResponse>;
  generateFeedbackSuggestion(proof: Proof, draftFeedback: string, userContext: AiUserContext): Promise<AiResponse>;
  generateFeedbackSummary(proof: Proof, feedbackList: Feedback[], userContext: AiUserContext): Promise<AiResponse>;
};
