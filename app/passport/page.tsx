"use client";

import { useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { Badge, ButtonLink, Card } from "@/components/beta/ui";
import {
  BadgeRow,
  CurrentDirectionCard,
  IntroductionCard,
  PassportHeader,
  PassportMenuSheet,
  PassportTabs,
  PinnedProofCard,
  ProgressSnapshotCard,
  TrustSummaryCard
} from "@/components/passport/PassportComponents";
import type { PassportTab } from "@/lib/passportData";
import { samplePassportProfile } from "@/lib/passportData";

export default function PassportPage() {
  const [activeTab, setActiveTab] = useState<PassportTab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const profile = samplePassportProfile;

  return (
    <AppShell>
      <div className="space-y-5">
        <PassportHeader profile={profile} onMenu={() => setMenuOpen(true)} />
        <IntroductionCard profile={profile} />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-black text-[#111111]">Displayed badges</h2>
            <ButtonLink href="/passport/badges" variant="quiet" className="min-h-10 px-2 text-xs">Manage</ButtonLink>
          </div>
          <BadgeRow badges={profile.badges} />
        </div>
        <PassportTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "overview" && (
          <div className="space-y-4">
            <CurrentDirectionCard profile={profile} />
            <ProgressSnapshotCard profile={profile} />
            <TrustSummaryCard profile={profile} />
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-[#111111]">Pinned proofs</h3>
                <ButtonLink href="/passport/pinned-proofs" variant="quiet" className="min-h-10 px-2 text-xs">Edit</ButtonLink>
              </div>
              <div className="mt-4 space-y-3">
                {profile.pinnedProofs.map((proof) => <PinnedProofCard key={proof.title} proof={proof} />)}
              </div>
            </Card>
          </div>
        )}
        {activeTab === "proof" && (
          <Card className="p-5">
            <Badge>Proof</Badge>
            <h3 className="mt-3 text-xl font-black text-[#111111]">Evidence of practice</h3>
            <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Pinned proof shows what you practiced and what changed. Proof can stay simple while you practice.</p>
            <div className="mt-4 space-y-3">
              {profile.pinnedProofs.map((proof) => <PinnedProofCard key={proof.title} proof={proof} />)}
            </div>
          </Card>
        )}
        {activeTab === "feedback" && (
          <Card className="p-5">
            <Badge>Feedback</Badge>
            <h3 className="mt-3 text-xl font-black text-[#111111]">Feedback loops completed</h3>
            <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Feedback helps you improve. It does not define you.</p>
            <div className="mt-4 rounded-[18px] bg-[#FFF8EE] p-4 text-sm font-bold leading-6 text-[#111111]">
              {profile.stats.feedbackLoops} loops completed through practice, proof, and useful next steps.
            </div>
          </Card>
        )}
        {activeTab === "contribution" && (
          <Card className="p-5">
            <Badge tone="green">Contribution</Badge>
            <h3 className="mt-3 text-xl font-black text-[#111111]">Helpful, not rushed</h3>
            <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Contribution grows from proof, applied feedback, and beginner-safe help. The next useful step matters more than appearance.</p>
            <div className="mt-4 rounded-[18px] bg-[#FFF8EE] p-4">
              <p className="text-2xl font-black text-[#111111]">{profile.stats.usefulFeedbackResponses}</p>
              <p className="text-[12px] font-bold text-[#6E6E6E]">Useful feedback responses</p>
            </div>
          </Card>
        )}
      </div>
      {menuOpen && <PassportMenuSheet onClose={() => setMenuOpen(false)} />}
    </AppShell>
  );
}
