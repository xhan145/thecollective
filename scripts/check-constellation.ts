// Unit checks for lib/constellation/projection.ts
// (run: npx tsx scripts/check-constellation.ts)
//
// Fixture-driven contract for the Progress Constellation: node status rules,
// beginner-safe lock ordering, moderated/deleted evidence exclusion, foreign
// row rejection, deterministic next-action priority, loop counting, and
// output determinism. Every completed node must trace to real evidence.

import { buildConstellationState } from "../lib/constellation/projection";
import type {
  CompletionInput,
  ConstellationInputs,
  FeedbackApplicationInput,
  FeedbackInput,
  ProofInput
} from "../lib/constellation/types";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const NOW = "2026-07-11T12:00:00.000Z";
const ME = "user-me";
const OTHER = "user-other";
const DIR = { id: "direction-communication", title: "Confident Communication" };

const PROMPTS = [
  { id: "comm-s1", title: "Ask one useful question" },
  { id: "comm-s2", title: "Rewrite a rambly message" },
  { id: "comm-b1", title: "Explain it in three sentences" }
];

function base(overrides: Partial<ConstellationInputs> = {}): ConstellationInputs {
  return {
    userId: ME,
    direction: DIR,
    directionPrompts: PROMPTS,
    completions: [],
    ownProofs: [],
    feedbackReceived: [],
    feedbackGiven: [],
    proofDirectionById: {},
    applications: [],
    unreadFeedbackCount: 0,
    eligibleProofToReview: false,
    now: NOW,
    ...overrides
  };
}

const completion = (promptId: string, at = "2026-07-01T10:00:00.000Z"): CompletionInput => ({
  id: `comp-${promptId}`,
  promptId,
  createdAt: at
});

const proof = (id: string, overrides: Partial<ProofInput> = {}): ProofInput => ({
  id,
  promptId: "comm-s1",
  directionId: DIR.id,
  title: "My 60-second voice practice",
  status: "submitted",
  createdAt: "2026-07-02T10:00:00.000Z",
  ...overrides
});

const fb = (id: string, overrides: Partial<FeedbackInput> = {}): FeedbackInput => ({
  id,
  proofId: "proof-1",
  authorId: OTHER,
  recipientId: ME,
  helpful: false,
  createdAt: "2026-07-03T10:00:00.000Z",
  ...overrides
});

const application = (
  feedbackId: string,
  status: FeedbackApplicationInput["status"],
  at = "2026-07-04T10:00:00.000Z"
): FeedbackApplicationInput => ({
  id: `app-${feedbackId}`,
  feedbackId,
  status,
  reflection: null,
  createdAt: at,
  updatedAt: at
});

// ---------------------------------------------------------------- empty state
{
  const s = buildConstellationState(base());
  assert(s.directionId === DIR.id && s.directionName === DIR.title, "direction passthrough");
  assert(s.nodes.practice.status === "active", "empty: practice is the recommended entry");
  assert(s.recommendedNode === "practice" && s.recommendedRule === "start_practice", "empty: start practice");
  assert(s.nodes.prove.status === "locked", "empty: prove locked");
  assert(s.nodes.feedback.status === "locked", "empty: feedback locked");
  assert(s.nodes.apply.status === "locked", "empty: apply locked");
  assert(s.nodes.contribute.status === "locked", "empty: contribute locked");
  assert(s.completedNodeCount === 0 && s.completedLoopCount === 0, "empty: nothing completed");
  assert(s.nodes.practice.progressCurrent === 0 && s.nodes.practice.progressTarget === 3, "practice 0/3");
  assert(s.updatedAt === NOW, "empty: updatedAt falls back to now");
  assert(s.nodes.practice.nextActionHref === "/practice", "practice CTA routes to /practice");
  for (const key of ["practice", "prove", "feedback", "apply", "contribute"] as const) {
    assert(s.nodes[key].explanation.length > 0, `${key} has plain-language explanation`);
    assert(s.nodes[key].evidence.length === 0, `${key} has no evidence yet`);
  }
}

