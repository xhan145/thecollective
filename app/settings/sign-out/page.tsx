"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ButtonLink, Card, PageHeader } from "@/components/beta/ui";

export default function SignOutPage() {
  const router = useRouter();
  const { currentUser, signOut, signOutDemo } = useBetaApp();
  const isDemoUser = !!currentUser && currentUser.id.startsWith("user-");

  async function handleSignOut() {
    if (isDemoUser) signOutDemo();
    else await signOut();
    router.replace("/auth");
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title={isDemoUser ? "Leave demo" : "Sign out"} subtitle="You can always come back to your progress." />
        <Card className="space-y-4 p-5 pixel-card">
          <p className="text-sm leading-6 text-[#6E6E6E]">
            {isDemoUser
              ? "Leaving demo mode returns you to the start. Your demo exploration isn’t saved."
              : "Signing out keeps everything safe — your proof, feedback, and trust will be here when you return."}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-full bg-[#DC2626] px-4 py-3 text-center text-sm font-extrabold text-white transition-colors hover:bg-[#b91c1c]"
          >
            {isDemoUser ? "Leave demo" : "Sign out"}
          </button>
          <ButtonLink href="/settings" variant="secondary" className="w-full">Cancel</ButtonLink>
        </Card>
      </div>
    </AppShell>
  );
}
