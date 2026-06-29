// Typed settings schema for the Settings screen (user_settings table, 034).
// Notification toggles live in one namespaced map so new toggles need no DDL.
// Pure + serializable; the repository maps to/from the DB row.

export type ProfileVisibility = "private" | "members" | "feedback_group" | "public";
export type ProofVisibility = "private" | "feedback_group" | "members" | "public";
export type FeedbackStyle = "gentle" | "balanced" | "direct";
export type FeedbackFrom = "anyone" | "trusted_members" | "same_direction";

export type ToggleMap = Record<string, boolean>;

export type FeedbackPrefs = {
  style: FeedbackStyle;
  focusAreas: string[];
  from: FeedbackFrom;
  allowAnonymous: boolean;
};

export type ContentPrefs = {
  topics: string[];
  hideAdvanced: boolean;
  beginnerSafe: boolean;
};

export type UserSettings = {
  profileVisibility: ProfileVisibility;
  proofVisibilityDefault: ProofVisibility;
  notifications: ToggleMap;
  feedback: FeedbackPrefs;
  content: ContentPrefs;
};

// ── Toggle group definitions (label + default), namespaced by surface. ──────
export type ToggleDef = { key: string; label: string; hint?: string; def: boolean };

export const PUSH_TOGGLES: ToggleDef[] = [
  { key: "push.practiceReminders", label: "Practice reminders", def: true },
  { key: "push.proofFeedback", label: "Feedback on my proof", def: true },
  { key: "push.introductionRequests", label: "Introduction requests", def: true },
  { key: "push.trustUpdates", label: "Trust updates", def: true },
  { key: "push.contributionActivity", label: "Contribution activity", def: true },
  { key: "push.achievements", label: "Achievements", def: true },
  { key: "push.productUpdates", label: "Product updates", def: false },
];

export const EMAIL_TOGGLES: ToggleDef[] = [
  { key: "email.weeklySummary", label: "Weekly progress summary", def: true },
  { key: "email.feedbackDigests", label: "Feedback digests", def: true },
  { key: "email.introductionRequests", label: "Introduction requests", def: true },
  { key: "email.productUpdates", label: "Product updates", def: false },
  { key: "email.accountNotices", label: "Important account notices", hint: "Always on for security.", def: true },
  { key: "email.marketing", label: "Marketing emails", def: false },
];

export const FEEDBACK_TOGGLES: ToggleDef[] = [
  { key: "fb.newReceived", label: "New feedback received", def: true },
  { key: "fb.replies", label: "Feedback replies", def: true },
  { key: "fb.helpfulAlerts", label: "Helpful-rating alerts", def: true },
  { key: "fb.applyReminders", label: "Reminders to apply feedback", def: true },
  { key: "fb.requestedOnMine", label: "Feedback requested on my proof", def: true },
  { key: "fb.loopCompleted", label: "Feedback loop completed", def: true },
];

export const CONTENT_TOPICS = ["Communication", "Confidence", "Leadership", "Mindset", "Relationships", "Creativity", "Productivity", "Career"];
export const FEEDBACK_FOCUS = ["Clarity", "Tone", "Pacing", "Confidence", "Structure", "Warmth"];

export function defaultToggles(): ToggleMap {
  const map: ToggleMap = {};
  for (const t of [...PUSH_TOGGLES, ...EMAIL_TOGGLES, ...FEEDBACK_TOGGLES]) map[t.key] = t.def;
  return map;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  profileVisibility: "members",
  proofVisibilityDefault: "feedback_group",
  notifications: defaultToggles(),
  feedback: { style: "balanced", focusAreas: ["Clarity", "Tone", "Pacing"], from: "trusted_members", allowAnonymous: false },
  content: { topics: ["Communication", "Confidence"], hideAdvanced: false, beginnerSafe: true },
};

export function toggleOn(map: ToggleMap, def: ToggleDef): boolean {
  return map[def.key] ?? def.def;
}

export function mergeSettings(partial: Partial<UserSettings>, base: UserSettings = DEFAULT_USER_SETTINGS): UserSettings {
  return {
    ...base,
    ...partial,
    notifications: { ...base.notifications, ...(partial.notifications ?? {}) },
    feedback: { ...base.feedback, ...(partial.feedback ?? {}) },
    content: { ...base.content, ...(partial.content ?? {}) },
  };
}

export const PROFILE_VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string; hint: string }[] = [
  { value: "private", label: "Private", hint: "Only you can see your passport." },
  { value: "members", label: "Members only", hint: "Signed-in Collective members can view it." },
  { value: "feedback_group", label: "Feedback group", hint: "Only people in your feedback group." },
  { value: "public", label: "Public portfolio", hint: "Anyone with the link can view it." },
];

export const PROOF_VISIBILITY_OPTIONS: { value: ProofVisibility; label: string; hint: string }[] = [
  { value: "private", label: "Private", hint: "Only you can see it." },
  { value: "feedback_group", label: "Shared with feedback group", hint: "Your feedback group can see and respond." },
  { value: "members", label: "Members only", hint: "Signed-in members can see it." },
  { value: "public", label: "Public on profile", hint: "Shown on your public passport." },
];