// ------------------------------------------------- practice completed → prove
{
  const s = buildConstellationState(base({ completions: [completion("comm-s1")] }));
  assert(s.nodes.practice.status === "completed", "practice completed with 1 completion");
  assert(s.nodes.practice.evidenceCount === 1, "practice evidence count");
  assert(s.nodes.practice.completedAt === "2026-07-01T10:00:00.000Z", "practice completedAt = evidence time");
  assert(s.nodes.practice.progressCurrent === 1 && s.nodes.practice.progressTarget === 3, "practice 1/3");
  assert(s.nodes.prove.status === "active", "prove unlocked and recommended");
  assert(s.recommendedNode === "prove" && s.recommendedRule === "submit_proof", "submit_proof fires");
  assert(s.nodes.prove.nextActionHref === "/proof/new/comm-s1", "prove CTA deep-links the completed prompt");
  assert(s.nodes.feedback.status === "locked", "feedback still locked");
  assert(s.updatedAt === "2026-07-01T10:00:00.000Z", "updatedAt = max evidence time");
  // Cross-direction completions must not count.
  const t = buildConstellationState(base({ completions: [completion("mom-s1")] }));
  assert(t.nodes.practice.status === "active" && t.nodes.practice.evidenceCount === 0, "other-direction completion ignored");
}

// --------------------------------------------------------- draft proof → rule
{
  const s = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-d", { status: "draft", createdAt: "2026-07-02T09:00:00.000Z" })]
    })
  );
  assert(s.nodes.prove.status === "active", "draft: prove is the emphasized node");
  assert(s.recommendedRule === "finish_proof_draft", "draft outranks submit_proof");
  assert(s.nodes.prove.nextActionHref === "/proof/new/comm-s1", "draft CTA returns to composer");
  assert(s.nodes.prove.evidenceCount === 0, "drafts are not evidence");
}

// ------------------------------------------------ proof submitted → feedback
{
  const s = buildConstellationState(
    base({ completions: [completion("comm-s1")], ownProofs: [proof("proof-1")] })
  );
  assert(s.nodes.prove.status === "completed", "prove completed by submitted proof");
  assert(s.nodes.prove.evidence[0]?.href === "/proof/proof-1", "proof evidence links to proof screen");
  assert(s.nodes.feedback.status === "available", "feedback waiting state is available, not locked");
  assert(s.nodes.apply.status === "locked", "apply locked until feedback");
  // Nothing actionable mid-wait → start another practice.
  assert(s.recommendedNode === "practice" && s.recommendedRule === "start_practice", "waiting: start another practice");
}

// -------------------------------------------- feedback received, unread/read
{
  const unread = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1")],
      feedbackReceived: [fb("fb-1")],
      unreadFeedbackCount: 1
    })
  );
  assert(unread.nodes.feedback.status === "active", "unread feedback: feedback node emphasized");
  assert(unread.recommendedRule === "review_feedback", "review outranks apply");
  assert(unread.nodes.feedback.nextActionHref === "/proof/proof-1/feedback", "review CTA deep-links feedback");
  assert(unread.nodes.feedback.evidenceCount === 1, "feedback evidence counted");

  const read = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1")],
      feedbackReceived: [fb("fb-1")]
    })
  );
  assert(read.nodes.feedback.status === "completed", "read feedback: node settles to completed");
  assert(read.nodes.apply.status === "active", "apply becomes the recommended step");
  assert(read.recommendedRule === "apply_feedback", "apply rule fires");
}

// ------------------------------------------------------- applications ladder
{
  const planned = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1")],
      feedbackReceived: [fb("fb-1")],
      applications: [application("fb-1", "planned")]
    })
  );
  assert(planned.nodes.apply.status === "active", "planned application keeps apply emphasized");
  assert(planned.recommendedRule === "apply_feedback", "planned still under apply rule");
  assert(planned.nodes.apply.evidenceCount === 1, "planned application is visible evidence");

  const practiced = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1")],
      feedbackReceived: [fb("fb-1")],
      applications: [application("fb-1", "practiced")]
    })
  );
  assert(practiced.nodes.apply.status === "completed", "practiced application completes apply");
  assert(practiced.nodes.contribute.status === "available", "contribute unlocks after feedback loop");
  assert(practiced.recommendedRule === "start_practice", "no eligible proof → start practice");

  const eligible = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1")],
      feedbackReceived: [fb("fb-1")],
      applications: [application("fb-1", "practiced")],
      eligibleProofToReview: true
    })
  );
  assert(eligible.recommendedNode === "contribute" && eligible.recommendedRule === "give_feedback", "give feedback when eligible");
  assert(eligible.nodes.contribute.nextActionHref === "/feed", "contribute CTA routes to feed");
}

