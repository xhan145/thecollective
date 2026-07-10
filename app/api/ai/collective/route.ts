import { NextResponse } from "next/server";
import { runCollectivePanel } from "@/lib/ai/collective-orchestrator";
import { isAiEnabled } from "@/lib/aiService";
import type { AiFeature, AiUserContext, CollectiveAiAction } from "@/lib/aiTypes";
import type { Feedback, PracticePrompt, Proof } from "@/lib/betaTypes";

type CollectiveAiRequest = {
  action?: CollectiveAiAction;
  feature?: AiFeature;
  userContext?: AiUserContext;
  input?: {
    prompt?: PracticePrompt;
    proof?: Proof | null;
    reflectionText?: string;
    draftFeedback?: string;
    feedbackList?: Feedback[];
    userContext?: AiUserContext;
  };
};

const fallbackContext: AiUserContext = {
  userId: "server-demo",
  displayName: "Beta member",
  cohortId: "founding-circle"
};

const actionByFeature: Partial<Record<AiFeature, CollectiveAiAction>> = {
  PRACTICE_PREP: "generate_practice",
  PRACTICE_GENERATION: "generate_practice",
  PROOF_PREP: "prepare_proof",
  REFLECTION_HELPER: "reflect_on_proof",
  FEEDBACK_COACH: "coach_feedback",
  FEEDBACK_SUMMARY: "summarize_feedback",
  SAFETY_REVIEW: "review_safety",
  COLLECTIVE_PANEL: "run_demo_panel"
};

const supportedActions: CollectiveAiAction[] = [
  "generate_practice",
  "prepare_proof",
  "reflect_on_proof",
  "coach_feedback",
  "summarize_feedback",
  "review_safety",
  "run_demo_panel"
];

function safeInput(input: CollectiveAiRequest["input"]): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

export async function POST(request: Request) {
  // AI is opt-in (R29): the server endpoint enforces the flag too, so a direct
  // POST can't trigger model calls when beta AI is off.
  if (!isAiEnabled()) return NextResponse.json({ error: "AI is disabled." }, { status: 403 });
  try {
    const body = (await request.json()) as CollectiveAiRequest;
    const input = safeInput(body.input);
    const userContext = body.userContext || body.input?.userContext || fallbackContext;

    if (body.action) {
      if (!supportedActions.includes(body.action)) {
        return NextResponse.json({ ok: false, error: "Unsupported Collective AI action." }, { status: 400 });
      }

      const result = await runCollectivePanel({ action: body.action, input, userContext });
      return NextResponse.json(result);
    }

    if (body.feature) {
      const action = actionByFeature[body.feature];
      if (!action) {
        return NextResponse.json({ error: "Unsupported Collective AI request." }, { status: 400 });
      }

      const result = await runCollectivePanel({ action, input, userContext }, { log: false, userContext });
      return NextResponse.json(result.result.response);
    }

    return NextResponse.json({ ok: false, error: "Unsupported Collective AI request." }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "AI support is not available right now." }, { status: 500 });
  }
}
