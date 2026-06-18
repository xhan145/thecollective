import type { AiResponse, AiUserContext, CollectiveAiAction, CollectivePanelInput, CollectivePanelResult } from "../aiTypes";
import type { Feedback, PracticePrompt, Proof } from "../betaTypes";
import { mockAiService } from "../aiService";
import { getSupabaseServiceClient } from "../supabase/server";
import { reviewTextSafety } from "./safety";
import type { SafetyReviewInput, SafetyReviewOutput } from "./agents/safety-reviewer";
import * as feedbackCoach from "./agents/feedback-coach";
import * as practiceCoach from "./agents/practice-coach";
import * as reflectionHelper from "./agents/reflection-helper";
import * as safetyReviewer from "./agents/safety-reviewer";
import * as summaryComposer from "./agents/summary-composer";

type RunOptions = {
  userContext?: AiUserContext;
  relatedProofId?: string | null;
  relatedFeedbackId?: string | null;
  log?: boolean;
};

type SpecialistInput = {
  direction?: string;
  context?: string;
  prompt?: PracticePrompt;
  proof?: Proof | null;
  reflectionText?: string;
  draftFeedback?: string;
  feedbackList?: Feedback[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function now() {
  return new Date().toISOString();
}

function makeAiId(feature: AiResponse["feature"]) {
  return `ai-${feature.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function asUuid(value: string | null | undefined) {
  return value && UUID_RE.test(value) ? value : null;
}

function modelName() {
  return process.env.COLLECTIVE_AI_MODEL || "collective-mock-v0";
}

function shouldLog(options?: RunOptions) {
  return options?.log !== false && process.env.COLLECTIVE_AI_SKIP_AGENT_LOGS !== "true";
}

function inputText(input: Record<string, unknown>) {
  try {
    return JSON.stringify(input).slice(0, 4000);
  } catch {
    return "";
  }
}

function panelResult(action: CollectiveAiAction, response: AiResponse, safety: SafetyReviewOutput): CollectivePanelResult {
  return {
    ok: true,
    action,
    result: {
      response,
      data: response.structured.data,
      feature: response.feature
    },
    safety
  };
}

function boundaryResponse(action: CollectiveAiAction, safety: SafetyReviewOutput): AiResponse {
  return {
    id: makeAiId("SAFETY_REVIEW"),
    feature: "SAFETY_REVIEW",
    title: safety.needs_human_review ? "Needs a human review" : "Add one more detail",
    summary: safety.safe_redirect || "This needs a little more context before AI can help safely.",
    bullets: [
      safety.needs_human_review ? "Pause before using AI for this part." : "Keep the request specific and practice-focused.",
      "Remove private details or harsh wording if they are present.",
      "A safe next step can still be small."
    ],
    suggestedNextStep: safety.safe_redirect || "Rewrite the request with one concrete practice goal.",
    caution: `Safety status: ${safety.status}. Action: ${action}.`,
    structured: { kind: "safetyReview", data: safety },
    createdAt: now()
  };
}

async function logAgentRun(
  agentName: string,
  input: unknown,
  output: unknown,
  safetyStatus: string,
  startedAt: number,
  options?: RunOptions
) {
  if (!shouldLog(options)) return;
  const client = getSupabaseServiceClient();
  if (!client) return;

  await client
    .from("ai_agent_runs")
    .insert({
      user_id: asUuid(options?.userContext?.userId),
      related_proof_id: asUuid(options?.relatedProofId || null),
      related_feedback_id: asUuid(options?.relatedFeedbackId || null),
      agent_name: agentName,
      model_name: modelName(),
      input: input as Record<string, unknown>,
      output: output as Record<string, unknown>,
      safety_status: safetyStatus,
      latency_ms: Math.max(0, Date.now() - startedAt)
    })
    .then(({ error }) => {
      if (error) console.warn("Collective AI agent log skipped:", error.message);
    });
}

async function logUserInteraction(
  action: CollectiveAiAction,
  response: AiResponse,
  safety: SafetyReviewOutput,
  input: Record<string, unknown>,
  userContext?: AiUserContext,
  options?: RunOptions
) {
  if (!shouldLog(options)) return;
  const userId = asUuid(userContext?.userId);
  if (!userId) return;
  const client = getSupabaseServiceClient();
  if (!client) return;

  await client
    .from("ai_interactions")
    .insert({
      user_id: userId,
      cohort_id: userContext?.cohortId || "founding-circle",
      feature: response.feature,
      source_type: "APP_CONTEXT",
      source_id: action,
      prompt_id: typeof input.promptId === "string" ? input.promptId : null,
      proof_id: asUuid(typeof input.proofId === "string" ? input.proofId : null),
      input_summary: inputText(input).slice(0, 240),
      output: { response, safety }
    })
    .then(({ error }) => {
      if (error) console.warn("Collective AI interaction log skipped:", error.message);
    });
}

export async function runSafetyReview(input: SafetyReviewInput, options?: RunOptions): Promise<SafetyReviewOutput> {
  const startedAt = Date.now();
  const output = reviewTextSafety(input);
  await logAgentRun(safetyReviewer.agentName, input, output, output.status, startedAt, options);
  return output;
}

export async function runPracticeCoach(input: SpecialistInput, options?: RunOptions): Promise<AiResponse> {
  const startedAt = Date.now();
  const output = await mockAiService.generatePractice({ direction: input.direction, context: input.context, prompt: input.prompt }, options?.userContext || fallbackUserContext);
  await logAgentRun(practiceCoach.agentName, input, output, "ok", startedAt, options);
  return output;
}

export async function runReflectionHelper(input: SpecialistInput, options?: RunOptions): Promise<AiResponse> {
  const startedAt = Date.now();
  const output = await mockAiService.reflectOnProof(input.proof || null, input.reflectionText || "", input.prompt, options?.userContext || fallbackUserContext);
  await logAgentRun(reflectionHelper.agentName, input, output, "ok", startedAt, options);
  return output;
}

export async function runFeedbackCoach(input: SpecialistInput, options?: RunOptions): Promise<AiResponse> {
  const startedAt = Date.now();
  const proof = input.proof || fallbackProof;
  const output = await mockAiService.coachFeedback(proof, input.draftFeedback || "", options?.userContext || fallbackUserContext);
  await logAgentRun(feedbackCoach.agentName, input, output, "ok", startedAt, options);
  return output;
}

export async function runSummaryComposer(input: SpecialistInput & { response?: AiResponse }, options?: RunOptions): Promise<AiResponse> {
  const startedAt = Date.now();
  const response = input.response || (await mockAiService.summarizeFeedback(input.proof || fallbackProof, input.feedbackList || [], options?.userContext || fallbackUserContext));
  await logAgentRun(summaryComposer.agentName, input, response, "ok", startedAt, options);
  return response;
}

export async function runCollectivePanel(input: CollectivePanelInput, options?: RunOptions): Promise<CollectivePanelResult> {
  const userContext = input.userContext || options?.userContext || fallbackUserContext;
  const runOptions = { ...options, userContext };
  const safety = await runSafetyReview(
    {
      action: input.action,
      text: inputText(input.input),
      context: input.input
    },
    runOptions
  );

  let response: AiResponse;
  if (safety.needs_human_review) {
    response = boundaryResponse(input.action, safety);
  } else {
    const raw = input.input as SpecialistInput;
    if (input.action === "generate_practice") {
      response = await runPracticeCoach(raw, runOptions);
    } else if (input.action === "prepare_proof") {
      const startedAt = Date.now();
      response = await mockAiService.prepareProof(raw.prompt, userContext);
      await logAgentRun(practiceCoach.agentName, raw, response, safety.status, startedAt, runOptions);
    } else if (input.action === "reflect_on_proof") {
      response = await runReflectionHelper(raw, runOptions);
    } else if (input.action === "coach_feedback") {
      response = await runFeedbackCoach(raw, runOptions);
    } else if (input.action === "summarize_feedback") {
      response = await mockAiService.summarizeFeedback(raw.proof || fallbackProof, raw.feedbackList || [], userContext);
      await runSummaryComposer({ ...raw, response }, runOptions);
    } else if (input.action === "review_safety") {
      response = boundaryResponse(input.action, safety);
    } else {
      response = {
        id: makeAiId("COLLECTIVE_PANEL"),
        feature: "COLLECTIVE_PANEL",
        title: "Generated example panel",
        summary: "This is example activity for demo review only, not real member activity.",
        bullets: ["Label it as an example.", "Keep trust impact at zero.", "Replace it with real proof when available."],
        suggestedNextStep: "Use this only as a starting example.",
        structured: {
          kind: "summary",
          data: {
            title: "Generated example panel",
            summary: "This is example activity for demo review only, not real member activity.",
            bullets: ["Label it as an example.", "Keep trust impact at zero.", "Replace it with real proof when available."],
            suggestedNextStep: "Use this only as a starting example."
          }
        },
        createdAt: now()
      };
      await runSummaryComposer({ ...raw, response }, runOptions);
    }
  }

  await logUserInteraction(input.action, response, safety, input.input, userContext, runOptions);
  return panelResult(input.action, response, safety);
}

export async function prepareProof(input: SpecialistInput, options?: RunOptions) {
  return runCollectivePanel({ action: "prepare_proof", input: input as Record<string, unknown>, userContext: options?.userContext }, options);
}

export async function reflectOnProof(input: SpecialistInput, options?: RunOptions) {
  return runCollectivePanel({ action: "reflect_on_proof", input: input as Record<string, unknown>, userContext: options?.userContext }, options);
}

export async function coachFeedback(input: SpecialistInput, options?: RunOptions) {
  return runCollectivePanel({ action: "coach_feedback", input: input as Record<string, unknown>, userContext: options?.userContext }, options);
}

export async function summarizeFeedback(input: SpecialistInput, options?: RunOptions) {
  return runCollectivePanel({ action: "summarize_feedback", input: input as Record<string, unknown>, userContext: options?.userContext }, options);
}

const fallbackUserContext: AiUserContext = {
  userId: "server-demo",
  displayName: "Beta member",
  cohortId: "founding-circle"
};

const fallbackProof: Proof = {
  id: "demo-proof",
  userId: "server-demo",
  promptId: "demo-prompt",
  directionId: "direction-confidence",
  title: "Practice proof",
  body: "One small practice proof.",
  mediaType: "text",
  attachments: [],
  status: "submitted",
  visibility: "cohort",
  feedbackIds: [],
  createdAt: now(),
  isDemo: true
};
