# Phase B — Contribute Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Contribute stage of the loop — a member who has been through the loop helps another on an "open" proof with a structured contribution, the proof owner accepts it, and the contributor earns `accepted-contribution` (+15) through Phase A's server-authoritative trust path.

**Architecture:** Additive migration `024_contributions.sql` adds a `contributions` table + two `proofs` columns and two SECURITY DEFINER RPCs (`submit_contribution` — server-gated by the G1 eligibility rule; `record_contribution_trust` — owner-validated accept that credits the contributor), extends `_recompute_profile_counts` to populate `contribution_count`, and adds a notify trigger. The client (`betaTypes`, `betaRepository`, `AppStateProvider`) gains contribution state + RPC calls, and a beta Contribute queue replaces the legacy `/contribute` page with role-aware sections on the proof-detail screen.

**Tech Stack:** Next.js (App Router) + TypeScript, Supabase (Postgres/RLS/plpgsql), `@supabase/supabase-js`. Migration applied to live project `qfzguujtjloskyxcdbon` via the Supabase MCP `apply_migration` tool. No new dependencies.

## Global Constraints

- Additive only. Do NOT edit applied migrations `010`–`023`. New migration is `024_contributions.sql`.
- Migration idempotent / safe to re-run (`create or replace`, `drop policy/trigger if exists`, `if not exists`).
- Builds on Phase A. Reuse its helpers `public._insert_trust`, `public._recompute_profile_counts`, `public._trust_points`. Those helpers stay revoked from `public, anon, authenticated`; only SECURITY DEFINER functions call them.
- All new SECURITY DEFINER functions: `set search_path = public, pg_temp`; `revoke all ... from public, anon`; `grant execute ... to authenticated`. Trigger functions use `set search_path = public` (matches migration 020 style).
- Trust value unchanged: `accepted-contribution` = 15 (already in `_trust_points`). No new trust types.
- Server-authoritative: contribution submit + accept are RPC-only; `contributions` has NO client INSERT/UPDATE policy. No client-minted trust (Phase A invariant).
- G1 eligibility: a member may submit a contribution only if they have ≥1 proof AND ≥1 feedback given. Enforced in `submit_contribution`.
- Brand/copy: "Contribute", "Open for contributions", "Accepted". NO likes/followers/leaderboards/clout language.
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local`. Git Bash shell. Verification gates: `npm run typecheck` and `npm run build` (no unit-test runner configured).
- DB columns snake_case; `betaRepository.ts` maps to camelCase app types. Proof/feedback ids are uuids (Phase A).
- **Start work on a new branch `phase-b-contribute` off `main` before Task 1.**

## File Structure

- `supabase/migrations/024_contributions.sql` — **create.** Whole migration (also applied to live DB via MCP).
- `lib/betaTypes.ts` — **modify.** `Contribution` type; `Proof` gains `openForContributions?`/`contributionFocus?`; `BetaAppSnapshot` gains `contributions`.
- `lib/supabase/betaRepository.ts` — **modify.** `mapContribution`; load contributions + proof open flags; `submitContribution`/`acceptContribution`/`setProofOpen`.
- `lib/betaData.ts` — **modify.** `seedSnapshot.contributions = []`.
- `components/beta/AppStateProvider.tsx` — **modify.** Context type + applyBundle + methods/selectors + beta events.
- `components/beta/ContributeComponents.tsx` — **create.** `ContributeComposer`, `ReceivedContributions`, `OpenProofRow` (keeps `ProofComponents.tsx` focused).
- `app/contribute/page.tsx` — **replace.** Legacy v8 page → beta Contribute queue.
- `app/proof/[id]/page.tsx` — **modify.** Render role-aware contribute sections.
- `app/home/page.tsx`, `app/profile/page.tsx` — **modify.** Entry links to `/contribute`.
- `scripts/demo/shared.ts`, `scripts/seed-demo-data.ts` — **modify.** Light demo seeding (reproducibility); live demo rows seeded via MCP in Task 6.
- `docs/BETA_QA.md` — **modify.** QA checklist line.

## Reference (read before starting)

Notify-trigger template (migration 020) + notifications columns:
```sql
insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
values (recipient, actor, '<type>', '<title>', '<body or null>', 'proof', <proof_id>);
```
Phase A helpers available: `_insert_trust(p_uid uuid, p_type text, p_label text, p_source_id text)`, `_recompute_profile_counts(p_uid uuid)`. `trust_events` has `unique(user_id,type,source_id) where source_id is not null` (idempotent inserts).

---

### Task 1: Migration `024_contributions.sql` (write + apply + verify)

**Files:**
- Create: `supabase/migrations/024_contributions.sql`

**Interfaces:**
- Produces (client/later tasks call): `submit_contribution(p_proof_id uuid, p_observation text, p_next_step text) returns uuid`, `record_contribution_trust(p_contribution_id uuid) returns void`. New table `public.contributions`; new `proofs.open_for_contributions`/`contribution_focus`.

- [ ] **Step 1: Create the branch**

```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b phase-b-contribute
```

- [ ] **Step 2: Write the migration file**

Create `supabase/migrations/024_contributions.sql`:

```sql
-- 024_contributions.sql — Phase B: the Contribute step (additive).
-- Run AFTER 010–023. Idempotent. Builds on Phase A trust helpers.

