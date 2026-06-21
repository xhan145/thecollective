"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Closed-beta flow events for debugging the funnel (not surveillance). */
export type BetaEventType =
  | "signup_started"
  | "signup_completed"
  | "invite_validated"
  | "onboarding_started"
  | "onboarding_completed"
  | "practice_started"
  | "practice_completed"
  | "proof_submit_started"
  | "proof_submit_succeeded"
  | "proof_submit_failed"
  | "feedback_submitted"
  | "app_feedback_submitted"
  | "contribution_submitted"
  | "contribution_accepted";

/**
 * Insert a beta event. Never throws and never blocks the user flow — logging
 * failures are swallowed on purpose. RLS allows a user to insert only their own
 * events (user_id must equal auth.uid()).
 */
export async function logBetaEvent(
  client: SupabaseClient | null,
  userId: string | null,
  eventType: BetaEventType,
  route?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!client || !userId) return;
  try {
    await client.from("beta_events").insert({
      user_id: userId,
      event_type: eventType,
      route: route ?? (typeof window !== "undefined" ? window.location.pathname : null),
      metadata: metadata ?? {},
    });
  } catch {
    /* non-blocking */
  }
}
