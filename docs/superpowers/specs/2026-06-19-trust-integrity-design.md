# Phase A — Server-Side Trust Integrity (design)

Date: 2026-06-19
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js + Supabase, live project `qfzguujtjloskyxcdbon`)

## Problem

Two flaws in the current trust system:

1. **Trust is mintable.** The RLS policy `trust_events_insert_authenticated` is
   `with check (true)`, so any authenticated user can insert any `trust_events`
   row — any `user_id`, any `points`, any `type` — directly from the browser
   console. This breaks the product's core promise of "trust is earned, not
   paid."
2. **Cross-user counters go stale.** `profiles_update_own` lets a user update
   only their own profile row. So `refreshProfileStats` only ever refreshes the
   *acting* user. When A gives feedback to B, B's `feedback_received_count` (and
   any cross-user trust like "helpful") does not update until B reloads — and
   "helpful" credit, which belongs to the feedback *author* but is triggered by
   the *recipient*, can't be written correctly under RLS at all.

## Goal & boundary

Make trust **earned, not mintable**, and make affected counters **instant and
drift-free**, **without** moving proof/feedback row writes off their existing
safe own-row RLS. After this phase, the only way a `trust_events` row or a
profile counter changes is through a validated, server-authoritative function.

## Decisions (locked during brainstorming)

- **Mechanism (M1 + M3):** narrow `SECURITY DEFINER` Postgres RPCs own trust
  events + counter refresh. Proof/feedback/completion **rows stay client-side**
  under existing own-row RLS (already safe). Smallest diff that closes the holes.
- **Lock-down (L1):** deny all direct client inserts to `trust_events`
  (`with check (false)`). Only SECURITY DEFINER functions (run as owner) and the
  service role can write trust. This is the only option that closes
  "mint your own trust."
- **Counter refresh (R1):** recompute from source tables (drift-free,
  self-healing) — the existing `refreshProfileStats` logic moved server-side and
  applied to **every affected user**.
- **Idempotency (I1):** `unique (user_id, type, source_id)` on `trust_events`;
  RPCs insert `on conflict do nothing`. One credit per action per source.
- **RPC surface (S1):** a few small purpose-specific RPCs sharing one private
  recompute helper, rather than one generic branching function.

## Database — `supabase/migrations/023_trust_integrity.sql` (additive)

Does not edit applied migrations 010–022.

1. **De-dupe** existing `trust_events` on `(user_id, type, source_id)`, keeping
   the earliest row per group (so the new unique constraint can be created
   cleanly over demo/seed data).
2. **Unique constraint:** add `unique (user_id, type, source_id)` to
   `trust_events`. (Confirm `source_id` type during implementation — real
   `prompt_id`/`proof_id`/`feedback_id` are uuids; the constraint treats
   `source_id` as-is. All four credited flows always set `source_id`.)
3. **Lock down (L1):** drop and recreate the insert policy as
   `with check (false)` for `authenticated`. Keep `trust_events_read_own`.
