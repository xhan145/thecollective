"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { seedSnapshot } from "@/lib/betaData";
import type { AiFeature, AiHelpfulness, AiInteraction, AiIssueType, AiResponse, AiSourceType, AiUserFeedback } from "@/lib/aiTypes";
import type {
  AppFeedbackDraftInput,
  AppNotification,
  BetaAppSnapshot,
  Contribution,
  Conversation,
  Feedback,
  FeedbackDraftInput,
  Message,
  PracticePrompt,
  PracticeTip,
  Proof,
  ProofDraftInput,
  SavedTargetType,
  TrustSummary,
  UsefulReason,
  UserProfile
} from "@/lib/betaTypes";
import { rankTips } from "@/lib/tips/rankTips";
import { listTips } from "@/lib/supabase/tipsRepository";
import type { Cohort, CohortMember, CohortJoinRequest } from "@/lib/cohorts/types";
import { rankFeed, type RankedProof } from "@/lib/feed/rankProofFeed";
import {
  listMyCohorts,
  getCohort,
  listMembers,
  listOwnerRequests,
  listCohortProofs,
  createCohort as createCohortRpc,
  joinCohort as joinCohortRpc,
  requestJoin as requestJoinRpc,
  approveRequest as approveRequestRpc,
  declineRequest as declineRequestRpc,
  redeemCohortInvite as redeemCohortInviteRpc,
  leaveCohort as leaveCohortRpc,
  removeMember as removeMemberRpc,
} from "@/lib/supabase/cohortsRepository";
import { firebaseModeLabel, isFirebaseConfigured, proofStoragePath } from "@/lib/firebase";
import { makeTrustEvent, summarizeTrust, trustLevelForPoints } from "@/lib/betaTrust";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  loadUserBundle,
  persistAiInteraction,
  persistAiUserFeedback,
  persistAppFeedback,
  persistFeedback,
  persistMarkHelpful,
  persistProof,
  persistConnection,
  persistSavedItem,
  persistUsefulMark,
  recordPracticeCompletion,
  markAllNotificationsRead,
  markNotificationRead as markNotificationReadRow,
  mapNotification,
  removeConnection,
  removeSavedItem,
  removeUsefulMark,
  sendMessage,
  startConversation,
  submitContribution,
  acceptContribution,
  setProofOpen,
  updateOnboarding,
  updateProfile as updateProfileRow,
  type BetaUserBundle
} from "@/lib/supabase/betaRepository";
import { loadContent, type CollectiveContent } from "@/lib/supabase/contentRepository";
import { logBetaEvent, type BetaEventType } from "@/lib/supabase/betaEvents";

const STORAGE_KEY = "collective.beta.snapshot.v1";

export type AuthResult = { error: string | null; needsConfirmation?: boolean };
export type CohortActionResult = { error: string | null; id?: string | null };

export type OnboardingPayload = {
  directionId: string;
  goalText?: string;
  startingLevel?: import("@/lib/betaTypes").PracticeLevel;
  contextTags?: import("@/lib/betaTypes").ContextTag[];
  cadence?: string;
};

type BetaAppContextValue = {
  snapshot: BetaAppSnapshot;
  currentUser: UserProfile | null;
  isMockMode: boolean;
  firebaseMode: string;
  supabaseEnabled: boolean;
  authReady: boolean;
  trustSummary: TrustSummary;
  enterDemoBeta: (userId?: string) => void;
  signOutDemo: () => void;
  signUpWithEmail: (email: string, password: string, meta?: { displayName?: string; username?: string }) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>;
  updateProfile: (fields: { displayName?: string; username?: string; bio?: string }) => Promise<void>;
  completePractice: (promptId: string) => void;
  submitProof: (input: ProofDraftInput) => Promise<{ proof: Proof | null; error: string | null }>;
  logEvent: (eventType: BetaEventType, metadata?: Record<string, unknown>) => void;
  addFeedback: (input: FeedbackDraftInput) => Feedback | null;
  markFeedbackHelpful: (feedbackId: string) => void;
  submitAppFeedback: (input: AppFeedbackDraftInput) => void;
  toggleUseful: (targetId: string, reason?: UsefulReason, targetType?: "proof" | "tip") => void;
  toggleSaved: (targetType: SavedTargetType, targetId: string) => void;
  toggleLearnFrom: (teacherId: string) => void;
  isUseful: (proofId: string) => boolean;
  isSaved: (targetType: SavedTargetType, targetId: string) => boolean;
  isLearningFrom: (teacherId: string) => boolean;
  getSavedProofs: () => Proof[];
  getSavedPractices: () => PracticePrompt[];
  getTeachers: () => UserProfile[];
  requestFeedback: (proofId: string, body: string) => Promise<string | null>;
  sendPeerNote: (recipientId: string, body: string, proofId?: string | null) => Promise<string | null>;
  replyToConversation: (conversationId: string, body: string) => Promise<void>;
  getConversations: () => Conversation[];
  getMessages: (conversationId: string) => Message[];
  getNotifications: () => AppNotification[];
  unreadNotificationCount: () => number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  recordAiInteraction: (input: {
    feature: AiFeature;
    sourceType: AiSourceType;
    sourceId: string;
    promptId?: string;
    proofId?: string;
    inputSummary: string;
    output: AiResponse;
  }) => AiInteraction | null;
  submitAiUserFeedback: (input: {
    aiInteractionId: string;
    feature: AiFeature;
    helpfulness: AiHelpfulness;
    issueType?: AiIssueType;
    comment?: string;
  }) => AiUserFeedback | null;
  submitContribution: (input: { proofId: string; observation: string; nextStep: string }) => Promise<{ contribution: Contribution | null; error: string | null }>;
  acceptContribution: (contributionId: string) => Promise<void>;
  toggleProofOpen: (proofId: string, open: boolean, focus?: string) => void;
  getOpenProofs: () => Proof[];
  getContributionsForProof: (proofId: string) => Contribution[];
  isEligibleToContribute: () => boolean;
  getPromptById: (promptId: string) => PracticePrompt | undefined;
  getProofById: (proofId: string) => Proof | undefined;
  getFeedbackForProof: (proofId: string) => Feedback[];
  getTrustSummaryForUser: (userId: string) => TrustSummary;
  getTipsForPractice: (promptId: string) => PracticeTip[];
  loadTips: (promptId: string) => Promise<void>;
  submitTip: (promptId: string, body: string) => Promise<{ tip: PracticeTip | null; error: string | null }>;
  // Cohorts
  getMyCohorts: () => Cohort[];
  loadCohort: (id: string) => Promise<{ cohort: Cohort | null; members: CohortMember[]; requests: CohortJoinRequest[]; feedProofs: Proof[] }>;
  getCohortFeed: (cohortId: string, proofs: Proof[]) => RankedProof[];
  createCohortAction: (a: { name: string; description?: string; directionId?: string; visibility: string; accent?: string }) => Promise<CohortActionResult>;
  joinCohortAction: (id: string) => Promise<CohortActionResult>;
  requestJoinAction: (id: string) => Promise<CohortActionResult>;
  approveRequestAction: (id: string) => Promise<CohortActionResult>;
  declineRequestAction: (id: string) => Promise<CohortActionResult>;
  redeemCohortInviteAction: (code: string) => Promise<CohortActionResult>;
  leaveCohortAction: (id: string) => Promise<CohortActionResult>;
  removeMemberAction: (cohortId: string, userId: string) => Promise<CohortActionResult>;
};

