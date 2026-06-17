"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppFeedback,
  AppFeedbackDraftInput,
  Feedback,
  FeedbackDraftInput,
  Proof,
  ProofAttachment,
  ProofDraftInput,
  TrustEvent,
  UserProfile,
} from "@/lib/betaTypes";
import type { AiInteraction, AiUserFeedback } from "@/lib/aiTypes";
import { makeTrustEvent } from "@/lib/betaTrust";
import { PROOF_BUCKET } from "./client";

/** User-generated data loaded for the signed-in member (+ cohort feed). */
export interface BetaUserBundle {
  profile: UserProfile | null;
  profiles: UserProfile[];
  proofs: Proof[];
  feedback: Feedback[];
  trustEvents: TrustEvent[];
  appFeedback: AppFeedback[];
  completedPracticeIds: string[];
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
}

// ---------- mappers (snake_case row -> camelCase app type) ----------

function mapProfile(row: any): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name ?? "Member",
    initials: row.initials ?? "M",
    role: row.role ?? "member",
    cohortId: row.cohort_id ?? "founding-circle",
    directionIds: row.direction_ids ?? [],
    createdAt: row.created_at ?? new Date().toISOString(),
    username: row.username ?? undefined,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    currentDirectionId: row.current_direction_id ?? null,
    onboardingCompleted: row.onboarding_completed ?? false,
    trustScore: row.trust_score ?? 0,
    practiceCount: row.practice_count ?? 0,
    proofCount: row.proof_count ?? 0,
    feedbackGivenCount: row.feedback_given_count ?? 0,
    feedbackReceivedCount: row.feedback_received_count ?? 0,
    contributionCount: row.contribution_count ?? 0,
  };
}

function mapAttachment(row: any): ProofAttachment {
  return {
    id: row.id,
    mediaType: row.media_type,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    storagePath: row.storage_path ?? undefined,
    localUrl: row.public_url ?? undefined,
  };
}

function mapFeedback(row: any): Feedback {
  return {
    id: row.id,
    proofId: row.proof_id,
    authorId: row.author_id,
    recipientId: row.recipient_id,
    body: row.body,
    tone: row.tone,
    helpful: row.helpful ?? false,
    createdAt: row.created_at,
    clarityNote: row.clarity_note ?? undefined,
    usefulNote: row.useful_note ?? undefined,
    nextStepNote: row.next_step_note ?? undefined,
  };
}

function mapTrust(row: any): TrustEvent {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    points: row.points ?? 0,
    label: row.label,
    sourceId: row.source_id ?? undefined,
    createdAt: row.created_at,
  };
}

function publicUrl(client: SupabaseClient, path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return client.storage.from(PROOF_BUCKET).getPublicUrl(path).data.publicUrl;
}

// ---------- profile ----------

export async function ensureProfile(
  client: SupabaseClient,
  userId: string,
  email: string | null,
): Promise<UserProfile | null> {
  const { data: existing } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return mapProfile(existing);

  const name = email ? email.split("@")[0] : "Member";
  const { data } = await client
    .from("profiles")
    .upsert(
      {
        id: userId,
        display_name: name,
        initials: name.slice(0, 2).toUpperCase(),
      },
      { onConflict: "id" },
    )
    .select()
    .maybeSingle();
  return data ? mapProfile(data) : null;
}

// ---------- load ----------