// ------------------------------------------------------- contribute + loop
{
  const s = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1")],
      feedbackReceived: [fb("fb-1")],
      applications: [application("fb-1", "demonstrated")],
      feedbackGiven: [
        fb("fb-mine", { authorId: ME, recipientId: OTHER, proofId: "proof-other", helpful: true, createdAt: "2026-07-05T10:00:00.000Z" })
      ],
      proofDirectionById: { "proof-other": DIR.id }
    })
  );
  assert(s.nodes.contribute.status === "completed", "helpful authored feedback completes contribute");
  assert(s.completedNodeCount === 5, "all five nodes completed");
  assert(s.completedLoopCount === 1, "full loop counted once");
  assert(s.updatedAt === "2026-07-05T10:00:00.000Z", "updatedAt tracks newest evidence");

  // Authored-but-not-helpful = in_progress; unknown proof direction is excluded.
  const partial = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1")],
      feedbackReceived: [fb("fb-1")],
      applications: [application("fb-1", "practiced")],
      feedbackGiven: [
        fb("fb-mine", { authorId: ME, recipientId: OTHER, proofId: "proof-other", helpful: false }),
        fb("fb-unknown", { authorId: ME, recipientId: OTHER, proofId: "proof-unknown", helpful: true })
      ],
      proofDirectionById: { "proof-other": DIR.id }
    })
  );
  assert(partial.nodes.contribute.status === "in_progress", "authored feedback in flight = in_progress");
  assert(partial.completedLoopCount === 0, "no loop until contribute completes");
}

// --------------------------------------------- moderation + foreign rows
{
  const s = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1", { moderationStatus: "removed" })],
      feedbackReceived: [fb("fb-1", { moderationStatus: "pending" })]
    })
  );
  assert(s.nodes.prove.status !== "completed", "removed proof never completes prove");
  assert(s.nodes.prove.evidenceCount === 0, "removed proof leaves no evidence");
  assert(s.nodes.feedback.status === "locked", "pending feedback is invisible (prove incomplete)");

  const pendingOwn = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1", { moderationStatus: "pending" })]
    })
  );
  assert(pendingOwn.nodes.prove.status === "attention_needed", "own pending proof = calm attention state");
  assert(pendingOwn.nodes.prove.explanation.toLowerCase().includes("review"), "attention explains the hold");

  const limited = buildConstellationState(
    base({ completions: [completion("comm-s1")], ownProofs: [proof("proof-1", { moderationStatus: "limited" })] })
  );
  assert(limited.nodes.prove.status === "completed", "limited stays visible/counted");

  const foreign = buildConstellationState(
    base({
      completions: [completion("comm-s1")],
      ownProofs: [proof("proof-1")],
      feedbackReceived: [fb("fb-foreign", { recipientId: OTHER })],
      applications: [application("fb-foreign", "practiced")]
    })
  );
  assert(foreign.nodes.feedback.status === "available", "foreign-recipient feedback ignored");
  assert(foreign.nodes.apply.status === "locked", "application to invisible feedback ignored");
}

// ------------------------------------------------------ evidence list rules
{
  const many = Array.from({ length: 8 }, (_, i) =>
    completion(`comm-s1`, `2026-07-0${(i % 7) + 1}T10:00:00.000Z`)
  ).map((c, i) => ({ ...c, id: `comp-${i}`, promptId: i < 4 ? "comm-s1" : "comm-s2" }));
  const s = buildConstellationState(base({ completions: many }));
  assert(s.nodes.practice.evidence.length <= 5, "evidence list capped at 5");
  const times = s.nodes.practice.evidence.map((e) => e.occurredAt);
  assert([...times].sort().reverse().join() === times.join(), "evidence sorted newest first");
  assert(s.nodes.practice.evidence[0].href === "/practice/comm-s1" || s.nodes.practice.evidence[0].href === "/practice/comm-s2", "completion evidence links to practice");
  assert(s.nodes.practice.progressCurrent === 2, "distinct prompts practiced = 2");
}

// ------------------------------------------------------------- no direction
{
  const s = buildConstellationState(base({ direction: null }));
  assert(s.directionId === "" && s.directionName === "", "no direction = empty ids");
  assert(s.nodes.practice.status === "active", "still renders a composed, actionable map");
  assert(s.recommendedRule === "start_practice", "CTA is choose/start practice");
}

// ------------------------------------------------------------- determinism
{
  const inputs = base({
    completions: [completion("comm-s1")],
    ownProofs: [proof("proof-1")],
    feedbackReceived: [fb("fb-1")],
    applications: [application("fb-1", "practiced")],
    eligibleProofToReview: true
  });
  const a = JSON.stringify(buildConstellationState(inputs));
  const b = JSON.stringify(buildConstellationState(inputs));
  assert(a === b, "projection is deterministic");
}

console.log("check-constellation: all assertions passed ✓");
