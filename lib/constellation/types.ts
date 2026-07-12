// Progress Constellation — typed contract between the evidence projection and
// every surface that renders it (full map, list view, detail sheet, home
// preview). Pure types only; the projection in ./projection.ts is the single
// producer. Presentation (node positions) deliberately lives elsewhere —
// evidence is the source of truth, geometry is not.

import type { ModerationStatus } from "../moderation";

export type ConstellationNodeStatus =
  | "locked"
  | "available"
  | "active" // the recommended step — strongest emphasis, breathing glow
  | "in_progress"
  | "completed"
  | "attention_needed";

export type ConstellationNodeKey = "practice" | "prove" | "feedback" | "apply" | "contribute";

export const CONSTELLATION_NODE_ORDER: ConstellationNodeKey[] = [
  "practice",
  "prove",
  "feedback",
  "apply",
  "contribute"
];

export type ConstellationEvidenceType =
  | "practice_completion"
  | "proof"
  | "proof_draft"
  | "feedback_received"
  | "feedback_application"
  | "feedback_given"
  | "helpful_mark";

export type ConstellationEvidence = {
  id: string;
  type: ConstellationEvidenceType;
  title: string;
  occurredAt: string; // ISO
  /** Route that re-checks authorization when opened (RLS-scoped screens). */
  href: string | null;
};

export type ConstellationNode = {
  key: ConstellationNodeKey;
  label: string;
  status: ConstellationNodeStatus;
  evidenceCount: number;
  /** Meaningful pair only where a real finite target exists (e.g. practices in
   *  the direction). Otherwise both null — never invent totals. */
  progressCurrent: number | null;
  progressTarget: number | null;
  completedAt: string | null;
  /** Plain-language, beginner-safe. Shared verbatim by map, list, and sheet. */
  explanation: string;
  nextActionLabel: string | null;
  nextActionHref: string | null;
  /** Most recent first, capped by the projection; excludes moderated rows. */
  evidence: ConstellationEvidence[];
};

export type ConstellationState = {
  directionId: string;
  directionName: string;
  nodes: Record<ConstellationNodeKey, ConstellationNode>;
  recommendedNode: ConstellationNodeKey;
  /** Why the recommendation fired — analytics tag + sheet copy key. */
  recommendedRule: NextActionRule;
  completedLoopCount: number;
  completedNodeCount: number;
  updatedAt: string;
};

/** Deterministic next-action rules, in strict priority order (spec §NEXT-ACTION).
 *  "resume_practice" is contractually first but vacuous in v1 — the app does
 *  not persist an in-progress practice yet; it slots in without reshuffling
 *  when that lands. "submit_proof" is not in the spec's six but sits directly
 *  after finish_proof_draft: a completed practice with no proof at all is the
 *  same intent (get your proof in) one step earlier. */
export type NextActionRule =
  | "resume_practice"
  | "finish_proof_draft"
  | "submit_proof"
  | "review_feedback"
  | "apply_feedback"
  | "give_feedback"
  | "start_practice";

// ---------------------------------------------------------------------------
// Projection inputs — narrow, IO-free views over the member's OWN rows
// (RLS-scoped upstream). The projection never sees other members' data except
// the cohort proofs the member can already read (for direction lookup of
// feedback they authored).

export type CompletionInput = {
  id: string;
  promptId: string;
  createdAt: string | null; // null when only ids are known (snapshot fallback)
};

export type ProofInput = {
  id: string;
  promptId: string;
  directionId: string;
  title: string;
  status: "draft" | "submitted" | "feedback-ready" | "used-for-practice";
  createdAt: string;
  moderationStatus?: ModerationStatus;
};

export type FeedbackInput = {
  id: string;
  proofId: string;
  authorId: string;
  recipientId: string;
  helpful: boolean;
  createdAt: string;
  moderationStatus?: ModerationStatus;
};

export type FeedbackApplicationStatus = "planned" | "practiced" | "demonstrated";

export type FeedbackApplicationInput = {
  id: string;
  feedbackId: string;
  status: FeedbackApplicationStatus;
  reflection: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type ConstellationInputs = {
  userId: string;
  direction: { id: string; title: string } | null;
  /** Active prompts belonging to the direction (id → title for evidence rows). */
  directionPrompts: { id: string; title: string }[];
  /** The member's own completions (all directions; filtered inside). */
  completions: CompletionInput[];
  /** The member's own proofs (all directions). */
  ownProofs: ProofInput[];
  /** Feedback where the member is the recipient. */
  feedbackReceived: FeedbackInput[];
  /** Feedback the member authored on others' proofs. */
  feedbackGiven: FeedbackInput[];
  /** direction lookup for proofs the member can read (own + cohort feed). */
  proofDirectionById: Record<string, string>;
  /** The member's feedback applications (050). */
  applications: FeedbackApplicationInput[];
  /** Count of unread feedback notifications (rule 3). */
  unreadFeedbackCount: number;
  /** Whether at least one cohort proof is currently eligible for the member's
   *  feedback (not own, visible, not blocked) — rule 5 predicate. */
  eligibleProofToReview: boolean;
  /** Deterministic clock (ISO) — projection never reads Date.now(). */
  now: string;
};
