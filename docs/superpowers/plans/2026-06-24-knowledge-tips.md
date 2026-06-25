# Knowledge Tips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a member who's done a practice post a short "what helped me" tip on it; tips show on the practice ranked by author level × usefulness, earn farm-resistant Contribution trust, and pass layered safety on submit.

**Architecture:** Additive migration `028` adds `practice_tips` + `tip_reports`, extends `useful_marks` to tips, adds two Contribution trust types + a `submit_tip` RPC + a definer trigger for marked-useful credit, and updates the V2 recompute. A Node-only API route runs the regex + AI moderation safety pipeline. The practice screen gains a tips section + gated composer. Pure `rankTips` mirrors the feed.

**Tech Stack:** Supabase (Postgres, RLS, SECURITY-DEFINER RPCs, trigger) via MCP (`qfzguujtjloskyxcdbon`), Next.js route + UI, OpenAI moderation, `npx tsx` pure check.

## Global Constraints

- Additive only; **do not edit** migrations 010–027. New `028_knowledge_tips.sql`. Apply via MCP; `get_advisors(security)` clean.
- Tips: **text-only**, `body ≤ 280` chars. Author gate: must have a `practice_completions` row (or submitted proof) for `(author, prompt_id)` — enforced in `submit_tip`.
- Trust (folds into **Contribution**): `tip-submit` **+1** (daily cap 5), `useful-tip` **+6** once (idempotent via `(user_id,type,source_id)` unique; credited by a definer trigger; NOT self-markable). All trust writes via SECURITY-DEFINER RPC/trigger — clients cannot mint.
- `practice_tips` insert **denied to clients** (RLS `with check (false)`); only `submit_tip` (definer) + service role write. Read: any authenticated. Update/delete: own.
- Safety on submit: regex pre-gate (`coachSafetyPrecheck`, reused) **+** OpenAI moderation + `assertBrandSafe`; AI layer **graceful** (skipped if no `OPENAI_API_KEY`, regex still applies).
- Ranking pure + deterministic; real tips before demo; own excluded; never empty for non-empty input.
- Beginner-safe copy; no scores/counts/clout; level chip is the only status signal.
- The V2 recompute (`_recompute_profile_counts`, same name/signature) is re-declared with the extended Contribution set — all existing callers keep working.
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (Git Bash). **Start on branch `knowledge-tips` off `main`.**

## File Structure

- `lib/tips/types.ts` — **create.** `PracticeTip`.
- `lib/tips/rankTips.ts` — **create.** Pure `rankTips`.
- `scripts/check-tips.ts` — **create.** Runnable assertions.
- `supabase/migrations/028_knowledge_tips.sql` — **create + apply.**
- `lib/supabase/tipsRepository.ts` — **create.** Mappers + reads + submit.
- `app/api/tips/route.ts`, `app/api/tips/report/route.ts` — **create.**
- `lib/supabase/betaRepository.ts` — **modify.** `persistUsefulMark` gains `targetType`.
- `lib/betaTypes.ts` — **modify.** `BetaAppSnapshot` += `practiceTips`, `usefulCountByTip`; `SavedTargetType`/useful target includes `'tip'` where relevant.
- `components/beta/AppStateProvider.tsx` — **modify.** Snapshot wiring + `getTipsForPractice`/`submitTip` + `toggleUseful` target-type.
- `app/practice/page.tsx` (+ practice detail if present) — **modify.** Tips section + composer.
- `components/beta/TipCard.tsx`, `components/beta/TipComposer.tsx` — **create.**
- `app/api/admin/beta/route.ts`, `app/admin/beta/page.tsx` — **modify.** Reported-tips list.
- `docs/BETA_QA.md` — **modify.**

## Reference (verified current state)

