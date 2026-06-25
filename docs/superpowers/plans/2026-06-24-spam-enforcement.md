# Spam Enforcement (reversible content quarantine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-hold (quarantine) new outbound content from an actively-spamming author (spam_signal ≥ 70) so it's hidden from others' feeds, reversibly + self-healing, with admin Clear/Remove tools.

**Architecture:** A server-side BEFORE-INSERT trigger stamps `held` on proofs/tips/feedback from the author's current `spam_signal`; read paths hide others' held content; the trust recompute auto-releases held content when the author's signal falls below the flag line; admins can Clear/Remove via SECURITY-DEFINER RPCs. All additive; clients cannot set/bypass `held`.

**Tech Stack:** Supabase (Postgres, triggers, SECURITY-DEFINER RPCs) via MCP (`qfzguujtjloskyxcdbon`), Next.js admin route + UI, `npx tsx` pure check.

## Global Constraints

- Additive; **do not edit** migrations 010–028. New `029_spam_enforcement.sql`. Apply via MCP; `get_advisors(security)` clean.
- `SPAM_FLAG = 40`, `SPAM_QUARANTINE = 70`.
- `held` is stamped **server-side** by a BEFORE-INSERT trigger from `profiles.spam_signal ≥ 70`; client-supplied `held` is overwritten. Author columns: `proofs.user_id`, `practice_tips.author_id`, `feedback.author_id`.
- **Self-heal:** `_recompute_profile_counts` (re-declared, same name/signature; ONLY change vs 028 = add the self-heal block) — when `v_spam < 40`, set `held = false` on that author's rows `where held and not removed`.
- **Admin RPCs** `clear_content(text,uuid)` / `remove_content(text,uuid)` are SECURITY DEFINER, revoked from `public, anon, authenticated`; the admin route (admin-only) calls them via service role. `remove` sets `held=true, removed=true` (never auto-released).
- **Read hiding** is additive `.or("held.eq.false,<author>.eq.<viewer>")` — author sees own held; others don't. No ranking/count change.
- Silent + beginner-safe: no flag/pending/spam label shown to authors; existing content never retroactively held. Content quarantine only — no account warn/suspend/ban.
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (Git Bash). **Start on branch `spam-enforcement` off `main`.**

## File Structure

- `lib/trust/trustV2.ts` — **modify.** Add `SPAM_FLAG`/`SPAM_QUARANTINE` + `isFlagged`/`isQuarantined`/`shouldAutoRelease`.
- `scripts/check-spam-enforcement.ts` — **create.** Pure band-boundary assertions.
- `supabase/migrations/029_spam_enforcement.sql` — **create + apply.**
- `lib/supabase/betaRepository.ts` — **modify.** `.or(...)` filters on the proofs + feedback bundle queries.
- `lib/supabase/tipsRepository.ts` — **modify.** `listTips` gains a `viewerId` for the `.or(...)` filter.
- `components/beta/AppStateProvider.tsx` — **modify.** `loadTips` passes the current user id to `listTips`.
- `app/api/admin/moderation/route.ts` — **create.** Admin clear/remove.
- `app/api/admin/beta/route.ts`, `app/admin/beta/page.tsx` — **modify.** Held-content view + actions.
- `docs/BETA_QA.md` — **modify.**

## Reference (verified current state)

- `loadUserBundle` (`lib/supabase/betaRepository.ts`) `Promise.all` includes `client.from("proofs").select("*").order("created_at",{ascending:false})` and `client.from("feedback").select("*").order("created_at",{ascending:false})`. It has `userId` in scope.
- `feedback` cols: `id, proof_id, author_id, recipient_id, body, tone, helpful, created_at`. `proofs` author = `user_id`. `practice_tips` author = `author_id`.
- `listTips(client, promptId)` in `lib/supabase/tipsRepository.ts`. Provider `loadTips(promptId)` calls it with `getSupabaseClient()`.
- 028 `_recompute_profile_counts(p_uid)` body (Contribution set = `in ('accepted-contribution','tip-submit','useful-tip')`); reproduce verbatim + add self-heal.
- Admin route pattern: `runtime="nodejs"` + `getSupabaseServiceClient()` + `getAuthedUser(req)` + `isAdminUser(service,user)` (see `app/api/admin/beta/route.ts`).

