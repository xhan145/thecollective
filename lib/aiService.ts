import type { AiResponse, AiService, AiUserContext, CollectiveAiAction, CollectivePanelInput, CollectivePanelResult } from "./aiTypes";
import type { SafetyReviewInput, SafetyReviewOutput } from "./ai/agents/safety-reviewer";
import type { Feedback, PracticePrompt, Proof } from "./betaTypes";
import { reviewTextSafety } from "./ai/safety";
import { collectiveAiSystemPrompt } from "./collectiveAiPolicy";

function makeAiId(feature: AiResponse["feature"]) {
  return `ai-${feature.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

function compact(text: string, fallback: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return fallback;
  return clean.length > 160 ? `${clean.slice(0, 157)}...` : clean;
}

function promptFromDirection(direction = "confidence", context = ""): PracticePrompt {
  const title = compact(direction, "Small practice");
  return {
    id: `generated-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "practice"}`,
    directionId: "direction-confidence",
    title: `Small practice for ${title}`,
    description: compact(context, "Practice one useful step that is safe to repeat."),
    prompt: context || "Choose one clear thing to say or do, then capture a short note about what changed.",
    type: "reflection",
    estimatedMinutes: 5,
    beginnerSafe: true
  };
}

function textFromInput(input: Record<string, unknown>) {
  try {
    return JSON.stringify(input).slice(0, 4000);
  } catch {
    return "";
  }
}

function safetyTextFromInput(input: Record<string, unknown>) {
  return typeof input.text === "string" ? input.text : textFromInput(input);
}

function safetyResponse(action: CollectiveAiAction, safety: SafetyReviewOutput): AiResponse {
  const title = safety.needs_human_review ? "Needs a human review" : "Add one more detail";
  const summary = safety.safe_redirect || "This needs a little more context before AI can help safely.";
  return {
    id: makeAiId("SAFETY_REVIEW"),
    feature: "SAFETY_REVIEW",
    title,
    summary,
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

export const mockAiService: AiService = {
  async generatePractice(input, userContext) {
    void userContext;
    const prompt = input.prompt || promptFromDirection(input.direction, input.context);
    const response = await mockAiService.generatePracticePrep(prompt, userContext);
    return {
      ...response,
      id: makeAiId("PRACTICE_GENERATION"),
      feature: "PRACTICE_GENERATION",
      title: prompt.title,
      summary: "Here is one small practice you can do without turning it into a performance.",
      suggestedNextStep: "Try it once, then save one sentence of proof."
    };
  },

  async generatePracticePrep(prompt) {
    const title = `Simple plan for ${prompt.title}`;
    return {
      id: makeAiId("PRACTICE_PREP"),
      feature: "PRACTICE_PREP",
      title,
      summary: "Use a small structure, then stop before it turns into performance.",
      bullets: [
        "Say what you are practicing in one sentence.",
        "Share one small reason it matters.",
        "End with one thing you want to improve."
      ],
      suggestedNextStep: "Speak clearly, not perfectly.",
      caution: "This is practice. It does not need to feel polished.",
      structured: {
        kind: "practicePrep",
        data: {
          title,
          steps: [
            "Say what you are practicing in one sentence.",
            "Share one small reason it matters.",
            "End with one thing you want to improve."
          ],
          focus: "Speak clearly, not perfectly.",
          encouragement: "This is practice. It does not need to feel polished."
        }
      },
      createdAt: now()
    };
  },

  async prepareProof(prompt) {
    const title = prompt?.title || "this practice";
    return {
      id: makeAiId("PROOF_PREP"),
      feature: "PROOF_PREP",
      title: "Prepare proof safely",
      summary: "Capture enough evidence to remember the practice, without sharing more than you need.",
      bullets: [
        `Proof idea: one short note about ${title}.`,
        "Safe scope: include what changed, not private details.",
        "Feedback request: ask for one thing you want reviewed."
      ],
      suggestedNextStep: "Write one sentence that starts with: I practiced...",
      structured: {
        kind: "proofPrep",
        data: {
          proofIdea: `One short note, screenshot, or clip that shows you tried ${title}.`,
          safeScope: "Keep private names, secrets, and sensitive context out of the proof.",
          feedbackRequest: "Ask for feedback on clarity, tone, or the next small step.",
          nextSmallStep: "Write one sentence that starts with: I practiced..."
        }
      },
      createdAt: now()
    };
  },

  async generateReflectionHelp(_proof, reflectionText, prompt) {
    const reflection = compact(reflectionText, "You practiced showing up and putting your thoughts into words.");
    return {
      id: makeAiId("REFLECTION_HELPER"),
      feature: "REFLECTION_HELPER",
      title: "Reflection help",
      summary: "It makes sense if this felt awkward. That usually means you practiced something real.",
      bullets: [
        "You practiced showing up and putting your thoughts into words.",
        prompt ? `This connects to: ${prompt.title}.` : `Your reflection was: ${reflection}`,
        "The next version only needs one clearer detail."
      ],
      suggestedNextStep: "Try the same prompt once more with a slower first sentence.",
      structured: {
        kind: "reflectionHelp",
        data: {
          validation: "It makes sense if this felt awkward. That usually means you practiced something real.",
          whatYouPracticed: "You practiced showing up and putting your thoughts into words.",
          nextSmallStep: "Try the same prompt once more with a slower first sentence."
        }
      },
      createdAt: now()
    };
  },

  async reflectOnProof(proof, reflectionText, prompt, userContext) {
    return mockAiService.generateReflectionHelp(proof, reflectionText, prompt, userContext);
  },

  async generateFeedbackSuggestion(proof, draftFeedback) {
    const draft = compact(draftFeedback, "Your message had a clear starting point.");
    return {
      id: makeAiId("FEEDBACK_COACH"),
      feature: "FEEDBACK_COACH",
      title: "Make feedback more useful",
      summary: "Keep feedback specific, kind, and inside the request.",
      bullets: [
        "What worked: Your message had a clear starting point.",
        "Suggestion: Try adding one specific example so the listener can follow faster.",
        "Encouragement: This is a strong practice rep to build from."
      ],
      suggestedNextStep: "Use only the parts that fit what you actually noticed.",
      caution: `Draft context: ${draft}. Proof: ${proof.title}.`,
      structured: {
        kind: "feedbackCoach",
        data: {
          whatWorked: "Your message had a clear starting point.",
          suggestion: "Try adding one specific example so the listener can follow faster.",
          encouragement: "This is a strong practice rep to build from."
        }
      },
      createdAt: now()
    };
  },

  async coachFeedback(proof, draftFeedback, userContext) {
    return mockAiService.generateFeedbackSuggestion(proof, draftFeedback, userContext);
  },

  async generateFeedbackSummary(_proof, feedbackList) {
    const hasFeedback = feedbackList.length > 0;
    return {
      id: makeAiId("FEEDBACK_SUMMARY"),
      feature: "FEEDBACK_SUMMARY",
      title: "Feedback summary",
      summary: hasFeedback
        ? "People noticed that your message was clear and easy to understand."
        : "No feedback has arrived yet. Feedback can come next.",
      bullets: [
        hasFeedback ? "Common theme: your message was clear." : "Common theme: still waiting for peer feedback.",
        hasFeedback ? "Useful suggestion: slow down slightly." : "Useful suggestion: ask for feedback on one specific part.",
        "Next step: repeat the practice with one short pause after the first sentence."
      ],
      suggestedNextStep: "Record the same idea again with one short pause after the first sentence.",
      structured: {
        kind: "feedbackSummary",
        data: {
          commonTheme: hasFeedback
            ? "People noticed that your message was clear and easy to understand."
            : "No feedback has arrived yet.",
          usefulSuggestion: hasFeedback
            ? "The main improvement was to slow down slightly."
            : "Ask for one specific kind of feedback.",
          nextPracticeStep: "Record the same idea again with one short pause after the first sentence."
        }
      },
      createdAt: now()
    };
  },

  async summarizeFeedback(proof, feedbackList, userContext) {
    return mockAiService.generateFeedbackSummary(proof, feedbackList, userContext);
  },

  async reviewSafety(input: SafetyReviewInput) {
    return reviewTextSafety(input);
  },

  async runCollectivePanel(input: CollectivePanelInput) {
    const safety = await mockAiService.reviewSafety({
      action: input.action,
      text: safetyTextFromInput(input.input),
      context: input.input
    });

    if (safety.needs_human_review) {
      return panelResult(input.action, safetyResponse(input.action, safety), safety);
    }

    const context = input.userContext || {
      userId: "mock-user",
      displayName: "Member",
      cohortId: "founding-circle"
    };
    const raw = input.input as {
      direction?: string;
      context?: string;
      prompt?: PracticePrompt;
      proof?: Proof | null;
      reflectionText?: string;
      draftFeedback?: string;
      feedbackList?: Feedback[];
    };

    if (input.action === "generate_practice") {
      return panelResult(input.action, await mockAiService.generatePractice(raw, context), safety);
    }
    if (input.action === "prepare_proof") {
      return panelResult(input.action, await mockAiService.prepareProof(raw.prompt, context), safety);
    }
    if (input.action === "reflect_on_proof") {
      return panelResult(
        input.action,
        await mockAiService.reflectOnProof(raw.proof || null, raw.reflectionText || "", raw.prompt, context),
        safety
      );
    }
    if (input.action === "coach_feedback" && raw.proof) {
      return panelResult(input.action, await mockAiService.coachFeedback(raw.proof, raw.draftFeedback || "", context), safety);
    }
    if (input.action === "summarize_feedback" && raw.proof) {
      return panelResult(input.action, await mockAiService.summarizeFeedback(raw.proof, raw.feedbackList || [], context), safety);
    }
    if (input.action === "review_safety") {
      return panelResult(input.action, safetyResponse(input.action, safety), safety);
    }

    return panelResult(input.action, {
      id: makeAiId("COLLECTIVE_PANEL"),
      feature: "COLLECTIVE_PANEL",
      title: "Demo panel",
      summary: "This generated example is for product review only, not member activity.",
      bullets: [
        "Label it as an example.",
        "Do not count it toward trust.",
        "Use it only to help someone start."
      ],
      suggestedNextStep: "Replace demo activity with real proof as soon as it exists.",
      structured: {
        kind: "summary",
        data: {
          title: "Demo panel",
          summary: "This generated example is for product review only, not member activity.",
          bullets: ["Label it as an example.", "Do not count it toward trust.", "Use it only to help someone start."],
          suggestedNextStep: "Replace demo activity with real proof as soon as it exists."
        }
      },
      createdAt: now()
    }, safety);
  }
};

export function getAiEndpoint() {
  return process.env.NEXT_PUBLIC_COLLECTIVE_AI_ENDPOINT || process.env.VITE_COLLECTIVE_AI_ENDPOINT || "";
}

export function isAiEnabled() {
  // Default OFF for beta (R29): AI is opt-in and must be explicitly enabled.
  const explicit = process.env.NEXT_PUBLIC_COLLECTIVE_AI_ENABLED || process.env.VITE_COLLECTIVE_AI_ENABLED;
  return explicit === "true";
}

export function isMockAiMode() {
  const explicit = process.env.NEXT_PUBLIC_COLLECTIVE_AI_MOCK_MODE || process.env.VITE_COLLECTIVE_AI_MOCK_MODE;
  if (explicit) return explicit !== "false";
  // Real mode only when a server-side OpenAI key exists. The browser never has
  // this var, so client-side stays on mock/route — which is correct.
  return !process.env.OPENAI_API_KEY;
}

export function makeRemoteAiService(endpoint: string): AiService {
  async function callRemote(feature: AiResponse["feature"], input: unknown): Promise<AiResponse> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature, input, policy: collectiveAiSystemPrompt })
    });

    if (!response.ok) {
      throw new Error("AI support is not available right now. Try the mock helper or come back later.");
    }

    return response.json() as Promise<AiResponse>;
  }

  async function callAction(action: CollectiveAiAction, input: Record<string, unknown>, userContext?: AiUserContext): Promise<CollectivePanelResult> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, input, userContext })
    });

    if (!response.ok) {
      throw new Error("AI support is not available right now. Try the mock helper or come back later.");
    }

    return response.json() as Promise<CollectivePanelResult>;
  }

  function unwrapAiResponse(result: CollectivePanelResult): AiResponse {
    const response = result.result.response;
    if (response && typeof response === "object" && "id" in response) return response as AiResponse;
    throw new Error("AI support returned an unexpected response.");
  }

  return {
    generatePractice(input: { direction?: string; context?: string; prompt?: PracticePrompt }, userContext: AiUserContext) {
      return callAction("generate_practice", input as Record<string, unknown>, userContext).then(unwrapAiResponse);
    },
    generatePracticePrep(prompt: PracticePrompt, userContext: AiUserContext) {
      return callRemote("PRACTICE_PREP", { prompt, userContext });
    },
    prepareProof(prompt: PracticePrompt | undefined, userContext: AiUserContext) {
      return callAction("prepare_proof", { prompt }, userContext).then(unwrapAiResponse);
    },
    reflectOnProof(proof: Proof | null, reflectionText: string, prompt: PracticePrompt | undefined, userContext: AiUserContext) {
      return callAction("reflect_on_proof", { proof, reflectionText, prompt }, userContext).then(unwrapAiResponse);
    },
    generateReflectionHelp(proof: Proof | null, reflectionText: string, prompt: PracticePrompt | undefined, userContext: AiUserContext) {
      return callRemote("REFLECTION_HELPER", { proof, reflectionText, prompt, userContext });
    },
    coachFeedback(proof: Proof, draftFeedback: string, userContext: AiUserContext) {
      return callAction("coach_feedback", { proof, draftFeedback }, userContext).then(unwrapAiResponse);
    },
    generateFeedbackSuggestion(proof: Proof, draftFeedback: string, userContext: AiUserContext) {
      return callRemote("FEEDBACK_COACH", { proof, draftFeedback, userContext });
    },
    summarizeFeedback(proof: Proof, feedbackList: Feedback[], userContext: AiUserContext) {
      return callAction("summarize_feedback", { proof, feedbackList }, userContext).then(unwrapAiResponse);
    },
    generateFeedbackSummary(proof: Proof, feedbackList: Feedback[], userContext: AiUserContext) {
      return callRemote("FEEDBACK_SUMMARY", { proof, feedbackList, userContext });
    },
    reviewSafety(input: SafetyReviewInput) {
      return callAction("review_safety", { ...input }).then((result) => result.safety);
    },
    runCollectivePanel(input: CollectivePanelInput) {
      return callAction(input.action, input.input, input.userContext);
    }
  };
}

export function getCollectiveAiService(): AiService {
  const endpoint = getAiEndpoint();
  if (!isAiEnabled() || !endpoint || isMockAiMode()) return mockAiService;
  return makeRemoteAiService(endpoint);
}
