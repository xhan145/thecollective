import type { AiResponse, AiService, AiUserContext } from "./aiTypes";
import type { Feedback, PracticePrompt, Proof } from "./betaTypes";
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

export const mockAiService: AiService = {
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
  }
};

export function getAiEndpoint() {
  return process.env.NEXT_PUBLIC_COLLECTIVE_AI_ENDPOINT || process.env.VITE_COLLECTIVE_AI_ENDPOINT || "";
}

export function isAiEnabled() {
  const explicit = process.env.NEXT_PUBLIC_COLLECTIVE_AI_ENABLED || process.env.VITE_COLLECTIVE_AI_ENABLED;
  if (!explicit) return true;
  return explicit !== "false";
}

export function isMockAiMode() {
  const explicit = process.env.NEXT_PUBLIC_COLLECTIVE_AI_MOCK_MODE || process.env.VITE_COLLECTIVE_AI_MOCK_MODE;
  if (explicit) return explicit !== "false";
  return !getAiEndpoint();
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

  return {
    generatePracticePrep(prompt: PracticePrompt, userContext: AiUserContext) {
      return callRemote("PRACTICE_PREP", { prompt, userContext });
    },
    generateReflectionHelp(proof: Proof | null, reflectionText: string, prompt: PracticePrompt | undefined, userContext: AiUserContext) {
      return callRemote("REFLECTION_HELPER", { proof, reflectionText, prompt, userContext });
    },
    generateFeedbackSuggestion(proof: Proof, draftFeedback: string, userContext: AiUserContext) {
      return callRemote("FEEDBACK_COACH", { proof, draftFeedback, userContext });
    },
    generateFeedbackSummary(proof: Proof, feedbackList: Feedback[], userContext: AiUserContext) {
      return callRemote("FEEDBACK_SUMMARY", { proof, feedbackList, userContext });
    }
  };
}

export function getCollectiveAiService(): AiService {
  const endpoint = getAiEndpoint();
  if (!isAiEnabled() || !endpoint || isMockAiMode()) return mockAiService;
  return makeRemoteAiService(endpoint);
}
