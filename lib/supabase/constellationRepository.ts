// Progress Constellation — feature repository (matches badgesRepository /
// passportRepository shape). Loads the two evidence sets the shared bundle
// does not carry (practice completions WITH timestamps, feedback
// applications) and owns feedback_applications writes.
//
// Missing-table tolerance: migration 050 may land after a deploy. Every read
// degrades to an empty list and reports `applicationsAvailable: false` so the
// screen renders (Apply node simply has no evidence yet) instead of breaking.

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CompletionInput,
  FeedbackApplicationInput,
  FeedbackApplicationStatus
} from "../constellation/types";

export type ConstellationExtras = {
  completions: CompletionInput[];
  applications: FeedbackApplicationInput[];
  /** false when the feedback_applications table is unreachable (pre-migration). */
  applicationsAvailable: boolean;
};

function mapApplication(row: Record<string, unknown>): FeedbackApplicationInput {
  return {
    id: String(row.id),
    feedbackId: String(row.feedback_id),
    status: (row.status as FeedbackApplicationStatus) ?? "planned",
    reflection: (row.reflection as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: (row.updated_at as string | null) ?? null
  };
}

export async function loadConstellationExtras(
  client: SupabaseClient,
  userId: string
): Promise<ConstellationExtras> {
  const [compRes, appRes] = await Promise.all([
    client
      .from("practice_completions")
      .select("id, prompt_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("feedback_applications")
      .select("id, feedback_id, status, reflection, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  ]);

  const completions: CompletionInput[] = (compRes.data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    promptId: String(row.prompt_id),
    createdAt: (row.created_at as string | null) ?? null
  }));

  return {
    completions,
    applications: appRes.error ? [] : (appRes.data ?? []).map(mapApplication),
    applicationsAvailable: !appRes.error
  };
}

/** Plan an application of one piece of received feedback (idempotent — the
 *  table is unique per (user, feedback), so re-planning returns the row). */
export async function upsertFeedbackApplication(
  client: SupabaseClient,
  userId: string,
  feedbackId: string,
  reflection: string | null
): Promise<{ application?: FeedbackApplicationInput; error?: string }> {
  const { data, error } = await client
    .from("feedback_applications")
    .upsert(
      { user_id: userId, feedback_id: feedbackId, reflection, status: "planned" },
      { onConflict: "user_id,feedback_id" }
    )
    .select()
    .single();
  if (error) return { error: error.message };
  return { application: mapApplication(data as Record<string, unknown>) };
}

/** Advance planned → practiced → demonstrated (any order the member chooses;
 *  the projection only distinguishes planned vs advanced). */
export async function setFeedbackApplicationStatus(
  client: SupabaseClient,
  userId: string,
  applicationId: string,
  status: FeedbackApplicationStatus,
  reflection?: string | null
): Promise<{ application?: FeedbackApplicationInput; error?: string }> {
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (reflection !== undefined) patch.reflection = reflection;
  const { data, error } = await client
    .from("feedback_applications")
    .update(patch)
    .eq("id", applicationId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return { error: error.message };
  return { application: mapApplication(data as Record<string, unknown>) };
}