---

## SLICE 1 — DB + thresholds

### Task 1: Threshold helpers + pure check

**Files:** Modify `lib/trust/trustV2.ts`; Create `scripts/check-spam-enforcement.ts`

**Interfaces:**
- Produces: `SPAM_FLAG=40`, `SPAM_QUARANTINE=70`, `isFlagged(n)`, `isQuarantined(n)`, `shouldAutoRelease(n)`.

- [ ] **Step 1: Branch**
```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b spam-enforcement
```

- [ ] **Step 2: Append to `lib/trust/trustV2.ts`**
```ts
// Spam enforcement thresholds. Mirror the SQL trigger (>=70 holds) + recompute (<40 releases).
export const SPAM_FLAG = 40;
export const SPAM_QUARANTINE = 70;

export function isFlagged(signal: number): boolean {
  return signal >= SPAM_FLAG;
}
export function isQuarantined(signal: number): boolean {
  return signal >= SPAM_QUARANTINE;
}
export function shouldAutoRelease(signal: number): boolean {
  return signal < SPAM_FLAG;
}
```

- [ ] **Step 3: Create `scripts/check-spam-enforcement.ts`**
```ts
import assert from "node:assert";
import { isFlagged, isQuarantined, shouldAutoRelease, SPAM_FLAG, SPAM_QUARANTINE } from "../lib/trust/trustV2";

assert.equal(SPAM_FLAG, 40); assert.equal(SPAM_QUARANTINE, 70);
// flag band
assert.equal(isFlagged(39), false, "39 not flagged");
assert.equal(isFlagged(40), true, "40 flagged");
// quarantine band
assert.equal(isQuarantined(69), false, "69 not quarantined");
assert.equal(isQuarantined(70), true, "70 quarantined");
// auto-release band
assert.equal(shouldAutoRelease(40), false, "40 not released");
assert.equal(shouldAutoRelease(39), true, "39 released");
assert.equal(shouldAutoRelease(0), true, "0 released");

console.log("spam-enforcement checks passed");
```

- [ ] **Step 4: Run + typecheck + commit**
```bash
npx tsx scripts/check-spam-enforcement.ts
npm run typecheck
git add lib/trust/trustV2.ts scripts/check-spam-enforcement.ts
git commit -m "feat(spam): quarantine thresholds + band helpers + check"
```
Expected: `spam-enforcement checks passed`; typecheck clean.

---

### Task 2: Migration 029 — author, apply, verify

**Files:** Create `supabase/migrations/029_spam_enforcement.sql`

