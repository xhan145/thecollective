import { NextResponse } from "next/server";
import { mockAiService } from "@/lib/aiService";
import type { AiFeature, AiUserContext } from "@/lib/aiTypes";
import type { Feedback, PracticePrompt, Proof } from "@/lib/betaTypes";

type CollectiveAiRequest = {
  feature: AiFeature;
  input: {
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

export async function POST(request: Request) {
  const body = (await request.json()) as CollectiveAiRequest;
  const userContext = body.input.userContext || fallbackContext;

  if (body.feature === "PRACTICE_PREP" && body.input.prompt) {
    return NextResponse.json(await mockAiService.generatePracticePrep(body.input.prompt, userContext));
  }

  if (body.feature === "REFLECTION_HELPER") {
    return NextResponse.json(
      await mockAiService.generateReflectionHelp(
        body.input.proof || null,
        body.input.reflectionText || "",
        body.input.prompt,
        userContext
      )
    );
  }

  if (body.feature === "FEEDBACK_COACH" && body.input.proof) {
    return NextResponse.json(
      await mockAiService.generateFeedbackSuggestion(body.input.proof, body.input.draftFeedback || "", userContext)
    );
  }

  if (body.feature === "FEEDBACK_SUMMARY" && body.input.proof) {
    return NextResponse.json(
      await mockAiService.generateFeedbackSummary(body.input.proof, body.input.feedbackList || [], userContext)
    );
  }

  return NextResponse.json({ error: "Unsupported Collective AI request." }, { status: 400 });
}
