// Progress Constellation — pure evidence projection. IO-free and deterministic:
// same inputs ⇒ deep-equal output (verified by scripts/check-constellation.ts).
// The projection is the single authority on node status, explanations, CTAs,
// and the recommended next action; map, list, sheet, and home preview all
// render this object and never re-derive progress themselves.
//
// Beginner-safe ordering: practice → prove → feedback → apply → contribute.
// A node is locked until its predecessor has real evidence; evidence always
// wins over locks. Moderation: pending/removed rows are excluded from counts
// and evidence lists (an own pending proof surfaces as a calm
// attention_needed, never as silent loss).

import type {
  CompletionInput,
  ConstellationEvidence,
  ConstellationInputs,
  ConstellationNode,
  ConstellationNodeKey,
  ConstellationNodeStatus,
  ConstellationState,
  FeedbackApplicationInput,
  FeedbackInput,
  NextActionRule,
  ProofInput
} from "./types";

const EVIDENCE_CAP = 5;

const NODE_LABELS: Record<ConstellationNodeKey, string> = {
  practice: "Practice",
  prove: "Prove",
  feedback: "Feedback",
  apply: "Apply",
  contribute: "Contribute"
};

function visibleModeration(status?: string): boolean {
  return status === undefined || status === "clear" || status === "limited";
}

function newestFirst<T extends { occurredAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
}