- [ ] **Step 1: Write `supabase/migrations/029_spam_enforcement.sql`**
```sql
-- 029_spam_enforcement.sql — reversible content quarantine (additive). After 028.
-- held is stamped server-side at insert from the author's current spam_signal (>=70);
-- _recompute releases (held=false) when spam<40 on non-removed rows; admins clear/remove.

-- 1) Columns.
alter table public.proofs        add column if not exists held boolean not null default false;
alter table public.proofs        add column if not exists removed boolean not null default false;
alter table public.practice_tips add column if not exists held boolean not null default false;
alter table public.practice_tips add column if not exists removed boolean not null default false;
alter table public.feedback      add column if not exists held boolean not null default false;
alter table public.feedback      add column if not exists removed boolean not null default false;
create index if not exists proofs_held_idx        on public.proofs(user_id)   where held;
create index if not exists practice_tips_held_idx on public.practice_tips(author_id) where held;
create index if not exists feedback_held_idx      on public.feedback(author_id) where held;

-- 2) BEFORE-INSERT triggers: stamp held from author's current signal (>= 70). Server-only.
create or replace function public._stamp_held_proof()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.held := coalesce((select spam_signal from public.profiles where id = new.user_id), 0) >= 70;
  return new;
end;
$$;
create or replace function public._stamp_held_by_author()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.held := coalesce((select spam_signal from public.profiles where id = new.author_id), 0) >= 70;
  return new;
end;
$$;
drop trigger if exists trg_stamp_held on public.proofs;
create trigger trg_stamp_held before insert on public.proofs
  for each row execute function public._stamp_held_proof();
drop trigger if exists trg_stamp_held on public.practice_tips;
create trigger trg_stamp_held before insert on public.practice_tips
  for each row execute function public._stamp_held_by_author();
drop trigger if exists trg_stamp_held on public.feedback;
create trigger trg_stamp_held before insert on public.feedback
  for each row execute function public._stamp_held_by_author();

-- 3) Recompute (re-declared from 028; ONLY addition = the self-heal block at the end).
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

  -- Self-heal: behavior normalized -> release non-removed held content for this author.
  if v_spam < 40 then
    update public.proofs        set held = false where user_id   = p_uid and held and not removed;
    update public.practice_tips set held = false where author_id = p_uid and held and not removed;
    update public.feedback      set held = false where author_id = p_uid and held and not removed;
  end if;
end;
$$;

-- 4) Admin moderation RPCs (service-role only).
create or replace function public.clear_content(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kind = 'proof' then update public.proofs set held = false, removed = false where id = p_id;
  elsif p_kind = 'tip' then update public.practice_tips set held = false, removed = false where id = p_id;
  elsif p_kind = 'feedback' then update public.feedback set held = false, removed = false where id = p_id;
  else raise exception 'bad kind'; end if;
end;
$$;
create or replace function public.remove_content(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_kind = 'proof' then update public.proofs set held = true, removed = true where id = p_id;
  elsif p_kind = 'tip' then update public.practice_tips set held = true, removed = true where id = p_id;
  elsif p_kind = 'feedback' then update public.feedback set held = true, removed = true where id = p_id;
  else raise exception 'bad kind'; end if;
end;
$$;

-- 5) Grants: triggers + admin RPCs unreachable by clients.
revoke all on function public._stamp_held_proof() from public, anon, authenticated;
revoke all on function public._stamp_held_by_author() from public, anon, authenticated;
revoke all on function public.clear_content(text, uuid) from public, anon, authenticated;
revoke all on function public.remove_content(text, uuid) from public, anon, authenticated;
```

