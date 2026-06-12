import "server-only";

export type AiMode =
  | "proof_reflection"
  | "feedback_helper"
  | "practice_coach"
  | "beta_feedback_summary";

const SYSTEM_PROMPT = `You are a calm, supportive practice companion inside Collective,
a beginner-safe progress platform. You are support, not authority.

Hard rules:
- Never score, grade, rank, or judge the person.
- Never declare whether someone is confident, skilled, worthy, or trusted.
- Never use hype, clout, or social-media language (viral, followers, likes, crush it, elite).
- Keep responses short: 3-5 sentences or 3 short bullets.
- Be specific, kind, and useful. Beginner safety first.`;

const MODE_PROMPTS: Record<AiMode, string> = {
  proof_reflection:
    "The user shares proof of a small practice. Ask 3 short reflection questions: what improved, what felt hard, and one small next step. Do not evaluate quality.",
  feedback_helper:
    "The user drafted feedback for someone else's practice proof. Rewrite it to be more specific, useful, and kind. Keep their intent. Return only the improved feedback.",
  practice_coach:
    "The user is about to do a small practice. Give one short, encouraging coaching prompt to help them start. No pressure language.",
  beta_feedback_summary:
    "Summarize the main themes in this app feedback in 3 short bullets: what works, what is confusing, what to build next.",
};

const MOCKS: Record<AiMode, string> = {
  proof_reflection:
    "• What feels clearer now than before you practiced?\n• Which moment felt hardest — and what made it hard?\n• What is one small step you could try next time?",
  feedback_helper:
    "What worked: your main point came through clearly. One thing that could be clearer: the example in the middle — one concrete detail would help. A useful next step: try ending with the single idea you want remembered.",
  practice_coach:
    "Pick one idea you actually care about — that makes everything easier. Say the main point first, plainly. One honest take beats a perfect script.",
  beta_feedback_summary:
    "• Useful: the small daily practice and clear proof flow.\n• Confusing: where feedback appears after submitting.\n• Build next: simpler way to see responses to your proof.",
};

export interface ReflectResult {
  output: string;
  source: "openai" | "mock";
}

export async function runReflection(
  mode: AiMode,
  input: string,
): Promise<ReflectResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { output: MOCKS[mode], source: "mock" };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        temperature: 0.6,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: MODE_PROMPTS[mode] },
          { role: "user", content: input.slice(0, 4000) },
        ],
      }),
    });
    if (!res.ok) return { output: MOCKS[mode], source: "mock" };
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const output = json.choices?.[0]?.message?.content?.trim();
    if (!output) return { output: MOCKS[mode], source: "mock" };
    return { output, source: "openai" };
  } catch {
    return { output: MOCKS[mode], source: "mock" };
  }
}

export function isValidMode(mode: string): mode is AiMode {
  return (
    mode === "proof_reflection" ||
    mode === "feedback_helper" ||
    mode === "practice_coach" ||
    mode === "beta_feedback_summary"
  );
}