function count(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function buildConstellationState(inputs: ConstellationInputs): ConstellationState {
  const directionId = inputs.direction?.id ?? "";
  const directionName = inputs.direction?.title ?? "";
  const promptTitleById = new Map(inputs.directionPrompts.map((p) => [p.id, p.title]));

  // ----- practice -----------------------------------------------------------
  const directionCompletions: CompletionInput[] = inputs.completions.filter((c) =>
    promptTitleById.has(c.promptId)
  );
  const practiceEvidence: ConstellationEvidence[] = newestFirst(
    directionCompletions.map((c) => ({
      id: c.id,
      type: "practice_completion" as const,
      title: promptTitleById.get(c.promptId) ?? "Practice completed",
      occurredAt: c.createdAt ?? inputs.now,
      href: `/practice/${c.promptId}`
    }))
  );
  const distinctPracticed = new Set(directionCompletions.map((c) => c.promptId)).size;
  const practiceComplete = directionCompletions.length > 0;

  // ----- prove ---------------------------------------------------------------
  const directionProofs: ProofInput[] = inputs.ownProofs.filter((p) => p.directionId === directionId);
  const visibleProofs = directionProofs.filter(
    (p) => p.status !== "draft" && visibleModeration(p.moderationStatus)
  );
  const draftProofs = directionProofs.filter((p) => p.status === "draft");
  const pendingProofs = directionProofs.filter(
    (p) => p.status !== "draft" && p.moderationStatus === "pending"
  );
  const proveEvidence: ConstellationEvidence[] = newestFirst(
    visibleProofs.map((p) => ({
      id: p.id,
      type: "proof" as const,
      title: p.title,
      occurredAt: p.createdAt,
      href: `/proof/${p.id}`
    }))
  );
  const proveComplete = visibleProofs.length > 0;
  const proveAttention = !proveComplete && pendingProofs.length > 0;

  // ----- feedback (received) -------------------------------------------------
  const proofTitleById = new Map(directionProofs.map((p) => [p.id, p.title]));
  const visibleProofIds = new Set(visibleProofs.map((p) => p.id));
  const receivedVisible: FeedbackInput[] = inputs.feedbackReceived.filter(
    (f) =>
      f.recipientId === inputs.userId &&
      visibleModeration(f.moderationStatus) &&
      visibleProofIds.has(f.proofId)
  );
  const feedbackEvidence: ConstellationEvidence[] = newestFirst(
    receivedVisible.map((f) => ({
      id: f.id,
      type: "feedback_received" as const,
      title: `Feedback on “${proofTitleById.get(f.proofId) ?? "your proof"}”`,
      occurredAt: f.createdAt,
      href: `/proof/${f.proofId}/feedback`
    }))
  );
  const feedbackComplete = receivedVisible.length > 0;

  // ----- apply ---------------------------------------------------------------
  const receivedIds = new Set(receivedVisible.map((f) => f.id));
  const validApplications: FeedbackApplicationInput[] = inputs.applications.filter((a) =>
    receivedIds.has(a.feedbackId)
  );
  const advancedApplications = validApplications.filter(
    (a) => a.status === "practiced" || a.status === "demonstrated"
  );
  const applyEvidence: ConstellationEvidence[] = newestFirst(
    validApplications.map((a) => ({
      id: a.id,
      type: "feedback_application" as const,
      title:
        a.status === "planned"
          ? "Planned: one suggestion to use"
          : a.status === "practiced"
            ? "Feedback used in a follow-up practice"
            : "Feedback demonstrated in a later proof",
      occurredAt: a.updatedAt ?? a.createdAt,
      href: null
    }))
  );
  const applyComplete = advancedApplications.length > 0;
  const applyInProgress = !applyComplete && validApplications.length > 0;

  // ----- contribute ----------------------------------------------------------
  const givenInDirection: FeedbackInput[] = inputs.feedbackGiven.filter(
    (f) =>
      f.authorId === inputs.userId &&
      f.recipientId !== inputs.userId &&
      visibleModeration(f.moderationStatus) &&
      inputs.proofDirectionById[f.proofId] === directionId
  );
  const helpfulGiven = givenInDirection.filter((f) => f.helpful);
  const contributeEvidence: ConstellationEvidence[] = newestFirst(
    givenInDirection.map((f) => ({
      id: f.id,
      type: (f.helpful ? "helpful_mark" : "feedback_given") as ConstellationEvidence["type"],
      title: f.helpful ? "Marked useful by the member you helped" : "Feedback you gave",
      occurredAt: f.createdAt,
      href: "/feedback"
    }))
  );
  const contributeComplete = helpfulGiven.length > 0;
  const contributeInProgress = !contributeComplete && givenInDirection.length > 0;
  const contributeUnlocked = feedbackComplete || contributeComplete;

  // ----- next action (strict priority) ---------------------------------------
  const latestCompletion = practiceEvidence[0];
  const latestCompletedPromptId = newestFirst(
    directionCompletions.map((c) => ({ occurredAt: c.createdAt ?? inputs.now, promptId: c.promptId }))
  )[0]?.promptId;
  const newestDraft = newestFirst(
    draftProofs.map((p) => ({ occurredAt: p.createdAt, promptId: p.promptId }))
  )[0];
  const newestFeedback = feedbackEvidence[0];

  let rule: NextActionRule;
  let recommendedNode: ConstellationNodeKey;
  // 1. resume_practice — vacuous in v1 (no persisted in-progress practice).
  if (newestDraft) {
    rule = "finish_proof_draft"; // 2
    recommendedNode = "prove";
  } else if (practiceComplete && !proveComplete && !proveAttention) {
    rule = "submit_proof"; // 2.5 — same intent as 2, one step earlier
    recommendedNode = "prove";
  } else if (feedbackComplete && inputs.unreadFeedbackCount > 0) {
    rule = "review_feedback"; // 3
    recommendedNode = "feedback";
  } else if (feedbackComplete && !applyComplete) {
    rule = "apply_feedback"; // 4
    recommendedNode = "apply";
  } else if (contributeUnlocked && !contributeComplete && inputs.eligibleProofToReview) {
    rule = "give_feedback"; // 5
    recommendedNode = "contribute";
  } else {
    rule = "start_practice"; // 6
    recommendedNode = "practice";
  }

  // ----- assemble nodes -------------------------------------------------------
  const completedFlags: Record<ConstellationNodeKey, boolean> = {
    practice: practiceComplete,
    prove: proveComplete,
    feedback: feedbackComplete,
    apply: applyComplete,
    contribute: contributeComplete
  };

  function displayStatus(key: ConstellationNodeKey, base: ConstellationNodeStatus): ConstellationNodeStatus {
    if (base === "attention_needed") return base;
    if (key === recommendedNode && base !== "locked") return "active";
    return base;
  }

  const hasDirection = inputs.direction !== null;

  const practiceNode: ConstellationNode = {
    key: "practice",
    label: NODE_LABELS.practice,
    status: displayStatus("practice", practiceComplete ? "completed" : "available"),
    evidenceCount: directionCompletions.length,
    progressCurrent: distinctPracticed,
    progressTarget: inputs.directionPrompts.length > 0 ? inputs.directionPrompts.length : null,
    completedAt: practiceComplete ? (latestCompletion?.occurredAt ?? null) : null,
    explanation: practiceComplete
      ? `${count(directionCompletions.length, "completed practice", "completed practices")}. Small steps, kept small on purpose.`
      : hasDirection
        ? "Choose one small practice to begin your path. Five minutes counts."
        : "Choose a direction to begin — confidence, communication, or momentum.",
    nextActionLabel: practiceComplete ? "Practice again" : hasDirection ? "Start a practice" : "Choose a direction",
    nextActionHref: hasDirection ? "/practice" : "/directions",
    evidence: practiceEvidence.slice(0, EVIDENCE_CAP)
  };

  const proveStatus: ConstellationNodeStatus = proveAttention
    ? "attention_needed"
    : proveComplete
      ? "completed"
      : newestDraft
        ? "in_progress"
        : practiceComplete
          ? "available"
          : "locked";
  const proveNode: ConstellationNode = {
    key: "prove",
    label: NODE_LABELS.prove,
    status: displayStatus("prove", proveStatus),
    evidenceCount: visibleProofs.length,
    progressCurrent: null,
    progressTarget: null,
    completedAt: proveComplete ? (proveEvidence[0]?.occurredAt ?? null) : null,
    explanation: proveAttention
      ? "Your proof is being reviewed. It will come back shortly — nothing is lost."
      : proveComplete
        ? `${count(visibleProofs.length, "submitted proof", "submitted proofs")}. Real attempts, on the record.`
        : newestDraft
          ? "You have a proof draft waiting. Finishing it is one honest paragraph away."
          : practiceComplete
            ? "Show what you practiced. It does not need to be perfect."
            : "Complete one practice first — proof comes from a real attempt.",
    nextActionLabel: proveComplete ? "Add another proof" : newestDraft ? "Finish your draft" : practiceComplete ? "Show what you practiced" : null,
    nextActionHref:
      newestDraft?.promptId != null
        ? `/proof/new/${newestDraft.promptId}`
        : latestCompletedPromptId
          ? `/proof/new/${latestCompletedPromptId}`
          : null,
    evidence: proveEvidence.slice(0, EVIDENCE_CAP)
  };

  const feedbackStatus: ConstellationNodeStatus = feedbackComplete
    ? "completed"
    : proveComplete
      ? "available"
      : "locked";
  const feedbackNode: ConstellationNode = {
    key: "feedback",
    label: NODE_LABELS.feedback,
    status: displayStatus("feedback", feedbackStatus),
    evidenceCount: receivedVisible.length,
    progressCurrent: null,
    progressTarget: null,
    completedAt: feedbackComplete ? (feedbackEvidence[0]?.occurredAt ?? null) : null,
    explanation: feedbackComplete
      ? `${count(receivedVisible.length, "response received", "responses received")}. Feedback helps you improve — it does not define you.`
      : proveComplete
        ? "Your proof is out there. Feedback from another member usually arrives within a few days."
        : "Submit a proof first — feedback answers a real attempt.",
    nextActionLabel: feedbackComplete ? "Review feedback" : null,
    nextActionHref: newestFeedback?.href ?? null,
    evidence: feedbackEvidence.slice(0, EVIDENCE_CAP)
  };

  const applyStatus: ConstellationNodeStatus = applyComplete
    ? "completed"
    : applyInProgress
      ? "in_progress"
      : feedbackComplete
        ? "available"
        : "locked";
  const applyNode: ConstellationNode = {
    key: "apply",
    label: NODE_LABELS.apply,
    status: displayStatus("apply", applyStatus),
    evidenceCount: validApplications.length,
    progressCurrent: null,
    progressTarget: null,
    completedAt: applyComplete ? (newestFirst(applyEvidence.filter((e) => e.title !== "Planned: one suggestion to use"))[0]?.occurredAt ?? null) : null,
    explanation: applyComplete
      ? "Feedback used in a follow-up practice. This is where growth compounds."
      : applyInProgress
        ? "You planned which suggestion to use. Mark it practiced once you have tried it."
        : feedbackComplete
          ? "Choose one suggestion from your feedback to use in another practice."
          : "Receive feedback first — then pick one suggestion to use.",
    nextActionLabel: applyComplete ? "Apply more feedback" : applyInProgress ? "Mark it practiced" : feedbackComplete ? "Choose a suggestion to apply" : null,
    nextActionHref: null, // handled in-app via the Apply sheet
    evidence: applyEvidence.slice(0, EVIDENCE_CAP)
  };

  const contributeStatus: ConstellationNodeStatus = contributeComplete
    ? "completed"
    : contributeInProgress
      ? "in_progress"
      : contributeUnlocked
        ? "available"
        : "locked";
  const contributeNode: ConstellationNode = {
    key: "contribute",
    label: NODE_LABELS.contribute,
    status: displayStatus("contribute", contributeStatus),
    evidenceCount: givenInDirection.length,
    progressCurrent: null,
    progressTarget: null,
    completedAt: contributeComplete
      ? (newestFirst(helpfulGiven.map((f) => ({ occurredAt: f.createdAt })))[0]?.occurredAt ?? null)
      : null,
    explanation: contributeComplete
      ? `${count(helpfulGiven.length, "person found", "people found")} your feedback useful. Practice became contribution.`
      : contributeInProgress
        ? "You have given feedback. It completes when someone marks it useful."
        : contributeUnlocked
          ? "Give one specific, kind piece of feedback to another member's proof."
          : "Complete your own feedback loop first — then help someone else with theirs.",
    nextActionLabel: contributeUnlocked ? "Find a proof to help" : null,
    nextActionHref: contributeUnlocked ? "/feed" : null,
    evidence: contributeEvidence.slice(0, EVIDENCE_CAP)
  };

  const nodes = {
    practice: practiceNode,
    prove: proveNode,
    feedback: feedbackNode,
    apply: applyNode,
    contribute: contributeNode
  };

  const completedNodeCount = Object.values(completedFlags).filter(Boolean).length;
  const allEvidence = [
    ...practiceEvidence,
    ...proveEvidence,
    ...feedbackEvidence,
    ...applyEvidence,
    ...contributeEvidence
  ];
  const updatedAt = newestFirst(allEvidence)[0]?.occurredAt ?? inputs.now;

  return {
    directionId,
    directionName,
    nodes,
    recommendedNode,
    recommendedRule: rule,
    completedLoopCount: completedNodeCount === 5 ? 1 : 0,
    completedNodeCount,
    updatedAt
  };
}
