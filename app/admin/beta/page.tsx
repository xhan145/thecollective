"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

type Stats = {
  totalUsers: number; demoUsers: number; onboardedUsers: number; betaUsers: number;
  proofCount: number; demoProofCount: number; feedbackCount: number; appFeedbackCount: number;
  onboardingIncompleteCount: number; noProofCount: number;
};
type AppFeedbackRow = { id: string; name: string; category: string; rating: number | null; route: string | null; body: string; status: string; createdAt: string };
type ProofRow = { id: string; name?: string; title: string; mediaType: string; createdAt: string };
type Person = { id: string; name?: string; createdAt: string };
type SpamRow = { id: string; name: string; spamSignal: number; isDemo: boolean };
type ReportedTipRow = { id: string; reason: string | null; body: string; tipId: string | null };
type HeldContentRow = { kind: string; id: string; authorId: string; body: string; createdAt: string };
type ReportRow = { key: string; targetType: string; targetId: string; kind: string; snippet: string; authorName: string; status: string; severity: string; reasons: string[]; distinctReporters: number; latestAt: string };
type Payload = { stats: Stats; reports?: ReportRow[]; appFeedback: AppFeedbackRow[]; recentProofs: ProofRow[]; onboardingIncomplete: Person[]; noProof: Person[]; spamReview?: SpamRow[]; reportedTips?: ReportedTipRow[]; heldContent?: HeldContentRow[] };

const STATUSES = ["new", "reviewing", "planned", "resolved", "dismissed"];

