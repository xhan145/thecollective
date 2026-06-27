"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofCard } from "@/components/beta/ProofComponents";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  SectionLabel,
} from "@/components/beta/ui";
import { MotionItem, MotionList, Reveal, ScreenSkeleton } from "@/components/beta/motion";
import { hasCapability } from "@/lib/roles";
import type { Cohort, CohortMember, CohortJoinRequest } from "@/lib/cohorts/types";
import type { Proof } from "@/lib/betaTypes";

// Accent gradients keyed by cohort.accent — mirrors CohortCard
const ACCENT_GRADIENTS: Record<string, string> = {
  gold: "from-[#FFF1C7] to-[#FFF8EE]",
  rose: "from-[#FFF0F3] to-[#FFF8EE]",
  sage: "from-[#EDF6F0] to-[#F7FEFA]",
  sky: "from-[#EBF4FD] to-[#F5FAFF]",
};
const DEFAULT_GRADIENT = ACCENT_GRADIENTS.gold;

function getGradient(accent: string | null): string {
  if (!accent) return DEFAULT_GRADIENT;
  return ACCENT_GRADIENTS[accent.toLowerCase()] ?? DEFAULT_GRADIENT;
}

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | {
      status: "loaded";
      cohort: Cohort;
      members: CohortMember[];
      requests: CohortJoinRequest[];
      feedProofs: Proof[];
    };