export async function loadUserBundle(
  client: SupabaseClient,
  userId: string,
  email: string | null,
): Promise<BetaUserBundle> {
  const profile = await ensureProfile(client, userId, email);

  const [proofsRes, attachmentsRes, feedbackRes, trustRes, appRes, compRes, profilesRes] =
    await Promise.all([
      client.from("proofs").select("*").order("created_at", { ascending: false }),
      client.from("proof_attachments").select("*"),
      client.from("feedback").select("*").order("created_at", { ascending: false }),
      client.from("trust_events").select("*").eq("user_id", userId),
      client.from("app_feedback").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      client.from("practice_completions").select("prompt_id").eq("user_id", userId),
      client.from("profiles").select("*"),
    ]);

  const attachmentsByProof = new Map<string, ProofAttachment[]>();
  for (const row of attachmentsRes.data ?? []) {
    const att = mapAttachment({ ...row, public_url: publicUrl(client, row.storage_path) });
    const list = attachmentsByProof.get(row.proof_id) ?? [];
    list.push(att);
    attachmentsByProof.set(row.proof_id, list);
  }

  const feedback = (feedbackRes.data ?? []).map(mapFeedback);
  const feedbackByProof = new Map<string, string[]>();
  for (const f of feedback) {
    const list = feedbackByProof.get(f.proofId) ?? [];
    list.push(f.id);
    feedbackByProof.set(f.proofId, list);
  }

  const proofs: Proof[] = (proofsRes.data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    promptId: row.prompt_id,
    directionId: row.direction_id,
    title: row.title,
    body: row.body,
    mediaType: row.media_type,
    attachments: attachmentsByProof.get(row.id) ?? [],
    status: row.status,
    visibility: row.visibility,
    feedbackIds: feedbackByProof.get(row.id) ?? [],
    createdAt: row.created_at,
  }));

  return {
    profile,
    profiles: (profilesRes.data ?? []).map(mapProfile),
    proofs,
    feedback,
    trustEvents: (trustRes.data ?? []).map(mapTrust),
    appFeedback: (appRes.data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      category: row.category,
      body: row.body,
      route: row.route ?? undefined,
      rating: row.rating ?? undefined,
      status: row.status ?? undefined,
      createdAt: row.created_at,
      reviewed: row.reviewed ?? false,
    })),
    completedPracticeIds: (compRes.data ?? []).map((row: any) => row.prompt_id),
  };
}

// ---------- write-through ----------

async function insertTrust(client: SupabaseClient, event: TrustEvent) {
  await client.from("trust_events").insert({
    user_id: event.userId,
    type: event.type,
    points: event.points,
    label: event.label,
    source_id: event.sourceId ?? null,
  });
}

/**
 * Recompute the acting user's profile counters + trust_score from source tables.
 * Idempotent and drift-free. RLS only lets a user update their own profile row,
 * so always call this with the user who performed the action; other users'
 * counters refresh the next time they load.
 */
