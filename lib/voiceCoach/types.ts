export type VoiceCoachDynamicVariables = Record<string, string | number | boolean>;

export type VoiceCoachContext = {
  learner_name: string;
  cohort: string;
  current_skill: string;
  current_challenge: string;
  mastery_level: string;
  recent_attempts: Array<{
    title: string;
    outcome: string;
    note: string;
    created_at?: string;
  }>;
};

export type VoiceCoachSessionResponse = {
  signedUrl: string;
  dynamicVariables: VoiceCoachDynamicVariables;
};

export type VoiceCoachToolName =
  | "get_current_challenge"
  | "get_learner_progress"
  | "log_practice_attempt"
  | "mark_concept_understood"
  | "request_hint";

export type VoiceCoachToolRequest = {
  tool: VoiceCoachToolName;
  params?: Record<string, unknown>;
};

export type VoiceCoachToolResponse = Record<string, unknown>;

