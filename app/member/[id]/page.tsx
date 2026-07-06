"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { IntroductionCard } from "@/components/beta/PassportComponents";
import { Button, Card, EmptyState, PageHeader, SectionLabel, TextArea, TrustPill } from "@/components/beta/ui";
import { trustLevelForPoints } from "@/lib/betaTrust";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getProfileDetails, type ProfileDetails } from "@/lib/supabase/passportRepository";
import { getMySentIntroTo, sendIntroductionRequest, type IntroRequest } from "@/lib/supabase/memberRepository";

export default function MemberPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { snapshot, currentUser, supabaseEnabled, blockMember, unblockMember } = useBetaApp();
  const memberId = params.id;
  const member = snapshot.users.find((u) => u.id === memberId);
  const isSelf = currentUser?.id === memberId;
  const blocked = snapshot.blockedUserIds.includes(memberId);
  const client = useMemo(() => (supabaseEnabled ? getSupabaseClient() : null), [supabaseEnabled]);

  const [details, setDetails] = useState<ProfileDetails | null>(null);
  const [sentRequest, setSentRequest] = useState<IntroRequest | null>(null);
  const [message, setMessage] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Own passport lives at /passport.
  useEffect(() => {
    if (isSelf) router.replace("/passport");
  }, [isSelf, router]);

  useEffect(() => {
    let active = true;
    if (!client || !currentUser?.id || !memberId || blocked) return;
    void Promise.all([
      getProfileDetails(client, memberId), // RLS: visible per their setting, never across a block
      getMySentIntroTo(client, currentUser.id, memberId),
    ]).then(([d, req]) => {
      if (!active) return;
      setDetails(d);
      setSentRequest(req);
    });
    return () => {
      active = false;
    };
  }, [client, currentUser?.id, memberId, blocked]);

  const recentProofs = useMemo(
    () => snapshot.proofs.filter((p) => p.userId === memberId && !p.isDemo).slice(0, 5),
    [snapshot.proofs, memberId],
  );

  async function handleSend() {
    if (!client || !currentUser?.id || !message.trim()) return;
    setBusy(true);
    setSendError(null);
    const { error } = await sendIntroductionRequest(client, currentUser.id, memberId, message);
    setBusy(false);
    if (error) {
      setSendError(error);
      return;
    }
    setSentRequest({ id: "local", senderId: currentUser.id, receiverId: memberId, message, status: "pending", createdAt: new Date().toISOString() });
    setAskOpen(false);
  }

  if (!member) {
    return (
      <AppShell>
        <PageHeader title="Member" />
        <EmptyState title="Member not found" body="This member isn't available in the current session." />
      </AppShell>
    );
  }

  const direction = snapshot.directions.find((d) => d.id === member.currentDirectionId);
  const pendingSent = sentRequest?.status === "pending";
  const accepted = sentRequest?.status === "accepted";

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Passport" subtitle="A member of your practice community." />

        <Card className="pixel-card p-5">
          <div className="flex items-center gap-4">
            <span className="inline-grid rounded-full p-[3px] ring-2 ring-[#F2A900]/45">
              <Avatar name={member.displayName} avatarUrl={member.avatarUrl} size={60} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-[#111111]">{member.displayName}</h2>
              {member.headline && <p className="mt-0.5 text-sm leading-snug text-[#6E6E6E]">{member.headline}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {direction && <span className="rounded-full bg-[#FFF1C7] px-3 py-1 text-xs font-extrabold text-[#7A5300]">{direction.title}</span>}
                <TrustPill label={trustLevelForPoints(member.trustScore ?? 0)} />
                {member.openToIntroductions && !blocked && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-bold text-[#15803D]">
                    <span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden /> Open to introductions
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {blocked ? (
          <Card className="p-5">
            <p className="text-sm leading-6 text-[#6E6E6E]">You&rsquo;ve blocked this member. Their proof and requests stay hidden from you.</p>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => void unblockMember(memberId)}>Unblock</Button>
          </Card>
        ) : (
          <>
            {details && <IntroductionCard details={details} editHref="" />}

            {supabaseEnabled && member.openToIntroductions && !isSelf && (
              <Card className="space-y-3 p-5">
                {accepted ? (
                  <p className="text-sm font-bold text-[#15803D]">You&rsquo;re introduced — say hello in <Link href="/notes" className="underline">Notes</Link>.</p>
                ) : pendingSent ? (
                  <p className="text-sm font-bold text-[#7A5300]">Introduction requested — they&rsquo;ll see it in their notifications.</p>
                ) : askOpen ? (
                  <>
                    <label className="block text-sm font-extrabold text-[#111111]" htmlFor="intro-msg">Why would you like to connect?</label>
                    <TextArea id="intro-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="I'm practicing the same skill and your proof helped me…" className="min-h-20" />
                    {sendError && <p className="text-sm font-bold text-[#B4443F]">{sendError}</p>}
                    <div className="flex gap-2">
                      <Button className="flex-1" disabled={busy || !message.trim()} onClick={handleSend}>{busy ? "Sending…" : "Send request"}</Button>
                      <Button variant="secondary" onClick={() => setAskOpen(false)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <Button className="w-full" onClick={() => setAskOpen(true)}>Ask for an introduction</Button>
                )}
              </Card>
            )}

            <SectionLabel title="Recent proof" />
            {recentProofs.length === 0 ? (
              <Card className="p-4 text-sm text-[#6E6E6E]">No shared proof yet.</Card>
            ) : (
              <div className="space-y-2">
                {recentProofs.map((p) => (
                  <Link key={p.id} href={`/proof/${p.id}`} className="elev-1 elev-hover block rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] p-3.5">
                    <p className="truncate text-sm font-extrabold text-[#111111]">{p.title}</p>
                    <p className="mt-0.5 text-xs text-[#6E6E6E]">{p.mediaType}</p>
                  </Link>
                ))}
              </div>
            )}

            {supabaseEnabled && !isSelf && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Block ${member.displayName}? You won't see their proof, and they can't send you requests.`)) {
                    void blockMember(memberId);
                  }
                }}
                className="w-full rounded-full px-4 py-3 text-center text-sm font-extrabold text-[#B4443F] transition-colors hover:bg-[#B4443F]/5"
              >
                Block this member
              </button>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
