# Trust System V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make trust earned + structured: 4 dimension sub-scores (Practice/Feedback/Consistency/Contribution) rolled into a weighted `trust_score`, feedback that pays on usefulness, daily soft caps, a rolling no-shame Consistency signal, and a measured-but-non-enforcing `spam_signal` surfaced to admins.

**Architecture:** Additive migration `027` redefines the trust point values + the recompute function (so all existing callers, incl. contribution, get V2) and adds daily caps to the self-triggered record RPCs; profiles gain 5 columns; a backfill recomputes everyone. A Node mirror of the scoring powers a pure check. An admin "spam review" list surfaces `spam_signal`.

**Tech Stack:** Supabase (Postgres, SECURITY-DEFINER RPCs) via MCP (project `qfzguujtjloskyxcdbon`), Next.js admin route/dashboard, `npx tsx` pure check.

## Global Constraints

- Additive only; **do not edit** migrations 010–026. New file `027_trust_v2.sql`. Apply via Supabase MCP; `get_advisors(security)` clean.
- All trust writes stay inside **SECURITY-DEFINER RPCs**; helpers revoked from `public, anon, authenticated`; `record_*` granted to `authenticated`. Clients cannot mint trust; direct `trust_events` insert stays denied.
- **Weighted rollup:** `trust_score = round(practice_trust*1 + feedback_trust*1.5 + consistency_trust*1 + contribution_trust*2)`.
- **Point values:** proof 5, practice 5, **peer-feedback 1** (was 3), **helpful 6** (was 7), accepted-contribution 15.
- **Daily soft caps** (full up to cap, **0 beyond**, still recorded): proof 3, practice 3, peer-feedback 5; helpful + accepted-contribution **uncapped**.
- **Consistency** = `least(distinct_active_weeks_in_last_8, 8) * 4` (0–32); other 3 dimensions cumulative, never decay.
- **spam_signal** (0–100) measured + stored + admin-surfaced only; **never** auto-penalizes trust or hides content in V2.
- Backfill recompute for every profile at migration end. After apply, inspect `trust_score` distribution; re-tune tiers only if clearly off (keep current thresholds otherwise).
- Beginner-safe; no leaderboard/clout; the 4 sub-scores are a descriptive profile readout only.
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (Git Bash). **Start on branch `trust-v2` off `main`.**

## File Structure

- `lib/trust/trustV2.ts` — **create.** Node mirror of the scoring (canonical, unit-tested). The SQL functions are the runtime copy — keep in parity.
- `scripts/check-trust-v2.ts` — **create.** Runnable assertions.
- `supabase/migrations/027_trust_v2.sql` — **create + apply.** Columns + redefined fns + caps + backfill.
- `lib/supabase/betaRepository.ts` — **modify.** `mapProfile` reads the 4 sub-scores + `spam_signal`.
- `lib/betaTypes.ts` — **modify.** `UserProfile` += the 5 fields.
- `app/api/admin/beta/route.ts` — **modify.** Add a `spamReview` list (profiles by `spam_signal` desc).
- `app/admin/beta/page.tsx` — **modify.** Render the read-only spam-review list.

## Reference (verified current state, from 023/024)

- `_trust_points(text)` case map; `_recompute_profile_counts(p_uid)` sets practice_count/proof_count/feedback_given_count/feedback_received_count/trust_score (=Σ points)/updated_at.
- `_insert_trust(p_uid,p_type,p_label,p_source_id)` inserts `_trust_points(type)` with `on conflict (user_id,type,source_id) where source_id is not null do nothing`.
- `record_proof_trust(uuid)`, `record_practice_trust(text)`, `record_feedback_trust(uuid)` (giver + recompute receiver), `mark_feedback_helpful(uuid)` (recipient-only; credits author 'helpful'); `record_contribution_trust(uuid)` (024) credits 'accepted-contribution' + calls `_recompute_profile_counts`.
- Grants: helpers revoked from public+anon+authenticated; record_* granted to authenticated.
- `mapProfile` already reads `trust_score`, `practice_count`, etc. `UserProfile` already has `trustScore?`, `practiceCount?`, etc.

---

### Task 1: Node mirror + pure check

