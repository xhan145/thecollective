# Server-Side Trust Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make trust earned-not-mintable and keep all affected profile counters drift-free by routing every `trust_events` write + counter recompute through validated `SECURITY DEFINER` RPCs, while proof/feedback/completion rows stay client-side under existing RLS.

**Architecture:** One additive migration (`023_trust_integrity.sql`) de-dupes `trust_events`, adds a `unique (user_id, type, source_id)` constraint, locks the `trust_events` insert policy to `with check (false)`, and creates a small set of purpose-specific SECURITY DEFINER functions that validate ownership/relationship, stamp points from a server-side mapping, insert trust idempotently, and recompute every affected user's counters from source tables. Then `lib/supabase/betaRepository.ts` swaps its direct `insertTrust` + `refreshProfileStats` calls for `supabase.rpc(...)` calls. Row inserts are unchanged.

**Tech Stack:** Next.js (App Router) + TypeScript, Supabase (Postgres + RLS + plpgsql), `@supabase/supabase-js`. Migrations applied to live project `qfzguujtjloskyxcdbon` via the Supabase MCP `apply_migration` tool. No new dependencies.

## Global Constraints

- Additive only. Do NOT edit applied migrations `010`–`022`. New migration is `023_trust_integrity.sql`.
- The migration must be idempotent and safe to re-run (`create or replace`, `drop policy if exists`, `if not exists` where applicable).
- Service role stays server-only; the client must NOT receive the service role key. RPCs are called from the browser with the user's JWT via `supabase.rpc(...)`.
- Trust point values are UNCHANGED: `proof` 5, `practice` 5, `peer-feedback` 3, `helpful` 7. Do not retune.
- Trust must stay quiet: no leaderboards, no public ranking, no likes/followers language.
- All SECURITY DEFINER functions must pin `search_path` (`set search_path = public, pg_temp`) and grant `execute` to `authenticated` only (revoke from `public`/`anon`).
- Repo working dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (junction: `C:\Users\xhan1\collective-web`). Shell is Git Bash; project also reachable via PowerShell.
- Verification commands: `npm run typecheck` and `npm run build` must both pass at the end.
- Existing camelCase↔snake_case convention: DB columns are snake_case; `betaRepository.ts` maps to camelCase app types.

## File Structure

- `supabase/migrations/023_trust_integrity.sql` — **create.** The full migration (de-dupe, constraint, policy lock-down, all functions, grants). Single source of truth checked into the repo; the same SQL is applied to the live DB via MCP.
- `lib/supabase/betaRepository.ts` — **modify.** Replace the bodies of `recordPracticeCompletion`, `persistProof`, `persistFeedback`, `persistMarkHelpful` to call RPCs; remove the now-unused `insertTrust`; replace `refreshProfileStats` with a thin `recomputeProfileCounts(client, userId)` wrapper over the `_recompute`-equivalent RPC for admin/manual repair.
- No client component or type changes are required (the provider already calls these repository functions and keeps its optimistic-update pattern).

## Source-of-truth reference (read before starting)

Current trust write path in `lib/supabase/betaRepository.ts`:
- `insertTrust(client, event)` — `client.from("trust_events").insert({...})`. **To be removed.**
- `refreshProfileStats(client, userId)` — recomputes the acting user's counters; relies on `profiles_update_own`. **To be replaced by a wrapper over the new RPC.**
- `recordPracticeCompletion` calls `practice_completions` upsert → `insertTrust(practice)` → `refreshProfileStats`.
- `persistProof` inserts proof row + optional attachment → `insertTrust(proof)` → `refreshProfileStats`.
- `persistFeedback` inserts feedback row → `proofs.update status` → `insertTrust(peer-feedback)` → `refreshProfileStats`.
- `persistMarkHelpful` does `feedback.update({helpful:true})` → `insertTrust(helpful)` for the author.

Current RLS (migration 011) being changed:
- `trust_events_insert_authenticated ... with check (true)` → becomes `with check (false)`.
- `trust_events_read_own` (select, `auth.uid() = user_id`) — keep.

`makeTrustEvent` types map to DB `trust_events.type` values: `proof`, `practice`, `peer-feedback`, `helpful`, `accepted-contribution`.

---

### Task 0: Fix proof/feedback id generation (use real UUIDs)