-- 1) proofs: open-for-contributions flag + focus.
alter table public.proofs add column if not exists open_for_contributions boolean not null default false;
alter table public.proofs add column if not exists contribution_focus text;

-- 2) contributions table.
create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references public.proofs(id) on delete cascade,
  contributor_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  observation text not null,
  next_step text not null,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  is_demo boolean not null default false,
  demo_seed_id text,
  unique (proof_id, contributor_id),
  check (contributor_id <> owner_id)
);
create index if not exists contributions_proof_idx on public.contributions(proof_id);
create index if not exists contributions_contributor_idx on public.contributions(contributor_id);
create index if not exists contributions_owner_idx on public.contributions(owner_id);
create unique index if not exists contributions_demo_seed_uidx on public.contributions(demo_seed_id) where demo_seed_id is not null;

-- 3) RLS: read by participants; NO client insert/update (RPC-only).
alter table public.contributions enable row level security;
drop policy if exists "contributions_read_participant" on public.contributions;
create policy "contributions_read_participant" on public.contributions
  for select to authenticated
  using (auth.uid() = contributor_id or auth.uid() = owner_id);
-- (no insert/update/delete policies: submission + acceptance go through SECURITY DEFINER RPCs;
--  service role bypasses RLS for demo seeding.)

-- 4) extend _recompute_profile_counts to populate contribution_count (additive).
create or replace function public._recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.profiles p set
    practice_count = (select count(*) from public.practice_completions where user_id = p_uid),
    proof_count = (select count(*) from public.proofs where user_id = p_uid),
    feedback_given_count = (select count(*) from public.feedback where author_id = p_uid),
    feedback_received_count = (select count(*) from public.feedback where recipient_id = p_uid),
    contribution_count = (select count(*) from public.contributions where contributor_id = p_uid and status = 'accepted'),
    trust_score = (select coalesce(sum(points), 0) from public.trust_events where user_id = p_uid),
    updated_at = now()
  where p.id = p_uid;
end;
$$;

-- 5) submit_contribution: server-gated by G1; insert pending.
create or replace function public.submit_contribution(p_proof_id uuid, p_observation text, p_next_step text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_open boolean; v_id uuid;
begin
  if coalesce(trim(p_observation),'') = '' or coalesce(trim(p_next_step),'') = '' then
    raise exception 'observation and next step are required';
  end if;
  -- G1: must have been through the loop once.
  if (select count(*) from public.proofs where user_id = auth.uid()) < 1
     or (select count(*) from public.feedback where author_id = auth.uid()) < 1 then
    raise exception 'not eligible to contribute yet';
  end if;
  select user_id, open_for_contributions into v_owner, v_open from public.proofs where id = p_proof_id;
  if v_owner is null then raise exception 'proof not found'; end if;
  if not v_open then raise exception 'proof is not open for contributions'; end if;
  if v_owner = auth.uid() then raise exception 'cannot contribute to your own proof'; end if;
  if exists (select 1 from public.contributions where proof_id = p_proof_id and contributor_id = auth.uid()) then
    raise exception 'you already contributed to this proof';
  end if;
  insert into public.contributions (proof_id, contributor_id, owner_id, observation, next_step)
  values (p_proof_id, auth.uid(), v_owner, trim(p_observation), trim(p_next_step))
  returning id into v_id;
  return v_id;
end;
$$;

-- 6) record_contribution_trust: owner-validated accept -> credit contributor (+15).
create or replace function public.record_contribution_trust(p_contribution_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid; v_contrib uuid; v_status text; v_proof uuid; v_actor text;
begin
  select owner_id, contributor_id, status, proof_id
    into v_owner, v_contrib, v_status, v_proof
    from public.contributions where id = p_contribution_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'only the proof owner can accept';
  end if;
  if v_status <> 'pending' then return; end if; -- idempotent: already accepted
  update public.contributions set status = 'accepted', accepted_at = now() where id = p_contribution_id;
  perform public._insert_trust(v_contrib, 'accepted-contribution', 'Contribution accepted', p_contribution_id::text);
  perform public._recompute_profile_counts(v_contrib);
  -- notify the contributor (cross-user write; safe because owner-validated).
  select display_name into v_actor from public.profiles where id = v_owner;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
  values (v_contrib, v_owner, 'contribution_accepted',
          coalesce(v_actor,'A member') || ' accepted your contribution', null, 'proof', v_proof);
end;
$$;

-- 7) notify the proof owner on a new contribution.
create or replace function public.notify_on_contribution()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor_name text;
begin
  if new.is_demo or new.contributor_id = new.owner_id then return new; end if;
  select display_name into actor_name from public.profiles where id = new.contributor_id;
  insert into public.notifications (user_id, actor_id, type, title, body, source_type, source_id)
  values (new.owner_id, new.contributor_id, 'contribution',
          coalesce(actor_name,'A member') || ' contributed to your proof', new.observation, 'proof', new.proof_id);
  return new;
