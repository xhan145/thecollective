"use client";

import { useState } from "react";
import type { AiFeature, AiHelpfulness, AiIssueType, AiResponse, AiSourceType } from "@/lib/aiTypes";
import { Badge, Button, Card, TextArea } from "./ui";
import { useBetaApp } from "./AppStateProvider";
import { isAiEnabled } from "@/lib/aiService";

const issueOptions: Array<{ value: AiIssueType; label: string }> = [
  { value: "TOO_GENERIC", label: "Too generic" },
  { value: "TOO_MUCH_TEXT", label: "Too much text" },
  { value: "NOT_CLEAR", label: "Not clear" },
  { value: "FELT_JUDGMENTAL", label: "Felt judgmental" },
  { value: "WRONG_CONTEXT", label: "Wrong context" },
  { value: "ACTUALLY_USEFUL", label: "Actually useful" },
  { value: "OTHER", label: "Other" }
];

const helpfulnessOptions: Array<{ value: AiHelpfulness; label: string }> = [
  { value: "YES", label: "Yes" },
  { value: "KIND_OF", label: "Kind of" },
  { value: "NO", label: "No" }
];

export function AiSupportCard({
  title,
  description,
  ctaLabel,
  feature,
  sourceType,
  sourceId,
  promptId,
  proofId,
  inputSummary,
  disabled,
  onGenerate,
  onApply,
  applyLabel = "Use suggestion"
}: {
  title: string;
  description: string;
  ctaLabel: string;
  feature: AiFeature;
  sourceType: AiSourceType;
  sourceId: string;
  promptId?: string;
  proofId?: string;
  inputSummary: string;
  disabled?: boolean;
  onGenerate: () => Promise<AiResponse>;
  onApply?: (response: AiResponse) => void;
  applyLabel?: string;
}) {
  const { recordAiInteraction, submitAiUserFeedback } = useBetaApp();
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [helpfulness, setHelpfulness] = useState<AiHelpfulness | null>(null);
  const [issueType, setIssueType] = useState<AiIssueType | "">("");
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI is opt-in (R29): render nothing when disabled — no card, no interaction
  // logging (R28). Hooks above always run so this early return is safe.
  if (!isAiEnabled()) return null;

  async function runAi() {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const output = await onGenerate();
      const interaction = recordAiInteraction({
        feature,
        sourceType,
        sourceId,
        promptId,
        proofId,
        inputSummary,
        output
      });
      setResponse(output);
      setInteractionId(interaction?.id || null);
      setFeedbackSent(false);
      setHelpfulness(null);
      setIssueType("");
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI support is not available right now.");
    } finally {
      setLoading(false);
    }
  }

  async function copyResponse() {
    if (!response || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText([response.summary, ...response.bullets, response.suggestedNextStep].join("\n"));
    setCopied(true);
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone="gold">AI support</Badge>
          <h2 className="mt-3 text-lg font-extrabold text-[#111111]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">{description}</p>
        </div>
      </div>

      <Button className="w-full" variant="secondary" onClick={runAi} disabled={disabled || loading}>
        {loading ? "Thinking..." : ctaLabel}
      </Button>

      {error && <p className="rounded-[18px] bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">{error}</p>}

      {response && (
        <div className="rounded-[20px] border border-[#EFE7D8] bg-white p-4">
          <h3 className="text-base font-extrabold text-[#111111]">{response.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#38322A]">{response.summary}</p>
          <ul className="mt-3 space-y-2">
            {response.bullets.slice(0, 3).map((bullet) => (
              <li key={bullet} className="rounded-[16px] bg-[#FFF8EE] p-3 text-sm leading-6 text-[#38322A]">{bullet}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-[16px] bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">
            Next small step: {response.suggestedNextStep}
          </p>
          {response.caution && <p className="mt-2 text-xs leading-5 text-[#6E6E6E]">{response.caution}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {onApply && <Button variant="secondary" onClick={() => onApply(response)}>{applyLabel}</Button>}
            <Button variant="quiet" onClick={copyResponse}>{copied ? "Copied" : "Copy"}</Button>
          </div>
        </div>
      )}

      {response && interactionId && !feedbackSent && (
        <div className="rounded-[20px] bg-[#FFF8EE] p-4">
          <p className="text-sm font-extrabold text-[#111111]">Was this helpful?</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {helpfulnessOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setHelpfulness(option.value)}
                className={`min-h-11 rounded-full border px-2 text-xs font-extrabold ${helpfulness === option.value ? "border-[#F2A900] bg-[#FFF1C7] text-[#111111]" : "border-[#EFE7D8] bg-white text-[#6E6E6E]"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {helpfulness && (
            <div className="mt-3 space-y-3">
              <select
                value={issueType}
                onChange={(event) => setIssueType(event.target.value as AiIssueType | "")}
                className="min-h-11 w-full rounded-[16px] border border-[#EFE7D8] bg-white px-3 text-sm font-bold text-[#38322A]"
                aria-label="AI feedback issue type"
              >
                <option value="">Issue type optional</option>
                {issueOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <TextArea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="What should the AI do better?"
                className="min-h-20"
              />
              <Button
                className="w-full"
                onClick={() => {
                  submitAiUserFeedback({
                    aiInteractionId: interactionId,
                    feature,
                    helpfulness,
                    issueType: issueType || undefined,
                    comment
                  });
                  setFeedbackSent(true);
                }}
              >
                Send AI feedback
              </Button>
            </div>
          )}
        </div>
      )}

      {feedbackSent && <p className="rounded-[18px] bg-[#E8F8EE] p-3 text-sm font-bold text-[#17743B]">Thanks. This helps us improve the AI.</p>}
    </Card>
  );
}