export async function refreshProfileStats(client: SupabaseClient, userId: string): Promise<void> {
  const [pc, pr, fg, fr, te] = await Promise.all([
    client.from("practice_completions").select("id", { count: "exact", head: true }).eq("user_id", userId),
    client.from("proofs").select("id", { count: "exact", head: true }).eq("user_id", userId),
    client.from("feedback").select("id", { count: "exact", head: true }).eq("author_id", userId),
    client.from("feedback").select("id", { count: "exact", head: true }).eq("recipient_id", userId),
    client.from("trust_events").select("points").eq("user_id", userId),
  ]);
  const trustScore = (te.data ?? []).reduce((sum, row: any) => sum + (row.points ?? 0), 0);
  await client
    .from("profiles")
    .update({
      practice_count: pc.count ?? 0,
      proof_count: pr.count ?? 0,
      feedback_given_count: fg.count ?? 0,
      feedback_received_count: fr.count ?? 0,
      trust_score: trustScore,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

/** Persist onboarding completion + chosen direction. */
export async function updateOnboarding(
  client: SupabaseClient,
  userId: string,
  directionId: string | null,
): Promise<void> {
  await client
    .from("profiles")
    .update({
      current_direction_id: directionId,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

/** Update editable profile fields (display name / username / bio). */
export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  fields: { displayName?: string; username?: string; bio?: string },
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.displayName !== undefined) {
    patch.display_name = fields.displayName;
    patch.initials = fields.displayName.slice(0, 2).toUpperCase();
  }
  if (fields.username !== undefined) patch.username = fields.username;
  if (fields.bio !== undefined) patch.bio = fields.bio;
  await client.from("profiles").update(patch).eq("id", userId);
}

export async function recordPracticeCompletion(
  client: SupabaseClient,
  userId: string,
  promptId: string,
  label: string,
) {
  await client
    .from("practice_completions")
    .upsert({ user_id: userId, prompt_id: promptId }, { onConflict: "user_id,prompt_id" });
  await insertTrust(client, makeTrustEvent(userId, "practice", label, promptId));
  await refreshProfileStats(client, userId);
}

export async function uploadProofFile(
  client: SupabaseClient,
  userId: string,
  proofId: string,
  file: File,
): Promise<string | null> {
  const path = `${userId}/${proofId}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await client.storage
    .from(PROOF_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  return error ? null : path;
}

/** Persist a proof (and optional attachment file) for the given local proof object. */
export async function persistProof(
  client: SupabaseClient,
  proof: Proof,
  file?: File,
): Promise<void> {
  await client.from("proofs").insert({
    id: proof.id,
    user_id: proof.userId,
    prompt_id: proof.promptId,
    direction_id: proof.directionId,
    title: proof.title,
    body: proof.body,
    media_type: proof.mediaType,
    status: proof.status,
    visibility: proof.visibility,
  });

  const attachment = proof.attachments[0];
  if (attachment) {
    let storagePath = attachment.storagePath ?? null;
    if (file) storagePath = await uploadProofFile(client, proof.userId, proof.id, file);
    await client.from("proof_attachments").insert({
      proof_id: proof.id,
      media_type: attachment.mediaType,
      file_name: attachment.fileName,
      mime_type: attachment.mimeType,
      size_bytes: attachment.sizeBytes,
      storage_path: storagePath,
    });
  }

  await insertTrust(client, makeTrustEvent(proof.userId, "proof", "Submitted proof from practice", proof.id));
  await refreshProfileStats(client, proof.userId);
}

export async function persistFeedback(client: SupabaseClient, feedback: Feedback): Promise<void> {
  await client.from("feedback").insert({
    id: feedback.id,
    proof_id: feedback.proofId,
    author_id: feedback.authorId,
    recipient_id: feedback.recipientId,
    body: feedback.body,
    tone: feedback.tone,
    helpful: false,
    clarity_note: feedback.clarityNote ?? null,
    useful_note: feedback.usefulNote ?? null,
    next_step_note: feedback.nextStepNote ?? null,
  });
  await client.from("proofs").update({ status: "feedback-ready" }).eq("id", feedback.proofId);
  await insertTrust(client, makeTrustEvent(feedback.authorId, "peer-feedback", "Gave useful feedback", feedback.id));
  await refreshProfileStats(client, feedback.authorId);
}

export async function persistMarkHelpful(
  client: SupabaseClient,
  feedbackId: string,
  authorId: string,
): Promise<void> {
  await client.from("feedback").update({ helpful: true }).eq("id", feedbackId);
  await insertTrust(client, makeTrustEvent(authorId, "helpful", "Feedback marked helpful", feedbackId));
}

export async function persistAppFeedback(
  client: SupabaseClient,
  userId: string,
  input: AppFeedbackDraftInput,
): Promise<void> {
  await client.from("app_feedback").insert({
    user_id: userId,
    category: input.category,
    body: input.body.trim(),
    route: input.route ?? null,
    rating: input.rating ?? null,
  });
}

export async function persistAiInteraction(
  client: SupabaseClient,
  interaction: AiInteraction,
): Promise<void> {
  await client.from("ai_interactions").insert({
    id: interaction.id,
    user_id: interaction.userId,
    cohort_id: interaction.cohortId,
    feature: interaction.feature,
    source_type: interaction.sourceType,
    source_id: interaction.sourceId,
    prompt_id: interaction.promptId ?? null,
    proof_id: interaction.proofId ?? null,
    input_summary: interaction.inputSummary,
    output: interaction.output as unknown as Record<string, unknown>,
  });
}

export async function persistAiUserFeedback(
  client: SupabaseClient,
  feedback: AiUserFeedback,
): Promise<void> {
  await client.from("ai_user_feedback").insert({
    id: feedback.id,
    user_id: feedback.userId,
    user_display_name: feedback.userDisplayName,
    cohort_id: feedback.cohortId,
    ai_interaction_id: feedback.aiInteractionId,
    feature: feedback.feature,
    helpfulness: feedback.helpfulness,
    issue_type: feedback.issueType ?? null,
    comment: feedback.comment ?? null,
  });
}

// re-export the input types used by callers for convenience
export type { ProofDraftInput, FeedbackDraftInput };