end;
$$;
drop trigger if exists trg_notify_on_contribution on public.contributions;
create trigger trg_notify_on_contribution after insert on public.contributions
  for each row execute function public.notify_on_contribution();

-- 8) grants.
revoke all on function public.submit_contribution(uuid, text, text) from public, anon;
revoke all on function public.record_contribution_trust(uuid) from public, anon;
grant execute on function public.submit_contribution(uuid, text, text) to authenticated;
grant execute on function public.record_contribution_trust(uuid) to authenticated;
```

- [ ] **Step 3: Apply via Supabase MCP**

Use `apply_migration`: project_id `qfzguujtjloskyxcdbon`, name `024_contributions`, query = the SQL above. Expected `{"success":true}`.

- [ ] **Step 4: Verify structure (MCP `execute_sql`)**

```sql
select
  (select count(*) from information_schema.tables where table_name='contributions') as has_table,
  (select count(*) from information_schema.columns where table_name='proofs' and column_name in ('open_for_contributions','contribution_focus')) as proof_cols,
  (select count(*) from pg_policies where tablename='contributions') as policies,
  (select count(*) from pg_proc where proname in ('submit_contribution','record_contribution_trust','notify_on_contribution')) as fns,
  (select count(*) from pg_trigger where tgname='trg_notify_on_contribution') as trig;
```
Expected: `has_table=1, proof_cols=2, policies=1, fns=3, trig=1`.

- [ ] **Step 5: Verify gates + accept flow with a controlled DB test (MCP `execute_sql`)**

```sql
create temp table _r(test text, result text) on commit drop;
do $$
declare v_owner uuid; v_contrib uuid; v_proof uuid; v_cid uuid;
begin
  select id into v_owner from public.profiles where is_demo limit 1;
  select id into v_contrib from public.profiles where is_demo and id <> v_owner limit 1;
  select id into v_proof from public.proofs where user_id = v_owner limit 1;
  update public.proofs set open_for_contributions = true where id = v_proof;
  -- seed contributor eligibility is satisfied by demo data (they have proofs+feedback)
  insert into public.contributions (proof_id, contributor_id, owner_id, observation, next_step)
    values (v_proof, v_contrib, v_owner, 'obs', 'step') returning id into v_cid;
  -- non-owner accept must fail
  begin
    set local role authenticated;  -- auth.uid() is null here -> not owner
    perform public.record_contribution_trust(v_cid);
    reset role; insert into _r values ('non-owner accept','FAIL allowed');
  exception when others then reset role; insert into _r values ('non-owner accept','PASS blocked'); end;
  -- owner-context accept (definer role) works + credits
  perform public.record_contribution_trust(v_cid);
  insert into _r values ('owner accept', (select status from public.contributions where id=v_cid));
  insert into _r values ('trust row', (select count(*)::text from public.trust_events where source_id = v_cid::text and type='accepted-contribution'));
  -- cleanup
  delete from public.trust_events where source_id = v_cid::text;
  delete from public.contributions where id = v_cid;
  update public.proofs set open_for_contributions = false where id = v_proof;
  perform public._recompute_profile_counts(v_contrib);
end $$;
select * from _r order by test;
```
Expected rows: `non-owner accept = PASS blocked`, `owner accept = accepted`, `trust row = 1`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/024_contributions.sql
git commit -m "feat(db): contributions table + submit/accept RPCs + notify (024)"
```

---

### Task 2: Types + repository

**Files:**
- Modify: `lib/betaTypes.ts`, `lib/supabase/betaRepository.ts`, `lib/betaData.ts`

**Interfaces:**
- Produces: `Contribution` type; `submitContribution(client, {proofId, observation, nextStep})`, `acceptContribution(client, contributionId)`, `setProofOpen(client, proofId, open, focus)`; `BetaUserBundle.contributions`.

- [ ] **Step 1: Add types** in `lib/betaTypes.ts`

