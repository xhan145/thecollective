import type { MediaAwareFeedback, ProofType, ProofVisibility } from "./types";

export type AiProofInput = {
  pathTitle?: string;
  promptTitle?: string;
  promptInstruction?: string;
  proofType: ProofType;
  textResponse?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  linkUrl?: string;
  reflection: string;
  feedbackRequest?: string;
  visibility?: ProofVisibility;
};

// AI is a support layer only. It may summarize, suggest safer prompts, and flag low-quality feedback.
// It must not judge user worth, decide trustworthiness, replace human feedback, or generate fake proof.
export function createMockAiFeedback(input: AiProofInput, proofLabel: string): MediaAwareFeedback {
  return {
    summary: `You submitted ${proofLabel} proof for ${input.promptTitle || "this practice"}.`,
    whatWorked: "You captured a concrete attempt and added reflection. That makes the proof easier for a person to respond to usefully.",
    whatCouldImprove: input.feedbackRequest ? "Your feedback request is focused. The next improvement is to point reviewers to the exact moment or choice you want reviewed." : "Add a focused feedback request so a reviewer knows whether to look at clarity, tone, courage, evidence, or next steps.",
    nextStep: "Choose one small adjustment, then submit another proof after the next practice.",
    reflectionQuestion: "What did this proof make visible about your progress, effort, or resistance?",
    riskLevel: "low",
    confidenceScore: 0.76,
    mediaNotes: `Demo mode received metadata for ${input.fileName || input.linkUrl || proofLabel}. It does not send large binary files to OpenAI. Future media analysis should use safe extraction first.`
  };
}

export function suggestReflectionPrompts(proofType: ProofType) {
  if (proofType === "video") {
    return ["What did the recording show about your pacing?", "What would you repeat in the next take?", "What feedback would feel safe and useful?"];
  }
  if (proofType === "image" || proofType === "screenshot") {
    return ["What changed from before to after?", "What does the image make easier to understand?", "What next step is visible now?"];
  }
  return ["What did you practice?", "What felt different this time?", "What is one small next step?"];
}

export function suggestSafeFeedbackPrompts() {
  return [
    "Be specific, kind, and useful.",
    "Respond to the practice, not the person.",
    "Help them take the next step."
  ];
}

export function flagPossiblyLowQualityFeedback(text: string) {
  const trimmed = text.trim().toLowerCase();
  if (trimmed.length < 12) return true;
  return ["bad", "cringe", "stupid", "just do better"].some((phrase) => trimmed.includes(phrase));
}
