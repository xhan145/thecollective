"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { TrustSnapshotCard } from "@/components/beta/LoopCards";
import { HelpWithCard } from "@/components/beta/HelpWithCard";
import { Badge, ButtonLink, Card, PageHeader, SectionLabel, TrustPill } from "@/components/beta/ui";
import { hasCapability } from "@/lib/roles";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, trustSummary, signOut, signOutDemo, supabaseEnabled, updateProfile } = useBetaApp();

  async function handleSignOut() {
    await signOut();
    router.replace("/auth");
  }

  function handleLeaveDemo() {
    signOutDemo();
    router.replace("/auth");
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Profile" subtitle="Progress you can build on." />
        <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
          <div className="space-y-5 lg:col-span-2">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <Avatar name={currentUser?.displayName} avatarUrl={currentUser?.avatarUrl} size={64} />
                <div>
                  <h2 className="text-xl font-extrabold text-[#111111]">{currentUser?.displayName || "Alex"}</h2>
                  <p className="mt-1 text-sm text-[#6E6E6E]">Building confident communication</p>
                  <div className="mt-2"><TrustPill label={trustSummary.levelLabel} /></div>
                </div>
              </div>
            </Card>
            <TrustSnapshotCard trust={trustSummary} />
            <HelpWithCard />
            {currentUser && hasCapability(currentUser, "mentor_visibility") && (
              <Card className="p-5">
                <SectionLabel title="Mentoring" />
                <label className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-[#38322A]">List me as someone to learn from in my direction</span>
                  <input
                    type="checkbox"
                    checked={!!currentUser.mentorOptIn}
                    onChange={(e) => updateProfile({ mentorOptIn: e.target.checked })}
                    className="h-5 w-5 accent-[#F2A900]"
                    aria-label="List me as someone to learn from"
                  />
                </label>
                <p className="mt-1 text-xs text-[#6E6E6E]">Optional. Turn it off anytime.</p>
              </Card>
            )}
          </div>

          <aside className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <ButtonLink href="/profile/saved" variant="secondary" className="w-full">Saved for practice</ButtonLink>
              <ButtonLink href="/profile/learning" variant="secondary" className="w-full">People you learn from</ButtonLink>
            </div>
            <ButtonLink href="/notes" variant="secondary" className="w-full">Peer notes &amp; requests</ButtonLink>
            <ButtonLink href="/contribute" variant="secondary" className="w-full">Contribute</ButtonLink>
            <div className="grid grid-cols-2 gap-3">
              <ButtonLink href="/notifications" variant="secondary" className="w-full">Notifications</ButtonLink>
              <ButtonLink href="/settings" variant="secondary" className="w-full">Settings</ButtonLink>
            </div>
            <Card className="p-5">
              <Badge>Contribution</Badge>
              <h2 className="mt-3 text-xl font-extrabold text-[#111111]">Not rushed</h2>
              <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">You will unlock more ways to help others as your proof and feedback history grows.</p>
              <ButtonLink href="/app-feedback" className="mt-4 w-full">Give app feedback</ButtonLink>
              {supabaseEnabled ? (
                <button
                  type="button"
                  className="mt-3 w-full rounded-full px-4 py-3 text-sm font-extrabold text-[#C2413F]"
                  onClick={() => void handleSignOut()}
                >
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  className="mt-3 w-full rounded-full px-4 py-3 text-sm font-extrabold text-[#6E6E6E]"
                  onClick={handleLeaveDemo}
                >
                  Leave demo beta
                </button>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