After the `Proof` type, add `openForContributions`/`contributionFocus` to `Proof` (insert before its closing `};`):
```ts
  isDemo?: boolean;
  thumbnailUrl?: string;
  mediaUrl?: string;
  openForContributions?: boolean;
  contributionFocus?: string | null;
};
```
Add a new type (near `Feedback`):
```ts
export type Contribution = {
  id: string;
  proofId: string;
  contributorId: string;
  ownerId: string;
  observation: string;
  nextStep: string;
  status: "pending" | "accepted";
  createdAt: string;
  acceptedAt?: string | null;
  isDemo?: boolean;
};
```
Add to `BetaAppSnapshot` (after `notifications: AppNotification[];`):
```ts
  contributions: Contribution[];
```

- [ ] **Step 2: Seed default** in `lib/betaData.ts`

In the `seedSnapshot` object literal, after `notifications: []`, add:
```ts
  contributions: [],
```

- [ ] **Step 3: Repository — import, bundle field, mapper, proof open fields**

In `lib/supabase/betaRepository.ts`:
- Add `Contribution` to the `@/lib/betaTypes` import list.
- Add to `BetaUserBundle` interface: `contributions: Contribution[];`
- Add mapper:
```ts
function mapContribution(row: any): Contribution {
  return {
    id: row.id,
    proofId: row.proof_id,
    contributorId: row.contributor_id,
    ownerId: row.owner_id,
    observation: row.observation,
    nextStep: row.next_step,
    status: row.status,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at ?? null,
    isDemo: row.is_demo ?? false,
  };
}
```
- In the proofs `.map` inside `loadUserBundle`, add to each proof object:
```ts
    openForContributions: row.open_for_contributions ?? false,
    contributionFocus: row.contribution_focus ?? null,
```

- [ ] **Step 4: Repository — load contributions**

In `loadUserBundle`'s `Promise.all([...])`, add a final query (and a matching destructured variable `contribRes` at the end of the destructure list):
```ts
      client.from("contributions").select("*").or(`contributor_id.eq.${userId},owner_id.eq.${userId}`),
```
Then in the returned object add:
```ts
    contributions: (contribRes?.data ?? []).map(mapContribution),
```

- [ ] **Step 5: Repository — write functions** (append near the other write-throughs)

```ts
/** Submit a contribution to an open proof (server-gated by G1). Returns new id or throws. */
export async function submitContribution(
  client: SupabaseClient,
  input: { proofId: string; observation: string; nextStep: string },
): Promise<string> {
  const { data, error } = await client.rpc("submit_contribution", {
    p_proof_id: input.proofId,
    p_observation: input.observation,
    p_next_step: input.nextStep,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Owner accepts a contribution -> credits the contributor via the trust RPC. */
export async function acceptContribution(client: SupabaseClient, contributionId: string): Promise<void> {
  const { error } = await client.rpc("record_contribution_trust", { p_contribution_id: contributionId });
  if (error) throw new Error(error.message);
}

/** Toggle a proof's open-for-contributions flag + focus (owner only via RLS). */
export async function setProofOpen(
  client: SupabaseClient,
  proofId: string,
  open: boolean,
  focus: string | null,
): Promise<void> {
  await client.from("proofs").update({ open_for_contributions: open, contribution_focus: focus }).eq("id", proofId);
}
```

- [ ] **Step 6: Typecheck + commit**

```bash
npm run typecheck
git add lib/betaTypes.ts lib/betaData.ts lib/supabase/betaRepository.ts
git commit -m "feat: contribution types + repository (load/submit/accept/setOpen)"
```
Expected: typecheck clean.

---

### Task 3: Provider wiring

**Files:**
- Modify: `components/beta/AppStateProvider.tsx`, `lib/supabase/betaEvents.ts`

**Interfaces:**
- Consumes: Task 2 repository fns.
- Produces (UI uses): `submitContribution(input) => Promise<{contribution: Contribution|null; error: string|null}>`, `acceptContribution(id) => Promise<void>`, `toggleProofOpen(proofId, open, focus?) => void`, `getOpenProofs() => Proof[]`, `getContributionsForProof(proofId) => Contribution[]`, `isEligibleToContribute() => boolean`.

- [ ] **Step 1: Beta event types** in `lib/supabase/betaEvents.ts`

Add to the `BetaEventType` union:
```ts
  | "contribution_submitted"
  | "contribution_accepted"
```

- [ ] **Step 2: Imports + context type** in `components/beta/AppStateProvider.tsx`

- Add `Contribution` to the `@/lib/betaTypes` import list.
- Add `submitContribution, acceptContribution, setProofOpen` to the `@/lib/supabase/betaRepository` import list.
- Add to `BetaAppContextValue`:
```ts
  submitContribution: (input: { proofId: string; observation: string; nextStep: string }) => Promise<{ contribution: Contribution | null; error: string | null }>;
  acceptContribution: (contributionId: string) => Promise<void>;
  toggleProofOpen: (proofId: string, open: boolean, focus?: string) => void;
  getOpenProofs: () => Proof[];
  getContributionsForProof: (proofId: string) => Contribution[];
  isEligibleToContribute: () => boolean;
```

