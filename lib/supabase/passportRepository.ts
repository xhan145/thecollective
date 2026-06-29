import type { SupabaseClient } from "@supabase/supabase-js";

// Guided introduction (profile_details) + pinned proofs for the Passport screen.
// RLS is read-own/write-own (migration 033) — these helpers only ever touch the
// signed-in user's own rows.

export type IntroductionVisibility = "private" | "members" | "public";

export type ProfileDetails = {
  hereToPractice: string | null;
  currentlyWorkingOn: string | null;
  wantsFeedbackOn: string | null;
  canHelpWith: string | null;
  lookingFor: string[];
  introductionVisibility: IntroductionVisibility;
  allowSameDirectionOnly: boolean;
  allowTrustedOnly: boolean;
};

export const EMPTY_PROFILE_DETAILS: ProfileDetails = {
  hereToPractice: null,
  currentlyWorkingOn: null,
  wantsFeedbackOn: null,
  canHelpWith: null,
  lookingFor: [],
  introductionVisibility: "members",
  allowSameDirectionOnly: false,
  allowTrustedOnly: false,
};

function mapDetails(row: Record<string, unknown>): ProfileDetails {
  return {
    hereToPractice: (row.here_to_practice as string) ?? null,
    currentlyWorkingOn: (row.currently_working_on as string) ?? null,
    wantsFeedbackOn: (row.wants_feedback_on as string) ?? null,
    canHelpWith: (row.can_help_with as string) ?? null,
    lookingFor: (row.looking_for as string[]) ?? [],
    introductionVisibility: (row.introduction_visibility as IntroductionVisibility) ?? "members",
    allowSameDirectionOnly: (row.allow_same_direction_only as boolean) ?? false,
    allowTrustedOnly: (row.allow_trusted_only as boolean) ?? false,
  };
}

export async function getProfileDetails(client: SupabaseClient, userId: string): Promise<ProfileDetails | null> {
  const { data, error } = await client.from("profile_details").select("*").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return mapDetails(data as Record<string, unknown>);
}

export async function saveProfileDetails(client: SupabaseClient, userId: string, d: Partial<ProfileDetails>): Promise<void> {
  const patch: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
  if (d.hereToPractice !== undefined) patch.here_to_practice = d.hereToPractice;
  if (d.currentlyWorkingOn !== undefined) patch.currently_working_on = d.currentlyWorkingOn;
  if (d.wantsFeedbackOn !== undefined) patch.wants_feedback_on = d.wantsFeedbackOn;
  if (d.canHelpWith !== undefined) patch.can_help_with = d.canHelpWith;
  if (d.lookingFor !== undefined) patch.looking_for = d.lookingFor;
  if (d.introductionVisibility !== undefined) patch.introduction_visibility = d.introductionVisibility;
  if (d.allowSameDirectionOnly !== undefined) patch.allow_same_direction_only = d.allowSameDirectionOnly;
  if (d.allowTrustedOnly !== undefined) patch.allow_trusted_only = d.allowTrustedOnly;
  await client.from("profile_details").upsert(patch, { onConflict: "user_id" });
}

export async function listPinnedProofIds(client: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await client
    .from("pinned_proofs")
    .select("proof_id, display_order")
    .eq("user_id", userId)
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => (r as { proof_id: string }).proof_id);
}

export async function addPinnedProof(client: SupabaseClient, userId: string, proofId: string, order = 0): Promise<void> {
  await client.from("pinned_proofs").insert({ user_id: userId, proof_id: proofId, display_order: order });
}

export async function removePinnedProof(client: SupabaseClient, userId: string, proofId: string): Promise<void> {
  await client.from("pinned_proofs").delete().eq("user_id", userId).eq("proof_id", proofId);
}
