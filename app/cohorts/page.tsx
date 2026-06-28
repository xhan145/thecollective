"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { CohortCard } from "@/components/beta/CohortCard";
import {
  Button,
  ButtonLink,
  EmptyState,
  PageHeader,
  SectionLabel,
  TextInput,
} from "@/components/beta/ui";
import { MotionItem, MotionList } from "@/components/beta/motion";
import { canCreateCohort } from "@/lib/cohorts/access";
import { listCohorts } from "@/lib/supabase/cohortsRepository";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Cohort } from "@/lib/cohorts/types";

export default function CohortsPage() {
  const router = useRouter();
  const { currentUser, getMyCohorts, redeemCohortInviteAction } = useBetaApp();

  const [allCohorts, setAllCohorts] = useState<Cohort[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Load all public/request cohorts on mount
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setAllCohorts([]);
      return;
    }
    listCohorts(client)
      .then((cohorts) => setAllCohorts(cohorts))
      .catch(() => setAllCohorts([]));
  }, []);

  const myCohorts = getMyCohorts();
  const myCohortIds = new Set(myCohorts.map((c) => c.id));

  // "For your directions": cohorts whose directionId is in currentUser.directionIds, excluding ones already joined
  const myDirectionIds = new Set(currentUser?.directionIds ?? []);
  const forYourDirections = allCohorts.filter(
    (c) => c.directionId && myDirectionIds.has(c.directionId) && !myCohortIds.has(c.id)
  );

  // "Explore": all other visible cohorts (public or request), not already shown
  const forYourDirectionIds = new Set(forYourDirections.map((c) => c.id));
  const explore = allCohorts.filter(
    (c) =>
      !myCohortIds.has(c.id) &&
      !forYourDirectionIds.has(c.id) &&
      (c.visibility === "public" || c.visibility === "request")
  );

  const canCreate = canCreateCohort(currentUser);

  async function handleJoinWithCode() {
    const code = inviteCode.trim();
    if (!code) return;
    setInviteError(null);
    setJoining(true);
    try {
      const result = await redeemCohortInviteAction(code);
      if (result.error) {
        setInviteError(result.error);
      } else if (result.id) {
        router.push(`/cohorts/${result.id}`);
      } else {
        // fallback: go to cohorts list where the new cohort appears under "Your cohorts"
        router.push("/cohorts");
      }
    } finally {
      setJoining(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Cohorts"
          subtitle="Find your people for this practice."
          action={
            canCreate ? (
              <ButtonLink href="/cohorts/new" variant="primary" className="shrink-0">
                Create
              </ButtonLink>
            ) : undefined
          }
        />

        {/* Invite code input */}
        <div className="space-y-2">
          <SectionLabel title="Have an invite code?" />
          <div className="flex gap-2">
            <TextInput
              placeholder="Paste your code"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setInviteError(null);
              }}
              aria-label="Cohort invite code"
              className="flex-1"
            />
            <Button
              variant="secondary"
              onClick={handleJoinWithCode}
              disabled={joining || !inviteCode.trim()}
              aria-label="Join with invite code"
              className="shrink-0"
            >
              {joining ? "Joining…" : "Join"}
            </Button>
          </div>
          {inviteError && (
            <p className="text-sm text-[#C0392B]" role="alert">
              {inviteError}
            </p>
          )}
        </div>

        {/* Your cohorts */}
        <section className="space-y-3">
          <SectionLabel title="Your cohorts" />
          {myCohorts.length > 0 ? (
            <MotionList className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
              {myCohorts.map((cohort) => (
                <MotionItem key={cohort.id}>
                  <CohortCard cohort={cohort} />
                </MotionItem>
              ))}
            </MotionList>
          ) : (
            <EmptyState
              title="No cohorts yet"
              body="Join a cohort to learn alongside people working on the same thing."
            />
          )}
        </section>

        {/* For your directions */}
        {forYourDirections.length > 0 && (
          <section className="space-y-3">
            <SectionLabel title="For your directions" />
            <MotionList className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
              {forYourDirections.map((cohort) => (
                <MotionItem key={cohort.id}>
                  <CohortCard cohort={cohort} />
                </MotionItem>
              ))}
            </MotionList>
          </section>
        )}

        {/* Explore */}
        {explore.length > 0 && (
          <section className="space-y-3">
            <SectionLabel title="Explore" />
            <MotionList className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0">
              {explore.map((cohort) => (
                <MotionItem key={cohort.id}>
                  <CohortCard cohort={cohort} />
                </MotionItem>
              ))}
            </MotionList>
          </section>
        )}

        {/* If nothing at all */}
        {myCohorts.length === 0 && forYourDirections.length === 0 && explore.length === 0 && (
          <EmptyState
            title="No cohorts yet"
            body="Cohorts are coming soon. Practice a little more and be among the first to start one."
          />
        )}
      </div>
    </AppShell>
  );
}