**Why:** `proofs.id` and `feedback.id` are `uuid` columns, but the provider generates ids via `makeId("proof")` → `"proof-<ts>-<rand>"`, which is not a valid uuid. `persistProof`/`persistFeedback` send `id: proof.id` into those uuid columns, so real inserts throw `invalid input syntax for type uuid` (confirmed: 0 real proofs/feedback exist on the live DB — the path has never succeeded). The trust RPCs in later tasks key off these ids, so they must be valid uuids that match the persisted row. Fix: generate proof/feedback ids with `crypto.randomUUID()` so the local id IS the DB id.

**Files:**
- Modify: `components/beta/AppStateProvider.tsx` (two id-generation sites)

**Interfaces:**
- Produces: proof + feedback objects whose `id` is a valid uuid, used unchanged by `persistProof`/`persistFeedback` (they still send `id: …`, now valid) and by the trust RPCs in Task 1/2.

- [ ] **Step 1: Switch the proof id to a uuid**

In `components/beta/AppStateProvider.tsx`, inside `submitProof`, change:

```ts
        const proofId = makeId("proof");
```

to:

```ts
        const proofId = crypto.randomUUID();
```

- [ ] **Step 2: Switch the feedback id to a uuid**

In `components/beta/AppStateProvider.tsx`, inside `addFeedback`, change:

```ts
          const feedbackId = makeId("feedback");
```

to:

```ts
          const feedbackId = crypto.randomUUID();
```

Leave all other `makeId(...)` calls as-is — conversations/messages/useful/saved/connection inserts don't send a client id into a uuid PK (the DB generates those), so they're unaffected.

- [ ] **Step 3: Typecheck**

Run:

```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
npm run typecheck
```

Expected: no errors. (`crypto.randomUUID()` is available in the browser; these methods run only in `"use client"` code.)

- [ ] **Step 4: Confirm no other proof/feedback id forcing remains**

Run:

```bash
grep -n "makeId(\"proof\")\|makeId(\"feedback\")\|makeId('proof')\|makeId('feedback')" components/beta/AppStateProvider.tsx
```

Expected: zero matches.

- [ ] **Step 5: Commit**

```bash
git add components/beta/AppStateProvider.tsx
git commit -m "fix: generate proof/feedback ids as uuids so they persist + match DB"
```

---

### Task 1: Write and apply migration `023_trust_integrity.sql`

**Files:**
- Create: `supabase/migrations/023_trust_integrity.sql`

**Interfaces:**
- Consumes: existing tables `trust_events(user_id uuid, type text, points int, label text, source_id, created_at)`, `proofs(id, user_id)`, `feedback(id, author_id, recipient_id, helpful)`, `practice_completions(user_id, prompt_id)`, `profiles(id, practice_count, proof_count, feedback_given_count, feedback_received_count, trust_score, updated_at)`.
- Produces (callable by later tasks / client):
  - `public.record_proof_trust(p_proof_id uuid) returns void`
  - `public.record_practice_trust(p_prompt_id uuid) returns void`
  - `public.record_feedback_trust(p_feedback_id uuid) returns void`
  - `public.mark_feedback_helpful(p_feedback_id uuid) returns void`
  - `public.recompute_profile_counts(p_uid uuid) returns void` (public wrapper for admin/manual repair; internal helper `_recompute_profile_counts` does the work)
  - `public._trust_points(p_type text) returns integer`

- [ ] **Step 1: Confirm `source_id` column type** (informs the unique constraint + casts)

Run via Supabase MCP `execute_sql` (project `qfzguujtjloskyxcdbon`):

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'trust_events' and column_name in ('source_id','type','points','user_id');
```

Expected: note whether `source_id` is `text` or `uuid`. The migration below treats `source_id` as `text` in the unique constraint (works for both because the proof/feedback/prompt ids are stored as-is); if it is `uuid`, the constraint and inserts still work unchanged (the function parameters are `uuid` and Postgres will accept them). Do NOT change the column type.

- [ ] **Step 2: Check for existing duplicate trust rows** (so the de-dupe step is understood, not blind)

Run via MCP `execute_sql`:

```sql
select user_id, type, source_id, count(*)
from public.trust_events
where source_id is not null
group by user_id, type, source_id
having count(*) > 1
limit 20;
```

Expected: 0 rows ideally; if some exist (seed data), the de-dupe in Step 3 handles them.

- [ ] **Step 3: Write the migration file**

Create `supabase/migrations/023_trust_integrity.sql` with this exact content:

```sql
-- 023_trust_integrity.sql — Phase A: server-side trust integrity (additive).
-- Run AFTER 010–022. Idempotent / safe to re-run.
-- Makes trust earned-not-mintable (no direct client inserts) and keeps every
-- affected user's profile counters drift-free, via SECURITY DEFINER RPCs.