export default function CohortDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const {
    currentUser,
    snapshot,
    getFeedbackForProof,
    loadCohort,
    getCohortFeed,
    joinCohortAction,
    requestJoinAction,
    leaveCohortAction,
    approveRequestAction,
    declineRequestAction,
    removeMemberAction,
    setCohortGuideAction,
  } = useBetaApp();

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [requestSent, setRequestSent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // tracks which action is in-flight

  async function refresh() {
    if (!id) return;
    const result = await loadCohort(id);
    if (!result.cohort) {
      setPageState({ status: "not-found" });
    } else {
      setPageState({
        status: "loaded",
        cohort: result.cohort,
        members: result.members,
        requests: result.requests,
        feedProofs: result.feedProofs,
      });
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (pageState.status === "loading") {
    return (
      <AppShell>
        <ScreenSkeleton />
      </AppShell>
    );
  }

  if (pageState.status === "not-found") {
    return (
      <AppShell>
        <Reveal>
          <EmptyState
            title="Cohort not found"
            body="This cohort may have been removed or the link is no longer valid."
            cta={<ButtonLink href="/cohorts">Browse cohorts</ButtonLink>}
          />
        </Reveal>
      </AppShell>
    );
  }

  const { cohort, members, requests, feedProofs } = pageState;

  // Derive role
  const isMember = !!currentUser && members.some((m) => m.userId === currentUser.id);
  const ownerMember = members.find((m) => m.role === "owner");
  const isOwner = !!currentUser && !!ownerMember && ownerMember.userId === currentUser.id;

  // Direction label
  const direction = cohort.directionId
    ? snapshot.directions.find((d) => d.id === cohort.directionId) ?? null
    : null;

  // Scoped feed
  const memberIds = new Set(members.map((m) => m.userId));
  const scopedProofs = feedProofs.filter((p) => memberIds.has(p.userId));
  const ranked = getCohortFeed(cohort.id, scopedProofs);
  const canGiveFeedback = hasCapability(currentUser, "give_feedback");

  function userFor(userId: string) {
    return snapshot.users.find((u) => u.id === userId);
  }

  // Milestone stamp — purely cosmetic
  const totalProofs = feedProofs.length;
  const MILESTONE = 25;
  const showMilestone = totalProofs >= MILESTONE;

  async function doAction(key: string, fn: () => Promise<{ error: string | null }>) {
    setBusy(key);
    setActionError(null);
    try {
      const result = await fn();
      if (result.error) {
        setActionError(result.error);
      } else {
        await refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  const gradient = getGradient(cohort.accent);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ---- Header ---- */}
        <Reveal>
          <div className="overflow-hidden rounded-[22px] border border-[#EFE7D8] bg-[#FFFDF8] shadow-[0_1px_2px_rgba(71,52,18,0.06),0_10px_30px_rgba(71,52,18,0.08)]">
            {/* Accent banner */}
            <div className={`h-14 w-full bg-gradient-to-r ${gradient}`} aria-hidden />

            <div className="px-5 pb-5 pt-4">
              {/* Name */}
              <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-[#111111]">
                {cohort.name}
              </h1>

              {/* Direction "what it's for" */}
              {direction && (
                <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#9B958B]">
                  {direction.title}
                </p>
              )}

              {/* Description */}
              {cohort.description && (
                <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{cohort.description}</p>
              )}

              {/* Milestone stamp */}
              {showMilestone && (
                <div className="mt-3">
                  <Badge tone="green">{MILESTONE}+ proofs practiced together</Badge>
                </div>
              )}

              {/* Join / membership controls */}
              <div className="mt-4">
                {actionError && (
                  <p className="mb-3 text-sm text-[#C0392B]" role="alert">
                    {actionError}
                  </p>
                )}

                {!isMember && !requestSent && (
                  <>
                    {cohort.visibility === "public" && (
                      <Button
                        variant="primary"
                        disabled={busy === "join"}
                        onClick={() =>
                          doAction("join", () => joinCohortAction(cohort.id))
                        }
                      >
                        {busy === "join" ? "Joining…" : "Join cohort"}
                      </Button>
                    )}
                    {cohort.visibility === "request" && (
                      <Button
                        variant="secondary"
                        disabled={busy === "request"}
                        onClick={async () => {
                          setBusy("request");
                          setActionError(null);
                          try {
                            const res = await requestJoinAction(cohort.id);
                            if (res.error) {
                              setActionError(res.error);
                            } else {
                              setRequestSent(true);
                            }
                          } finally {
                            setBusy(null);
                          }
                        }}
                      >
                        {busy === "request" ? "Sending…" : "Request to join"}
                      </Button>
                    )}
                    {cohort.visibility === "invite" && (
                      <p className="text-sm text-[#9B958B]">
                        This cohort is invite only. Ask a member to share a code.
                      </p>
                    )}
                  </>
                )}

                {!isMember && requestSent && (
                  <p className="text-sm font-semibold text-[#17743B]">
                    Request sent — the owner will review it shortly.
                  </p>
                )}

                {isMember && !isOwner && (
                  <Button
                    variant="quiet"
                    className="text-[#9B958B]"
                    disabled={busy === "leave"}
                    onClick={() =>
                      doAction("leave", () => leaveCohortAction(cohort.id))
                    }
                  >
                    {busy === "leave" ? "Leaving…" : "Leave cohort"}
                  </Button>
                )}

                {isOwner && (
                  <p className="text-sm text-[#9B958B]">You host this cohort.</p>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ---- Scoped Feed (members only) ---- */}
        {isMember && (
          <section className="space-y-3">
            <SectionLabel title="Practice together" />
            {ranked.length > 0 ? (
              <MotionList className="space-y-3">
                {ranked.map(({ proof, relation }) => (
                  <MotionItem key={proof.id}>
                    <ProofCard
                      proof={proof}
                      feedbackCount={getFeedbackForProof(proof.id).length}
                      authorName={userFor(proof.userId)?.displayName}
                      authorAvatarUrl={userFor(proof.userId)?.avatarUrl}
                      relation={relation}
                      canGiveFeedback={canGiveFeedback}
                    />
                  </MotionItem>
                ))}
              </MotionList>
            ) : (
              <EmptyState
                title="Nothing here yet"
                body="Once members submit proof, it will show up here for everyone to learn from."
              />
            )}
          </section>
        )}

        {/* ---- Owner moderation ---- */}
        {isOwner && (
          <>
            {/* Pending requests */}
            {requests.length > 0 && (
              <section className="space-y-3">
                <SectionLabel title="Join requests" />
                <div className="space-y-2">
                  {requests.map((req) => {
                    const requester = userFor(req.userId);
                    const displayName = requester?.displayName ?? "Someone";
                    return (
                      <Card key={req.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-sm font-semibold text-[#111111]">{displayName}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="min-h-9 px-4 text-xs"
                            disabled={busy === `approve-${req.id}`}
                            onClick={() =>
                              doAction(`approve-${req.id}`, () =>
                                approveRequestAction(req.id)
                              )
                            }
                          >
                            {busy === `approve-${req.id}` ? "…" : "Approve"}
                          </Button>
                          <Button
                            variant="secondary"
                            className="min-h-9 px-4 text-xs"
                            disabled={busy === `decline-${req.id}`}
                            onClick={() =>
                              doAction(`decline-${req.id}`, () =>
                                declineRequestAction(req.id)
                              )
                            }
                          >
                            {busy === `decline-${req.id}` ? "…" : "Decline"}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Members list */}
            <section className="space-y-3">
              <SectionLabel title="Members" />
              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((m) => {
                    const user = userFor(m.userId);
                    const displayName = user?.displayName ?? "Member";
                    const isThisOwner = m.role === "owner";
                    return (
                      <Card
                        key={m.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#111111]">
                            {displayName}
                          </span>
                          {isThisOwner && (
                            <Badge tone="gold">Host</Badge>
                          )}
                          {!isThisOwner && m.role === "guide" && (
                            <Badge tone="muted">Guide</Badge>
                          )}
                        </div>
                        {!isThisOwner && (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const memberProfile = userFor(m.userId);
                              const guideEligible = hasCapability(memberProfile, "cohort_guide");
                              const isGuide = m.role === "guide";
                              if (!guideEligible && !isGuide) return null;
                              return (
                                <Button
                                  variant="quiet"
                                  className="min-h-9 px-3 text-xs text-[#9B958B]"
                                  disabled={busy === `guide-${m.userId}`}
                                  onClick={() =>
                                    doAction(`guide-${m.userId}`, () =>
                                      setCohortGuideAction(cohort.id, m.userId, !isGuide)
                                    )
                                  }
                                >
                                  {busy === `guide-${m.userId}` ? "…" : isGuide ? "Remove guide" : "Make guide"}
                                </Button>
                              );
                            })()}
                            <Button
                              variant="quiet"
                              className="min-h-9 px-3 text-xs text-[#9B958B]"
                              disabled={busy === `remove-${m.userId}`}
                              onClick={() =>
                                doAction(`remove-${m.userId}`, () =>
                                  removeMemberAction(cohort.id, m.userId)
                                )
                              }
                            >
                              {busy === `remove-${m.userId}` ? "…" : "Remove"}
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No members yet"
                  body="When people join, they will appear here."
                />
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