- [ ] **Step 3: applyBundle + readSnapshot defaults**

- In `applyBundle`, add to the returned snapshot object: `contributions: bundle.contributions,`
- In `readSnapshot`, ensure the merged object includes `contributions: parsed.contributions || []` (add alongside the `aiInteractions`/`aiUserFeedback` defaults).

- [ ] **Step 4: Methods + selectors** (inside the `useMemo` return object, near the other engagement methods)

```ts
      async submitContribution(input) {
        const uid = authUid();
        const me = uid || snapshot.currentUserId || "user-alex";
        const proof = snapshot.proofs.find((p) => p.id === input.proofId);
        if (!proof || !input.observation.trim() || !input.nextStep.trim()) {
          return { contribution: null, error: "Add an observation and a next step." };
        }
        const optimistic: Contribution = {
          id: makeId("contribution"), proofId: proof.id, contributorId: me, ownerId: proof.userId,
          observation: input.observation.trim(), nextStep: input.nextStep.trim(),
          status: "pending", createdAt: new Date().toISOString(), acceptedAt: null,
        };
        setSnapshot((current) => ({ ...current, contributions: [optimistic, ...current.contributions] }));
        if (!writesEnabled || !uid) return { contribution: optimistic, error: null };
        try {
          const id = await submitContribution(supabase!, input);
          void logBetaEvent(supabase!, uid, "contribution_submitted", undefined, { proofId: input.proofId });
          setSnapshot((current) => ({
            ...current,
            contributions: current.contributions.map((c) => (c.id === optimistic.id ? { ...c, id } : c)),
          }));
          return { contribution: { ...optimistic, id }, error: null };
        } catch {
          return { contribution: optimistic, error: "We couldn’t send your contribution yet — your text is still here, try again." };
        }
      },
      async acceptContribution(contributionId) {
        setSnapshot((current) => ({
          ...current,
          contributions: current.contributions.map((c) =>
            c.id === contributionId ? { ...c, status: "accepted", acceptedAt: new Date().toISOString() } : c),
        }));
        const uid = authUid();
        if (writesEnabled && uid) {
          try {
            await acceptContribution(supabase!, contributionId);
            void logBetaEvent(supabase!, uid, "contribution_accepted", undefined, { contributionId });
          } catch { /* optimistic accept stays; reconciles on next load */ }
        }
      },
      toggleProofOpen(proofId, open, focus) {
        setSnapshot((current) => ({
          ...current,
          proofs: current.proofs.map((p) =>
            p.id === proofId ? { ...p, openForContributions: open, contributionFocus: focus ?? null } : p),
        }));
        const uid = authUid();
        if (writesEnabled && uid) void setProofOpen(supabase!, proofId, open, focus ?? null).catch(() => {});
      },
      getOpenProofs() {
        const me = snapshot.currentUserId;
        return snapshot.proofs.filter((p) => p.openForContributions && p.userId !== me);
      },
      getContributionsForProof(proofId) {
        return snapshot.contributions.filter((c) => c.proofId === proofId);
      },
      isEligibleToContribute() {
        const me = snapshot.currentUserId;
        if (!me) return false;
        const hasProof = snapshot.proofs.some((p) => p.userId === me);
        const gaveFeedback = snapshot.feedback.some((f) => f.authorId === me);
        return hasProof && gaveFeedback;
      },
```

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add components/beta/AppStateProvider.tsx lib/supabase/betaEvents.ts
git commit -m "feat: provider contribution methods + selectors + events"
```
Expected: typecheck clean.

---

### Task 4: Contribute components + queue page + entry links

**Files:**
- Create: `components/beta/ContributeComponents.tsx`
- Modify: `app/contribute/page.tsx` (replace legacy), `app/home/page.tsx`, `app/profile/page.tsx`

**Interfaces:**
- Consumes: provider selectors/methods from Task 3; `Card, Button, PageHeader, EmptyState, TextArea, SectionLabel` from `components/beta/ui`; `Avatar` from `components/beta/Avatar`.
- Produces: `ContributeComposer`, `ReceivedContributions` (used by Task 5 too).

- [ ] **Step 1: Create `components/beta/ContributeComponents.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Contribution, Proof } from "@/lib/betaTypes";
import { useBetaApp } from "./AppStateProvider";
import { Avatar } from "./Avatar";
import { Button, Card, TextArea } from "./ui";

const field = "w-full rounded-2xl border border-[#EFE7D8] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#F2A900]";