-- 1) De-dupe trust_events on (user_id, type, source_id), keeping the earliest row,
--    so the unique constraint can be created cleanly over existing/seed data.
delete from public.trust_events t
using public.trust_events d
where t.user_id = d.user_id
  and t.type = d.type
  and t.source_id is not distinct from d.source_id
  and t.source_id is not null
  and t.ctid > d.ctid;

-- 2) Unique constraint backs idempotent inserts (on conflict do nothing).
create unique index if not exists trust_events_user_type_source_uidx
  on public.trust_events (user_id, type, source_id)
  where source_id is not null;

-- 3) Lock down: deny ALL direct client inserts. Only SECURITY DEFINER functions
--    (run as owner) and the service role may write trust_events.
drop policy if exists "trust_events_insert_authenticated" on public.trust_events;
create policy "trust_events_insert_denied" on public.trust_events
  for insert to authenticated with check (false);

-- 4) Point values — single server-side source (unchanged from app TRUST_POINTS).
create or replace function public._trust_points(p_type text)
returns integer language sql immutable as $$
  select case p_type
    when 'proof' then 5
    when 'practice' then 5
    when 'peer-feedback' then 3
    when 'helpful' then 7
    when 'accepted-contribution' then 15
    else 0
  end;
$$;

-- 5) Recompute one user's counters from source tables (drift-free, self-healing).
create or replace function public._recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.profiles p set
    practice_count = (select count(*) from public.practice_completions where user_id = p_uid),
    proof_count = (select count(*) from public.proofs where user_id = p_uid),
    feedback_given_count = (select count(*) from public.feedback where author_id = p_uid),
    feedback_received_count = (select count(*) from public.feedback where recipient_id = p_uid),
    trust_score = (select coalesce(sum(points), 0) from public.trust_events where user_id = p_uid),
    updated_at = now()
  where p.id = p_uid;
end;
$$;

-- Public wrapper for admin/manual repair (callable by authenticated for own id).
create or replace function public.recompute_profile_counts(p_uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._recompute_profile_counts(p_uid);
end;
$$;

-- 6) Internal trust insert (idempotent) used by the action RPCs.
create or replace function public._insert_trust(p_uid uuid, p_type text, p_label text, p_source_id text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.trust_events (user_id, type, points, label, source_id)
  values (p_uid, p_type, public._trust_points(p_type), p_label, p_source_id)
  on conflict (user_id, type, source_id) where source_id is not null do nothing;
end;
$$;

-- 7) Action RPCs — each validates ownership/relationship, credits, recomputes.

