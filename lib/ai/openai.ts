import "server-only";
import OpenAI from "openai";
import type { ZodType } from "zod";
import { collectiveAiSystemPrompt } from "../collectiveAiPolicy";
import { buildPersonaBlock } from "./persona";
import type { AiUserContext } from "../aiTypes";

function model() {
  return process.env.COLLECTIVE_AI_MODEL || "gpt-4o-mini";
}
function maxTokens() {
  return Number(process.env.COLLECTIVE_AI_MAX_TOKENS || 512);
}
function timeoutMs() {
  return Number(process.env.COLLECTIVE_AI_TIMEOUT_MS || 15000);
}

/** Pure: parse + validate model JSON. Throws on bad JSON or schema mismatch. */
export function parseAgentJson<T>(raw: string, schema: ZodType<T>): T {
  const parsed = JSON.parse(raw) as unknown;
  return schema.parse(parsed);
}

/**
 * Server-only. Run one agent against OpenAI and return validated typed output.
 * Throws on missing key, network/timeout, non-JSON, or schema mismatch — callers
 * (the orchestrator) translate any throw into the safe mock fallback.
 */
export async function runAgent<T>(args: {
  agentSystemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
  jsonHint: string;
  persona: AiUserContext;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const client = new OpenAI({ apiKey });

  const persona = buildPersonaBlock(args.persona);
  const system = [collectiveAiSystemPrompt, args.agentSystemPrompt, persona]
    .filter(Boolean)
    .join("\n\n");
  const user = `${args.userPrompt}\n\nReturn ONLY a JSON object with these keys: ${args.jsonHint}`;

  const completion = await client.chat.completions.create(
    {
      model: model(),
      max_tokens: maxTokens(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    { timeout: timeoutMs() },
  );

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("empty model response");
  return parseAgentJson(raw, args.schema);
}
