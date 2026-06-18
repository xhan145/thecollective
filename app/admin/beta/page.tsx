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
type Payload = { stats: Stats; appFeedback: AppFeedbackRow[]; recentProofs: ProofRow[]; onboardingIncomplete: Person[]; noProof: Person[] };

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

  return (
    <main className="mx-auto min-h-screen max-w-[760px] bg-[#FFF8EE] px-5 py-8 text-[#111111]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Beta dashboard</h1>
        <Link href="/home" className="text-sm font-extrabold text-[#6E6E6E]">Back to app</Link>
      </div>

      {state === "loading" && <p className="mt-8 text-sm text-[#6E6E6E]">Getting your space ready…</p>}
      {state === "denied" && <p className="mt-8 rounded-2xl bg-[#FFF1C7] p-4 text-sm font-bold text-[#7A5300]">Admin access only. Sign in as an admin (profile role = admin or an email in ADMIN_EMAILS).</p>}
      {state === "error" && <p className="mt-8 rounded-2xl bg-[#FFF1C7] p-4 text-sm font-bold text-[#7A5300]">Could not load the dashboard. Confirm the service role key and ADMIN_EMAILS are set on the server.</p>}

      {state === "ok" && data && (
        <div className="mt-6 space-y-8">
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
            <h2 className="mb-2 text-lg font-extrabold">App feedback</h2>
            <div className="space-y-2">
              {data.appFeedback.length === 0 && <p className="text-sm text-[#6E6E6E]">No app feedback yet.</p>}
              {data.appFeedback.map((f) => (
                <div key={f.id} className="rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] p-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6E6E6E]">
                    <span className="font-extrabold text-[#111111]">{f.name}</span>
                    <span>{new Date(f.createdAt).toLocaleString()}</span>
                    <span className="rounded-full bg-[#FFF1C7] px-2 py-0.5 font-bold text-[#7A5300]">{f.category}</span>
                    {f.rating != null && <span>★ {f.rating}</span>}
                    {f.route && <span className="truncate">{f.route}</span>}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#38322A]">{f.body}</p>
                  <div className="mt-2">
                    <label className="text-xs font-bold text-[#6E6E6E]">Status: </label>
                    <select value={f.status} onChange={(e) => setStatus(f.id, e.target.value)} className="rounded-xl border border-[#EFE7D8] bg-white px-2 py-1 text-sm font-bold">
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
            <h2 className="mb-2 text-lg font-extrabold">Recent proofs</h2>
            <div className="space-y-1">
              {data.recentProofs.length === 0 && <p className="text-sm text-[#6E6E6E]">No real proofs yet.</p>}
              {data.recentProofs.map((p) => (
                <p key={p.id} className="rounded-xl bg-[#FFFDF8] px-3 py-2 text-sm text-[#38322A]">
                  <span className="font-extrabold">{p.name || "Member"}</span> — {p.title} <span className="text-[#9B958B]">({p.mediaType})</span>
                </p>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] p-3">
      <p className="text-2xl font-black text-[#111111]">{value}</p>
      <p className="text-xs font-bold text-[#6E6E6E]">{label}</p>
    </div>
  );
}

function PersonList({ title, people }: { title: string; people: Person[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-extrabold text-[#111111]">{title} ({people.length})</h3>
      <div className="space-y-1">
        {people.length === 0 && <p className="text-sm text-[#6E6E6E]">None.</p>}
        {people.slice(0, 25).map((p) => (
          <p key={p.id} className="rounded-xl bg-[#FFFDF8] px-3 py-1.5 text-sm text-[#38322A]">{p.name || p.id.slice(0, 8)}</p>
        ))}
      </div>
    </div>
  );
}
