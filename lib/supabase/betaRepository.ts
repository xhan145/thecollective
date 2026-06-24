"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppFeedback,
  AppFeedbackDraftInput,
  AppNotification,
  Contribution,
  Conversation,
  ConversationKind,
  Feedback,
  FeedbackDraftInput,
  MemberConnection,
  Message,
  Proof,
  ProofAttachment,
  ProofDraftInput,
  SavedItem,
  SavedTargetType,
  TrustEvent,
  UsefulMark,
  UsefulReason,
  UserProfile,
} from "@/lib/betaTypes";
import type { AiInteraction, AiUserFeedback } from "@/lib/aiTypes";
import { shouldShowDemoActivity } from "@/lib/feedAlgorithm";
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
  usefulMarks: UsefulMark[];
  usefulCountByProof: Record<string, number>;
  savedItems: SavedItem[];
  connections: MemberConnection[];
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  notifications: AppNotification[];
  contributions: Contribution[];
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
    practiceTrust: row.practice_trust ?? 0,
    feedbackTrust: row.feedback_trust ?? 0,
    consistencyTrust: row.consistency_trust ?? 0,
    contributionTrust: row.contribution_trust ?? 0,
    spamSignal: row.spam_signal ?? 0,
    goalText: row.goal_text ?? null,
    startingLevel: row.starting_level ?? null,
    contextTags: row.context_tags ?? [],
    cadence: row.cadence ?? null,
    betaAccess: row.beta_access ?? false,
    inviteCode: row.invite_code ?? null,
    betaJoinedAt: row.beta_joined_at ?? null,
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

function mapUsefulMark(row: any): UsefulMark {
  return {
    id: row.id,
    userId: row.user_id,
    targetId: row.target_id,
    reason: row.reason,
    createdAt: row.created_at,
    isDemo: row.is_demo ?? false,
  };
}

function mapSavedItem(row: any): SavedItem {
  return {
    id: row.id,
    userId: row.user_id,
    targetType: row.target_type,
    targetId: row.target_id,
    createdAt: row.created_at,
    isDemo: row.is_demo ?? false,
  };
}

function mapConnection(row: any): MemberConnection {
  return {
    id: row.id,
    learnerId: row.learner_id,
    teacherId: row.teacher_id,
    status: row.status,
    createdAt: row.created_at,
    isDemo: row.is_demo ?? false,
  };
}

export function mapNotification(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id ?? null,
    type: row.type,
    title: row.title,
    body: row.body ?? null,
    sourceType: row.source_type ?? null,
    sourceId: row.source_id ?? null,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  };
}

function mapConversation(row: any): Conversation {
  return {
    id: row.id,
    kind: row.kind,
    initiatorId: row.initiator_id,
    recipientId: row.recipient_id,
    proofId: row.proof_id ?? null,
    subject: row.subject ?? undefined,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    isDemo: row.is_demo ?? false,
  };
}

function mapMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    isDemo: row.is_demo ?? false,
  };
}