**Files:** Create `lib/trust/trustV2.ts`, `scripts/check-trust-v2.ts`

**Interfaces:**
- Produces:
  - `TRUST_POINTS_V2: Record<string, number>`
  - `cappedPoints(type, todayCountSoFar): number` (full points if under the type's daily cap, else 0)
  - `consistencyScore(activeWeeksInLast8: number): number`
  - `weightedTrustScore(d: { practice: number; feedback: number; consistency: number; contribution: number }): number`
  - `DAILY_CAPS: Record<string, number>`

- [ ] **Step 1: Branch**
```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b trust-v2
```

- [ ] **Step 2: Create `lib/trust/trustV2.ts`** (canonical scoring; the SQL in Task 2 mirrors this):
```ts
// Canonical Trust V2 scoring (Node). Migration 027's SQL functions mirror this —
// keep the two in parity. Pure, no I/O.
export const TRUST_POINTS_V2: Record<string, number> = {
  proof: 5,
  practice: 5,
  "peer-feedback": 1,
  helpful: 6,
  "accepted-contribution": 15,
};

// Daily soft caps for self-triggered actions; helpful + accepted-contribution uncapped.
export const DAILY_CAPS: Record<string, number> = {
  proof: 3,
  practice: 3,
  "peer-feedback": 5,
};

/** Points for the Nth action of a type today (todayCountSoFar = how many already counted today). */
export function cappedPoints(type: string, todayCountSoFar: number): number {
  const base = TRUST_POINTS_V2[type] ?? 0;
  const cap = DAILY_CAPS[type];
  if (cap === undefined) return base; // uncapped type
  return todayCountSoFar < cap ? base : 0;
}

/** Rolling consistency: active weeks (0..8) in the last 8 -> 0..32. */
export function consistencyScore(activeWeeksInLast8: number): number {
  return Math.min(Math.max(activeWeeksInLast8, 0), 8) * 4;
}

/** Weighted rollup -> overall trust_score. */
export function weightedTrustScore(d: { practice: number; feedback: number; consistency: number; contribution: number }): number {
  return Math.round(d.practice * 1 + d.feedback * 1.5 + d.consistency * 1 + d.contribution * 2);
}
```

- [ ] **Step 3: Create `scripts/check-trust-v2.ts`**
```ts
import assert from "node:assert";
import { TRUST_POINTS_V2, DAILY_CAPS, cappedPoints, consistencyScore, weightedTrustScore } from "../lib/trust/trustV2";

// feedback rebalance
assert.equal(TRUST_POINTS_V2["peer-feedback"], 1, "feedback submit = 1");
assert.equal(TRUST_POINTS_V2["helpful"], 6, "helpful = 6");
assert.equal(TRUST_POINTS_V2["proof"], 5, "proof = 5");

// daily caps: full up to cap, 0 beyond
assert.equal(cappedPoints("proof", 0), 5, "1st proof full");
assert.equal(cappedPoints("proof", 2), 5, "3rd proof full");
assert.equal(cappedPoints("proof", 3), 0, "4th proof zero");
assert.equal(cappedPoints("peer-feedback", 4), 1, "5th feedback full");
assert.equal(cappedPoints("peer-feedback", 5), 0, "6th feedback zero");
assert.equal(cappedPoints("helpful", 99), 6, "helpful uncapped");
assert.equal(cappedPoints("accepted-contribution", 99), 15, "contribution uncapped");

// consistency window
assert.equal(consistencyScore(0), 0, "no weeks");
assert.equal(consistencyScore(8), 32, "8 weeks capped");
assert.equal(consistencyScore(12), 32, "over 8 still capped");
assert.equal(consistencyScore(3), 12, "3 weeks");

// weighted rollup
assert.equal(weightedTrustScore({ practice: 10, feedback: 10, consistency: 10, contribution: 10 }), 55, "10*(1+1.5+1+2)=55");
assert.equal(weightedTrustScore({ practice: 0, feedback: 0, consistency: 0, contribution: 0 }), 0, "zero");

console.log("trust-v2 checks passed");
```

- [ ] **Step 4: Run + typecheck + commit**
```bash
npx tsx scripts/check-trust-v2.ts
npm run typecheck
git add lib/trust/trustV2.ts scripts/check-trust-v2.ts
git commit -m "feat(trust): V2 scoring Node mirror (points, caps, consistency, rollup) + check"
```
Expected: `trust-v2 checks passed`; typecheck clean.

---

### Task 2: Migration 027 (DB) — author, apply, verify

**Files:** Create `supabase/migrations/027_trust_v2.sql`

- [ ] **Step 1: Write `supabase/migrations/027_trust_v2.sql`**
```sql
-- 027_trust_v2.sql — quality-weighted 4-dimension trust (additive). After 010–026.
-- Redefines point values + recompute (so all callers, incl. contribution, get V2),
-- adds daily caps to self-triggered record RPCs, backfills every profile.

-- 1) Profile columns for the 4 dimensions + spam signal.
alter table public.profiles add column if not exists practice_trust int not null default 0;
alter table public.profiles add column if not exists feedback_trust int not null default 0;
alter table public.profiles add column if not exists consistency_trust int not null default 0;
alter table public.profiles add column if not exists contribution_trust int not null default 0;
alter table public.profiles add column if not exists spam_signal int not null default 0;

-- 2) Point values (feedback rebalanced to pay on usefulness).
create or replace function public._trust_points(p_type text)
returns integer language sql immutable set search_path = pg_catalog, pg_temp as $$
  select case p_type
    when 'proof' then 5
    when 'practice' then 5
    when 'peer-feedback' then 1
    when 'helpful' then 6
    when 'accepted-contribution' then 15
    else 0
  end;
$$;

-- 3) Capped internal insert: full points up to a daily cap, else 0 (still recorded).
create or replace function public._insert_trust_capped(p_uid uuid, p_type text, p_label text, p_source_id text, p_daily_cap int)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_today int; v_points int;
begin
  select count(*) into v_today from public.trust_events
   where user_id = p_uid and type = p_type and points > 0 and created_at::date = current_date;
  v_points := case when v_today < p_daily_cap then public._trust_points(p_type) else 0 end;
  insert into public.trust_events (user_id, type, points, label, source_id)
  values (p_uid, p_type, v_points, p_label, p_source_id)
  on conflict (user_id, type, source_id) where source_id is not null do nothing;
end;
$$;

-- 4) V2 recompute: 4 sub-scores + consistency + spam + weighted trust_score (+ keep counts).
create or replace function public._recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_practice int; v_feedback int; v_consist int; v_contrib int;
  v_weeks int; v_over_cap int; v_fb_given int; v_fb_helpful int; v_spam int;
begin
  select coalesce(sum(points),0) into v_practice from public.trust_events where user_id = p_uid and type in ('practice','proof');
  select coalesce(sum(points),0) into v_feedback from public.trust_events where user_id = p_uid and type in ('peer-feedback','helpful');
  select coalesce(sum(points),0) into v_contrib  from public.trust_events where user_id = p_uid and type = 'accepted-contribution';
  select count(distinct date_trunc('week', created_at)) into v_weeks
    from public.trust_events where user_id = p_uid and created_at >= now() - interval '8 weeks';
  v_consist := least(coalesce(v_weeks,0), 8) * 4;

  -- spam signal (coarse, non-enforcing): capped/grinding events + low helpful-ratio feedback.
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

-- 5) Self-triggered record RPCs gain daily caps (bodies replaced; names/sigs unchanged).
create or replace function public.record_proof_trust(p_proof_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  select user_id into v_owner from public.proofs where id = p_proof_id;
  if v_owner is null or v_owner is distinct from auth.uid() then raise exception 'not your proof'; end if;
  perform public._insert_trust_capped(auth.uid(), 'proof', 'Submitted proof from practice', p_proof_id::text, 3);
  perform public._recompute_profile_counts(auth.uid());
end;
$$;

create or replace function public.record_practice_trust(p_prompt_id text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.practice_completions where user_id = auth.uid() and prompt_id = p_prompt_id) then
    raise exception 'no completion for this practice';
  end if;
  perform public._insert_trust_capped(auth.uid(), 'practice', 'Completed a practice', p_prompt_id, 3);
  perform public._recompute_profile_counts(auth.uid());
end;
$$;

create or replace function public.record_feedback_trust(p_feedback_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_author uuid; v_recipient uuid;
begin
  select author_id, recipient_id into v_author, v_recipient from public.feedback where id = p_feedback_id;
  if v_author is null or v_author is distinct from auth.uid() then raise exception 'not your feedback'; end if;
  perform public._insert_trust_capped(auth.uid(), 'peer-feedback', 'Gave feedback', p_feedback_id::text, 5);
  perform public._recompute_profile_counts(auth.uid());
  if v_recipient is not null then perform public._recompute_profile_counts(v_recipient); end if;
end;
$$;

-- (mark_feedback_helpful + record_contribution_trust unchanged: they credit via _insert_trust
--  with the new point values and call _recompute_profile_counts, which is now V2.)

-- 6) Grants: new helper must be unreachable by clients.
revoke all on function public._insert_trust_capped(uuid, text, text, text, int) from public, anon, authenticated;

-- 7) Backfill: recompute every profile so live tiers reflect V2 immediately.
do $$ declare r record; begin
  for r in select id from public.profiles loop
    perform public._recompute_profile_counts(r.id);
  end loop;
end $$;
```

- [ ] **Step 2: Apply via Supabase MCP** (`apply_migration`, name `027_trust_v2`, the SQL above; project `qfzguujtjloskyxcdbon`). Idempotent (column adds guarded; `create or replace`; backfill is a recompute). Then `get_advisors(type: "security")` — confirm no new errors on the trust functions.

- [ ] **Step 3: Verify integrity + scoring via MCP `execute_sql`:**
```sql
-- columns present
select column_name from information_schema.columns where table_name='profiles'
  and column_name in ('practice_trust','feedback_trust','consistency_trust','contribution_trust','spam_signal');
-- helpers unreachable by clients (expect false)
select has_function_privilege('authenticated','public._insert_trust_capped(uuid,text,text,text,int)','execute') as cap_exec,
       has_function_privilege('authenticated','public._recompute_profile_counts(uuid)','execute') as recompute_exec;
-- backfill ran: sub-scores populated, trust_score = weighted blend
select count(*) as profiles, count(*) filter (where trust_score = round(practice_trust*1 + feedback_trust*1.5 + consistency_trust*1 + contribution_trust*2)) as consistent
  from public.profiles;
```
Expected: 5 columns; both `*_exec` false; `consistent == profiles`.

- [ ] **Step 4: Tier calibration check** — inspect the new distribution:
```sql
select case
  when trust_score >= 200 then 'Contributor' when trust_score >= 100 then 'Helpful'
  when trust_score >= 50 then 'Reliable' when trust_score >= 20 then 'Practicing' else 'New' end as tier,
  count(*) from public.profiles group by 1 order by 1;
```
If the distribution looks reasonable (not everyone collapsed to one tier), keep thresholds. If clearly skewed, note the suggested new thresholds in the report (do NOT change `trustLevelForPoints` unless the skew is severe — flag for the human). This is an observation step.

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/027_trust_v2.sql
git commit -m "feat(db): Trust V2 — 4 dimensions, feedback-on-helpful, daily caps, spam signal (027)"
```

---

### Task 3: Types + repository + admin spam review

**Files:** Modify `lib/betaTypes.ts`, `lib/supabase/betaRepository.ts`, `app/api/admin/beta/route.ts`, `app/admin/beta/page.tsx`

**Interfaces:**
- Consumes: the new profile columns (Task 2).
- Produces: `UserProfile` += sub-scores + `spamSignal`; admin `spamReview` data + UI list.

- [ ] **Step 1: Extend `UserProfile`** in `lib/betaTypes.ts` (after `contributionCount?`):
```ts
  practiceTrust?: number;
  feedbackTrust?: number;
  consistencyTrust?: number;
  contributionTrust?: number;
  spamSignal?: number;
```

- [ ] **Step 2: Map them in `mapProfile`** (`lib/supabase/betaRepository.ts`, alongside the existing count fields):
```ts
    practiceTrust: row.practice_trust ?? 0,
    feedbackTrust: row.feedback_trust ?? 0,
    consistencyTrust: row.consistency_trust ?? 0,
    contributionTrust: row.contribution_trust ?? 0,
    spamSignal: row.spam_signal ?? 0,
```

- [ ] **Step 3: Add a spam-review list to `app/api/admin/beta/route.ts`** — after the existing profile query, add (admin-only path already enforced by `isAdminUser`):
```ts
  const { data: spamRows } = await service
    .from("profiles")
    .select("id, display_name, username, spam_signal, is_demo")
    .gt("spam_signal", 0)
    .order("spam_signal", { ascending: false })
    .limit(25);
  const spamReview = (spamRows ?? []).map((r: any) => ({
    id: r.id, name: r.display_name || r.username || r.id, spamSignal: r.spam_signal ?? 0, isDemo: !!r.is_demo,
  }));
```
Include `spamReview` in the JSON response object this route returns (add it to the existing `NextResponse.json({...})` payload).

- [ ] **Step 4: Render the spam-review list in `app/admin/beta/page.tsx`** — add a read-only section (only meaningful when the data has rows). Match the page's existing styling; example block:
```tsx
{data.spamReview?.length > 0 && (
  <section className="space-y-2">
    <h2 className="text-sm font-extrabold text-[#111111]">Spam review (signal only — no auto-action)</h2>
    <ul className="space-y-1">
      {data.spamReview.map((s: { id: string; name: string; spamSignal: number; isDemo: boolean }) => (
        <li key={s.id} className="flex items-center justify-between rounded-xl border border-[#EFE7D8] bg-[#FFFDF8] px-3 py-2 text-sm">
          <span className="text-[#111111]">{s.name}{s.isDemo ? " (demo)" : ""}</span>
          <span className="font-extrabold text-[#7A5300]">signal {s.spamSignal}</span>
        </li>
      ))}
    </ul>
  </section>
)}
```
(Adjust the `data` accessor to match how the page consumes the route's JSON. Wire the type so typecheck passes.)

- [ ] **Step 5: Verify + commit**
```bash
npx tsx scripts/check-trust-v2.ts
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add lib/betaTypes.ts lib/supabase/betaRepository.ts app/api/admin/beta/route.ts app/admin/beta/page.tsx
git commit -m "feat(trust): expose V2 sub-scores + admin spam-review list"
```
Expected: check passes; typecheck clean; compiled.

---

## Self-Review

**1. Spec coverage:**
- 4 dimensions + weighted rollup → Task 2 recompute (`_recompute_profile_counts`) + Task 1 mirror. ✓
- Feedback-on-usefulness (+1/+6) + daily soft caps → Task 2 `_trust_points` + `_insert_trust_capped` + record fns; Task 1 `cappedPoints`. ✓
- Rolling no-shame Consistency; other 3 cumulative → Task 2 `v_weeks`/`v_consist`; Task 1 `consistencyScore`. ✓
- `spam_signal` measured + admin-surfaced, non-enforcing → Task 2 (compute, never alters trust beyond storing) + Task 3 (admin list). ✓
- SECURITY-DEFINER, no client mint, helper revoked → Task 2 grants + verify. ✓
- Additive + backfill + tier-calibration observation → Task 2 Steps 1/7/4. ✓
- Types/repo expose sub-scores → Task 3. ✓

**2. Placeholder scan:** No TBD/TODO. Full SQL + code in each step. The calibration step is an explicit observe-and-flag (with the exact query), not a vague "tune later." The admin `data` accessor note points to a concrete wiring (match the route JSON), not a placeholder.

**3. Type consistency:** `_recompute_profile_counts(uuid)` keeps its name/signature (so 024's contribution fn + `mark_feedback_helpful` callers still resolve and now get V2). `_insert_trust_capped(uuid,text,text,text,int)` new + revoked. Point values match between `lib/trust/trustV2.ts` (`TRUST_POINTS_V2`) and the SQL `_trust_points`; caps match (`DAILY_CAPS` vs the `3/3/5` args); rollup weights identical (`weightedTrustScore` vs the SQL `round(...)`); `consistencyScore(w)=min(w,8)*4` matches `least(weeks,8)*4`. `UserProfile` new fields (Task 3) match `mapProfile` reads + the `profiles` columns (Task 2).
```