const BetaAppContext = createContext<BetaAppContextValue | undefined>(undefined);

function readSnapshot(): BetaAppSnapshot {
  if (typeof window === "undefined") return seedSnapshot;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return seedSnapshot;
    const parsed = JSON.parse(saved) as Partial<BetaAppSnapshot>;
    return {
      ...seedSnapshot,
      ...parsed,
      aiInteractions: parsed.aiInteractions || [],
      aiUserFeedback: parsed.aiUserFeedback || [],
      contributions: parsed.contributions || [],
      practiceTips: parsed.practiceTips || [],
      usefulCountByTip: parsed.usefulCountByTip || {},
      myCohorts: parsed.myCohorts || []
    };
  } catch {
    return seedSnapshot;
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function titleFromBody(body: string, fallback: string) {
  const clean = body.trim().replace(/\s+/g, " ");
  if (!clean) return fallback;
  return clean.length > 72 ? `${clean.slice(0, 69)}...` : clean;
}

/** Merge seeded static content with Supabase-loaded user data for the authed member. */
function applyBundle(bundle: BetaUserBundle, uid: string, content: CollectiveContent | null): BetaAppSnapshot {
  const usersById = new Map<string, UserProfile>();
  for (const u of seedSnapshot.users) usersById.set(u.id, u);
  for (const p of bundle.profiles) usersById.set(p.id, p);
  if (bundle.profile) usersById.set(bundle.profile.id, bundle.profile);
  return {
    ...seedSnapshot,
    directions: content?.directions ?? seedSnapshot.directions,
    prompts: content?.prompts ?? seedSnapshot.prompts,
    currentUserId: uid,
    users: Array.from(usersById.values()),
    proofs: bundle.proofs,
    feedback: bundle.feedback,
    trustEvents: bundle.trustEvents,
    appFeedback: bundle.appFeedback,
    completedPracticeIds: bundle.completedPracticeIds,
    usefulMarks: bundle.usefulMarks,
    usefulCountByProof: bundle.usefulCountByProof,
    savedItems: bundle.savedItems,
    connections: bundle.connections,
    conversations: bundle.conversations,
    messagesByConversation: bundle.messagesByConversation,
    notifications: bundle.notifications,
    aiInteractions: [],
    aiUserFeedback: [],
    contributions: bundle.contributions,
    practiceTips: [],
    usefulCountByTip: {},
    myCohorts: [],
  };
}

export function BetaAppProvider({ children }: { children: React.ReactNode }) {
  const supabaseEnabled = isSupabaseConfigured();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [snapshot, setSnapshot] = useState<BetaAppSnapshot>(seedSnapshot);
  const [hydrated, setHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(!supabaseEnabled);
  const authUserIdRef = useRef<string | null>(null);
  const contentRef = useRef<CollectiveContent | null>(null);

  // Demo mode: hydrate from localStorage.
  useEffect(() => {
    if (supabaseEnabled) return;
    setSnapshot(readSnapshot());
    setHydrated(true);
  }, [supabaseEnabled]);

  // Demo mode: persist to localStorage.
  useEffect(() => {
    if (supabaseEnabled || !hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [supabaseEnabled, hydrated, snapshot]);

  // Supabase mode: load on session + react to auth changes.
  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    let active = true;

    async function loadFor(uid: string, email: string | null) {
      try {
        const [bundle, content, myCohorts] = await Promise.all([
          loadUserBundle(supabase!, uid, email),
          contentRef.current ? Promise.resolve(contentRef.current) : loadContent(supabase!),
          listMyCohorts(supabase!, uid).catch(() => [] as Cohort[])
        ]);
        if (!active) return;
        contentRef.current = content;
        authUserIdRef.current = uid;
        const base = applyBundle(bundle, uid, content);
        setSnapshot({ ...base, myCohorts });
      } catch {
        if (active) setSnapshot({ ...seedSnapshot, currentUserId: uid });
      } finally {
        if (active) setAuthReady(true);
      }
    }

    // Load DB content once (directions + practices) so signed-out screens show real data too.
    loadContent(supabase).then((content) => {
      if (!active) return;
      contentRef.current = content;
      setSnapshot((current) => ({ ...current, directions: content.directions, prompts: content.prompts }));
    });

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user) {
        void loadFor(user.id, user.email ?? null);
      } else if (active) {
        setAuthReady(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        void loadFor(user.id, user.email ?? null);
      } else {
        authUserIdRef.current = null;
        setSnapshot(seedSnapshot);
        setAuthReady(true);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabaseEnabled, supabase]);

  // Realtime: stream new notifications for the signed-in member straight into state.
  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    const uid = snapshot.currentUserId;
    if (!uid) return;
    const channel = supabase
      .channel(`notifications:${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        (payload) => {
          const n = mapNotification(payload.new);
          setSnapshot((current) =>
            current.notifications.some((x) => x.id === n.id)
              ? current
              : { ...current, notifications: [n, ...current.notifications] }
          );
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabaseEnabled, supabase, snapshot.currentUserId]);

  const currentUser = snapshot.users.find((user) => user.id === snapshot.currentUserId) || null;
  const isMockMode = !supabaseEnabled && !isFirebaseConfigured();
  const firebaseMode = supabaseEnabled ? "Supabase connected" : firebaseModeLabel();

  const trustSummary = useMemo(() => {
    const summary = summarizeTrust(snapshot.currentUserId || "user-alex", snapshot.trustEvents);
    const cu = snapshot.users.find((u) => u.id === snapshot.currentUserId);
    return { ...summary, levelLabel: trustLevelForPoints(cu?.trustScore ?? summary.totalPoints) };
  }, [snapshot.currentUserId, snapshot.trustEvents, snapshot.users]);

  const value = useMemo<BetaAppContextValue>(() => {
    const writesEnabled = supabaseEnabled && !!supabase;
    function authUid() {
      return authUserIdRef.current;
    }

    function getPromptById(promptId: string) {
      return snapshot.prompts.find((prompt) => prompt.id === promptId);
    }
    function getProofById(proofId: string) {
      return snapshot.proofs.find((proof) => proof.id === proofId);
    }
    function getFeedbackForProof(proofId: string) {
      return snapshot.feedback.filter((item) => item.proofId === proofId);
    }
    function getTrustSummaryForUser(userId: string) {
      const summary = summarizeTrust(userId, snapshot.trustEvents);
      const u = snapshot.users.find((user) => user.id === userId);
      return { ...summary, levelLabel: trustLevelForPoints(u?.trustScore ?? summary.totalPoints) };
    }

    async function startThread(
      kind: Conversation["kind"],
      initiatorId: string,
      recipientId: string,
      proofId: string | null,
      body: string
    ): Promise<string | null> {
      const uid = authUid();
      let convId = makeId("conv");
      let msgId = makeId("msg");
      if (writesEnabled && uid) {
        const res = await startConversation(supabase!, { kind, initiatorId: uid, recipientId, proofId, body });
        if (!res) return null;
        convId = res.conversationId;
        if (res.messageId) msgId = res.messageId;
      }
      const nowIso = new Date().toISOString();
      const conversation: Conversation = {
        id: convId, kind, initiatorId, recipientId, proofId: proofId ?? null,
        subject: kind === "feedback_request" ? "Feedback request" : "Peer note",
        lastMessageAt: nowIso, createdAt: nowIso
      };
      const message: Message = { id: msgId, conversationId: convId, senderId: initiatorId, body, createdAt: nowIso };
      setSnapshot((current) => ({
        ...current,
        conversations: [conversation, ...current.conversations],
        messagesByConversation: { ...current.messagesByConversation, [convId]: [message] }
      }));
      return convId;
    }

    return {
      snapshot,
      currentUser,
      isMockMode,
      firebaseMode,
      supabaseEnabled,
      authReady,
      trustSummary,
      enterDemoBeta(userId = "user-alex") {
        setSnapshot((current) => ({ ...current, currentUserId: userId }));
      },
      signOutDemo() {
        setSnapshot((current) => ({ ...current, currentUserId: null }));
      },
      async signUpWithEmail(email, password, meta) {
        if (!writesEnabled) return { error: "Supabase is not configured." };
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${appUrl}/auth`,
            data: meta ? { display_name: meta.displayName, username: meta.username } : undefined
          }
        });
        if (error) return { error: error.message };
        // If a session exists immediately (email confirmation off), save the chosen
        // display name + username. Otherwise the trigger's email-derived values stand.
        if (data.session && meta) {
          await updateProfileRow(supabase!, data.session.user.id, {
            displayName: meta.displayName,
            username: meta.username
          }).catch(() => {});
        }
        if (data.session) void logBetaEvent(supabase!, data.session.user.id, "signup_completed");
        return { error: null, needsConfirmation: !data.session };
      },
      async signInWithEmail(email, password) {
        if (!writesEnabled) return { error: "Supabase is not configured." };
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        return { error: error ? error.message : null };
      },
      async signOut() {
        if (writesEnabled) await supabase!.auth.signOut();
        setSnapshot(seedSnapshot);
      },
      async completeOnboarding(payload) {
        setSnapshot((current) => {
          if (!current.currentUserId) return current;
          return {
            ...current,
            users: current.users.map((u) =>
              u.id === current.currentUserId
                ? {
                    ...u,
                    currentDirectionId: payload.directionId,
                    onboardingCompleted: true,
                    directionIds: [payload.directionId],
                    goalText: payload.goalText ?? null,
                    startingLevel: payload.startingLevel ?? null,
                    contextTags: payload.contextTags ?? [],
                    cadence: payload.cadence ?? null,
                  }
                : u
            ),
          };
        });
        const uid = authUid();
        if (writesEnabled && uid) {
          await updateOnboarding(supabase!, uid, {
            directionId: payload.directionId,
            goalText: payload.goalText,
            startingLevel: payload.startingLevel,
            contextTags: payload.contextTags,
            cadence: payload.cadence,
          }).catch(() => {});
          void logBetaEvent(supabase!, uid, "onboarding_completed", undefined, { directionId: payload.directionId });
        }
      },
      async updateProfile(fields) {
        setSnapshot((current) => {
          if (!current.currentUserId) return current;
          return {
            ...current,
            users: current.users.map((u) =>
              u.id === current.currentUserId
                ? {
                    ...u,
                    ...(fields.displayName !== undefined
                      ? { displayName: fields.displayName, initials: fields.displayName.slice(0, 2).toUpperCase() }
                      : {}),
                    ...(fields.username !== undefined ? { username: fields.username } : {}),
                    ...(fields.bio !== undefined ? { bio: fields.bio } : {})
                  }
                : u
            )
          };
        });
        const uid = authUid();
        if (writesEnabled && uid) await updateProfileRow(supabase!, uid, fields).catch(() => {});
      },
      completePractice(promptId) {
        let label = "a practice";
        setSnapshot((current) => {
          if (!current.currentUserId || current.completedPracticeIds.includes(promptId)) return current;
          const prompt = current.prompts.find((item) => item.id === promptId);
          label = prompt?.title || label;
          return {
            ...current,
            completedPracticeIds: [promptId, ...current.completedPracticeIds],
            trustEvents: [
              makeTrustEvent(current.currentUserId, "practice", `Completed ${label}`, promptId),
              ...current.trustEvents
            ]
          };
        });
        const uid = authUid();
        if (writesEnabled && uid) {
          void recordPracticeCompletion(supabase!, uid, promptId, `Completed ${label}`).catch(() => {});
          void logBetaEvent(supabase!, uid, "practice_completed", undefined, { promptId });
        }
      },
      logEvent(eventType, metadata) {
        if (writesEnabled) void logBetaEvent(supabase!, authUid(), eventType, undefined, metadata);
      },
      async submitProof(input) {
        const uid = authUid();
        const ownerId = uid || snapshot.currentUserId || "user-alex";
        const prompt = snapshot.prompts.find((item) => item.id === input.promptId);
        const directionId = prompt?.directionId || snapshot.directions[0]?.id || "direction-confidence";
        const proofId = crypto.randomUUID();
        const attachment = input.attachment
          ? (() => {
              const { file, ...meta } = input.attachment!;
              void file;
              return { ...meta, id: makeId("attachment"), storagePath: proofStoragePath(ownerId, proofId, meta.fileName) };
            })()
          : undefined;

        const created: Proof = {
          id: proofId,
          userId: ownerId,
          promptId: input.promptId,
          directionId,
          title: titleFromBody(input.body, `${input.mediaType[0].toUpperCase()}${input.mediaType.slice(1)} proof`),
          body: input.body.trim(),
          mediaType: input.mediaType,
          attachments: attachment ? [attachment] : [],
          status: "submitted",
          visibility: "private",
          feedbackIds: [],
          createdAt: new Date().toISOString()
        };

        // Optimistic insert so the proof appears immediately and the text is never lost.
        setSnapshot((current) => ({
          ...current,
          currentUserId: ownerId,
          proofs: [created, ...current.proofs],
          trustEvents: [makeTrustEvent(ownerId, "proof", "Submitted proof from practice", proofId), ...current.trustEvents]
        }));

        // Demo mode (no backend): the optimistic proof is the source of truth.
        if (!writesEnabled || !uid) return { proof: created, error: null };
        // Video proofs are marked submitted locally only — we do NOT store them on
        // the database (no proofs row, no storage upload). The optimistic proof
        // (status "submitted") is the source of truth.
        if (input.mediaType === "video") {
          void logBetaEvent(supabase!, uid, "proof_submit_succeeded", undefined, { proofId, stored: false });
          return { proof: created, error: null };
        }
        try {
          await persistProof(supabase!, created, input.attachment?.file);
          void logBetaEvent(supabase!, uid, "proof_submit_succeeded", undefined, { proofId });
          return { proof: created, error: null };
        } catch {
          // The optimistic proof stays in local state, so the user's text is not lost.
          void logBetaEvent(supabase!, uid, "proof_submit_failed", undefined, { proofId });
          return { proof: created, error: "We couldn’t save this proof yet. Your text is still here — try again." };
        }
      },
      addFeedback(input) {
        let created: Feedback | null = null;
        const uid = authUid();
        const clarity = input.clarityNote?.trim() || "";
        const useful = input.usefulNote?.trim() || "";
        const next = input.nextStepNote?.trim() || "";
        const body =
          input.body?.trim() ||
          [
            clarity && `What was clear: ${clarity}`,
            useful && `What could be improved: ${useful}`,
            next && `One useful next step: ${next}`
          ]
            .filter(Boolean)
            .join("\n");
        setSnapshot((current) => {
          const ownerId = uid || current.currentUserId || "user-alex";
          const proof = current.proofs.find((item) => item.id === input.proofId);
          if (!proof || !body.trim()) return current;
          const feedbackId = crypto.randomUUID();
          created = {
            id: feedbackId,
            proofId: proof.id,
            authorId: ownerId,
            recipientId: proof.userId,
            body,
            tone: input.tone ?? "specific",
            helpful: false,
            clarityNote: clarity || undefined,
            usefulNote: useful || undefined,
            nextStepNote: next || undefined,
            createdAt: new Date().toISOString()
          };
          return {
            ...current,
            feedback: [created, ...current.feedback],
            proofs: current.proofs.map((item) =>
              item.id === proof.id
                ? { ...item, status: "feedback-ready", feedbackIds: [feedbackId, ...item.feedbackIds] }
                : item
            ),
            trustEvents: [
              makeTrustEvent(ownerId, "peer-feedback", "Gave useful feedback", feedbackId),
              ...current.trustEvents
            ]
          };
        });
        if (writesEnabled && uid && created) {
          void persistFeedback(supabase!, created).catch(() => {});
          void logBetaEvent(supabase!, uid, "feedback_submitted", undefined, { proofId: input.proofId });
        }
        return created;
      },
      markFeedbackHelpful(feedbackId) {
        let authorId: string | null = null;
        setSnapshot((current) => {
          const feedback = current.feedback.find((item) => item.id === feedbackId);
          if (!feedback || feedback.helpful) return current;
          authorId = feedback.authorId;
          return {
            ...current,
            feedback: current.feedback.map((item) => (item.id === feedbackId ? { ...item, helpful: true } : item)),
            trustEvents: [
              makeTrustEvent(feedback.authorId, "helpful", "Feedback marked helpful", feedbackId),
              ...current.trustEvents
            ]
          };
        });
        if (writesEnabled && authUid() && authorId) {
          void persistMarkHelpful(supabase!, feedbackId, authorId).catch(() => {});
        }
      },
      submitAppFeedback(input) {
        const uid = authUid();
        setSnapshot((current) => {
          const ownerId = uid || current.currentUserId || "user-alex";
          return {
            ...current,
            currentUserId: ownerId,
            appFeedback: [
              {
                id: makeId("app-feedback"),
                userId: ownerId,
                category: input.category,
                body: input.body.trim(),
                route: input.route,
                createdAt: new Date().toISOString(),
                reviewed: false
              },
              ...current.appFeedback
            ]
          };
        });
        if (writesEnabled && uid) {
          void persistAppFeedback(supabase!, uid, input).catch(() => {});
          void logBetaEvent(supabase!, uid, "app_feedback_submitted", undefined, { category: input.category });
        }
      },
      recordAiInteraction(input) {
        let created: AiInteraction | null = null;
        const uid = authUid();
        setSnapshot((current) => {
          const ownerId = uid || current.currentUserId || "user-alex";
          const user = current.users.find((item) => item.id === ownerId) || current.users[0];
          created = {
            id: `ai-interaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId: ownerId,
            cohortId: user?.cohortId || "founding-circle",
            feature: input.feature,
            sourceType: input.sourceType,
            sourceId: input.sourceId,
            promptId: input.promptId,
            proofId: input.proofId,
            inputSummary: input.inputSummary,
            output: input.output,
            createdAt: new Date().toISOString()
          };
          return {
            ...current,
            currentUserId: ownerId,
            aiInteractions: [created, ...(current.aiInteractions || [])]
          };
        });
        if (writesEnabled && uid && created) {
          void persistAiInteraction(supabase!, created).catch(() => {});
        }
        return created;
      },
      submitAiUserFeedback(input) {
        let created: AiUserFeedback | null = null;
        const uid = authUid();
        setSnapshot((current) => {
          const ownerId = uid || current.currentUserId || "user-alex";
          const user = current.users.find((item) => item.id === ownerId) || current.users[0];
          created = {
            id: `ai-user-feedback-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId: ownerId,
            userDisplayName: user?.displayName || "Alex",
            cohortId: user?.cohortId || "founding-circle",
            aiInteractionId: input.aiInteractionId,
            feature: input.feature,
            helpfulness: input.helpfulness,
            issueType: input.issueType,
            comment: input.comment?.trim() || undefined,
            createdAt: new Date().toISOString()
          };
          return {
            ...current,
            currentUserId: ownerId,
            aiUserFeedback: [created, ...(current.aiUserFeedback || [])]
          };
        });
        if (writesEnabled && uid && created) {
          void persistAiUserFeedback(supabase!, created).catch(() => {});
        }
        return created;
      },
      toggleUseful(targetId, reason = "clear", targetType = "proof") {
        const me = authUid() || snapshot.currentUserId;
        if (!me) return;
        const has = snapshot.usefulMarks.some((m) => m.targetId === targetId && m.userId === me);
        setSnapshot((current) => {
          const marks = has
            ? current.usefulMarks.filter((m) => !(m.targetId === targetId && m.userId === me))
            : [{ id: makeId("um"), userId: me, targetId, targetType, reason, createdAt: new Date().toISOString() }, ...current.usefulMarks];
          // Recompute both count maps from the updated marks list.
          const newCountsByProof: Record<string, number> = {};
          const newCountsByTip: Record<string, number> = {};
          for (const m of marks) {
            if (m.targetType === "tip") {
              newCountsByTip[m.targetId] = (newCountsByTip[m.targetId] ?? 0) + 1;
            } else {
              newCountsByProof[m.targetId] = (newCountsByProof[m.targetId] ?? 0) + 1;
            }
          }
          return { ...current, usefulMarks: marks, usefulCountByProof: newCountsByProof, usefulCountByTip: newCountsByTip };
        });
        const uid = authUid();
        if (writesEnabled && uid) {
          void (has ? removeUsefulMark(supabase!, uid, targetId) : persistUsefulMark(supabase!, uid, targetId, reason, targetType)).catch(() => {});
        }
      },
      toggleSaved(targetType, targetId) {
        const me = authUid() || snapshot.currentUserId;
        if (!me) return;
        const has = snapshot.savedItems.some((s) => s.targetType === targetType && s.targetId === targetId && s.userId === me);
        setSnapshot((current) => ({
          ...current,
          savedItems: has
            ? current.savedItems.filter((s) => !(s.targetType === targetType && s.targetId === targetId && s.userId === me))
            : [{ id: makeId("si"), userId: me, targetType, targetId, createdAt: new Date().toISOString() }, ...current.savedItems]
        }));
        const uid = authUid();
        if (writesEnabled && uid) {
          void (has ? removeSavedItem(supabase!, uid, targetType, targetId) : persistSavedItem(supabase!, uid, targetType, targetId)).catch(() => {});
        }
      },
      toggleLearnFrom(teacherId) {
        const me = authUid() || snapshot.currentUserId;
        if (!me || me === teacherId) return;
        const has = snapshot.connections.some((c) => c.teacherId === teacherId && c.learnerId === me && c.status === "active");
        setSnapshot((current) => ({
          ...current,
          connections: has
            ? current.connections.filter((c) => !(c.teacherId === teacherId && c.learnerId === me))
            : [{ id: makeId("mc"), learnerId: me, teacherId, status: "active", createdAt: new Date().toISOString() }, ...current.connections]
        }));
        const uid = authUid();
        if (writesEnabled && uid) {
          void (has ? removeConnection(supabase!, uid, teacherId) : persistConnection(supabase!, uid, teacherId)).catch(() => {});
        }
      },
      isUseful(proofId) {
        const me = snapshot.currentUserId;
        return !!me && snapshot.usefulMarks.some((m) => m.targetId === proofId && m.userId === me);
      },
      isSaved(targetType, targetId) {
        const me = snapshot.currentUserId;
        return !!me && snapshot.savedItems.some((s) => s.targetType === targetType && s.targetId === targetId && s.userId === me);
      },
      isLearningFrom(teacherId) {
        const me = snapshot.currentUserId;
        return !!me && snapshot.connections.some((c) => c.teacherId === teacherId && c.learnerId === me && c.status === "active");
      },
      getSavedProofs() {
        const ids = new Set(snapshot.savedItems.filter((s) => s.targetType === "proof").map((s) => s.targetId));
        return snapshot.proofs.filter((p) => ids.has(p.id));
      },
      getSavedPractices() {
        const ids = new Set(snapshot.savedItems.filter((s) => s.targetType === "practice").map((s) => s.targetId));
        return snapshot.prompts.filter((p) => ids.has(p.id));
      },
      getTeachers() {
        const ids = new Set(snapshot.connections.filter((c) => c.status === "active").map((c) => c.teacherId));
        return snapshot.users.filter((u) => ids.has(u.id));
      },
      async requestFeedback(proofId, body) {
        const me = authUid() || snapshot.currentUserId;
        const proof = snapshot.proofs.find((p) => p.id === proofId);
        if (!me || !proof || proof.userId === me || !body.trim()) return null;
        return startThread("feedback_request", me, proof.userId, proofId, body.trim());
      },
      async sendPeerNote(recipientId, body, proofId = null) {
        const me = authUid() || snapshot.currentUserId;
        if (!me || me === recipientId || !body.trim()) return null;
        return startThread("peer_note", me, recipientId, proofId, body.trim());
      },
      async replyToConversation(conversationId, body) {
        const me = authUid() || snapshot.currentUserId;
        if (!me || !body.trim()) return;
        const message: Message = {
          id: makeId("msg"),
          conversationId,
          senderId: me,
          body: body.trim(),
          createdAt: new Date().toISOString()
        };
        setSnapshot((current) => ({
          ...current,
          conversations: current.conversations
            .map((c) => (c.id === conversationId ? { ...c, lastMessageAt: message.createdAt } : c))
            .sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1)),
          messagesByConversation: {
            ...current.messagesByConversation,
            [conversationId]: [...(current.messagesByConversation[conversationId] ?? []), message]
          }
        }));
        const uid = authUid();
        if (writesEnabled && uid) await sendMessage(supabase!, conversationId, uid, body.trim()).catch(() => {});
      },
      getConversations() {
        return [...snapshot.conversations].sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
      },
      getMessages(conversationId) {
        return snapshot.messagesByConversation[conversationId] ?? [];
      },
      getNotifications() {
        return snapshot.notifications;
      },
      unreadNotificationCount() {
        return snapshot.notifications.filter((n) => !n.readAt).length;
      },
      markNotificationRead(id) {
        const nowIso = new Date().toISOString();
        setSnapshot((current) => ({
          ...current,
          notifications: current.notifications.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: nowIso } : n))
        }));
        if (writesEnabled) void markNotificationReadRow(supabase!, id).catch(() => {});
      },
      markAllNotificationsRead() {
        const nowIso = new Date().toISOString();
        setSnapshot((current) => ({
          ...current,
          notifications: current.notifications.map((n) => (n.readAt ? n : { ...n, readAt: nowIso }))
        }));
        const uid = authUid();
        if (writesEnabled && uid) void markAllNotificationsRead(supabase!, uid).catch(() => {});
      },
      async submitContribution(input) {
        const uid = authUid();
        const me = uid || snapshot.currentUserId || "user-alex";
        const proof = snapshot.proofs.find((p) => p.id === input.proofId);
        if (!proof || !input.observation.trim() || !input.nextStep.trim()) {
          return { contribution: null, error: "Add an observation and a next step." };
        }
        const optimistic: Contribution = {
          id: makeId("contribution"), proofId: proof.id, contributorId: me, ownerId: proof.userId,
          observation: input.observation.trim(), nextStep: input.nextStep.trim(),
          status: "pending", createdAt: new Date().toISOString(), acceptedAt: null,
        };
        setSnapshot((current) => ({ ...current, contributions: [optimistic, ...current.contributions] }));
        if (!writesEnabled || !uid) return { contribution: optimistic, error: null };
        try {
          const id = await submitContribution(supabase!, input);
          void logBetaEvent(supabase!, uid, "contribution_submitted", undefined, { proofId: input.proofId });
          setSnapshot((current) => ({
            ...current,
            contributions: current.contributions.map((c) => (c.id === optimistic.id ? { ...c, id } : c)),
          }));
          return { contribution: { ...optimistic, id }, error: null };
        } catch {
          return { contribution: optimistic, error: "We couldn't send your contribution yet — your text is still here, try again." };
        }
      },
      async acceptContribution(contributionId) {
        setSnapshot((current) => ({
          ...current,
          contributions: current.contributions.map((c) =>
            c.id === contributionId ? { ...c, status: "accepted", acceptedAt: new Date().toISOString() } : c),
        }));
        const uid = authUid();
        if (writesEnabled && uid) {
          try {
            await acceptContribution(supabase!, contributionId);
            void logBetaEvent(supabase!, uid, "contribution_accepted", undefined, { contributionId });
          } catch { /* optimistic accept stays; reconciles on next load */ }
        }
      },
      toggleProofOpen(proofId, open, focus) {
        setSnapshot((current) => ({
          ...current,
          proofs: current.proofs.map((p) =>
            p.id === proofId ? { ...p, openForContributions: open, contributionFocus: focus ?? null } : p),
        }));
        const uid = authUid();
        if (writesEnabled && uid) void setProofOpen(supabase!, proofId, open, focus ?? null).catch(() => {});
      },
      getOpenProofs() {
        const me = snapshot.currentUserId;
        return snapshot.proofs.filter((p) => p.openForContributions && p.userId !== me);
      },
      getContributionsForProof(proofId) {
        return snapshot.contributions.filter((c) => c.proofId === proofId);
      },
      isEligibleToContribute() {
        const me = snapshot.currentUserId;
        if (!me) return false;
        const hasProof = snapshot.proofs.some((p) => p.userId === me);
        const gaveFeedback = snapshot.feedback.some((f) => f.authorId === me);
        return hasProof && gaveFeedback;
      },
      getPromptById,
      getProofById,
      getFeedbackForProof,
      getTrustSummaryForUser,
      getTipsForPractice(promptId) {
        const authorsById: Record<string, UserProfile> = {};
        for (const u of snapshot.users) authorsById[u.id] = u;
        const tips = snapshot.practiceTips.filter((t) => t.promptId === promptId);
        return rankTips(currentUser, tips, authorsById, snapshot.usefulCountByTip);
      },
      async loadTips(promptId) {
        if (!supabaseEnabled || !supabase) return;
        try {
          const fetched = await listTips(supabase, promptId, authUid() || snapshot.currentUserId || undefined);
          setSnapshot((current) => {
            const existingIds = new Set(current.practiceTips.map((t) => t.id));
            const merged = [...current.practiceTips, ...fetched.filter((t) => !existingIds.has(t.id))];
            return { ...current, practiceTips: merged };
          });
        } catch {
          // non-fatal; tips will show on next attempt
        }
      },
      async submitTip(promptId, body) {
        const uid = authUid();
        const me = uid || snapshot.currentUserId;
        if (!me || !body.trim()) return { tip: null, error: "A tip body is required." };
        const optimistic: PracticeTip = {
          id: makeId("tip"),
          promptId,
          authorId: me,
          body: body.trim(),
          isDemo: false,
          createdAt: new Date().toISOString(),
        };
        setSnapshot((current) => ({ ...current, practiceTips: [optimistic, ...current.practiceTips] }));
        // Demo mode: optimistic tip is the source of truth.
        if (!writesEnabled || !uid) return { tip: optimistic, error: null };
        try {
          const token = (await supabase!.auth.getSession()).data.session?.access_token;
          const res = await fetch("/api/tips", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ promptId, body: body.trim() }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            setSnapshot((current) => ({ ...current, practiceTips: current.practiceTips.filter((t) => t.id !== optimistic.id) }));
            return { tip: null, error: (j && j.error) || "We couldn't save your tip — try again." };
          }
          const json = await res.json();
          const serverTip: PracticeTip | undefined = json?.tip;
          if (serverTip?.id) {
            setSnapshot((current) => ({
              ...current,
              practiceTips: current.practiceTips.map((t) => (t.id === optimistic.id ? serverTip : t)),
            }));
            return { tip: serverTip, error: null };
          }
          // Fallback: keep optimistic row if server response is missing the tip wrapper.
          return { tip: optimistic, error: null };
        } catch {
          setSnapshot((current) => ({ ...current, practiceTips: current.practiceTips.filter((t) => t.id !== optimistic.id) }));
          return { tip: null, error: "We couldn't save your tip — try again." };
        }
      },
      // ---- Cohort methods ----
      getMyCohorts() {
        return snapshot.myCohorts;
      },
      async loadCohort(id) {
        if (!supabaseEnabled || !supabase) {
          return { cohort: null, members: [], requests: [], feedProofs: [] };
        }
        const cohort = await getCohort(supabase, id).catch(() => null);
        const uid = authUid();
        const isOwner = !!cohort && !!uid && cohort.ownerId === uid;
        const [members, requests, feedProofs] = await Promise.all([
          listMembers(supabase, id).catch(() => [] as CohortMember[]),
          isOwner ? listOwnerRequests(supabase, id).catch(() => [] as CohortJoinRequest[]) : Promise.resolve([] as CohortJoinRequest[]),
          listCohortProofs(supabase, id).catch(() => [] as Proof[]),
        ]);
        return { cohort, members, requests, feedProofs };
      },
      getCohortFeed(_cohortId, proofs) {
        if (!currentUser) return [];
        const authorsById: Record<string, UserProfile> = {};
        for (const u of snapshot.users) authorsById[u.id] = u;
        return rankFeed(currentUser, proofs, authorsById, snapshot.usefulCountByProof);
      },
      async createCohortAction(a) {
        if (!writesEnabled || !supabase) return { error: "Supabase is not configured." };
        const { data, error } = await createCohortRpc(supabase, a);
        if (error) return { error: error.message };
        const newId: string | null = typeof data === "string" ? data : null;
        const uid = authUid();
        if (uid) {
          const fresh = await listMyCohorts(supabase, uid).catch(() => null);
          if (fresh) setSnapshot((current) => ({ ...current, myCohorts: fresh }));
        }
        return { error: null, id: newId };
      },
      async joinCohortAction(id) {
        if (!writesEnabled || !supabase) return { error: "Supabase is not configured." };
        const { error } = await joinCohortRpc(supabase, id);
        if (error) return { error: error.message };
        const uid = authUid();
        if (uid) {
          const fresh = await listMyCohorts(supabase, uid).catch(() => null);
          if (fresh) setSnapshot((current) => ({ ...current, myCohorts: fresh }));
        }
        return { error: null };
      },
      async requestJoinAction(id) {
        if (!writesEnabled || !supabase) return { error: "Supabase is not configured." };
        const { error } = await requestJoinRpc(supabase, id);
        return { error: error ? error.message : null };
      },
      async approveRequestAction(id) {
        if (!writesEnabled || !supabase) return { error: "Supabase is not configured." };
        const { error } = await approveRequestRpc(supabase, id);
        return { error: error ? error.message : null };
      },
      async declineRequestAction(id) {
        if (!writesEnabled || !supabase) return { error: "Supabase is not configured." };
        const { error } = await declineRequestRpc(supabase, id);
        return { error: error ? error.message : null };
      },
      async redeemCohortInviteAction(code) {
        if (!writesEnabled || !supabase) return { error: "Supabase is not configured." };
        const { data, error } = await redeemCohortInviteRpc(supabase, code);
        if (error) return { error: error.message };
        // redeem_cohort_invite RPC returns the cohort_id as data
        const cohortId: string | null = typeof data === "string" ? data : null;
        const uid = authUid();
        if (uid) {
          const fresh = await listMyCohorts(supabase, uid).catch(() => null);
          if (fresh) setSnapshot((current) => ({ ...current, myCohorts: fresh }));
        }
        return { error: null, id: cohortId };
      },
      async leaveCohortAction(id) {
        if (!writesEnabled || !supabase) return { error: "Supabase is not configured." };
        const { error } = await leaveCohortRpc(supabase, id);
        if (error) return { error: error.message };
        const uid = authUid();
        if (uid) {
          const fresh = await listMyCohorts(supabase, uid).catch(() => null);
          if (fresh) setSnapshot((current) => ({ ...current, myCohorts: fresh }));
        }
        return { error: null };
      },
      async removeMemberAction(cohortId, userId) {
        if (!writesEnabled || !supabase) return { error: "Supabase is not configured." };
        const { error } = await removeMemberRpc(supabase, cohortId, userId);
        return { error: error ? error.message : null };
      },
    };
  }, [currentUser, firebaseMode, isMockMode, snapshot, trustSummary, supabaseEnabled, supabase, authReady]);

  return <BetaAppContext.Provider value={value}>{children}</BetaAppContext.Provider>;
}

export function useBetaApp() {
  const context = useContext(BetaAppContext);
  if (!context) throw new Error("useBetaApp must be used inside BetaAppProvider");
  return context;
}