async function authedFetch(path: string, init?: RequestInit) {
  const client = getSupabaseClient();
  const token = client ? (await client.auth.getSession()).data.session?.access_token : null;
  return fetch(path, {
    ...init,
    headers: { ...(init?.headers || {}), "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

export default function AdminBetaPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied" | "error">("loading");

  const load = useCallback(async () => {
    try {
      const res = await authedFetch("/api/admin/beta");
      if (res.status === 401 || res.status === 403) { setState("denied"); return; }
      if (!res.ok) { setState("error"); return; }
      setData(await res.json());
      setState("ok");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function setStatus(id: string, status: string) {
    setData((d) => (d ? { ...d, appFeedback: d.appFeedback.map((f) => (f.id === id ? { ...f, status } : f)) } : d));
    await authedFetch("/api/admin/app-feedback", { method: "POST", body: JSON.stringify({ id, status }) }).catch(() => {});
  }

  async function moderateContent(action: "clear" | "remove" | "limit", kind: string, id: string) {
    await authedFetch("/api/admin/moderation", { method: "POST", body: JSON.stringify({ action, kind, id }) }).catch(() => {});
    await load();
  }

  return (
    <main className="mx-auto min-h-screen max-w-[760px] bg-bg px-5 py-8 text-content">
      <div className="flex items-center justify-between">
        <h1 className="text-title">Beta dashboard</h1>
        <Link href="/home" className="text-body font-semibold text-muted">Back to app</Link>
      </div>

      {state === "loading" && <p className="mt-8 text-body text-muted">Getting your space ready…</p>}
      {state === "denied" && <p className="mt-8 rounded-2xl bg-surface-soft p-4 text-body font-medium text-accent-text">Admin access only. Sign in as an admin (profile role = admin or an email in ADMIN_EMAILS).</p>}
      {state === "error" && <p className="mt-8 rounded-2xl bg-surface-soft p-4 text-body font-medium text-accent-text">Could not load the dashboard. Confirm the service role key and ADMIN_EMAILS are set on the server.</p>}

      {state === "ok" && data && (
        <div className="mt-6 space-y-8">
          {data.reports && data.reports.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-heading text-content">Reports queue ({data.reports.length})</h2>
              <ul className="space-y-2">
                {data.reports.map((r) => (
                  <li key={r.key} className="rounded-2xl border border-line bg-surface p-3">
                    <div className="flex flex-wrap items-center gap-2 text-caption">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${r.severity === "severe" ? "bg-danger-soft text-danger-text" : "bg-surface-soft text-accent-text"}`}>{r.severity}</span>
                      <span className="rounded-full bg-surface-soft px-2 py-0.5 font-medium text-muted">{r.kind}</span>
                      <span className="text-muted">{r.distinctReporters} reporter{r.distinctReporters === 1 ? "" : "s"}</span>
                      <span className="text-muted">·</span>
                      <span className="text-muted">{r.reasons.join(", ")}</span>
                      <span className="ml-auto rounded-full bg-surface-soft px-2 py-0.5 font-medium text-muted">{r.status}</span>
                    </div>
                    <p className="mt-2 text-body leading-6 text-secondary"><span className="font-semibold">{r.authorName}</span>: {r.snippet}{r.snippet.length >= 160 ? "…" : ""}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => moderateContent("clear", r.kind, r.targetId)} className="rounded-xl border border-line bg-surface-input px-3 py-1 text-caption font-medium text-content hover:bg-surface-soft">Dismiss</button>
                      <button onClick={() => moderateContent("limit", r.kind, r.targetId)} className="rounded-xl border border-line bg-surface-input px-3 py-1 text-caption font-medium text-accent-text hover:bg-surface-soft">Limit</button>
                      <button onClick={() => moderateContent("remove", r.kind, r.targetId)} className="rounded-xl bg-danger-soft px-3 py-1 text-caption font-medium text-danger-text hover:bg-danger-soft">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Users (real)" value={data.stats.totalUsers} />
            <Stat label="Onboarded" value={data.stats.onboardedUsers} />
            <Stat label="Beta access" value={data.stats.betaUsers} />
            <Stat label="Demo users" value={data.stats.demoUsers} />
            <Stat label="Proofs (real)" value={data.stats.proofCount} />
            <Stat label="Proofs (demo)" value={data.stats.demoProofCount} />
            <Stat label="Feedback" value={data.stats.feedbackCount} />
            <Stat label="App feedback" value={data.stats.appFeedbackCount} />
            <Stat label="Onboarding incomplete" value={data.stats.onboardingIncompleteCount} />
            <Stat label="Signed up, no proof" value={data.stats.noProofCount} />
          </section>

          <section>
            <h2 className="mb-2 text-heading">App feedback</h2>
            <div className="space-y-2">
              {data.appFeedback.length === 0 && <p className="text-body text-muted">No app feedback yet.</p>}
              {data.appFeedback.map((f) => (
                <div key={f.id} className="rounded-2xl border border-line bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted">
                    <span className="font-semibold text-content">{f.name}</span>
                    <span>{new Date(f.createdAt).toLocaleString()}</span>
                    <span className="rounded-full bg-surface-soft px-2 py-0.5 font-medium text-accent-text">{f.category}</span>
                    {f.rating != null && <span>★ {f.rating}</span>}
                    {f.route && <span className="truncate">{f.route}</span>}
                  </div>
                  <p className="mt-2 text-body leading-6 text-secondary">{f.body}</p>
                  <div className="mt-2">
                    <label className="text-caption font-medium text-muted">Status: </label>
                    <select value={f.status} onChange={(e) => setStatus(f.id, e.target.value)} className="rounded-xl border border-line bg-surface-input px-2 py-1 text-body font-medium">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <PersonList title="Onboarding incomplete" people={data.onboardingIncomplete} />
            <PersonList title="Signed up, no proof" people={data.noProof} />
          </section>

          <section>
            <h2 className="mb-2 text-heading">Recent proofs</h2>
            <div className="space-y-1">
              {data.recentProofs.length === 0 && <p className="text-body text-muted">No real proofs yet.</p>}
              {data.recentProofs.map((p) => (
                <p key={p.id} className="rounded-xl bg-surface px-3 py-2 text-body text-secondary">
                  <span className="font-semibold">{p.name || "Member"}</span> — {p.title} <span className="text-muted">({p.mediaType})</span>
                </p>
              ))}
            </div>
          </section>

          {data.spamReview && data.spamReview.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-body font-semibold text-content">Spam review (signal only — no auto-action)</h2>
              <ul className="space-y-1">
                {data.spamReview.map((s: SpamRow) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2 text-body">
                    <span className="text-content">{s.name}{s.isDemo ? " (demo)" : ""}</span>
                    <span className="font-semibold text-accent-text">signal {s.spamSignal}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.reportedTips && data.reportedTips.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-body font-semibold text-content">Reported tips (read-only — no auto-action)</h2>
              <ul className="space-y-1">
                {data.reportedTips.map((r: ReportedTipRow) => (
                  <li key={r.id} className="rounded-xl border border-line bg-surface px-3 py-2 text-body">
                    <p className="text-secondary leading-6">{r.body}</p>
                    {r.reason && <p className="mt-1 font-semibold text-accent-text">Reason: {r.reason}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.heldContent && data.heldContent.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-body font-semibold text-content">Held content (pending review)</h2>
              <ul className="space-y-1">
                {data.heldContent.map((h: HeldContentRow) => (
                  <li key={h.id} className="rounded-xl border border-line bg-surface px-3 py-2 text-body">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="rounded-full bg-surface-soft px-2 py-0.5 text-caption font-medium text-accent-text">{h.kind}</span>
                        <p className="mt-1 truncate text-secondary leading-6">{h.body.slice(0, 120)}{h.body.length > 120 ? "…" : ""}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => moderateContent("clear", h.kind, h.id)}
                          className="rounded-xl border border-line bg-surface-input px-3 py-1 text-caption font-medium text-content hover:bg-surface-soft"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => moderateContent("remove", h.kind, h.id)}
                          className="rounded-xl bg-surface-soft px-3 py-1 text-caption font-medium text-accent-text hover:bg-accent-soft"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <p className="text-title text-content">{value}</p>
      <p className="text-caption font-medium text-muted">{label}</p>
    </div>
  );
}

function PersonList({ title, people }: { title: string; people: Person[] }) {
  return (
    <div>
      <h3 className="mb-2 text-body font-semibold text-content">{title} ({people.length})</h3>
      <div className="space-y-1">
        {people.length === 0 && <p className="text-body text-muted">None.</p>}
        {people.slice(0, 25).map((p) => (
          <p key={p.id} className="rounded-xl bg-surface px-3 py-1.5 text-body text-secondary">{p.name || p.id.slice(0, 8)}</p>
        ))}
      </div>
    </div>
  );
}
