import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cohort, CohortJoinRequest, CohortMember } from "@/lib/cohorts/types";
import type { Proof } from "@/lib/betaTypes";

export function mapCohort(r: any): Cohort {
  return { id: r.id, name: r.name, description: r.description ?? null, directionId: r.direction_id ?? null, visibility: r.visibility, accent: r.accent ?? null, ownerId: r.owner_id ?? null, isDemo: !!r.is_demo, createdAt: r.created_at };
}
export function mapMember(r: any): CohortMember { return { id: r.id, cohortId: r.cohort_id, userId: r.user_id, role: r.role, joinedAt: r.joined_at }; }
export function mapRequest(r: any): CohortJoinRequest { return { id: r.id, cohortId: r.cohort_id, userId: r.user_id, status: r.status, createdAt: r.created_at }; }

function mapCohortProof(row: any): Proof {
  return {
    id: row.id, userId: row.user_id, promptId: row.prompt_id, directionId: row.direction_id,
    title: row.title, body: row.body, mediaType: row.media_type, attachments: [],
    status: row.status, visibility: row.visibility, feedbackIds: [], createdAt: row.created_at,
    isDemo: row.is_demo ?? false, thumbnailUrl: row.thumbnail_url ?? undefined,
    mediaUrl: row.media_url ?? undefined, openForContributions: row.open_for_contributions ?? false,
    contributionFocus: row.contribution_focus ?? null,
  } as Proof;
}

export async function listCohorts(client: SupabaseClient): Promise<Cohort[]> {
  const { data } = await client.from("cohorts").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(mapCohort);
}
export async function listMyCohorts(client: SupabaseClient, userId: string): Promise<Cohort[]> {
  const { data } = await client.from("cohort_members").select("cohort_id, cohorts(*)").eq("user_id", userId);
  return (data ?? []).map((r: any) => mapCohort(r.cohorts)).filter(Boolean);
}
export async function getCohort(client: SupabaseClient, id: string): Promise<Cohort | null> {
  const { data } = await client.from("cohorts").select("*").eq("id", id).maybeSingle();
  return data ? mapCohort(data) : null;
}
export async function listMembers(client: SupabaseClient, cohortId: string): Promise<CohortMember[]> {
  const { data } = await client.from("cohort_members").select("*").eq("cohort_id", cohortId);
  return (data ?? []).map(mapMember);
}
export async function listOwnerRequests(client: SupabaseClient, cohortId: string): Promise<CohortJoinRequest[]> {
  const { data } = await client.from("cohort_join_requests").select("*").eq("cohort_id", cohortId).eq("status", "pending");
  return (data ?? []).map(mapRequest);
}
/** Proofs by this cohort's members, held excluded — pre-filter for the cohort feed. */
export async function listCohortProofs(client: SupabaseClient, cohortId: string): Promise<Proof[]> {
  const { data: mem } = await client.from("cohort_members").select("user_id").eq("cohort_id", cohortId);
  const ids = (mem ?? []).map((m: any) => m.user_id);
  if (!ids.length) return [];
  const { data } = await client.from("proofs").select("*").in("user_id", ids).or("held.eq.false").order("created_at", { ascending: false });
  return (data ?? []).map((r: any) => mapCohortProof(r));
}
// RPC callers
export const createCohort = (c: SupabaseClient, a: { name: string; description?: string; directionId?: string; visibility: string; accent?: string }) =>
  c.rpc("create_cohort", { p_name: a.name, p_description: a.description ?? null, p_direction_id: a.directionId ?? null, p_visibility: a.visibility, p_accent: a.accent ?? null });
export const joinCohort = (c: SupabaseClient, id: string) => c.rpc("join_cohort", { p_cohort_id: id });
export const requestJoin = (c: SupabaseClient, id: string) => c.rpc("request_join", { p_cohort_id: id });
export const approveRequest = (c: SupabaseClient, id: string) => c.rpc("approve_request", { p_request_id: id });
export const declineRequest = (c: SupabaseClient, id: string) => c.rpc("decline_request", { p_request_id: id });
export const redeemCohortInvite = (c: SupabaseClient, code: string) => c.rpc("redeem_cohort_invite", { p_code: code });
export const leaveCohort = (c: SupabaseClient, id: string) => c.rpc("leave_cohort", { p_cohort_id: id });
export const removeMember = (c: SupabaseClient, cohortId: string, userId: string) => c.rpc("remove_member", { p_cohort_id: cohortId, p_user_id: userId });
