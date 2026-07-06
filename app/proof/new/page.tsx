"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { resolveStarterPromptId } from "@/lib/mastery";

// Bare /proof/new: forward to the user's next mastery step (never a dead id).
export default function NewProofRedirectPage() {
  const router = useRouter();
  const { snapshot, currentUser } = useBetaApp();
  useEffect(() => {
    const starterId = resolveStarterPromptId(currentUser?.currentDirectionId, {
      directions: snapshot.directions,
      skills: snapshot.skills,
      prompts: snapshot.prompts,
      completedPracticeIds: snapshot.completedPracticeIds,
    });
    router.replace(`/proof/new/${starterId}`);
  }, [router, snapshot, currentUser?.currentDirectionId]);
  return null;
}