- `useful_marks`: `target_type text default 'proof' check (target_type in ('proof'))`, `target_id uuid not null`, `unique(user_id, target_id)`. `persistUsefulMark(client,userId,proofId,reason)` hardcodes `target_type:'proof'`. `toggleUseful(proofId, reason)` is proof-only in the provider.
- `levelRank(profile)` in `lib/betaTrust.ts` (0–4). `rankProofFeed.ts` is the ranking pattern to mirror.
- 027 `_recompute_profile_counts(p_uid)` computes `v_contrib` from `type = 'accepted-contribution'`; this plan changes that one line to `in ('accepted-contribution','tip-submit','useful-tip')` (full fn re-declared in Task 2).
- `_insert_trust_capped(uuid,text,text,text,int)` + `_insert_trust(uuid,text,text,text)` + `_trust_points(text)` exist (027/023). Trust unique index `(user_id,type,source_id) where source_id is not null`.
- Protected API route pattern: `runtime="nodejs"` + `getSupabaseServiceClient()` + `getAuthedUser(req)`. `coachSafetyPrecheck` in `lib/coach/coachPolicy`; `assertBrandSafe` in `lib/ai/outputPolicy`.

---

## SLICE 1 — Backend

### Task 1: Types + pure rankTips + check

**Files:** Create `lib/tips/types.ts`, `lib/tips/rankTips.ts`, `scripts/check-tips.ts`

**Interfaces:**
- Produces: `PracticeTip`; `rankTips(viewer, tips, authorsById, usefulCountByTip): PracticeTip[]`.

- [ ] **Step 1: Branch**
```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b knowledge-tips
```

- [ ] **Step 2: Create `lib/tips/types.ts`**
```ts
export type PracticeTip = {
  id: string;
  promptId: string;
  authorId: string;
  body: string;
  isDemo: boolean;
  createdAt: string;
};
```

- [ ] **Step 3: Create `lib/tips/rankTips.ts`**
```ts
import type { UserProfile } from "@/lib/betaTypes";
import { levelRank } from "@/lib/betaTrust";
import type { PracticeTip } from "./types";

/** Rank a practice's tips by author level + usefulness. Real before demo; own excluded; deterministic. */
export function rankTips(
  viewer: UserProfile | null,
  tips: PracticeTip[],
  authorsById: Record<string, UserProfile>,
  usefulCountByTip: Record<string, number>,
): PracticeTip[] {
  const score = (t: PracticeTip) => {
    const author = authorsById[t.authorId];
    const authorRank = author ? levelRank(author) : 0;
    return authorRank * 1.5 + Math.min(usefulCountByTip[t.id] ?? 0, 5) * 1;
  };
  const sortTier = (list: PracticeTip[]) =>
    list.slice().sort((a, b) => score(b) - score(a) || (a.createdAt < b.createdAt ? 1 : -1));
  const own = (t: PracticeTip) => !!viewer && t.authorId === viewer.id;
  const real = tips.filter((t) => !t.isDemo && !own(t));
  const demo = tips.filter((t) => t.isDemo && !own(t));
  return [...sortTier(real), ...sortTier(demo)];
}
```

- [ ] **Step 4: Create `scripts/check-tips.ts`**
```ts
import assert from "node:assert";
import { rankTips } from "../lib/tips/rankTips";
import { coachSafetyPrecheck } from "../lib/coach/coachPolicy";
import type { UserProfile } from "../lib/betaTypes";
import type { PracticeTip } from "../lib/tips/types";

const U = (id: string, trustScore: number): UserProfile => ({
  id, displayName: id, initials: "X", role: "member", cohortId: "c", directionIds: ["d"], createdAt: "2026-01-01", trustScore,
});
const T = (id: string, authorId: string, isDemo = false, createdAt = "2026-06-01"): PracticeTip => ({
  id, promptId: "conf-s1", authorId, body: "what helped", isDemo, createdAt,
});

const viewer = U("me", 50);
const authors: Record<string, UserProfile> = { hi: U("hi", 250), lo: U("lo", 0), me: viewer };
const tips: PracticeTip[] = [T("tLo", "lo"), T("tHi", "hi"), T("tDemo", "hi", true), T("tOwn", "me")];
const ranked = rankTips(viewer, tips, authors, { tLo: 0, tHi: 0 });

assert.ok(!ranked.some((t) => t.id === "tOwn"), "own tip excluded");
assert.equal(ranked[0].id, "tHi", "higher-level author ranks first");
assert.ok(ranked.findIndex((t) => t.id === "tDemo") > ranked.findIndex((t) => t.id === "tLo"), "real before demo");
// usefulness boost
const ranked2 = rankTips(viewer, [T("a", "lo"), T("b", "lo")], authors, { a: 5, b: 0 });
assert.equal(ranked2[0].id, "a", "useful boost within tier");
// safety reuse
assert.equal(coachSafetyPrecheck("my email is a@b.com").ok, false, "regex blocks private info in tips");
assert.equal(coachSafetyPrecheck("breathe before you start").ok, true, "clean tip passes");

console.log("tips checks passed");
```

