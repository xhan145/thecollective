import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { VoiceCoachContext, VoiceCoachDynamicVariables, VoiceCoachToolResponse } from "./types";

const DEFAULT_ENABLED_COHORT = "second-tier-demo-v1";

type ProfileRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asAttempts(value: unknown): VoiceCoachContext["recent_attempts"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      return {
        title: asString(row.title, "Practice attempt"),
        outcome: asString(row.outcome, "noted"),
        note: asString(row.note, ""),
        created_at: asString(row.created_at, undefined as unknown as string)
      };
    })
    .filter(Boolean) as VoiceCoachContext["recent_attempts"];
}

function enabledCohorts() {
  return (process.env.VOICE_COACH_ENABLED_COHORTS || DEFAULT_ENABLED_COHORT)
    .split(",")
    .map((cohort) => cohort.trim())
    .filter(Boolean);
}

function friendlyError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "The coach could not reach progress right now.";
}

async function maybeSingle<T>(query: PromiseLike<{ data: T | null; error: { message?: string } | null }>) {
  const { data, error } = await query;
  if (error) return null;
  return data;
}

async function loadProfile(supabase: SupabaseClient, user: User): Promise<ProfileRow> {
  const baseProfile =
    (await maybeSingle<ProfileRow>(
      supabase
        .from("profiles")
        .select("id, username, full_name, current_goal, global_trust_level")
        .eq("id", user.id)
        .maybeSingle()
    )) || {};

  const coachingProfile =
    (await maybeSingle<ProfileRow>(
      supabase
        .from("profiles")
        .select("learner_name, cohort, current_skill, current_challenge, mastery_level, recent_attempts")
        .eq("id", user.id)
        .maybeSingle()
    )) || {};

  return { ...baseProfile, ...coachingProfile };
}