/** Composer shown to eligible non-owners on an open proof. */
export function ContributeComposer({ proof }: { proof: Proof }) {
  const { submitContribution, isEligibleToContribute, getContributionsForProof, currentUser } = useBetaApp();
  const eligible = isEligibleToContribute();
  const already = getContributionsForProof(proof.id).some((c) => c.contributorId === currentUser?.id);
  const [observation, setObservation] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (already || done) {
    return <Card className="p-4"><p className="text-sm font-extrabold text-[#111111]">Contribution sent.</p>
      <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">The owner can accept it if it helps.</p></Card>;
  }
  if (!eligible) {
    return <Card className="p-4"><p className="text-sm leading-6 text-[#6E6E6E]">Contributing unlocks after your first proof and your first feedback.</p></Card>;
  }
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-extrabold text-[#111111]">Contribute a focused next step</p>
      {proof.contributionFocus && <p className="text-xs leading-5 text-[#6E6E6E]">Focus: {proof.contributionFocus}</p>}
      <label className="block"><span className="mb-1 block text-xs font-extrabold text-[#111111]">One specific observation</span>
        <input className={field} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="What worked or what you noticed…" /></label>
      <label className="block"><span className="mb-1 block text-xs font-extrabold text-[#111111]">One concrete next step</span>
        <TextArea value={nextStep} onChange={(e) => setNextStep(e.target.value)} rows={3} placeholder="A small, kind, specific suggestion…" /></label>
      {error && <p className="rounded-2xl bg-[#FFF1C7] p-3 text-sm font-bold leading-6 text-[#7A5300]">{error}</p>}
      <Button className="w-full" disabled={busy || !observation.trim() || !nextStep.trim()} onClick={async () => {
        setBusy(true); setError("");
        try {
          const { error: e } = await submitContribution({ proofId: proof.id, observation, nextStep });
          if (e) setError(e); else setDone(true);
        } finally { setBusy(false); }
      }}>{busy ? "Sending…" : "Send contribution"}</Button>
    </Card>
  );
}