function mapContribution(row: any): Contribution {
  return {
    id: row.id,
    proofId: row.proof_id,
    contributorId: row.contributor_id,
    ownerId: row.owner_id,
    observation: row.observation,
    nextStep: row.next_step,
    status: row.status,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at ?? null,
    isDemo: row.is_demo ?? false,
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

  const [proofsRes, attachmentsRes, feedbackRes, trustRes, appRes, compRes, profilesRes, myUsefulRes, usefulAllRes, savedRes, connRes, convRes, messagesRes, notifsRes, contribRes] =
    await Promise.all([
      client.from("proofs").select("*").order("created_at", { ascending: false }),
      client.from("proof_attachments").select("*"),
      client.from("feedback").select("*").order("created_at", { ascending: false }),
      client.from("trust_events").select("*").eq("user_id", userId),
      client.from("app_feedback").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      client.from("practice_completions").select("prompt_id").eq("user_id", userId),
      client.from("profiles").select("*"),
      client.from("useful_marks").select("*").eq("user_id", userId),
      client.from("useful_marks").select("target_id"),
      client.from("saved_items").select("*").eq("user_id", userId),
      client.from("member_connections").select("*").eq("learner_id", userId).eq("status", "active"),
      client.from("conversations").select("*").or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`).order("last_message_at", { ascending: false }),
      client.from("messages").select("*").order("created_at"),
      client.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      client.from("contributions").select("*").or(`contributor_id.eq.${userId},owner_id.eq.${userId}`),
    ]);

  const messagesByConversation: Record<string, Message[]> = {};
  for (const row of (messagesRes?.data ?? [])) {
    const m = mapMessage(row);
    (messagesByConversation[m.conversationId] ??= []).push(m);
  }

  // Cohort-visible useful counts per proof (RLS scopes to readable rows) — ranking signal, never shown as a count.
  const usefulCountByProof: Record<string, number> = {};
  for (const row of usefulAllRes.data ?? []) {
    usefulCountByProof[row.target_id] = (usefulCountByProof[row.target_id] ?? 0) + 1;
  }
  const connections = (connRes.data ?? []).map(mapConnection);
  const teacherIds = new Set(connections.map((c) => c.teacherId));

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

  // Real content first. Demo examples only fill the feed when real proof volume
  // is low, and they never cross into trust/reputation ranking.
  const includeDemo = process.env.NEXT_PUBLIC_INCLUDE_DEMO_CONTENT !== "false";
  // Score within each tier: proofs by people you learn from rank up, then useful
  // marks, then recency. Demo rows get no rank boost.
  const score = (row: any) =>
    row.is_demo ? 0 : (teacherIds.has(row.user_id) ? 3 : 0) + (usefulCountByProof[row.id] ?? 0);
  const sortRows = (rows: any[]) => rows
    .sort((a: any, b: any) => {
      const sd = score(b) - score(a);
      if (sd !== 0) return sd;
      return a.created_at < b.created_at ? 1 : -1; // newest first
    });
  const allProofRows = proofsRes.data ?? [];
  const realRows = sortRows(allProofRows.filter((row: any) => !row.is_demo));
  const demoLimit = Math.max(0, 8 - realRows.length);
  const demoRows = includeDemo && shouldShowDemoActivity(realRows.length)
    ? sortRows(allProofRows.filter((row: any) => row.is_demo)).slice(0, demoLimit || 8)
    : [];
  const proofRows = [...realRows, ...demoRows];

  const proofs: Proof[] = proofRows.map((row: any) => ({
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
    isDemo: row.is_demo ?? false,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    openForContributions: row.open_for_contributions ?? false,
    contributionFocus: row.contribution_focus ?? null,
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
    usefulMarks: (myUsefulRes.data ?? []).map(mapUsefulMark),
    usefulCountByProof,
    savedItems: (savedRes.data ?? []).map(mapSavedItem),
    connections,
    conversations: (convRes?.data ?? []).map(mapConversation),
    messagesByConversation,
    notifications: (notifsRes?.data ?? []).map(mapNotification),
    contributions: (contribRes?.data ?? []).map(mapContribution),
  };
}

export async function markNotificationRead(client: SupabaseClient, id: string): Promise<void> {
  await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllNotificationsRead(client: SupabaseClient, userId: string): Promise<void> {
  await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
}

// ---------- write-through ----------

/**
 * Recompute a user's profile counters + trust_score from source tables, server-side.
 * Thin wrapper over the SECURITY DEFINER RPC (counters are owned by the DB now).
 * Use for admin/manual repair; the action RPCs already recompute affected users.
 */
export async function recomputeProfileCounts(client: SupabaseClient, userId: string): Promise<void> {
  await client.rpc("recompute_profile_counts", { p_uid: userId });
}

/** Persist onboarding completion + chosen direction + personalization answers. */
export async function updateOnboarding(
  client: SupabaseClient,
  userId: string,
  payload: { directionId: string | null; goalText?: string | null; startingLevel?: string | null; contextTags?: string[]; cadence?: string | null },
): Promise<void> {
  await client
    .from("profiles")
    .update({
      current_direction_id: payload.directionId,
      goal_text: payload.goalText ?? null,
      starting_level: payload.startingLevel ?? null,
      context_tags: payload.contextTags ?? [],
      cadence: payload.cadence ?? null,
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
  void label; // label is now stamped server-side by the RPC
  await client
    .from("practice_completions")
    .upsert({ user_id: userId, prompt_id: promptId }, { onConflict: "user_id,prompt_id" });
  await client.rpc("record_practice_trust", { p_prompt_id: promptId });
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
/**
 * Persist a proof (text first, so a reflection is never lost) and an optional
 * attachment. Throws if the proof row itself fails to save so the caller can
 * surface a calm retry without wiping the user's text. An attachment upload
 * failure is non-fatal: the text proof still saves.
 */
export async function persistProof(
  client: SupabaseClient,
  proof: Proof,
  file?: File,
): Promise<void> {
  // 1) Save the proof row (the user's text). This must succeed.
  const { error: proofError } = await client.from("proofs").insert({
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
  if (proofError) throw new Error(proofError.message);

  // 2) Attachment is best-effort — a failed upload must not lose the text proof.
  const attachment = proof.attachments[0];
  if (attachment) {
    let storagePath = attachment.storagePath ?? null;
    if (file) storagePath = await uploadProofFile(client, proof.userId, proof.id, file);
    if (storagePath) {
      await client.from("proof_attachments").insert({
        proof_id: proof.id,
        media_type: attachment.mediaType,
        file_name: attachment.fileName,
        mime_type: attachment.mimeType,
        size_bytes: attachment.sizeBytes,
        storage_path: storagePath,
      });
    }
  }

  // Trust is best-effort: the proof row is already saved, and trust_score is
  // recompute-from-source, so a hiccup here self-heals on the next action/load.
  // Never let it surface as "proof failed to save".
  try {
    await client.rpc("record_proof_trust", { p_proof_id: proof.id });
  } catch {
    /* non-fatal — proof persisted; trust will reconcile later */
  }
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
  await client.rpc("record_feedback_trust", { p_feedback_id: feedback.id });
}

export async function persistMarkHelpful(
  client: SupabaseClient,
  feedbackId: string,
  authorId: string,
): Promise<void> {
  void authorId; // the RPC derives + credits the author server-side
  await client.rpc("mark_feedback_helpful", { p_feedback_id: feedbackId });
}

// ---------- engagement: useful marks / saved items / learn-from ----------

export async function persistUsefulMark(
  client: SupabaseClient,
  userId: string,
  proofId: string,
  reason: UsefulReason = "clear",
): Promise<void> {
  await client
    .from("useful_marks")
    .upsert(
      { user_id: userId, target_type: "proof", target_id: proofId, reason },
      { onConflict: "user_id,target_id" },
    );
}

export async function removeUsefulMark(
  client: SupabaseClient,
  userId: string,
  proofId: string,
): Promise<void> {
  await client.from("useful_marks").delete().eq("user_id", userId).eq("target_id", proofId);
}

export async function persistSavedItem(
  client: SupabaseClient,
  userId: string,
  targetType: SavedTargetType,
  targetId: string,
): Promise<void> {
  await client
    .from("saved_items")
    .upsert(
      { user_id: userId, target_type: targetType, target_id: targetId },
      { onConflict: "user_id,target_type,target_id" },
    );
}

export async function removeSavedItem(
  client: SupabaseClient,
  userId: string,
  targetType: SavedTargetType,
  targetId: string,
): Promise<void> {
  await client
    .from("saved_items")
    .delete()
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId);
}

export async function persistConnection(
  client: SupabaseClient,
  learnerId: string,
  teacherId: string,
): Promise<void> {
  await client
    .from("member_connections")
    .upsert(
      { learner_id: learnerId, teacher_id: teacherId, connection_type: "learn_from", status: "active" },
      { onConflict: "learner_id,teacher_id,connection_type" },
    );
}

export async function removeConnection(
  client: SupabaseClient,
  learnerId: string,
  teacherId: string,
): Promise<void> {
  await client
    .from("member_connections")
    .update({ status: "removed" })
    .eq("learner_id", learnerId)
    .eq("teacher_id", teacherId);
}

// ---------- peer notes / feedback requests ----------

/** Create a conversation + its first message. Returns the new ids (or null). */
export async function startConversation(
  client: SupabaseClient,
  input: { kind: ConversationKind; initiatorId: string; recipientId: string; proofId?: string | null; subject?: string; body: string },
): Promise<{ conversationId: string; messageId: string } | null> {
  const nowIso = new Date().toISOString();
  const { data: conv, error } = await client
    .from("conversations")
    .insert({
      kind: input.kind,
      initiator_id: input.initiatorId,
      recipient_id: input.recipientId,
      proof_id: input.proofId ?? null,
      subject: input.subject ?? (input.kind === "feedback_request" ? "Feedback request" : "Peer note"),
      last_message_at: nowIso,
    })
    .select("id")
    .single();
  if (error || !conv) return null;
  const { data: msg } = await client
    .from("messages")
    .insert({ conversation_id: conv.id, sender_id: input.initiatorId, body: input.body })
    .select("id")
    .single();
  return { conversationId: conv.id, messageId: msg?.id ?? "" };
}

/** Append a message and bump the conversation's last_message_at. */
export async function sendMessage(
  client: SupabaseClient,
  conversationId: string,
  senderId: string,
  body: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("id")
    .single();
  if (error) return null;
  await client.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
  return data?.id ?? null;
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

/** Submit a contribution to an open proof (server-gated by G1). Returns new id or throws. */
export async function submitContribution(
  client: SupabaseClient,
  input: { proofId: string; observation: string; nextStep: string },
): Promise<string> {
  const { data, error } = await client.rpc("submit_contribution", {
    p_proof_id: input.proofId,
    p_observation: input.observation,
    p_next_step: input.nextStep,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Owner accepts a contribution -> credits the contributor via the trust RPC. */
export async function acceptContribution(client: SupabaseClient, contributionId: string): Promise<void> {
  const { error } = await client.rpc("record_contribution_trust", { p_contribution_id: contributionId });
  if (error) throw new Error(error.message);
}

/** Toggle a proof's open-for-contributions flag + focus (owner only via RLS). */
export async function setProofOpen(
  client: SupabaseClient,
  proofId: string,
  open: boolean,
  focus: string | null,
): Promise<void> {
  await client.from("proofs").update({ open_for_contributions: open, contribution_focus: focus }).eq("id", proofId);
}

// re-export the input types used by callers for convenience
export type { ProofDraftInput, FeedbackDraftInput };
