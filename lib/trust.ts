import type { TrustEventType, TrustStage } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const TRUST_POINTS: Record<TrustEventType, number> = {
  practice_completed: 1,
  proof_submitted: 2,
  feedback_given: 2,
  feedback_marked_helpful: 5,
  practice_remixed_from_proof: 3,
  beta_feedback_submitted: 1,
};

export const TRUST_STAGE_LABELS: Record<TrustStage, string> = {
  starting: "Starting",
  building: "Building",
  trusted: "Trusted",
  contributor: "Contributor",
};

export function calculateTrustStage(points: number): TrustStage {
  if (points >= 75) return "contributor";
  if (points >= 30) return "trusted";
  if (points >= 10) return "building";
  return "starting";
}

/**
 * Record a trust event and refresh the user's trust stage.
 * Runs with the admin client (server-only) so cross-user credit —
 * helpful-feedback credit, remix credit — works regardless of who
 * triggered it. Fails quietly: trust must never block the core loop.
 */
export async function recordTrustEvent(
  userId: string,
  eventType: TrustEventType,
  sourceType: string | null,
  sourceId: string | null,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  const points = TRUST_POINTS[eventType] ?? 0;
  await admin.from("trust_events").insert({
    user_id: userId,
    event_type: eventType,
    source_type: sourceType,
    source_id: sourceId,
    points,
  });
  const { data } = await admin
    .from("trust_events")
    .select("points")
    .eq("user_id", userId);
  const total = (data ?? []).reduce((sum, row) => sum + (row.points ?? 0), 0);
  await admin
    .from("profiles")
    .update({ trust_stage: calculateTrustStage(total), updated_at: new Date().toISOString() })
    .eq("id", userId);
}

/** Internal total — never shown competitively. */
export async function getTrustPoints(userId: string): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;
  const { data } = await admin
    .from("trust_events")
    .select("points")
    .eq("user_id", userId);
  return (data ?? []).reduce((sum, row) => sum + (row.points ?? 0), 0);
}

/** Create a notification for a user (server-only, best effort). */
export async function notify(
  userId: string,
  type: string,
  title: string,
  body: string | null,
  sourceType: string | null,
  sourceId: string | null,
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    source_type: sourceType,
    source_id: sourceId,
  });
}
