"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { flagPossiblyLowQualityFeedback, suggestSafeFeedbackPrompts } from "@/lib/aiFeedback";
import type { FeedbackType } from "@/lib/proofModels";
import { Pill, SectionHeader } from "./ui";

const feedbackTypes: Array<{ value: FeedbackType; label: string }> = [
  { value: "encouragement", label: "Encouragement" },
  { value: "suggestion", label: "Suggestion" },
  { value: "question", label: "Question" },
  { value: "correction", label: "Correction" }
];

export function FeedbackComposer({ proofId }: { proofId: string }) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("suggestion");
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const safePrompts = useMemo(() => suggestSafeFeedbackPrompts(), []);
  const lowQuality = text.length > 0 && flagPossiblyLowQualityFeedback(text);
  const disabled = lowQuality || text.trim().length < 12;

  function submitFeedback() {
    if (disabled) return;
    sessionStorage.setItem(`collective.demo.feedback.${proofId}`, JSON.stringify({ feedbackType, text, createdAt: new Date().toISOString() }));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="glass-panel p-6">
        <Pill tone="success">Feedback saved</Pill>
        <h2 className="mt-4 text-xl font-black">Useful support added</h2>
        <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">Demo mode saved your response locally. Specific feedback helps the practice loop continue.</p>
      </div>
    );
  }

  return (
    <section className="soft-card p-4">
      <SectionHeader eyebrow="Feedback circle" title="Give useful feedback" />
      <div className="mt-4 space-y-2">
        {safePrompts.map((prompt) => (
          <p key={prompt} className="surface-row p-3 text-xs leading-5 text-[#c8c2b8]">{prompt}</p>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {feedbackTypes.map((item) => (
          <button key={item.value} type="button" onClick={() => setFeedbackType(item.value)} className={`chip-button rounded-full border px-3 py-2.5 text-xs font-black transition ${feedbackType === item.value ? "border-purple2/50 bg-purple/15 text-white shadow-soft" : "border-white/10 bg-white/[0.04] text-[#8f887e]"}`}>
            {item.label}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-sm font-bold">Your feedback</label>
      <textarea value={text} onChange={(event) => setText(event.target.value)} className="input mt-2 min-h-32" placeholder="Name what worked, then offer one possible next step." />
      {lowQuality && <p className="mt-3 rounded-[22px] bg-orange/10 px-3 py-2 text-xs leading-5 text-orange">This may be too vague or harsh. Try making it specific, kind, and useful.</p>}
      <button type="button" onClick={submitFeedback} className="btn-primary mt-4 w-full" disabled={disabled}>
        <Send size={16} />
        Send feedback
      </button>
    </section>
  );
}
