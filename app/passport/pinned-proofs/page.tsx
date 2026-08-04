"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Card, PageHeader } from "@/components/beta/ui";
import { getSupabaseClient } from "@/lib/supabase/client";
import { addPinnedProof, listPinnedProofIds, removePinnedProof } from "@/lib/supabase/passportRepository";

const MEDIA_LABEL: Record<string, string> = { video: "Video", audio: "Audio", image: "Photo", text: "Note", link: "Link", document: "Doc" };
const MAX_PINS = 4;

export default function PinnedProofsPage() {
  const { currentUser, snapshot, supabaseEnabled } = useBetaApp();
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const client = useMemo(() => (supabaseEnabled ? getSupabaseClient() : null), [supabaseEnabled]);
  const myProofs = useMemo(() => snapshot.proofs.filter((p) => p.userId === currentUser?.id), [snapshot.proofs, currentUser?.id]);

  useEffect(() => {
    if (!client || !currentUser?.id) return;
    void listPinnedProofIds(client, currentUser.id).then((ids) => setPinned(new Set(ids)));
  }, [client, currentUser?.id]);

  async function toggle(proofId: string) {
    if (!client || !currentUser?.id || busy) return;
    const isPinned = pinned.has(proofId);
    if (!isPinned && pinned.size >= MAX_PINS) return;
    setBusy(true);
    const next = new Set(pinned);
    if (isPinned) {
      next.delete(proofId);
      await removePinnedProof(client, currentUser.id, proofId).catch(() => {});
    } else {
      next.add(proofId);
      await addPinnedProof(client, currentUser.id, proofId, next.size).catch(() => {});
    }
    setPinned(next);
    setBusy(false);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Pinned proofs" subtitle={`Highlight up to ${MAX_PINS} proofs on your Passport.`} />

        {!client && (
          <Card className="p-4 text-body text-muted">Pinning saves to your account — connect Collective to use it. In demo mode you can still explore your proof below.</Card>
        )}

        {myProofs.length === 0 ? (
          <Card className="p-5 text-body text-muted">You don’t have any proof yet. Once you submit proof, you can pin your favorites here.</Card>
        ) : (
          <div className="space-y-2">
            {myProofs.map((p) => {
              const isPinned = pinned.has(p.id);
              const atLimit = !isPinned && pinned.size >= MAX_PINS;
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 pixel-card">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-semibold text-content">{p.title}</p>
                    <p className="text-caption text-muted">{MEDIA_LABEL[p.mediaType] ?? "Proof"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    disabled={!client || busy || atLimit}
                    aria-pressed={isPinned}
                    aria-label={isPinned ? "Unpin proof" : "Pin proof"}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-caption font-semibold transition-colors disabled:opacity-40 ${
                      isPinned ? "bg-surface-soft text-accent-text" : "bg-bg text-muted hover:text-content"
                    }`}
                  >
                    {isPinned ? "Unpin" : atLimit ? "Limit" : "Pin"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
