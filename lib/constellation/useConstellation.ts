"use client";

// Progress Constellation — composition hook. Bridges the app-state snapshot
// (RLS-scoped, already loaded) with the two constellation-only reads, feeds
// the pure projection, and owns the feedback-application actions + analytics.
// Demo explorers get the same living map from seed data (in-memory
// applications), so the screen is never a dead end without Supabase.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  loadConstellationExtras,
  setFeedbackApplicationStatus,
  upsertFeedbackApplication
} from "@/lib/supabase/constellationRepository";
import { buildConstellationState } from "./projection";
import type {
  CompletionInput,
  ConstellationInputs,
  ConstellationState,
  FeedbackApplicationInput,
  FeedbackApplicationStatus
} from "./types";

function visibleModeration(status?: string): boolean {
  return status === undefined || status === "clear" || status === "limited";
}

export type ApplyTarget = {
  feedbackId: string;
  proofId: string;
  proofTitle: string;
  authorName: string;
  body: string;
  receivedAt: string;
  application: FeedbackApplicationInput | null;
};

export type ConstellationPhase = "loading" | "ready" | "error";

export function useConstellation() {
  const { snapshot, currentUser, supabaseEnabled, authReady, logEvent } = useBetaApp();
  const me = currentUser?.id ?? null;
  const isDemo = !supabaseEnabled || !me || me.startsWith("user-");

  const [phase, setPhase] = useState<ConstellationPhase>("loading");
  const [remoteCompletions, setRemoteCompletions] = useState<CompletionInput[] | null>(null);
  const [applications, setApplications] = useState<FeedbackApplicationInput[]>([]);
  const [applicationsAvailable, setApplicationsAvailable] = useState(true);
  const [loadStamp, setLoadStamp] = useState(() => new Date().toISOString());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!authReady) return;
    if (isDemo || !me) {
      setPhase("ready");
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      setPhase("ready");
      return;
    }
    setPhase("loading");
    loadConstellationExtras(client, me)
      .then((extras) => {
        if (cancelled) return;
        setRemoteCompletions(extras.completions);
        setApplications(extras.applications);
        setApplicationsAvailable(extras.applicationsAvailable);
        setLoadStamp(new Date().toISOString());
        setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, isDemo, me, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const inputs: ConstellationInputs | null = useMemo(() => {
    if (!authReady) return null;
    const userId = me ?? "";
    const direction =
      snapshot.directions.find((d) => d.id === currentUser?.currentDirectionId) ??
      snapshot.directions.find((d) => (currentUser?.directionIds ?? []).includes(d.id)) ??
      null;
    const directionPrompts = direction
      ? snapshot.prompts.filter((p) => p.directionId === direction.id).map((p) => ({ id: p.id, title: p.title }))
      : [];
    const completions: CompletionInput[] =
      remoteCompletions ??
      snapshot.completedPracticeIds.map((promptId) => ({ id: `local-${promptId}`, promptId, createdAt: null }));
    const blocked = new Set(snapshot.blockedUserIds);
    return {
      userId,
      direction: direction ? { id: direction.id, title: direction.title } : null,
      directionPrompts,
      completions,
      ownProofs: snapshot.proofs
        .filter((p) => p.userId === userId)
        .map((p) => ({
          id: p.id,
          promptId: p.promptId,
          directionId: p.directionId,
          title: p.title,
          status: p.status === "draft" ? ("draft" as const) : (p.status as "submitted" | "feedback-ready" | "used-for-practice"),
          createdAt: p.createdAt,
          moderationStatus: p.moderationStatus
        })),
      feedbackReceived: snapshot.feedback
        .filter((f) => f.recipientId === userId)
        .map((f) => ({ id: f.id, proofId: f.proofId, authorId: f.authorId, recipientId: f.recipientId, helpful: f.helpful, createdAt: f.createdAt, moderationStatus: f.moderationStatus })),
      feedbackGiven: snapshot.feedback
        .filter((f) => f.authorId === userId)
        .map((f) => ({ id: f.id, proofId: f.proofId, authorId: f.authorId, recipientId: f.recipientId, helpful: f.helpful, createdAt: f.createdAt, moderationStatus: f.moderationStatus })),
      proofDirectionById: Object.fromEntries(snapshot.proofs.map((p) => [p.id, p.directionId])),
      applications,
      unreadFeedbackCount: snapshot.notifications.filter((n) => n.type === "feedback" && !n.readAt).length,
      eligibleProofToReview: snapshot.proofs.some(
        (p) =>
          p.userId !== userId &&
          p.status !== "draft" &&
          p.visibility === "cohort" &&
          visibleModeration(p.moderationStatus) &&
          !blocked.has(p.userId)
      ),
      now: loadStamp
    };
  }, [authReady, me, snapshot, currentUser, remoteCompletions, applications, loadStamp]);

  const state: ConstellationState | null = useMemo(
    () => (inputs ? buildConstellationState(inputs) : null),
    [inputs]
  );

  // Fire growth_loop_completed exactly once per transition to a full loop.
  const prevCompleted = useRef<number | null>(null);
  useEffect(() => {
    if (!state) return;
    if (prevCompleted.current !== null && prevCompleted.current < 5 && state.completedNodeCount === 5) {
      logEvent("growth_loop_completed", { directionId: state.directionId });
    }
    prevCompleted.current = state.completedNodeCount;
  }, [state, logEvent]);

  /** Received feedback the member can apply, with any existing application. */
  const applyTargets: ApplyTarget[] = useMemo(() => {
    if (!inputs || !state) return [];
    const ownProofIds = new Map(
      inputs.ownProofs.filter((p) => p.status !== "draft" && visibleModeration(p.moderationStatus)).map((p) => [p.id, p.title])
    );
    const byFeedback = new Map(applications.map((a) => [a.feedbackId, a]));
    return inputs.feedbackReceived
      .filter((f) => visibleModeration(f.moderationStatus) && ownProofIds.has(f.proofId))
      .map((f) => {
        const author = snapshot.users.find((u) => u.id === f.authorId);
        const full = snapshot.feedback.find((x) => x.id === f.id);
        return {
          feedbackId: f.id,
          proofId: f.proofId,
          proofTitle: ownProofIds.get(f.proofId) ?? "your proof",
          authorName: author?.displayName ?? "A member",
          body: full?.body ?? "",
          receivedAt: f.createdAt,
          application: byFeedback.get(f.id) ?? null
        };
      })
      .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  }, [inputs, state, applications, snapshot.users, snapshot.feedback]);

  const planApplication = useCallback(
    async (feedbackId: string, reflection: string | null): Promise<{ error: string | null }> => {
      logEvent("feedback_application_planned", { feedbackId });
      if (isDemo || !me) {
        const now = new Date().toISOString();
        setApplications((prev) => {
          const existing = prev.find((a) => a.feedbackId === feedbackId);
          if (existing) return prev;
          return [{ id: `local-app-${feedbackId}`, feedbackId, status: "planned" as const, reflection, createdAt: now, updatedAt: now }, ...prev];
        });
        return { error: null };
      }
      const client = getSupabaseClient();
      if (!client) return { error: "Not connected." };
      const res = await upsertFeedbackApplication(client, me, feedbackId, reflection);
      if (res.error || !res.application) return { error: res.error ?? "Could not save." };
      const app = res.application;
      setApplications((prev) => [app, ...prev.filter((a) => a.feedbackId !== feedbackId)]);
      return { error: null };
    },
    [isDemo, me, logEvent]
  );

  const advanceApplication = useCallback(
    async (applicationId: string, status: FeedbackApplicationStatus): Promise<{ error: string | null }> => {
      if (status !== "planned") logEvent("feedback_application_completed", { status });
      if (isDemo || !me) {
        const now = new Date().toISOString();
        setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status, updatedAt: now } : a)));
        return { error: null };
      }
      const client = getSupabaseClient();
      if (!client) return { error: "Not connected." };
      const res = await setFeedbackApplicationStatus(client, me, applicationId, status);
      if (res.error || !res.application) return { error: res.error ?? "Could not save." };
      const app = res.application;
      setApplications((prev) => prev.map((a) => (a.id === app.id ? app : a)));
      return { error: null };
    },
    [isDemo, me, logEvent]
  );

  return {
    phase,
    state,
    retry,
    applyTargets,
    applicationsAvailable,
    planApplication,
    advanceApplication,
    logEvent
  };
}