- [ ] **Step 5: Run + typecheck + commit**
```bash
npx tsx scripts/check-tips.ts
npm run typecheck
git add lib/tips/types.ts lib/tips/rankTips.ts scripts/check-tips.ts
git commit -m "feat(tips): types + pure rankTips + check"
```
Expected: `tips checks passed`; typecheck clean.

---

### Task 2: Migration 028 — author, apply, verify

**Files:** Create `supabase/migrations/028_knowledge_tips.sql`

- [ ] **Step 1: Write `supabase/migrations/028_knowledge_tips.sql`**
```sql
-- 028_knowledge_tips.sql — practice-anchored knowledge tips (additive). After 027.
-- Tips earn Contribution trust (tip-submit +1 capped, useful-tip +6 once via trigger).

-- 1) Tables.
create table if not exists public.practice_tips (
  id uuid primary key default gen_random_uuid(),
  prompt_id text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 280 and char_length(btrim(body)) > 0),
  is_demo boolean not null default false,
  demo_cohort text,
  demo_seed_id text,
  created_at timestamptz not null default now()
);
create index if not exists practice_tips_prompt_idx on public.practice_tips(prompt_id, created_at desc);
create unique index if not exists practice_tips_demo_seed_uidx on public.practice_tips(demo_seed_id) where demo_seed_id is not null;

create table if not exists public.tip_reports (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid not null references public.practice_tips(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists tip_reports_tip_idx on public.tip_reports(tip_id);

-- 2) RLS.
alter table public.practice_tips enable row level security;
drop policy if exists practice_tips_read on public.practice_tips;
create policy practice_tips_read on public.practice_tips for select to authenticated using (true);
drop policy if exists practice_tips_no_client_insert on public.practice_tips;
create policy practice_tips_no_client_insert on public.practice_tips for insert to authenticated with check (false);
drop policy if exists practice_tips_own_update on public.practice_tips;
create policy practice_tips_own_update on public.practice_tips for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists practice_tips_own_delete on public.practice_tips;
create policy practice_tips_own_delete on public.practice_tips for delete to authenticated using (author_id = auth.uid());

alter table public.tip_reports enable row level security;
drop policy if exists tip_reports_insert_own on public.tip_reports;
create policy tip_reports_insert_own on public.tip_reports for insert to authenticated with check (reporter_id = auth.uid());
-- (no client select policy: admin reads via service role)

-- 3) Allow useful_marks on tips (extend the check; keep unique(user_id,target_id)).
alter table public.useful_marks drop constraint if exists useful_marks_target_type_check;
alter table public.useful_marks add constraint useful_marks_target_type_check check (target_type in ('proof','tip'));

-- 4) Trust point values for tips.
create or replace function public._trust_points(p_type text)
returns integer language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case p_type
    when 'proof' then 5
    when 'practice' then 5
    when 'peer-feedback' then 1
    when 'helpful' then 6
    when 'accepted-contribution' then 15
    when 'tip-submit' then 1
    when 'useful-tip' then 6
    else 0
  end;
$$;

-- 5) Recompute (re-declared from 027 with Contribution extended to include tip trust).
create or replace function public._recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_practice int; v_feedback int; v_consist int; v_contrib int;
  v_weeks int; v_over_cap int; v_fb_given int; v_fb_helpful int; v_spam int;
begin
  select coalesce(sum(points),0) into v_practice from public.trust_events where user_id = p_uid and type in ('practice','proof');
  select coalesce(sum(points),0) into v_feedback from public.trust_events where user_id = p_uid and type in ('peer-feedback','helpful');
  select coalesce(sum(points),0) into v_contrib  from public.trust_events where user_id = p_uid and type in ('accepted-contribution','tip-submit','useful-tip');
  select count(distinct date_trunc('week', created_at)) into v_weeks
    from public.trust_events where user_id = p_uid and created_at >= now() - interval '8 weeks';
  v_consist := least(coalesce(v_weeks,0), 8) * 4;

  select count(*) into v_over_cap from public.trust_events where user_id = p_uid and points = 0;
  select count(*) into v_fb_given from public.trust_events where user_id = p_uid and type = 'peer-feedback';
  select count(*) into v_fb_helpful from public.feedback where author_id = p_uid and helpful = true;
  v_spam := least(100, v_over_cap * 5 + (case when v_fb_given >= 5 and v_fb_helpful::numeric / nullif(v_fb_given,0) < 0.2 then 40 else 0 end));

  update public.profiles p set
    practice_count = (select count(*) from public.practice_completions where user_id = p_uid),
    proof_count = (select count(*) from public.proofs where user_id = p_uid),
    feedback_given_count = (select count(*) from public.feedback where author_id = p_uid),
    feedback_received_count = (select count(*) from public.feedback where recipient_id = p_uid),
    practice_trust = v_practice,
    feedback_trust = v_feedback,
    consistency_trust = v_consist,
    contribution_trust = v_contrib,
    spam_signal = coalesce(v_spam,0),
    trust_score = round(v_practice * 1 + v_feedback * 1.5 + v_consist * 1 + v_contrib * 2),
    updated_at = now()
  where p.id = p_uid;
end;
$$;

-- 6) submit_tip: author-gated insert + capped submit credit. Returns the new tip id.
create or replace function public.submit_tip(p_prompt_id text, p_body text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if char_length(btrim(p_body)) = 0 or char_length(p_body) > 280 then raise exception 'invalid tip body'; end if;
  if not exists (
    select 1 from public.practice_completions where user_id = auth.uid() and prompt_id = p_prompt_id
    union all
    select 1 from public.proofs where user_id = auth.uid() and prompt_id = p_prompt_id
  ) then raise exception 'complete the practice before sharing a tip'; end if;
  insert into public.practice_tips (prompt_id, author_id, body) values (p_prompt_id, auth.uid(), p_body) returning id into v_id;
  perform public._insert_trust_capped(auth.uid(), 'tip-submit', 'Shared a tip', v_id::text, 5);
  perform public._recompute_profile_counts(auth.uid());
  return v_id;
end;
$$;

-- 7) Trigger: marked-useful credits the tip author once (idempotent; not self).
create or replace function public._credit_useful_tip()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_author uuid;
begin
  if new.target_type <> 'tip' then return new; end if;
  select author_id into v_author from public.practice_tips where id = new.target_id;
  if v_author is not null and v_author is distinct from new.user_id then
    perform public._insert_trust(v_author, 'useful-tip', 'A tip you shared was useful', new.target_id::text);
    perform public._recompute_profile_counts(v_author);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_credit_useful_tip on public.useful_marks;
create trigger trg_credit_useful_tip after insert on public.useful_marks
  for each row execute function public._credit_useful_tip();

-- 8) Service-role helper: capped tip-submit credit for a given uid (used by the API route,
--    which runs as service role and has no auth.uid()). Unreachable by clients.
create or replace function public.record_tip_submit_trust(p_tip_id uuid, p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._insert_trust_capped(p_uid, 'tip-submit', 'Shared a tip', p_tip_id::text, 5);
  perform public._recompute_profile_counts(p_uid);
end;
$$;

-- 9) Grants: new helpers unreachable by clients; submit_tip callable by members.
revoke all on function public._credit_useful_tip() from public, anon, authenticated;
revoke all on function public.record_tip_submit_trust(uuid, uuid) from public, anon, authenticated;
revoke all on function public.submit_tip(text, text) from public, anon;
grant execute on function public.submit_tip(text, text) to authenticated;
```
> `submit_tip` (auth.uid-based) stays for any authenticated-context use; the API route (service role) uses the service-role insert + `record_tip_submit_trust` path below.

