"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ButtonLink, Card, PageHeader, SectionLabel } from "@/components/beta/ui";
import {
  BadgeMedallionRow,
  CurrentDirectionCard,
  IntroductionCard,
  PassportMenu,
  PassportTabs,
  PinnedProofCard,
  ProfileHeader,
  ProgressSnapshotCard,
  type PassportTab,
} from "@/components/beta/PassportComponents";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getProfileDetails, listPinnedProofIds, type ProfileDetails } from "@/lib/supabase/passportRepository";
import { evaluateLocalBadges } from "@/lib/badges/types";
import { DEMO_ACHIEVEMENTS } from "@/lib/badges/demo";

function shortAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < day) return "today";
  const days = Math.floor(diff / day);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const MEDIA_LABEL: Record<string, string> = { video: "Video", audio: "Audio", image: "Photo", text: "Note", link: "Link", document: "Doc" };

export default function PassportPage() {
  const router = useRouter();
  const { currentUser, snapshot, trustSummary, supabaseEnabled, signOut, signOutDemo } = useBetaApp();
  const isDemoUser = !!currentUser && currentUser.id.startsWith("user-");
  async function handleSignOut() {
    if (isDemoUser) signOutDemo();
    else await signOut();
    router.replace("/auth");
  }
  const [menuOpen, setMenuOpen] = useState(false);
  // Relative ages use Date.now(), which differs between SSR and the client.
  // Defer them to after mount so the first client render matches the server.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [tab, setTab] = useState<PassportTab>("overview");
  // Honor a ?tab= deep link (e.g. "See all" on /home → the member's own proofs).
  // Read from window rather than useSearchParams to avoid a Suspense boundary.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested && (["overview", "proof", "feedback", "contribution"] as const).includes(requested as PassportTab)) {
      setTab(requested as PassportTab);
    }
  }, []);
  const [details, setDetails] = useState<ProfileDetails | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const directionTitle = useMemo(
    () => snapshot.directions.find((d) => d.id === currentUser?.currentDirectionId)?.title ?? null,
    [snapshot.directions, currentUser?.currentDirectionId],
  );

  const myProofs = useMemo(
    () => snapshot.proofs.filter((p) => p.userId === currentUser?.id),
    [snapshot.proofs, currentUser?.id],
  );

  const myFeedbackReceived = useMemo(() => {
    const ids = new Set(myProofs.map((p) => p.id));
    return snapshot.feedback.filter((f) => ids.has(f.proofId)).length;
  }, [snapshot.feedback, myProofs]);

  // Badge names: pure, from the user's real counts (mirrors the /badges evaluator).
  const badgeNames = useMemo(() => {
    const counts = {
      practiceCount: trustSummary.practicesCompleted,
      proofCount: trustSummary.proofsSubmitted,
      feedbackGivenCount: trustSummary.feedbackGiven,
      feedbackReceivedCount: myFeedbackReceived,
      trustScore: currentUser?.trustScore ?? 0,
      hasDirection: !!currentUser?.currentDirectionId,
    };
    const earned = new Set(evaluateLocalBadges(counts, DEMO_ACHIEVEMENTS, new Set<string>()));
    return DEMO_ACHIEVEMENTS.filter((b) => earned.has(b.slug)).map((b) => b.name).slice(0, 6);
  }, [trustSummary, myFeedbackReceived, currentUser?.trustScore, currentUser?.currentDirectionId]);

  // Introduction + pinned proofs come from the DB (own rows only, per RLS).
  useEffect(() => {
    let active = true;
    async function load() {
      const client = supabaseEnabled ? getSupabaseClient() : null;
      if (!client || !currentUser?.id) {
        // Demo / no-DB: synthesize an intro from the onboarding answers we have.
        if (active && currentUser) {
          setDetails({
            hereToPractice: currentUser.goalText ?? null,
            currentlyWorkingOn: currentUser.introductionSummary ?? null,
            wantsFeedbackOn: null,
            canHelpWith: currentUser.mentorOptIn ? "Encouragement and beginner-friendly feedback." : null,
            lookingFor: [],
            introductionVisibility: "members",
            allowSameDirectionOnly: false,
            allowTrustedOnly: false,
          });
        }
        return;
      }
      const [d, pins] = await Promise.all([getProfileDetails(client, currentUser.id), listPinnedProofIds(client, currentUser.id)]);
      if (!active) return;
      setDetails(d);
      setPinnedIds(pins);
    }
    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseEnabled, currentUser?.id]);

  const pinnedProofs = useMemo(
    () => pinnedIds.map((id) => snapshot.proofs.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p),
    [pinnedIds, snapshot.proofs],
  );

  if (!currentUser) {
    return (
      <AppShell>
        <PageHeader title="Passport" subtitle="Your progress, proof, and trust." />
        <Card className="p-5 text-sm text-[#6E6E6E]">Sign in to see your Passport.</Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <ProfileHeader
          displayName={currentUser.displayName}
          initials={currentUser.initials}
          avatarUrl={currentUser.avatarUrl}
          headline={currentUser.headline ?? currentUser.bio ?? null}
          directionTitle={directionTitle}
          trustLabel={trustSummary.levelLabel}
          openToIntroductions={currentUser.openToIntroductions ?? true}
          onMenu={() => setMenuOpen(true)}
        />

        <BadgeMedallionRow names={badgeNames} viewHref="/badges" />

        <IntroductionCard details={details} editHref="/passport/edit-introduction" />

        <PassportTabs active={tab} onChange={setTab} />

        {tab === "overview" && (
          <div className="space-y-5">
            <CurrentDirectionCard directionTitle={directionTitle} focusSkill={currentUser.currentFocusSkill} nextStep={currentUser.goalText} />
            <ProgressSnapshotCard
              practices={trustSummary.practicesCompleted}
              proofs={trustSummary.proofsSubmitted}
              feedbackLoops={myFeedbackReceived}
              usefulResponses={trustSummary.feedbackGiven}
            />
            <Card className="pixel-card p-5">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#B6AE9F]">Trust</h3>
              <p className="mt-2 text-lg font-extrabold text-[#111111]">{trustSummary.levelLabel}</p>
              <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">
                Earned through useful feedback, proof, and beginner-safe behavior — never bought or boosted.
              </p>
            </Card>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <SectionLabel title="Pinned proofs" />
                <Link href="/passport/pinned-proofs" className="text-xs font-extrabold text-[#7A5300] hover:underline">Manage</Link>
              </div>
              {pinnedProofs.length === 0 ? (
                <Card className="p-4 text-sm text-[#6E6E6E]">Pin a proof you’re proud of so it leads your Passport.</Card>
              ) : (
                <div className="space-y-2">
                  {pinnedProofs.map((p) => (
                    <Link key={p.id} href={`/proof/${p.id}`} className="block">
                      <PinnedProofCard title={p.title} kind={MEDIA_LABEL[p.mediaType] ?? "Proof"} age={mounted ? shortAge(p.createdAt) : undefined} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "proof" && (
          <div className="space-y-2">
            {myProofs.length === 0 ? (
              <Card className="p-5 text-sm text-[#6E6E6E]">
                No proof yet. Practicing something? <Link href="/proof/new/conf-s1" className="font-extrabold text-[#7A5300] hover:underline">Submit your first proof</Link>.
              </Card>
            ) : (
              myProofs.map((p) => (
                <Link key={p.id} href={`/proof/${p.id}`} className="block">
                  <PinnedProofCard title={p.title} kind={MEDIA_LABEL[p.mediaType] ?? "Proof"} age={mounted ? shortAge(p.createdAt) : undefined} />
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "feedback" && (
          <Card className="pixel-card p-5">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#B6AE9F]">Feedback loops</h3>
            <p className="mt-2 text-2xl font-extrabold text-[#111111]">{myFeedbackReceived}</p>
            <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">
              Feedback you’ve received on your proof. Apply it, and it becomes a loop — the clearest signal of growth here.
            </p>
            <ButtonLink href="/feed" variant="secondary" className="mt-3 w-full">Give useful feedback</ButtonLink>
          </Card>
        )}

        {tab === "contribution" && (
          <Card className="pixel-card p-5">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#B6AE9F]">Contribution</h3>
            <p className="mt-2 text-2xl font-extrabold text-[#111111]">{currentUser.contributionCount ?? 0}</p>
            <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">
              Ways you’ve helped others move forward — observations and kind next steps on their proof.
            </p>
            <ButtonLink href="/contribute" variant="secondary" className="mt-3 w-full">See where you can help</ButtonLink>
          </Card>
        )}

        <SectionLabel title="Account" />
        <div className="space-y-2">
          <ButtonLink href="/profile/saved" variant="secondary" className="w-full">Saved</ButtonLink>
          <ButtonLink href="/profile/learning" variant="secondary" className="w-full">People you learn from</ButtonLink>
          <ButtonLink href="/settings" variant="secondary" className="w-full">Settings</ButtonLink>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-full px-4 py-3 text-center text-sm font-extrabold text-[#DC2626] transition-colors hover:bg-[#DC2626]/5"
          >
            {isDemoUser ? "Leave demo" : "Sign out"}
          </button>
        </div>
      </div>

      <PassportMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </AppShell>
  );
}
