"use client";

import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Badge, Card, EmptyState, PageHeader } from "@/components/beta/ui";

export default function BetaFeedbackReviewPage() {
  const { snapshot, currentUser } = useBetaApp();
  const canReview = currentUser?.role === "admin" || currentUser?.role === "founder";
  const aiFeedback = snapshot.aiUserFeedback || [];
  const aiInteractions = snapshot.aiInteractions || [];

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Feedback review" subtitle="Founder-only review of local beta notes." />
        {!canReview ? (
          <EmptyState title="Founder area" body="This local review page is for founder or admin beta accounts." />
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-[#111111]">AI Feedback Review</h2>
              {aiFeedback.length ? (
                aiFeedback.map((item) => {
                  const interaction = aiInteractions.find((entry) => entry.id === item.aiInteractionId);
                  return (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge>{item.feature.replaceAll("_", " ").toLowerCase()}</Badge>
                          <Badge tone={item.helpfulness === "YES" ? "green" : "gold"}>{item.helpfulness.replace("_", " ").toLowerCase()}</Badge>
                        </div>
                        <span className="text-xs font-bold text-[#6E6E6E]">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="mt-3 text-sm font-extrabold text-[#111111]">{item.userDisplayName}</p>
                      {item.issueType && <p className="mt-1 text-xs font-bold text-[#6E6E6E]">Issue: {item.issueType.replaceAll("_", " ").toLowerCase()}</p>}
                      {item.comment && <p className="mt-3 text-sm leading-6 text-[#38322A]">{item.comment}</p>}
                      {interaction && (
                        <p className="mt-3 rounded-[16px] bg-[#FFF8EE] p-3 text-xs leading-5 text-[#6E6E6E]">
                          Source: {interaction.sourceType.replaceAll("_", " ").toLowerCase()} · {interaction.inputSummary}
                        </p>
                      )}
                    </Card>
                  );
                })
              ) : (
                <EmptyState title="No AI feedback yet" body="AI helpfulness notes from beta members will appear here." />
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-[#111111]">App feedback</h2>
              {snapshot.appFeedback.length ? (
                snapshot.appFeedback.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Badge>{item.category}</Badge>
                      <span className="text-xs font-bold text-[#6E6E6E]">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#38322A]">{item.body}</p>
                    {item.route && <p className="mt-2 text-xs text-[#6E6E6E]">{item.route}</p>}
                  </Card>
                ))
              ) : (
                <EmptyState title="No beta notes yet" body="App feedback from beta members will appear here in demo mode." />
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