- [ ] **Step 2: Apply via Supabase MCP** (`apply_migration`, name `028_knowledge_tips`, project `qfzguujtjloskyxcdbon`). Then `get_advisors(type:"security")` — confirm no new errors on the new objects. (If MCP can't be loaded/called, STOP + report BLOCKED.)

- [ ] **Step 3: Verify via `execute_sql`:**
```sql
-- tables + columns
select table_name, count(*) from information_schema.columns where table_name in ('practice_tips','tip_reports') group by 1;
-- useful_marks accepts 'tip'
select pg_get_constraintdef(oid) from pg_constraint where conname='useful_marks_target_type_check';
-- submit_tip callable; helper not
select has_function_privilege('authenticated','public.submit_tip(text,text)','execute') as submit_ok,
       has_function_privilege('authenticated','public._credit_useful_tip()','execute') as trigfn_exec;
-- contribution now includes tip types (spot a profile recompute is consistent)
select count(*) filter (where trust_score = round(practice_trust*1+feedback_trust*1.5+consistency_trust*1+contribution_trust*2)) = count(*) as consistent from public.profiles;
```
Expected: practice_tips 8 cols, tip_reports 5; constraint includes `'tip'`; `submit_ok` true, `trigfn_exec` false; `consistent` true.

- [ ] **Step 4: Functional SQL check** (best-effort via service role / a test uid) — confirm `submit_tip` raises without a completion, and a `useful_marks` insert with `target_type='tip'` for another user's tip credits a single `useful-tip` event (run twice → still one). Record results in the report.

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/028_knowledge_tips.sql
git commit -m "feat(db): knowledge tips — practice_tips/tip_reports, tip trust + useful trigger (028)"
```

---

### Task 3: tipsRepository + API routes (layered safety)

**Files:** Create `lib/supabase/tipsRepository.ts`, `app/api/tips/route.ts`, `app/api/tips/report/route.ts`

- [ ] **Step 1: Create `lib/supabase/tipsRepository.ts`**
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PracticeTip } from "@/lib/tips/types";

export function mapTip(row: any): PracticeTip {
  return { id: row.id, promptId: row.prompt_id, authorId: row.author_id, body: row.body, isDemo: !!row.is_demo, createdAt: row.created_at };
}

export async function listTips(client: SupabaseClient, promptId: string): Promise<PracticeTip[]> {
  const { data } = await client.from("practice_tips").select("*").eq("prompt_id", promptId).order("created_at", { ascending: false });
  return (data ?? []).map(mapTip);
}
```

- [ ] **Step 2: Create `app/api/tips/route.ts`** (layered safety):
```ts
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/serverAuth";
import { coachSafetyPrecheck } from "@/lib/coach/coachPolicy";
import { assertBrandSafe } from "@/lib/ai/outputPolicy";
import { mapTip } from "@/lib/supabase/tipsRepository";

export const runtime = "nodejs";

async function aiFlagged(body: string): Promise<boolean> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false; // graceful: regex still applied
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "omni-moderation-latest", input: body }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return !!json.results?.[0]?.flagged;
  } catch { return false; }
}

export async function POST(req: Request) {
  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { promptId, body } = (await req.json()) as { promptId?: string; body?: string };
  const text = (body ?? "").trim();
  if (!promptId || !text) return NextResponse.json({ error: "Missing tip." }, { status: 400 });
  if (text.length > 280) return NextResponse.json({ error: "Tips are 280 characters or fewer." }, { status: 400 });

  const gate = coachSafetyPrecheck(text);
  if (!gate.ok) return NextResponse.json({ error: gate.redirect }, { status: 400 });
  try { assertBrandSafe([text]); } catch { return NextResponse.json({ error: "Let's keep tips practical and kind." }, { status: 400 }); }
  if (await aiFlagged(text)) return NextResponse.json({ error: "That tip didn't pass our safety check. Try rephrasing." }, { status: 400 });

  // submit_tip enforces the author gate + credits; call it as the user (RLS-respecting) via a user-scoped client
  // is not available here, so use service role but pass the user id through the SECURITY DEFINER fn which reads auth.uid().
  // The fn uses auth.uid(); with the service client there is no auth.uid(), so insert directly here as service role,
  // replicating the author-gate check, then credit via RPC-less path:
  const { data: done } = await service.from("practice_completions").select("user_id").eq("user_id", user.id).eq("prompt_id", promptId).limit(1);
  const { data: pf } = done?.length ? { data: done } : await service.from("proofs").select("user_id").eq("user_id", user.id).eq("prompt_id", promptId).limit(1);
  if (!pf?.length) return NextResponse.json({ error: "Complete the practice before sharing a tip." }, { status: 403 });

  const { data: tip, error } = await service.from("practice_tips").insert({ prompt_id: promptId, author_id: user.id, body: text }).select("*").single();
  if (error || !tip) return NextResponse.json({ error: "Could not save tip." }, { status: 500 });
  // capped submit credit via the existing internal helper (service role can call it)
  await service.rpc("record_tip_submit_trust", { p_tip_id: tip.id, p_uid: user.id }).catch(() => {});
  return NextResponse.json({ tip: mapTip(tip) }, { status: 201 });
}
```
> **Why this shape:** the route runs as the service role (no `auth.uid()`), so it re-checks the author gate itself and inserts the tip directly, then credits via `record_tip_submit_trust(tip_id, user.id)` (the service-role helper added in Task 2 Step 1 §8). Trust is still minted only inside a SECURITY-DEFINER function. (`submit_tip` remains for any future authenticated-context caller.)

- [ ] **Step 3: Create `app/api/tips/report/route.ts`**
```ts
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/serverAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tipId, reason } = (await req.json()) as { tipId?: string; reason?: string };
  if (!tipId) return NextResponse.json({ error: "Missing tip." }, { status: 400 });
  await service.from("tip_reports").insert({ tip_id: tipId, reporter_id: user.id, reason: reason ?? null });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add lib/supabase/tipsRepository.ts app/api/tips/route.ts app/api/tips/report/route.ts
git commit -m "feat(tips): repository + submit/report routes with layered safety"
```
Expected: typecheck clean; compiled.

---

## SLICE 2 — UI

### Task 4: Provider/snapshot + useful-mark target type

**Files:** Modify `lib/betaTypes.ts`, `lib/supabase/betaRepository.ts`, `components/beta/AppStateProvider.tsx`

- [ ] **Step 1: `BetaAppSnapshot`** (`lib/betaTypes.ts`) += `practiceTips: PracticeTip[]` and `usefulCountByTip: Record<string, number>` (import `PracticeTip`). Add empty defaults wherever the snapshot is seeded (`lib/betaData.ts` `seedSnapshot`: `practiceTips: []`, `usefulCountByTip: {}`).

- [ ] **Step 2: `persistUsefulMark`** (`lib/supabase/betaRepository.ts`) gains a `targetType`:
```ts
export async function persistUsefulMark(
  client: SupabaseClient, userId: string, targetId: string, reason: UsefulReason = "clear", targetType: "proof" | "tip" = "proof",
): Promise<void> {
  await client.from("useful_marks").upsert(
    { user_id: userId, target_type: targetType, target_id: targetId, reason },
    { onConflict: "user_id,target_id" },
  );
}
```

- [ ] **Step 3: Provider** (`components/beta/AppStateProvider.tsx`):
  - Load tips into the snapshot for the viewed practice on demand OR include recent tips in the bundle; simplest: a `getTipsForPractice(promptId)` selector that filters `snapshot.practiceTips` (populated by `submitTip` optimistic insert + a `listTips` fetch the practice page triggers — see Task 5).
  - `submitTip(promptId, body)`: optimistic insert a local `PracticeTip` (id `makeId("tip")`, authorId current user) into `snapshot.practiceTips`; if `writesEnabled`, `POST /api/tips`; on success replace the optimistic row with the server tip; on failure remove it + return an error string.
  - Extend `toggleUseful` to accept an optional `targetType: "proof" | "tip"` (default "proof") and pass it to `persistUsefulMark`; the optimistic mark stores `targetType`. (Add `usefulCountByTip` derivation from `usefulMarks` where targetType==='tip'.)
  - Add `getTipsForPractice`, `submitTip` to the context type + value.

- [ ] **Step 4: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add lib/betaTypes.ts lib/betaData.ts lib/supabase/betaRepository.ts components/beta/AppStateProvider.tsx
git commit -m "feat(tips): provider/snapshot wiring + useful-mark target type"
```
Expected: typecheck clean; compiled.

### Task 5: Practice-screen tips section + composer

**Files:** Create `components/beta/TipCard.tsx`, `components/beta/TipComposer.tsx`; Modify `app/practice/page.tsx`

- [ ] **Step 1: `TipCard.tsx`** — renders a tip: body, author name + `levelRank` chip, relative time, Useful toggle (`toggleUseful(tip.id, "clear", "tip")` via `useBetaApp`; `isUseful(tip.id)`), and a Report button (`POST /api/tips/report`). Beginner-safe, no counts.

- [ ] **Step 2: `TipComposer.tsx`** — a ≤280-char textarea + helper copy + submit; calls `submitTip(promptId, body)`; shows the returned error calmly; clears on success. Renders only when passed `canShare`.

- [ ] **Step 3: Wire into `app/practice/page.tsx`** — for the focused practice(s), add a "Tips from people who've done this" section: on mount, fetch `listTips(getSupabaseClient(), promptId)` into the provider (or call a provider `loadTips(promptId)`), render `rankTips(currentUser, getTipsForPractice(promptId), authorsById, snapshot.usefulCountByTip)` as `TipCard`s; show `TipComposer` with `canShare = snapshot.completedPracticeIds.includes(promptId)` (or a proof exists). Empty state copy from the spec.

- [ ] **Step 4: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add components/beta/TipCard.tsx components/beta/TipComposer.tsx app/practice/page.tsx
git commit -m "feat(tips): practice-screen tips section + gated composer + Useful/Report"
```
Expected: typecheck clean; compiled.

---

## SLICE 3 — Admin + verify

### Task 6: Reported-tips admin list + docs + final verify

**Files:** Modify `app/api/admin/beta/route.ts`, `app/admin/beta/page.tsx`, `docs/BETA_QA.md`

- [ ] **Step 1: Admin route** — add a reported-tips query (service role) and include in the JSON:
```ts
  const { data: reportRows } = await service
    .from("tip_reports")
    .select("id, reason, created_at, practice_tips(id, body, author_id)")
    .order("created_at", { ascending: false })
    .limit(25);
  const reportedTips = (reportRows ?? []).map((r: any) => ({
    id: r.id, reason: r.reason ?? null, body: r.practice_tips?.body ?? "(deleted)", tipId: r.practice_tips?.id ?? null,
  }));
```
Add `reportedTips` to the response payload.

- [ ] **Step 2: Admin page** — render a read-only "Reported tips" list (match existing styling; only when non-empty), mirroring the spam-review list block.

- [ ] **Step 3: Docs** — append a Knowledge Tips section to `docs/BETA_QA.md` (tables, submit gate, trust types, safety layers, report→admin, `npx tsx scripts/check-tips.ts`).

- [ ] **Step 4: Final verification**
```bash
npx tsx scripts/check-tips.ts
npx tsx scripts/check-trust-v2.ts
npm run typecheck
npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: both checks pass; typecheck clean; compiled.

- [ ] **Step 5: Commit**
```bash
git add app/api/admin/beta/route.ts app/admin/beta/page.tsx docs/BETA_QA.md
git commit -m "feat(tips): reported-tips admin list + docs + verify"
```

---

## Self-Review

**1. Spec coverage:**
- Practice-anchored text tips ≤280 + table/RLS → Task 2. ✓
- Completed-practice author gate (server) → Task 2 `submit_tip` + Task 3 route re-check. ✓
- Contribution trust (tip-submit +1 capped / useful-tip +6 once via trigger; recompute folds both) → Task 2. ✓
- useful_marks extended to 'tip' + trigger credit + not-self → Task 2; provider/repo target type → Task 4. ✓
- Ranked tips on practice screen + composer gated → Tasks 1 (rankTips), 5. ✓
- Layered safety (regex + AI moderation, graceful) + report→admin → Task 3 + Task 6. ✓
- Pure + typecheck + build verify; migration additive + advisors → Tasks 1/2/6. ✓

**2. Placeholder scan:** No TBD/TODO. The one genuine decision (route can't call `auth.uid()`-based `submit_tip` as service role) is presented as TWO concrete, fully-specified options with a stated default + "say which you took" — not a vague gap. All code blocks complete.

**3. Type consistency:** `PracticeTip` (Task 1) used by `rankTips`, `mapTip`, provider, UI. `rankTips(viewer, tips, authorsById, usefulCountByTip)` identical across def + call site. `persistUsefulMark(..., targetType)` (Task 4) matches the `toggleUseful` target-type extension. Trust types `tip-submit`/`useful-tip` consistent across `_trust_points`, recompute Contribution set, `submit_tip`/trigger, and the Node check. `submit_tip(text,text)` + (optional) `record_tip_submit_trust(uuid,uuid)` names match between Task 2 and Task 3's note.
```
