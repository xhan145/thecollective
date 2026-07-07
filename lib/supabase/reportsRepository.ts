import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportReason, ReportTargetType } from "@/lib/moderation";

// Member reporting of proofs + feedback (040). All enforcement (tiered hide,
// spam_signal) happens server-side in submit_report; the client only calls it.
export async function submitReport(
  client: SupabaseClient,
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  detail: string,
): Promise<{ error: string | null }> {
  const { error } = await client.rpc("submit_report", {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reason: reason,
    p_detail: detail.trim() || null,
  });
  if (!error) return { error: null };
  // Translate the RPC's raised codes into calm, beginner-safe copy.
  const msg = error.message || "";
  if (msg.includes("CANNOT_REPORT_OWN")) return { error: "You can't report your own content." };
  if (msg.includes("TARGET_NOT_FOUND")) return { error: "That content is no longer available." };
  if (msg.includes("NOT_AUTHENTICATED")) return { error: "Please sign in to report." };
  return { error: "Couldn't send that report. Please try again." };
}
