import { contentMasteryCatalog } from "./contentMasteryLoader";
import type {
  ContentPracticePrompt,
  FeedbackRubric,
  MasteryLevel,
  MasteryProgressEvent,
  MasteryProgressStatus,
  UserMasteryProgress
} from "./contentMasteryTypes";

function nowIso() {
  return new Date().toISOString();
}

function toPractice(level: MasteryLevel): ContentPracticePrompt {
  return {
    id: level.id,
    directionSlug: level.directionSlug,
    skillSlug: level.skillSlug,
    masteryLevelId: level.id,
    title: `${level.levelName}: ${level.masteryGoal}`,
    masteryGoal: level.masteryGoal,
    prompt: level.practicePrompt,
    proofRequirement: level.proofRequirement,
    proofType: level.proofType,
    estimatedMinutes: level.estimatedMinutes,
    safetyNote: level.safetyNote
  };
}

function levelProgress(progress: UserMasteryProgress[], levelId: string) {
  return progress.find((item) => item.masteryLevelId === levelId);
}

function isUnlocked(level: MasteryLevel, progress: UserMasteryProgress[]) {
  if (level.levelNumber === 1) return true;
  const previous = contentMasteryCatalog.masteryLevels.find(
    (item) => item.skillId === level.skillId && item.levelNumber === level.levelNumber - 1
  );
  if (!previous) return false;
  const previousProgress = levelProgress(progress, previous.id);

  if (level.levelNumber === 2) return Boolean(previousProgress && previousProgress.submittedProofCount >= 1);
  if (level.levelNumber === 3) {
    return Boolean(previousProgress && previousProgress.completedPracticeCount >= 2 && previousProgress.submittedProofCount >= 1);
  }
  if (level.levelNumber === 4) return Boolean(previousProgress && previousProgress.status === "completed");
  if (level.levelNumber === 5) {
    return Boolean(previousProgress && (previousProgress.usefulFeedbackCount > 0 || previousProgress.helpedSomeoneCount > 0 || previousProgress.status === "completed"));
  }

  return false;
}

function statusAfterEvent(current: UserMasteryProgress, event: MasteryProgressEvent): MasteryProgressStatus {
  if (event === "practice_started") return current.status === "not_started" ? "in_progress" : current.status;
  if (event === "practice_completed") return current.submittedProofCount > 0 ? "completed" : "in_progress";
  if (event === "proof_submitted") return current.completedPracticeCount > 0 ? "completed" : "proof_submitted";
  if (event === "feedback_received") return current.status === "not_started" ? "unlocked" : current.status;
  if (event === "useful_feedback_given" || event === "helped_someone") return "completed";
  return current.status;
}

export function getAllDirections() {
  return contentMasteryCatalog.directions;
}

export function getDirectionBySlug(slug: string) {
  return contentMasteryCatalog.directions.find((direction) => direction.slug === slug);
}

export function getSkillsForDirection(directionSlug: string) {
  return contentMasteryCatalog.skills.filter((skill) => skill.directionSlug === directionSlug);
}

export function getMasteryLevelsForSkill(skillSlug: string) {
  return contentMasteryCatalog.masteryLevels.filter((level) => level.skillSlug === skillSlug);
}

export function getNextRecommendedPractice(_userId: string, progress: UserMasteryProgress[] = []): ContentPracticePrompt | null {
  const nextLevel =
    contentMasteryCatalog.masteryLevels.find((level) => isUnlocked(level, progress) && levelProgress(progress, level.id)?.status !== "completed") ||
    contentMasteryCatalog.masteryLevels[0];

  return nextLevel ? toPractice(nextLevel) : null;
}

export function getPracticeByMasteryLevelId(id: string) {
  const level = contentMasteryCatalog.masteryLevels.find((item) => item.id === id);
  return level ? toPractice(level) : null;
}

export function getMasteryLevelById(id: string) {
  return contentMasteryCatalog.masteryLevels.find((item) => item.id === id);
}

export function getFeedbackRubricForMasteryLevel(id: string): FeedbackRubric | null {
  return getMasteryLevelById(id)?.feedbackRubric || null;
}

export function getFeedTagsForMasteryLevel(id: string) {
  return getMasteryLevelById(id)?.feedTags || [];
}

export function updateUserMasteryProgress(userId: string, masteryLevelId: string, event: MasteryProgressEvent, existing?: UserMasteryProgress): UserMasteryProgress {
  const level = getMasteryLevelById(masteryLevelId);
  if (!level) throw new Error(`Unknown mastery level: ${masteryLevelId}`);

  const current: UserMasteryProgress = existing || {
    userId,
    directionId: level.directionId,
    skillId: level.skillId,
    masteryLevelId,
    status: "unlocked",
    completedPracticeCount: 0,
    submittedProofCount: 0,
    usefulFeedbackCount: 0,
    helpedSomeoneCount: 0,
    updatedAt: nowIso()
  };

  const next: UserMasteryProgress = {
    ...current,
    completedPracticeCount: current.completedPracticeCount + (event === "practice_completed" ? 1 : 0),
    submittedProofCount: current.submittedProofCount + (event === "proof_submitted" ? 1 : 0),
    usefulFeedbackCount: current.usefulFeedbackCount + (event === "useful_feedback_given" ? 1 : 0),
    helpedSomeoneCount: current.helpedSomeoneCount + (event === "helped_someone" ? 1 : 0),
    lastPracticedAt: event === "practice_started" || event === "practice_completed" ? nowIso() : current.lastPracticedAt,
    updatedAt: nowIso()
  };

  const status = statusAfterEvent(next, event);
  return {
    ...next,
    status,
    completedAt: status === "completed" ? next.completedAt || nowIso() : next.completedAt
  };
}

export function getDirectionProgressSummary(directionSlug: string, progress: UserMasteryProgress[] = []) {
  const levels = contentMasteryCatalog.masteryLevels.filter((level) => level.directionSlug === directionSlug);
  const completed = levels.filter((level) => levelProgress(progress, level.id)?.status === "completed").length;
  return {
    completed,
    total: levels.length,
    label: `${completed} of ${levels.length} levels`
  };
}

