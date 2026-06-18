import { readFile } from "node:fs/promises";
import { config as loadEnv } from "dotenv";
import { getSupabaseServiceClient } from "../../lib/supabase/server";

loadEnv({ path: ".env.local" });
loadEnv();

type SourceKey = "oasst1" | "hh_rlhf" | "ultrafeedback" | "prosocial_dialog" | "civil_comments";

const sources: Record<SourceKey, {
  display_name: string;
  source_url: string;
  license_name: string;
  intended_use: "eval_only" | "safety_eval" | "preference_candidate";
  notes: string;
}> = {
  oasst1: {
    display_name: "OpenAssistant OASST1",
    source_url: "https://huggingface.co/datasets/OpenAssistant/oasst1",
    license_name: "Apache-2.0",
    intended_use: "eval_only",
    notes: "Use for eval review only until examples are manually cleaned and approved."
  },
  hh_rlhf: {
    display_name: "Anthropic HH-RLHF",
    source_url: "https://huggingface.co/datasets/Anthropic/hh-rlhf",
    license_name: "MIT",
    intended_use: "preference_candidate",
    notes: "Preference data requires manual review before training approval."
  },
  ultrafeedback: {
    display_name: "UltraFeedback",
    source_url: "https://huggingface.co/datasets/openbmb/UltraFeedback",
    license_name: "MIT",
    intended_use: "preference_candidate",
    notes: "Normalize only small reviewed samples by default."
  },
  prosocial_dialog: {
    display_name: "ProsocialDialog",
    source_url: "https://huggingface.co/datasets/allenai/prosocial-dialog",
    license_name: "Check dataset card before commercial use",
    intended_use: "safety_eval",
    notes: "Safety eval source; do not approve for training without license review."
  },
  civil_comments: {
    display_name: "Civil Comments / Jigsaw",
    source_url: "https://www.tensorflow.org/datasets/catalog/civil_comments",
    license_name: "Check dataset terms before commercial use",
    intended_use: "safety_eval",
    notes: "Safety eval source; keep samples limited and reviewed."
  }
};

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function has(name: string) {
  return process.argv.includes(name);
}

function asSourceKey(value: string | undefined): SourceKey | null {
  return value && value in sources ? (value as SourceKey) : null;
}

function parseJsonl(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function textValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function normalizeExample(sourceKey: SourceKey, row: Record<string, unknown>, index: number) {
  const chosen = Array.isArray(row.chosen) ? JSON.stringify(row.chosen) : row.chosen;
  const rejected = Array.isArray(row.rejected) ? JSON.stringify(row.rejected) : row.rejected;
  const input = textValue(row.input, row.prompt, row.instruction, row.context, row.question);
  const output = textValue(row.output, row.response, row.answer, chosen);
  const rejectedOutput = textValue(row.rejected_output, row.rejected_response, rejected);

  return {
    external_id: textValue(row.id, row.external_id) || `${sourceKey}-${index}`,
    category: sourceKey,
    input_text: input,
    output_text: output,
    rejected_output_text: rejectedOutput,
    label: typeof row.label === "object" && row.label ? row.label : {},
    metadata: row,
    status: "raw",
    approved_for_eval: true,
    approved_for_training: false
  };
}

async function upsertSources() {
  const client = getSupabaseServiceClient();
  if (!client) throw new Error("Missing Supabase service credentials. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  const rows = Object.entries(sources).map(([source_key, source]) => ({ source_key, ...source }));
  const { error } = await client.from("ai_dataset_sources").upsert(rows, { onConflict: "source_key" });
  if (error) throw error;
}

async function writeExamples(sourceKey: SourceKey, examples: ReturnType<typeof normalizeExample>[]) {
  const client = getSupabaseServiceClient();
  if (!client) throw new Error("Missing Supabase service credentials. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  const { data: source, error: sourceError } = await client
    .from("ai_dataset_sources")
    .select("id")
    .eq("source_key", sourceKey)
    .single();
  if (sourceError || !source) throw sourceError || new Error(`Dataset source ${sourceKey} is missing.`);

  const rows = examples.map((example) => ({ ...example, source_id: source.id }));
  const { error } = await client.from("ai_dataset_examples").upsert(rows, { onConflict: "source_id,external_id" });
  if (error) throw error;
}

async function main() {
  const sourceKey = asSourceKey(argValue("--source"));
  const samplePath = argValue("--sample");
  const limit = Math.max(1, Number(argValue("--limit") || 25));
  const write = has("--write");

  console.log("Collective public dataset ingestion skeleton");
  console.log("This script does not download huge public datasets by default.");
  console.log("Collective-owned app data and golden examples are the main future training data.");
  console.log("\nKnown sources:");
  for (const [key, source] of Object.entries(sources)) {
    console.log(`- ${key}: ${source.display_name} (${source.intended_use}) ${source.source_url}`);
  }

  if (!sourceKey || !samplePath) {
    console.log("\nNo ingestion performed.");
    console.log("Example dry run: npm run ai:ingest -- --source oasst1 --sample ./sample.jsonl --limit 20");
    console.log("Write only after review: npm run ai:ingest -- --source oasst1 --sample ./sample.jsonl --limit 20 --write");
    return;
  }

  const rows = parseJsonl(await readFile(samplePath, "utf8")).slice(0, limit);
  const normalized = rows.map((row, index) => normalizeExample(sourceKey, row, index));
  console.log(`\nsource=${sourceKey} sample=${samplePath} normalized=${normalized.length} write=${write}`);
  console.log("Defaults: approved_for_eval=true, approved_for_training=false, status=raw.");

  if (!write) {
    console.log("Dry run only. Nothing was written.");
    console.log(JSON.stringify(normalized[0] || {}, null, 2));
    return;
  }

  await upsertSources();
  await writeExamples(sourceKey, normalized);
  console.log(`Wrote ${normalized.length} normalized examples for ${sourceKey}. Manual review is still required before training approval.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