4. **Functions** — all `SECURITY DEFINER`, `set search_path = public, pg_temp`,
   `execute` granted to `authenticated` (revoked from `anon`/`public`):
   - `_trust_points(p_type text) returns int` — single source of point values:
     `proof` 5, `practice` 5, `peer-feedback` 3, `helpful` 7 (unchanged from
     today's `TRUST_POINTS`).
   - `_recompute_profile_counts(p_uid uuid)` — recount `proofs`,
     `feedback` (given via `author_id`, received via `recipient_id`),
     `practice_completions`, and `sum(trust_events.points)`; overwrite the
     profile counter columns + `trust_score` + `updated_at`.
   - `record_proof_trust(p_proof_id uuid)` — require a `proofs` row with
     `id = p_proof_id and user_id = auth.uid()`; insert `('proof')` trust for the
     caller `on conflict do nothing`; recompute caller.
   - `record_practice_trust(p_prompt_id uuid)` — require a `practice_completions`
     row for `(auth.uid(), p_prompt_id)`; insert `('practice')`; recompute caller.
   - `record_feedback_trust(p_feedback_id uuid)` — require a `feedback` row with
     `id = p_feedback_id and author_id = auth.uid()`; insert `('peer-feedback')`
     for the caller; recompute **both** the caller (author) **and** the
     `recipient_id` (whose `feedback_received_count` just changed). This is the
     cross-user staleness fix for the receive side.
   - `mark_feedback_helpful(p_feedback_id uuid)` — require a `feedback` row with
     `id = p_feedback_id and recipient_id = auth.uid()`; set `helpful = true`;
     insert `('helpful')` trust for the **author**; recompute the **author**.
     (The cross-user case that requires SECURITY DEFINER.)
   - Each function raises a clear exception on a failed validation check.

## Client wiring — `lib/supabase/betaRepository.ts`

Row inserts are unchanged (own-row RLS). Only the trust writes move to RPCs:

- `persistProof`: after inserting the proof row (+ best-effort attachment), call
  `rpc('record_proof_trust', { p_proof_id })` instead of
  `insertTrust` + `refreshProfileStats`.
- `recordPracticeCompletion`: upsert the completion (client), then
  `rpc('record_practice_trust', { p_prompt_id })`.
- `persistFeedback`: insert the feedback row + update proof status (client),
  then `rpc('record_feedback_trust', { p_feedback_id })`.
- `persistMarkHelpful`: replace the client `feedback.update` + `insertTrust` with
  a single `rpc('mark_feedback_helpful', { p_feedback_id })`.
- Remove the now-unused `insertTrust`; drop `refreshProfileStats` (the RPC owns
  recompute). Keep a thin `recomputeProfileCounts(uid)` wrapper over the RPC for
  admin/manual repair.

The provider's optimistic-update pattern is unchanged: the actor still sees an
instant local trust/counter bump; only the authoritative write changes to an RPC.

## Data flow & error handling

1. User acts → optimistic local snapshot update (instant, actor's view only).
2. Client inserts the row (proof/feedback/completion) under existing RLS.
3. Client calls the matching RPC → DB validates ownership/relationship, stamps
   points from `_trust_points`, inserts trust `on conflict do nothing`,
   recomputes every affected user — atomically in one transaction.
4. RPC failure → caught and logged, non-blocking (the row + the user's text are
   already saved); counters self-heal on the next authoritative load.
5. The feedback **recipient** now has correct server-side counters immediately,
   so their next load reflects reality. We do not push into another user's live
   session; reconciliation-on-next-load is the documented behavior.

## Testing & verification

- **DB (via MCP):** apply migration; assert the unique constraint exists and the
  insert policy is `false`; confirm a direct `insert into trust_events` as an
  authenticated role is rejected while the RPC path succeeds; confirm
  `mark_feedback_helpful` credits the author (not the caller) and is idempotent;
  smoke-test `_recompute_profile_counts` against hand-counted source rows.
- **App:** `npm run typecheck` + `npm run build`; confirm proof/feedback/
  practice/helpful flows still update the actor's UI in the preview.
- **Security advisor:** re-run; confirm the permissive-policy warning on
  `trust_events` is gone.
- **Limitation:** fully exercising `auth.uid()` inside the RPCs needs a real
  signed-in JWT, which can't be forged headlessly here — so the end-to-end
  "recipient counter updates instantly" check goes in the manual QA checklist.

## Out of scope (deferred)

- Changing trust point *values* (preserved deliberately; a separate tuning pass).
- A unified `submit_proof_with_trust` that also inserts the row (rows stay
  client-side per M3).
- `record_contribution_trust(...)` — lands with Phase B (Contribute), reusing
  `_recompute_profile_counts` and the same RPC shape.

## Acceptance criteria

1. A direct browser `insert into trust_events` by an authenticated user fails.
2. Each RPC rejects callers who don't own / aren't party to the source row.
3. Submitting proof, completing practice, giving feedback, and marking feedback
   helpful all write exactly one trust row each (idempotent) with server-stamped
   points.
4. `mark_feedback_helpful` credits the feedback author and updates the author's
   counters server-side.
5. Counters always equal a fresh recount of source tables (no drift).
6. `typecheck` + `build` green; security advisor no longer flags the trust insert
   policy; migrations 010–022 untouched; migration 023 is additive + idempotent.
