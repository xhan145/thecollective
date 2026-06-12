"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

const STORAGE_KEY = "collective.beta.snapshot.v1";

type BetaAppContextValue = {
  snapshot: BetaAppSnapshot;
  currentUser: UserProfile | null;
  isMockMode: boolean;
  firebaseMode: string;
  trustSummary: TrustSummary;
  enterDemoBeta: (userId?: string) => void;
  signOutDemo: () => void;
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

export function BetaAppProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<BetaAppSnapshot>(seedSnapshot);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSnapshot(readSnapshot());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [hydrated, snapshot]);

  const currentUser = snapshot.users.find((user) => user.id === snapshot.currentUserId) || null;
  const isMockMode = !isFirebaseConfigured();
  const firebaseMode = firebaseModeLabel();

  const trustSummary = useMemo(
    () => summarizeTrust(snapshot.currentUserId || "user-alex", snapshot.trustEvents),
    [snapshot.currentUserId, snapshot.trustEvents]
  );

  const value = useMemo<BetaAppContextValue>(() => {
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
      trustSummary,
      enterDemoBeta(userId = "user-alex") {
        setSnapshot((current) => ({ ...current, currentUserId: userId }));
      },
      signOutDemo() {
        setSnapshot((current) => ({ ...current, currentUserId: null }));
      },
      completePractice(promptId) {
        setSnapshot((current) => {
          if (!current.currentUserId || current.completedPracticeIds.includes(promptId)) return current;
          const prompt = current.prompts.find((item) => item.id === promptId);
          return {
            ...current,
            completedPracticeIds: [promptId, ...current.completedPracticeIds],
            trustEvents: [
              makeTrustEvent(current.currentUserId, "practice", `Completed ${prompt?.title || "a practice"}`, promptId),
              ...current.trustEvents
            ]
          };
        });
      },
      submitProof(input) {
        let created: Proof | null = null;
        setSnapshot((current) => {
          const currentUserId = current.currentUserId || "user-alex";
          const prompt = current.prompts.find((item) => item.id === input.promptId);
          const directionId = prompt?.directionId || current.directions[0]?.id || "direction-confidence";
          const proofId = makeId("proof");
          const attachment = input.attachment
            ? {
                ...input.attachment,
                id: makeId("attachment"),
                storagePath: proofStoragePath(currentUserId, proofId, input.attachment.fileName)
              }
            : undefined;

          created = {
            id: proofId,
            userId: currentUserId,
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
            currentUserId,
            proofs: [created, ...current.proofs],
            trustEvents: [
              makeTrustEvent(currentUserId, "proof", "Submitted proof from practice", proofId),
              ...current.trustEvents
            ]
          };
        });
        return created;
      },
      addFeedback(input) {
        let created: Feedback | null = null;
        setSnapshot((current) => {
          const currentUserId = current.currentUserId || "user-alex";
          const proof = current.proofs.find((item) => item.id === input.proofId);
          if (!proof || !input.body.trim()) return current;
          const feedbackId = makeId("feedback");
          created = {
            id: feedbackId,
            proofId: proof.id,
            authorId: currentUserId,
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
              makeTrustEvent(currentUserId, "peer-feedback", "Gave useful feedback", feedbackId),
              ...current.trustEvents
            ]
          };
        });
        return created;
      },
      markFeedbackHelpful(feedbackId) {
        setSnapshot((current) => {
          const feedback = current.feedback.find((item) => item.id === feedbackId);
          if (!feedback || feedback.helpful) return current;
          return {
            ...current,
            feedback: current.feedback.map((item) => (item.id === feedbackId ? { ...item, helpful: true } : item)),
            trustEvents: [
              makeTrustEvent(feedback.authorId, "helpful", "Feedback marked helpful", feedbackId),
              ...current.trustEvents
            ]
          };
        });
      },
      submitAppFeedback(input) {
        setSnapshot((current) => {
          const currentUserId = current.currentUserId || "user-alex";
          return {
            ...current,
            currentUserId,
            appFeedback: [
              {
                id: makeId("app-feedback"),
                userId: currentUserId,
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
      },
      recordAiInteraction(input) {
        let created: AiInteraction | null = null;
        setSnapshot((current) => {
          const currentUserId = current.currentUserId || "user-alex";
          const user = current.users.find((item) => item.id === currentUserId) || current.users[0];
          created = {
            id: `ai-interaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId: currentUserId,
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
            currentUserId,
            aiInteractions: [created, ...(current.aiInteractions || [])]
          };
        });
        return created;
      },
      submitAiUserFeedback(input) {
        let created: AiUserFeedback | null = null;
        setSnapshot((current) => {
          const currentUserId = current.currentUserId || "user-alex";
          const user = current.users.find((item) => item.id === currentUserId) || current.users[0];
          created = {
            id: `ai-user-feedback-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId: currentUserId,
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
            currentUserId,
            aiUserFeedback: [created, ...(current.aiUserFeedback || [])]
          };
        });
        return created;
      },
      getPromptById,
      getProofById,
      getFeedbackForProof,
      getTrustSummaryForUser
    };
  }, [currentUser, firebaseMode, isMockMode, snapshot, trustSummary]);

  return <BetaAppContext.Provider value={value}>{children}</BetaAppContext.Provider>;
}

export function useBetaApp() {
  const context = useContext(BetaAppContext);
  if (!context) throw new Error("useBetaApp must be used inside BetaAppProvider");
  return context;
}
