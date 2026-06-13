"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { seedSnapshot } from "@/lib/betaData";
import type { AiFeature, AiHelpfulness, AiInteraction, AiIssueType, AiResponse, AiSourceType, AiUserFeedback } from "@/lib/aiTypes";
import type {
  AppFeedbackDraftInput,
  BetaAppSnapshot,
  Feedback,
  FeedbackDraftInput,
  PracticePrompt,
  Proof,
  ProofDraftInput,
  TrustSummary,
  UserProfile
} from "@/lib/betaTypes";
import { firebaseModeLabel, isFirebaseConfigured, proofStoragePath } from "@/lib/firebase";
import { makeTrustEvent, summarizeTrust } from "@/lib/betaTrust";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  loadUserBundle,
  persistAiInteraction,
  persistAiUserFeedback,
  persistAppFeedback,
  persistFeedback,
  persistMarkHelpful,
  persistProof,
  recordPracticeCompletion,
  type BetaUserBundle
} from "@/lib/supabase/betaRepository";

const STORAGE_KEY = "collective.beta.snapshot.v1";

export type AuthResult = { error: string | null; needsConfirmation?: boolean };

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
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  completePractice: (promptId: string) => void;
  submitProof: (input: ProofDraftInput) => Proof | null;
  addFeedback: (input: FeedbackDraftInput) => Feedback | null;
  markFeedbackHelpful: (feedbackId: string) => void;
  submitAppFeedback: (input: AppFeedbackDraftInput) => void;
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
  getPromptById: (promptId: string) => PracticePrompt | undefined;
  getProofById: (proofId: string) => Proof | undefined;
  getFeedbackForProof: (proofId: string) => Feedback[];
  getTrustSummaryForUser: (userId: string) => TrustSummary;
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
      aiUserFeedback: parsed.aiUserFeedback || []
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
function applyBundle(bundle: BetaUserBundle, uid: string): BetaAppSnapshot {
  const usersById = new Map<string, UserProfile>();
  for (const u of seedSnapshot.users) usersById.set(u.id, u);
  for (const p of bundle.profiles) usersById.set(p.id, p);
  if (bundle.profile) usersById.set(bundle.profile.id, bundle.profile);
  return {
    ...seedSnapshot,
    currentUserId: uid,
    users: Array.from(usersById.values()),
    proofs: bundle.proofs,
    feedback: bundle.feedback,
    trustEvents: bundle.trustEvents,
    appFeedback: bundle.appFeedback,
    completedPracticeIds: bundle.completedPracticeIds,
    aiInteractions: [],
    aiUserFeedback: []
  };
}

export function BetaAppProvider({ children }: { children: React.ReactNode }) {
  const supabaseEnabled = isSupabaseConfigured();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [snapshot, setSnapshot] = useState<BetaAppSnapshot>(seedSnapshot);
  const [hydrated, setHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(!supabaseEnabled);
  const authUserIdRef = useRef<string | null>(null);

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
        const bundle = await loadUserBundle(supabase!, uid, email);
        if (!active) return;
        authUserIdRef.current = uid;
        setSnapshot(applyBundle(bundle, uid));
      } catch {
        if (active) setSnapshot({ ...seedSnapshot, currentUserId: uid });
      } finally {
        if (active) setAuthReady(true);
      }
    }

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

  const currentUser = snapshot.users.find((user) => user.id === snapshot.currentUserId) || null;
  const isMockMode = !supabaseEnabled && !isFirebaseConfigured();
  const firebaseMode = supabaseEnabled ? "Supabase connected" : firebaseModeLabel();

  const trustSummary = useMemo(
    () => summarizeTrust(snapshot.currentUserId || "user-alex", snapshot.trustEvents),
    [snapshot.currentUserId, snapshot.trustEvents]
  );

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
      return summarizeTrust(userId, snapshot.trustEvents);
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
      async signUpWithEmail(email, password) {
        if (!writesEnabled) return { error: "Supabase is not configured." };
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${appUrl}/auth` }
        });
        if (error) return { error: error.message };
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
        }
      },
      submitProof(input) {
        let created: Proof | null = null;
        const uid = authUid();
        const currentUserId = uid || snapshot.currentUserId || "user-alex";
        setSnapshot((current) => {
          const ownerId = uid || current.currentUserId || "user-alex";
          const prompt = current.prompts.find((item) => item.id === input.promptId);
          const directionId = prompt?.directionId || current.directions[0]?.id || "direction-confidence";
          const proofId = makeId("proof");
          const attachment = input.attachment
            ? (() => {
                const { file, ...meta } = input.attachment!;
                void file;
                return {
                  ...meta,
                  id: makeId("attachment"),
                  storagePath: proofStoragePath(ownerId, proofId, meta.fileName)
                };
              })()
            : undefined;

          created = {
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

          return {
            ...current,
            currentUserId: ownerId,
            proofs: [created, ...current.proofs],
            trustEvents: [
              makeTrustEvent(ownerId, "proof", "Submitted proof from practice", proofId),
              ...current.trustEvents
            ]
          };
        });
        if (writesEnabled && uid && created) {
          void persistProof(supabase!, created, input.attachment?.file).catch(() => {});
        }
        void currentUserId;
        return created;
      },
      addFeedback(input) {
        let created: Feedback | null = null;
        const uid = authUid();
        setSnapshot((current) => {
          const ownerId = uid || current.currentUserId || "user-alex";
          const proof = current.proofs.find((item) => item.id === input.proofId);
          if (!proof || !input.body.trim()) return current;
          const feedbackId = makeId("feedback");
          created = {
            id: feedbackId,
            proofId: proof.id,
            authorId: ownerId,
            recipientId: proof.userId,
            body: input.body.trim(),
            tone: input.tone,
            helpful: false,
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
      getPromptById,
      getProofById,
      getFeedbackForProof,
      getTrustSummaryForUser
    };
  }, [currentUser, firebaseMode, isMockMode, snapshot, trustSummary, supabaseEnabled, supabase, authReady]);

  return <BetaAppContext.Provider value={value}>{children}</BetaAppContext.Provider>;
}

export function useBetaApp() {
  const context = useContext(BetaAppContext);
  if (!context) throw new Error("useBetaApp must be used inside BetaAppProvider");
  return context;
}