create or replace function public.record_proof_trust(p_proof_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  select user_id into v_owner from public.proofs where id = p_proof_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'not your proof';
  end if;
  perform public._insert_trust(auth.uid(), 'proof', 'Submitted proof from practice', p_proof_id::text);
  perform public._recompute_profile_counts(auth.uid());
end;
$$;

create or replace function public.record_practice_trust(p_prompt_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.practice_completions where user_id = auth.uid() and prompt_id = p_prompt_id) then
    raise exception 'no completion for this practice';
  end if;
  perform public._insert_trust(auth.uid(), 'practice', 'Completed a practice', p_prompt_id::text);
  perform public._recompute_profile_counts(auth.uid());
end;
$$;

create or replace function public.record_feedback_trust(p_feedback_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_author uuid; v_recipient uuid;
begin
  select author_id, recipient_id into v_author, v_recipient from public.feedback where id = p_feedback_id;
  if v_author is null or v_author <> auth.uid() then
    raise exception 'not your feedback';
  end if;
  perform public._insert_trust(auth.uid(), 'peer-feedback', 'Gave useful feedback', p_feedback_id::text);
  perform public._recompute_profile_counts(auth.uid());      -- giver: feedback_given_count + trust
  if v_recipient is not null then
    perform public._recompute_profile_counts(v_recipient);   -- receiver: feedback_received_count
  end if;
end;
$$;

create or replace function public.mark_feedback_helpful(p_feedback_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_author uuid; v_recipient uuid;
begin
  select author_id, recipient_id into v_author, v_recipient from public.feedback where id = p_feedback_id;
  if v_recipient is null or v_recipient <> auth.uid() then
    raise exception 'only the recipient can mark feedback helpful';
  end if;
  update public.feedback set helpful = true where id = p_feedback_id;
  perform public._insert_trust(v_author, 'helpful', 'Feedback marked helpful', p_feedback_id::text);
  perform public._recompute_profile_counts(v_author);
end;
$$;

-- 8) Grants: only authenticated users may call the action RPCs; no public/anon.
revoke all on function public._trust_points(text) from public;
revoke all on function public._recompute_profile_counts(uuid) from public;
revoke all on function public._insert_trust(uuid, text, text, text) from public;
revoke all on function public.recompute_profile_counts(uuid) from public, anon;
revoke all on function public.record_proof_trust(uuid) from public, anon;
revoke all on function public.record_practice_trust(uuid) from public, anon;
revoke all on function public.record_feedback_trust(uuid) from public, anon;
revoke all on function public.mark_feedback_helpful(uuid) from public, anon;
grant execute on function public.recompute_profile_counts(uuid) to authenticated;
grant execute on function public.record_proof_trust(uuid) to authenticated;
grant execute on function public.record_practice_trust(uuid) to authenticated;
grant execute on function public.record_feedback_trust(uuid) to authenticated;
grant execute on function public.mark_feedback_helpful(uuid) to authenticated;
```

- [ ] **Step 4: Apply the migration to the live DB**

Use the Supabase MCP `apply_migration` tool: project_id `qfzguujtjloskyxcdbon`, name `023_trust_integrity`, query = the full SQL body above.
Expected: `{"success":true}`.

- [ ] **Step 5: Verify the constraint + policy + functions exist**

Run via MCP `execute_sql`:

```sql
select
  (select count(*) from pg_indexes where indexname = 'trust_events_user_type_source_uidx') as has_uidx,
  (select count(*) from pg_policies where tablename='trust_events' and policyname='trust_events_insert_denied') as has_deny_policy,
  (select count(*) from pg_proc where proname in
    ('record_proof_trust','record_practice_trust','record_feedback_trust','mark_feedback_helpful','recompute_profile_counts','_recompute_profile_counts','_trust_points','_insert_trust')) as fn_count;
```

Expected: `has_uidx=1`, `has_deny_policy=1`, `fn_count=8`.

- [ ] **Step 6: Verify `_recompute_profile_counts` matches a hand count for one demo user**

Run via MCP `execute_sql`:

```sql
with u as (select id from public.profiles where is_demo limit 1)
select
  (select proof_count from public.profiles where id = (select id from u)) as stored_before,
  (select count(*) from public.proofs where user_id = (select id from u)) as actual_proofs;
-- then recompute and re-read:
select public._recompute_profile_counts((select id from public.profiles where is_demo limit 1));
with u as (select id from public.profiles where is_demo limit 1)
select proof_count, feedback_received_count, trust_score from public.profiles where id = (select id from u);
```

Expected: after recompute, `proof_count` equals `actual_proofs`; no error raised.

- [ ] **Step 7: Commit**

```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git add supabase/migrations/023_trust_integrity.sql
git commit -m "feat(db): trust integrity RPCs + deny direct trust_events inserts (023)"
```

---

### Task 2: Rewire `betaRepository.ts` trust writes to RPCs

**Files:**
- Modify: `lib/supabase/betaRepository.ts`

**Interfaces:**
- Consumes: RPCs from Task 1 (`record_proof_trust`, `record_practice_trust`, `record_feedback_trust`, `mark_feedback_helpful`, `recompute_profile_counts`).
- Produces: unchanged exported function signatures — `persistProof`, `persistFeedback`, `persistMarkHelpful`, `recordPracticeCompletion`, plus a new exported `recomputeProfileCounts(client, userId)`. `insertTrust` and `refreshProfileStats` are removed.

- [ ] **Step 1: Remove `insertTrust` and replace `refreshProfileStats` with an RPC wrapper**

In `lib/supabase/betaRepository.ts`, delete the `insertTrust` function entirely. Replace the whole `refreshProfileStats` function with:

```ts
/**
 * Recompute a user's profile counters + trust_score from source tables, server-side.
 * Thin wrapper over the SECURITY DEFINER RPC (counters are owned by the DB now).
 * Use for admin/manual repair; the action RPCs already recompute affected users.
 */
export async function recomputeProfileCounts(client: SupabaseClient, userId: string): Promise<void> {
  await client.rpc("recompute_profile_counts", { p_uid: userId });
}
```

- [ ] **Step 2: Rewire `recordPracticeCompletion`**

Replace its body with:

```ts
export async function recordPracticeCompletion(
  client: SupabaseClient,
  userId: string,
  promptId: string,
  label: string,
) {
  void label; // label is now stamped server-side by the RPC
  await client
    .from("practice_completions")
    .upsert({ user_id: userId, prompt_id: promptId }, { onConflict: "user_id,prompt_id" });
  await client.rpc("record_practice_trust", { p_prompt_id: promptId });
}
```

- [ ] **Step 3: Rewire `persistProof` trust tail**

In `persistProof`, replace the final two lines (the `insertTrust(...)` + `refreshProfileStats(...)` calls) with:

```ts
  await client.rpc("record_proof_trust", { p_proof_id: proof.id });
```

Leave the proof-row insert (with `if (proofError) throw`) and the best-effort attachment block exactly as they are.

- [ ] **Step 4: Rewire `persistFeedback`**

Replace its body with:

```ts
export async function persistFeedback(client: SupabaseClient, feedback: Feedback): Promise<void> {
  await client.from("feedback").insert({
    id: feedback.id,
    proof_id: feedback.proofId,
    author_id: feedback.authorId,
    recipient_id: feedback.recipientId,
    body: feedback.body,
    tone: feedback.tone,
    helpful: false,
    clarity_note: feedback.clarityNote ?? null,
    useful_note: feedback.usefulNote ?? null,
    next_step_note: feedback.nextStepNote ?? null,
  });
  await client.from("proofs").update({ status: "feedback-ready" }).eq("id", feedback.proofId);
  await client.rpc("record_feedback_trust", { p_feedback_id: feedback.id });
}
```

- [ ] **Step 5: Rewire `persistMarkHelpful`**

Replace its body with:

```ts
export async function persistMarkHelpful(
  client: SupabaseClient,
  feedbackId: string,
  authorId: string,
): Promise<void> {
  void authorId; // the RPC derives + credits the author server-side
  await client.rpc("mark_feedback_helpful", { p_feedback_id: feedbackId });
}
```

- [ ] **Step 6: Fix any now-dangling references to removed symbols**

Run:

```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
grep -rn "insertTrust\|refreshProfileStats" lib components app
```

Expected: zero matches in `lib/`, `components/`, `app/`. (If `refreshProfileStats` was imported anywhere, replace that import/use with `recomputeProfileCounts`.) The `makeTrustEvent` import in `betaRepository.ts` may now be unused — if so, remove it from the import list to keep typecheck clean.

- [ ] **Step 7: Typecheck**

Run:

```bash
npm run typecheck
```

Expected: no errors (exits clean).

- [ ] **Step 8: Commit**

```bash
git add lib/supabase/betaRepository.ts
git commit -m "feat: route trust writes through SECURITY DEFINER RPCs"
```

---

### Task 3: Verify end-to-end (build, security advisor, lock-down proof)

**Files:** none (verification only).

- [ ] **Step 1: Confirm direct client trust insert is now denied**

Run via MCP `execute_sql` (runs as the privileged MCP connection, so simulate the authenticated path by checking the policy rather than bypassing it). Confirm the policy body:

```sql
select policyname, cmd, with_check
from pg_policies
where tablename = 'trust_events';
```

Expected: a row `trust_events_insert_denied | INSERT | false` and `trust_events_read_own | SELECT | ...`. No INSERT policy with `with_check = true` remains.

- [ ] **Step 2: Confirm idempotency of the constraint with a dry insert pair**

Run via MCP `execute_sql` (service role bypasses RLS, so this tests the unique index, not the policy):

```sql
-- pick a real demo user + proof to avoid FK issues
with d as (select user_id, id as proof_id from public.proofs where is_demo limit 1)
insert into public.trust_events (user_id, type, points, label, source_id)
select user_id, 'proof', 5, 'idempotency test', proof_id::text from d
on conflict (user_id, type, source_id) where source_id is not null do nothing;
-- second identical insert should also no-op:
with d as (select user_id, id as proof_id from public.proofs where is_demo limit 1)
insert into public.trust_events (user_id, type, points, label, source_id)
select user_id, 'proof', 5, 'idempotency test', proof_id::text from d
on conflict (user_id, type, source_id) where source_id is not null do nothing;
-- count must be exactly 1:
with d as (select user_id, id as proof_id from public.proofs where is_demo limit 1)
select count(*) as rows_for_pair from public.trust_events t, d
where t.user_id = d.user_id and t.type='proof' and t.source_id = d.proof_id::text;
```

Expected: `rows_for_pair = 1`. Then clean up the test row:

```sql
delete from public.trust_events where label = 'idempotency test';
```

Expected: removes the test row(s) only.

- [ ] **Step 2b: Recompute the touched demo user so counters reflect the cleanup**

```sql
select public._recompute_profile_counts((select user_id from public.proofs where is_demo limit 1));
```

Expected: no error (keeps that demo user's counters drift-free after the test insert/delete).

- [ ] **Step 3: Production build**

Run:

```bash
npm run build
```

Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Re-run the security advisor**

Use the Supabase MCP `get_advisors` tool: project_id `qfzguujtjloskyxcdbon`, type `security`.
Expected: the previous `rls_policy_always_true` warning naming `trust_events_insert_authenticated` is GONE. (Pre-existing warnings about the public storage bucket, the `notify_*` SECURITY DEFINER functions, and `beta_invites` rls-no-policy are unchanged and out of scope.)

- [ ] **Step 5: Manual QA note (cannot be automated here)**

Add a line to the manual checklist in `docs/BETA_QA.md` under "Known limitations" or the QA list:

```
- [ ] Trust integrity: as a signed-in member, confirm proof/practice/feedback/
      mark-helpful each add exactly one trust event; confirm a feedback recipient's
      feedback_received_count updates without them re-submitting; confirm a direct
      `supabase.from('trust_events').insert(...)` from the browser console is rejected.
```

Run:

```bash
grep -n "Trust integrity" docs/BETA_QA.md
```

Expected: the new line is present.

- [ ] **Step 6: Commit**

```bash
git add docs/BETA_QA.md
git commit -m "docs: trust integrity manual QA check"
```

---

## Self-Review

**1. Spec coverage:**
- Proof/feedback ids are valid uuids that match the persisted DB row (prereq for trust RPCs) → Task 0. ✓
- De-dupe + unique constraint (I1) → Task 1 Steps 2–3, verified Task 3 Step 2. ✓
- Lock-down `with check (false)` (L1) → Task 1 Step 3 §3, verified Task 3 Step 1. ✓
- `_trust_points` server-side mapping, values unchanged → Task 1 §4. ✓
- `_recompute_profile_counts` (R1) → Task 1 §5, verified Task 1 Step 6. ✓
- `record_proof_trust` / `record_practice_trust` / `record_feedback_trust` (recompute author + recipient) / `mark_feedback_helpful` (credit author) (S1) → Task 1 §7. ✓
- Grants to authenticated only → Task 1 §8. ✓
- Client wiring swaps insertTrust/refreshProfileStats for rpc, rows stay client-side → Task 2. ✓
- typecheck + build + advisor → Task 2 Step 7, Task 3 Steps 3–4. ✓
- Deferred (point retune, unified submit, contribution RPC) → not in plan, correct. ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to". All SQL and TS shown in full. ✓

**3. Type consistency:** RPC names + params identical across Task 1 (definitions) and Task 2 (calls): `record_proof_trust(p_proof_id)`, `record_practice_trust(p_prompt_id)`, `record_feedback_trust(p_feedback_id)`, `mark_feedback_helpful(p_feedback_id)`, `recompute_profile_counts(p_uid)`. Client wrapper `recomputeProfileCounts(client, userId)` ✓. `_recompute_profile_counts` is internal; `record_feedback_trust` recomputes both author and recipient (matches spec fix). ✓