- [ ] **Step 2: Apply via Supabase MCP** — load the tools, then `apply_migration(project_id "qfzguujtjloskyxcdbon", name "029_spam_enforcement", query=<the SQL>)`. Then `get_advisors(type:"security")` — confirm no NEW errors on the new objects. (If MCP can't be loaded/called, STOP + report BLOCKED — no psql/CLI.)

- [ ] **Step 3: Verify via `execute_sql`:**
```sql
-- columns exist
select table_name, count(*) from information_schema.columns
 where (table_name,column_name) in (('proofs','held'),('proofs','removed'),('practice_tips','held'),('practice_tips','removed'),('feedback','held'),('feedback','removed'))
 group by table_name;
-- admin RPCs not client-executable
select has_function_privilege('authenticated','public.clear_content(text,uuid)','execute') as clear_exec,
       has_function_privilege('authenticated','public.remove_content(text,uuid)','execute') as remove_exec;
-- triggers present
select tgname, tgrelid::regclass from pg_trigger where tgname = 'trg_stamp_held' order by 2;
```
Expected: 3 tables × 2 cols; both `*_exec` false; 3 `trg_stamp_held` triggers (proofs/practice_tips/feedback).

- [ ] **Step 4: Functional check** (best-effort via execute_sql; describe results in report): temporarily set a test profile's `spam_signal` to 80, insert a proof as that user (or simulate), confirm `held=true`; set it to 10 and run `select public._recompute_profile_counts('<that uid>')`, confirm the row's `held` flipped to false (non-removed). If a live insert isn't feasible without auth context, verify the trigger/recompute logic by reading `pg_proc.prosrc` and note that. Do NOT leave test rows in prod (delete any you create).

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/029_spam_enforcement.sql
git commit -m "feat(db): reversible content quarantine — held/removed + triggers + self-heal + admin RPCs (029)"
```

---

## SLICE 2 — Read-path hiding

### Task 3: Hide others' held content (bundle + tips)

**Files:** Modify `lib/supabase/betaRepository.ts`, `lib/supabase/tipsRepository.ts`, `components/beta/AppStateProvider.tsx`

- [ ] **Step 1: Filter the proofs + feedback bundle queries** in `loadUserBundle` (`lib/supabase/betaRepository.ts`). Change the two `Promise.all` entries to add an `.or(...)` (author sees own held; others don't):
```ts
      client.from("proofs").select("*").or(`held.eq.false,user_id.eq.${userId}`).order("created_at", { ascending: false }),
```
```ts
      client.from("feedback").select("*").or(`held.eq.false,author_id.eq.${userId}`).order("created_at", { ascending: false }),
```
(Leave every other query unchanged.)

- [ ] **Step 2: Filter `listTips`** (`lib/supabase/tipsRepository.ts`) — add a `viewerId` param:
```ts
export async function listTips(client: SupabaseClient, promptId: string, viewerId?: string): Promise<PracticeTip[]> {
  let q = client.from("practice_tips").select("*").eq("prompt_id", promptId);
  q = viewerId ? q.or(`held.eq.false,author_id.eq.${viewerId}`) : q.eq("held", false);
  const { data } = await q.order("created_at", { ascending: false });
  return (data ?? []).map(mapTip);
}
```

- [ ] **Step 3: Pass the viewer id from `loadTips`** (`components/beta/AppStateProvider.tsx`) — update the `listTips` call to pass the current user id:
```ts
const rows = await listTips(supabase!, promptId, authUid() || snapshot.currentUserId || undefined);
```
(Match the file's existing way of getting the current uid — `authUid()` / `snapshot.currentUserId`.)

- [ ] **Step 4: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add lib/supabase/betaRepository.ts lib/supabase/tipsRepository.ts components/beta/AppStateProvider.tsx
git commit -m "feat(spam): hide others' held proofs/tips/feedback from feeds (author still sees own)"
```
Expected: typecheck clean; compiled.

> Note: this is UI-level hiding (RLS still permits reading held rows directly). Held content is spam, not private data, so direct-API readability is acceptable; the goal is keeping it out of others' feeds.

---

## SLICE 3 — Admin moderation

### Task 4: Admin clear/remove route + UI + docs + verify

**Files:** Create `app/api/admin/moderation/route.ts`; Modify `app/api/admin/beta/route.ts`, `app/admin/beta/page.tsx`, `docs/BETA_QA.md`

- [ ] **Step 1: Create `app/api/admin/moderation/route.ts`**
```ts
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser, isAdminUser } from "@/lib/supabase/serverAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdminUser(service, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, kind, id } = (await req.json()) as { action?: string; kind?: string; id?: string };
  if (!id || (kind !== "proof" && kind !== "tip" && kind !== "feedback")) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const fn = action === "remove" ? "remove_content" : action === "clear" ? "clear_content" : null;
  if (!fn) return NextResponse.json({ error: "Bad action." }, { status: 400 });
  const { error } = await service.rpc(fn, { p_kind: kind, p_id: id });
  if (error) return NextResponse.json({ error: "Action failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Add held-content data to the admin route** (`app/api/admin/beta/route.ts`) — after the existing queries, fetch the currently-held items across the three tables and include them:
```ts
  const heldQuery = (table: string, authorCol: string) =>
    service.from(table).select(`id, ${authorCol}, body, created_at`).eq("held", true).order("created_at", { ascending: false }).limit(25);
  const [heldProofs, heldTips, heldFeedback] = await Promise.all([
    heldQuery("proofs", "user_id"), heldQuery("practice_tips", "author_id"), heldQuery("feedback", "author_id"),
  ]);
  const heldContent = [
    ...(heldProofs.data ?? []).map((r: any) => ({ kind: "proof" as const, id: r.id, authorId: r.user_id, body: r.body ?? "", createdAt: r.created_at })),
    ...(heldTips.data ?? []).map((r: any) => ({ kind: "tip" as const, id: r.id, authorId: r.author_id, body: r.body ?? "", createdAt: r.created_at })),
    ...(heldFeedback.data ?? []).map((r: any) => ({ kind: "feedback" as const, id: r.id, authorId: r.author_id, body: r.body ?? "", createdAt: r.created_at })),
  ];
```
Add `heldContent` to the route's JSON response payload.
> Note: `proofs.body` exists; if `select` errors on a missing column for any table, fall back to selecting `title` for proofs — verify the column names against the schema and adjust the mapped `body`.

- [ ] **Step 3: Render a "Held content" admin section** in `app/admin/beta/page.tsx` (mirror the spam-review/reported-tips block styling; only when non-empty). Each row shows `kind` + truncated `body` + **Clear** / **Remove** buttons that POST to `/api/admin/moderation` with the authed bearer (reuse the page's existing `authedFetch`/session-token pattern), then refresh. Extend the page's `Payload` type with `heldContent?: { kind: string; id: string; authorId: string; body: string; createdAt: string }[]`.

- [ ] **Step 4: Docs** — append a "Spam enforcement" section to `docs/BETA_QA.md` (held/removed columns; trigger stamps held at insert when author spam_signal≥70; recompute self-heals when <40 on non-removed; admin Clear/Remove via /api/admin/moderation; read paths hide others' held; `npx tsx scripts/check-spam-enforcement.ts`).

- [ ] **Step 5: Final verification**
```bash
npx tsx scripts/check-spam-enforcement.ts
npx tsx scripts/check-trust-v2.ts
npm run typecheck
npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: both checks pass; typecheck clean; compiled.

- [ ] **Step 6: Commit**
```bash
git add app/api/admin/moderation/route.ts app/api/admin/beta/route.ts app/admin/beta/page.tsx docs/BETA_QA.md
git commit -m "feat(spam): admin held-content moderation (clear/remove) + docs"
```

---

## Self-Review

**1. Spec coverage:**
- Thresholds + band helpers → Task 1. ✓
- held/removed columns + server-stamp triggers + self-heal recompute + clear/remove RPCs (migration 029, applied) → Task 2. ✓
- Read-path hiding (proofs/feedback bundle + tips, author-sees-own) → Task 3. ✓
- Admin clear/remove route + held-content UI + docs → Task 4. ✓
- Server-enforced held (trigger), additive, SECURITY-DEFINER revoked, beginner-safe, content-only → Global Constraints + Tasks 2/4. ✓
- Pure + typecheck + build + SQL role-switch verify → Tasks 1/2/4. ✓

**2. Placeholder scan:** No TBD/TODO. Full SQL + code in every step. The Task 2 functional-check fallback (read prosrc if live insert infeasible) and the Task 2-Step 2 body-column note are concrete contingencies, not vague gaps.

**3. Type consistency:** `SPAM_FLAG`/`SPAM_QUARANTINE`/`isFlagged`/`isQuarantined`/`shouldAutoRelease` defined Task 1, used in the check + (conceptually mirrored by) the SQL. `clear_content(text,uuid)`/`remove_content(text,uuid)` names match between migration (Task 2), the admin route `service.rpc(fn,{p_kind,p_id})` (Task 4), and the grants. `held`/`removed` columns + author columns (`proofs.user_id`, `practice_tips.author_id`, `feedback.author_id`) consistent across triggers, self-heal, read filters, and admin queries. `listTips(client, promptId, viewerId?)` signature matches the provider call. `_recompute_profile_counts(uuid)` keeps name/signature (028 callers unaffected).