/** Owner-facing list of received contributions with Accept. */
export function ReceivedContributions({ proof }: { proof: Proof }) {
  const { getContributionsForProof, acceptContribution, snapshot } = useBetaApp();
  const items = getContributionsForProof(proof.id);
  if (items.length === 0) {
    return <Card className="p-4"><p className="text-sm leading-6 text-[#6E6E6E]">No contributions yet. Open proofs invite focused help.</p></Card>;
  }
  return (
    <div className="space-y-3">
      {items.map((c: Contribution) => {
        const author = snapshot.users.find((u) => u.id === c.contributorId);
        return (
          <Card key={c.id} className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Avatar name={author?.displayName} avatarUrl={author?.avatarUrl} size={24} />
              <span className="text-xs font-extrabold text-[#111111]">{author?.displayName || "A member"}</span>
              {c.status === "accepted" && <span className="ml-auto rounded-full bg-[#E8F6EC] px-2 py-0.5 text-[11px] font-bold text-[#15803D]">Accepted</span>}
            </div>
            <p className="text-sm leading-6 text-[#38322A]"><span className="font-bold">Observed:</span> {c.observation}</p>
            <p className="text-sm leading-6 text-[#38322A]"><span className="font-bold">Next step:</span> {c.nextStep}</p>
            {c.status === "pending" && (
              <Button variant="secondary" className="w-full" onClick={() => void acceptContribution(c.id)}>Accept this contribution</Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/contribute/page.tsx` with the beta queue**

```tsx
"use client";

import Link from "next/link";
import { AppShell } from "@/components/beta/AppShell";
import { Avatar } from "@/components/beta/Avatar";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Card, EmptyState, PageHeader } from "@/components/beta/ui";

export default function ContributePage() {
  const { getOpenProofs, snapshot, isEligibleToContribute } = useBetaApp();
  const open = getOpenProofs();
  const eligible = isEligibleToContribute();
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Contribute" subtitle="Help someone take one specific next step." />
        {!eligible && (
          <Card className="p-4"><p className="text-sm leading-6 text-[#6E6E6E]">Contributing unlocks after your first proof and your first feedback. You can still read open requests.</p></Card>
        )}
        {open.length === 0 ? (
          <EmptyState title="No open requests right now" body="Check back soon — members open proofs when they want focused help." />
        ) : (
          <div className="space-y-3">
            {open.map((p) => {
              const owner = snapshot.users.find((u) => u.id === p.userId);
              return (
                <Link key={p.id} href={`/proof/${p.id}`}>
                  <Card interactive className="space-y-2 p-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={owner?.displayName} avatarUrl={owner?.avatarUrl} size={24} />
                      <span className="text-xs font-extrabold text-[#111111]">{owner?.displayName || "A member"}</span>
                    </div>
                    <p className="text-sm font-extrabold leading-5 text-[#111111]">{p.title}</p>
                    {p.contributionFocus && <p className="text-xs leading-5 text-[#6E6E6E]">Focus: {p.contributionFocus}</p>}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 3: Add `/contribute` to protected routes** in `components/beta/AppShell.tsx`

In the `protectedPrefixes` array, add `"/contribute"`.

- [ ] **Step 4: Entry links**

In `app/profile/page.tsx`, add inside the links grid (near "Peer notes" / settings links):
```tsx
        <ButtonLink href="/contribute" variant="secondary" className="w-full">Contribute</ButtonLink>
```
In `app/home/page.tsx`, add a simple entry near the loop cards (after the existing primary sections):
```tsx
        <ButtonLink href="/contribute" variant="secondary" className="w-full">Contribute — help someone’s next step</ButtonLink>
```
(If `ButtonLink` is not already imported on these pages, add it to the `@/components/beta/ui` import.)

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add components/beta/ContributeComponents.tsx app/contribute/page.tsx components/beta/AppShell.tsx app/home/page.tsx app/profile/page.tsx
git commit -m "feat: Contribute queue page, composer/received components, entry links"
```
Expected: typecheck clean.

---

### Task 5: Role-aware sections on proof detail

**Files:**
- Modify: `app/proof/[id]/page.tsx`

**Interfaces:**
- Consumes: `ContributeComposer`, `ReceivedContributions` (Task 4); provider `toggleProofOpen`, `currentUser`.

- [ ] **Step 1: Add an owner "open for contributions" control + the role-aware sections**

In `app/proof/[id]/page.tsx`, add imports:
```tsx
import { useState } from "react";
import { ContributeComposer, ReceivedContributions } from "@/components/beta/ContributeComponents";
import { Button, Card } from "@/components/beta/ui";
```
Pull `toggleProofOpen` from `useBetaApp()`. After the `<ProofDetail .../>` block (inside the `proof ?` branch), insert:
```tsx
            {currentUser?.id === proof.userId ? (
              <div className="space-y-3">
                <OwnerOpenControl proof={proof} toggle={toggleProofOpen} />
                <ReceivedContributions proof={proof} />
              </div>
            ) : (
              proof.openForContributions && <ContributeComposer proof={proof} />
            )}
```
And add this local component at the bottom of the file:
```tsx
function OwnerOpenControl({ proof, toggle }: { proof: import("@/lib/betaTypes").Proof; toggle: (id: string, open: boolean, focus?: string) => void }) {
  const [focus, setFocus] = useState(proof.contributionFocus ?? "");
  const open = !!proof.openForContributions;
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-extrabold text-[#111111]">Open for contributions</p>
      <p className="text-xs leading-5 text-[#6E6E6E]">Invite focused help. Members suggest one observation and one next step; you accept what helps.</p>
      {!open ? (
        <>
          <input className="w-full rounded-2xl border border-[#EFE7D8] bg-white px-4 py-3 text-sm text-[#111111] outline-none focus:border-[#F2A900]"
            value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Optional focus, e.g. ‘make the opening clearer’" />
          <Button className="w-full" onClick={() => toggle(proof.id, true, focus.trim() || undefined)}>Open this proof</Button>
        </>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => toggle(proof.id, false)}>Close to new contributions</Button>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npm run typecheck
git add "app/proof/[id]/page.tsx"
git commit -m "feat: owner open-control + role-aware contribute sections on proof detail"
```
Expected: typecheck clean.

---

### Task 6: Light demo seeding (script + live rows)

**Files:**
- Modify: `scripts/demo/shared.ts`, `scripts/seed-demo-data.ts`

**Interfaces:** none new (seed parity only).

- [ ] **Step 1: Seed a few open proofs + contributions on the live DB (MCP `execute_sql`)**

```sql
-- open 6 demo proofs with a focus
with picks as (
  select id, row_number() over (order by created_at desc) rn from public.proofs where is_demo
)
update public.proofs p set open_for_contributions = true,
  contribution_focus = 'Help me make the first line clearer'
from picks where p.id = picks.id and picks.rn <= 6;

-- one accepted + one pending contribution on each opened proof, demo-tagged, idempotent
with op as (select id as proof_id, user_id as owner_id from public.proofs where is_demo and open_for_contributions),
cand as (select id from public.profiles where is_demo)
insert into public.contributions (proof_id, contributor_id, owner_id, observation, next_step, status, accepted_at, is_demo, demo_seed_id)
select o.proof_id,
       (select id from cand c where c.id <> o.owner_id order by md5(c.id::text || o.proof_id::text) limit 1),
       o.owner_id,
       'The opening states the point before the detail — that lands well.',
       'Try cutting the second sentence so the first idea stands alone.',
       'accepted', now(), true, 'demo-contribution-' || o.proof_id::text
from op o
on conflict (demo_seed_id) where demo_seed_id is not null do nothing;

-- recompute the credited contributors' counts
select public._recompute_profile_counts(c.contributor_id)
from public.contributions c where c.is_demo and c.status='accepted';
```
Expected: rows insert without error; `select count(*) from contributions where is_demo` ≥ 1.

- [ ] **Step 2: Mirror the intent in the seed scripts (reproducibility)**

In `scripts/demo/shared.ts`, add an exported constant:
```ts
export const DEMO_OPEN_PROOFS = 6;
export const DEMO_CONTRIBUTION_FOCUS = "Help me make the first line clearer";
```
In `scripts/seed-demo-data.ts`, after proofs are created, add a phase that sets `open_for_contributions=true` + focus on the first `DEMO_OPEN_PROOFS` demo proofs and upserts one accepted demo contribution each (using `demo_seed_id` `demo-contribution-{proofId}`, `is_demo:true`), then calls the existing stats refresh. Match the file's existing upsert/log style; guard with the same service-role checks already in the file.

- [ ] **Step 3: Typecheck + commit**

```bash
npm run typecheck
git add scripts/demo/shared.ts scripts/seed-demo-data.ts
git commit -m "chore(demo): seed open proofs + contributions (script parity + live rows)"
```
Expected: typecheck clean.

---

### Task 7: Verify (build, advisor, visual, QA doc)

**Files:** Modify `docs/BETA_QA.md`.

- [ ] **Step 1: Build**

```bash
npm run build
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 2: Security advisor (MCP `get_advisors` type security)**

Confirm: no NEW problem beyond pre-existing/by-design. The new `submit_contribution` + `record_contribution_trust` being authenticated-executable is BY DESIGN (same lint 0029 as Phase A RPCs). Confirm both have pinned search_path (they do) and that `_insert_trust`/`_recompute_profile_counts` remain non-callable by `authenticated` (`has_function_privilege('authenticated','public._insert_trust(uuid,text,text,text)','EXECUTE')=false`).

- [ ] **Step 3: Visual check (demo mode, preview)**

Start preview; enter demo; open a proof you "own" in demo (currentUserId = a demo user) → confirm the owner open-control + received contributions render; open `/contribute` → confirm the queue lists open demo proofs; toggle dark mode and confirm calm styling (no white boxes, gold accents). Screenshot light + dark of `/contribute`.

- [ ] **Step 4: QA doc note** in `docs/BETA_QA.md`

Add under the manual checklist:
```
- [ ] Contribute (migration 024): mark a proof open for contributions; as a second
      eligible member, submit a contribution (observation + next step); as the owner,
      accept it; confirm the contributor gets +15 and their contribution_count rises;
      confirm an ineligible member sees the locked state; confirm a non-owner cannot
      accept (rpc rejects).
```

- [ ] **Step 5: Commit**

```bash
git add docs/BETA_QA.md
git commit -m "docs: Contribute manual QA check"
```

---

## Self-Review

**1. Spec coverage:**
- Proof open flag + focus, contributions table, RLS no client insert/update, demo cols → Task 1. ✓
- `submit_contribution` (G1 + open + not-own + dup) and `record_contribution_trust` (owner-only, idempotent, credit + recompute) → Task 1. ✓
- Extend `_recompute_profile_counts` for `contribution_count` → Task 1 Step 2 §4. ✓
- notify owner trigger + accept-notifies-contributor → Task 1 §6–7. ✓
- Types/snapshot/bundle/repo load+write → Task 2. ✓
- Provider methods/selectors/eligibility/events → Task 3. ✓
- Replace legacy page + queue + composer + role-aware proof detail + entry links → Tasks 4–5. ✓
- Demo seeding → Task 6. ✓
- Verify build/advisor/visual + QA doc → Task 7. ✓
- Brand/no-clout copy → enforced in component copy (Tasks 4–5). ✓

**2. Placeholder scan:** No TBD/"handle errors"/"similar to". Full SQL + TSX in every code step. (Task 6 Step 2 references "match the file's existing upsert/log style" — acceptable: the live rows are authoritative via Task 6 Step 1; the script mirror is reproducibility, and the exact pattern is file-local.)

**3. Type consistency:** `Contribution` fields identical across betaTypes (Task 2), `mapContribution` (Task 2), provider (Task 3), components (Task 4). RPC names/params match Task 1 ↔ Task 2 (`submit_contribution`/`p_proof_id,p_observation,p_next_step`; `record_contribution_trust`/`p_contribution_id`). Selectors used by Tasks 4–5 (`getOpenProofs`, `getContributionsForProof`, `isEligibleToContribute`, `toggleProofOpen`, `submitContribution`, `acceptContribution`) all defined in Task 3. `Proof.openForContributions`/`contributionFocus` defined in Task 2, used in Tasks 4–5. ✓