export async function loadRecentAttempts(supabase: SupabaseClient, userId: string) {
  const attempts = await maybeSingle<Array<Record<string, unknown>>>(
    supabase
      .from("attempts")
      .select("challenge_id, outcome, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
  );

  if (attempts?.length) {
    return attempts.map((attempt) => ({
      title: asString(attempt.challenge_id, "Practice attempt"),
      outcome: asString(attempt.outcome, "attempted"),
      note: asString(attempt.note, ""),
      created_at: asString(attempt.created_at, "")
    }));
  }

  const proofs = await maybeSingle<Array<Record<string, unknown>>>(
    supabase
      .from("proof_submissions")
      .select("title, reflection, reflection_text, text_response, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
  );

  return (proofs || []).map((proof) => ({
    title: asString(proof.title, "Submitted proof"),
    outcome: asString(proof.status, "submitted"),
    note: asString(proof.reflection, asString(proof.reflection_text, asString(proof.text_response, ""))),
    created_at: asString(proof.created_at, "")
  }));
}

export async function loadVoiceCoachContext(supabase: SupabaseClient, user: User): Promise<VoiceCoachContext> {
  const profile = await loadProfile(supabase, user);
  const recentAttempts = asAttempts(profile.recent_attempts);
  const loadedAttempts = recentAttempts.length ? recentAttempts : await loadRecentAttempts(supabase, user.id);
  const currentSkill = asString(profile.current_skill, asString(profile.current_goal, "communication"));

  return {
    learner_name: asString(profile.learner_name, asString(profile.full_name, user.email?.split("@")[0] || "Learner")),
    cohort: asString(profile.cohort, DEFAULT_ENABLED_COHORT),
    current_skill: currentSkill,
    current_challenge: asString(profile.current_challenge, currentSkill),
    mastery_level: asString(profile.mastery_level, asString(profile.global_trust_level, "beginner")),
    recent_attempts: loadedAttempts
  };
}

export function assertVoiceCoachEnabled(context: VoiceCoachContext) {
  if (!enabledCohorts().includes(context.cohort)) {
    throw new Response(JSON.stringify({ error: "The voice coach is not enabled for this cohort yet." }), {
      status: 403,
      headers: { "content-type": "application/json" }
    });
  }
}

export function toDynamicVariables(context: VoiceCoachContext): VoiceCoachDynamicVariables {
  return {
    learner_name: context.learner_name,
    cohort: context.cohort,
    current_skill: context.current_skill,
    current_challenge: context.current_challenge,
    mastery_level: context.mastery_level,
    recent_attempts: JSON.stringify(context.recent_attempts.slice(0, 5))
  };
}

export async function getSignedVoiceCoachUrl() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    throw new Response(JSON.stringify({ error: "Voice coach is not configured." }), {
      status: 503,
      headers: { "content-type": "application/json" }
    });
  }

  const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
  url.searchParams.set("agent_id", agentId);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "xi-api-key": apiKey
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Response(JSON.stringify({ error: "Could not start the voice coach right now." }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }

  const body = (await response.json()) as { signed_url?: string };
  if (!body.signed_url) {
    throw new Response(JSON.stringify({ error: "Voice coach did not return a signed URL." }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }

  return body.signed_url;
}

async function getCurrentChallenge(supabase: SupabaseClient, context: VoiceCoachContext): Promise<VoiceCoachToolResponse> {
  const challenge =
    (await maybeSingle<Record<string, unknown>>(
      supabase
        .from("challenges")
        .select("id, title, description, acceptance_criteria, attempt_state, hints")
        .eq("id", context.current_challenge)
        .maybeSingle()
    )) ||
    (await maybeSingle<Record<string, unknown>>(
      supabase
        .from("challenges")
        .select("id, title, description, acceptance_criteria, attempt_state, hints")
        .eq("slug", context.current_challenge)
        .maybeSingle()
    ));

  if (challenge) {
    return {
      challenge: {
        title: asString(challenge.title, context.current_challenge),
        description: asString(challenge.description, "Practice one small, concrete step.")
      },
      acceptance_criteria: challenge.acceptance_criteria || ["Complete one calm attempt.", "Capture what changed.", "Choose one next step."],
      attempt_state: asString(challenge.attempt_state, "ready")
    };
  }

  const prompt = await maybeSingle<Record<string, unknown>>(
    supabase.from("prompts").select("id, title, instruction, reflection_question, feedback_question").eq("is_active", true).limit(1).maybeSingle()
  );

  return {
    challenge: {
      title: asString(prompt?.title, context.current_challenge),
      description: asString(prompt?.instruction, "Practice one small, concrete step.")
    },
    acceptance_criteria: [
      asString(prompt?.reflection_question, "Notice what you tried."),
      asString(prompt?.feedback_question, "Name one useful next step.")
    ],
    attempt_state: context.recent_attempts[0]?.outcome || "ready"
  };
}

async function getLearnerProgress(
  supabase: SupabaseClient,
  user: User,
  context: VoiceCoachContext,
  params: Record<string, unknown>
): Promise<VoiceCoachToolResponse> {
  const skillId = asString(params.skill_id, context.current_skill);
  const skillAttempts = await loadRecentAttempts(supabase, user.id);

  return {
    mastery_level: context.mastery_level,
    skill_id: skillId,
    recent_attempts: skillAttempts.length ? skillAttempts : context.recent_attempts
  };
}

async function logPracticeAttempt(supabase: SupabaseClient, user: User, params: Record<string, unknown>) {
  const challengeId = asString(params.challenge_id, "current-challenge");
  const outcome = asString(params.outcome, "attempted");
  const note = asString(params.note, "");

  const attemptInsert = await supabase.from("attempts").insert({
    user_id: user.id,
    challenge_id: challengeId,
    outcome,
    note
  });

  if (!attemptInsert.error) return { ok: true, saved_to: "attempts" };

  const trustInsert = await supabase.from("trust_events").insert({
    user_id: user.id,
    event_type: "practice",
    score_change: 0,
    reason: note || `Practice attempt logged: ${outcome}`
  });

  if (!trustInsert.error) return { ok: true, saved_to: "trust_events" };
  return { ok: false, error: "Could not save the practice attempt." };
}

async function markConceptUnderstood(supabase: SupabaseClient, user: User, params: Record<string, unknown>) {
  const conceptId = asString(params.concept_id, "");
  if (!conceptId) return { ok: false, error: "Missing concept." };

  const masteryUpsert = await supabase.from("concept_mastery").upsert({
    user_id: user.id,
    concept_id: conceptId,
    understood: true,
    updated_at: new Date().toISOString()
  });

  if (!masteryUpsert.error) return { ok: true };

  const trustInsert = await supabase.from("trust_events").insert({
    user_id: user.id,
    event_type: "practice",
    score_change: 0,
    reason: `Concept understood: ${conceptId}`
  });

  if (!trustInsert.error) return { ok: true };
  return { ok: false, error: "Could not save concept progress." };
}

async function requestHint(supabase: SupabaseClient, context: VoiceCoachContext, params: Record<string, unknown>) {
  const challengeId = asString(params.challenge_id, context.current_challenge);
  const hintLevel = Math.max(1, Math.min(Number(params.hint_level || 1), 3));
  const challenge = await maybeSingle<Record<string, unknown>>(
    supabase.from("challenges").select("hints, description").eq("id", challengeId).maybeSingle()
  );
  const hints = Array.isArray(challenge?.hints) ? challenge?.hints : [];
  const fallbackHints = [
    "Start by saying the simplest version of the idea.",
    "Use one concrete example so the idea is easier to follow.",
    "End with one small next step you can actually do."
  ];

  return {
    hint: asString(hints[hintLevel - 1], fallbackHints[hintLevel - 1] || fallbackHints[0])
  };
}

export async function runVoiceCoachTool(
  supabase: SupabaseClient,
  user: User,
  tool: string,
  params: Record<string, unknown>
): Promise<VoiceCoachToolResponse> {
  try {
    const context = await loadVoiceCoachContext(supabase, user);
    assertVoiceCoachEnabled(context);

    if (tool === "get_current_challenge") return await getCurrentChallenge(supabase, context);
    if (tool === "get_learner_progress") return await getLearnerProgress(supabase, user, context, params);
    if (tool === "log_practice_attempt") return await logPracticeAttempt(supabase, user, params);
    if (tool === "mark_concept_understood") return await markConceptUnderstood(supabase, user, params);
    if (tool === "request_hint") return await requestHint(supabase, context, params);

    return { ok: false, error: "Unknown voice coach tool." };
  } catch (error) {
    if (error instanceof Response) throw error;
    return { ok: false, error: friendlyError(error) };
  }
}

