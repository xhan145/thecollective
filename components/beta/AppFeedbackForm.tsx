"use client";

import { useState } from "react";
import type { AppFeedbackCategory } from "@/lib/betaTypes";
import { Button, Card, SuccessState, TextArea } from "./ui";
import { useBetaApp } from "./AppStateProvider";

const categories: AppFeedbackCategory[] = ["bug", "confusing", "idea", "safety", "other"];

export function AppFeedbackForm() {
  const { submitAppFeedback } = useBetaApp();
  const [category, setCategory] = useState<AppFeedbackCategory>("idea");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return <SuccessState title="Feedback saved." body="Thank you for helping shape the beta. Small notes are useful." />;
  }

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-lg font-extrabold text-[#111111]">App feedback</h2>
        <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">Tell us what felt useful, confusing, or unsafe. This helps the beta improve.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`min-h-11 rounded-full border px-3 text-sm font-extrabold capitalize ${category === item ? "border-[#F2A900] bg-[#FFF1C7] text-[#111111]" : "border-[#EFE7D8] bg-white text-[#6E6E6E]"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <TextArea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What should we fix, clarify, or keep?" />
      <Button
        className="w-full"
        disabled={!body.trim()}
        onClick={() => {
          submitAppFeedback({ category, body, route: typeof window !== "undefined" ? window.location.pathname : undefined });
          setSent(true);
        }}
      >
        Send beta feedback
      </Button>
    </Card>
  );
}
