# Phase B — Contribute (design)

Date: 2026-06-20
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js + Supabase, live project `qfzguujtjloskyxcdbon`)
Depends on: Phase A — Server-Side Trust Integrity (trust RPC path + `_recompute_profile_counts`)

## Problem / goal

"Contribute" is the final stage of the Collective loop (Discover → Practice →
Prove → Get Feedback → Build Trust → **Contribute**) but it does not exist in the
beta app: the `/contribute` page is a leftover v8 prototype (legacy shell, mock
data), and the highest-value trust event `accepted-contribution` (+15) plus
`profiles.contribution_count` exist in the schema yet are never emitted by any
code. Phase B makes Contribute a real, discoverable stage where a member who has
been through the loop helps another member on an open proof, and the proof owner
**accepts** the help — earning the contributor trust through Phase A's
server-authoritative path.

## Decisions (locked during brainstorming)

- **C1 — Contribution = accepted help on an open request.** Distinct from
  feedback (+3) / helpful (+7); validated by the requester accepting it (+15).
- **M1 — Open requests are anchored to a proof.** Owner marks a proof "open for
  contributions" with a focus; contributors respond on that proof; owner accepts.
- **G1 — Light earned eligibility to contribute:** has submitted ≥1 proof AND
  given ≥1 feedback. Receiving contributions has no gate.

## Data model — migration `024_contributions.sql` (additive; after 023)

Does not edit applied migrations 010–023. Idempotent / safe to re-run.

1. `proofs`: add `open_for_contributions boolean not null default false` and
   `contribution_focus text`. The open flag is cohort-readable (powers the
   queue); only the owner may flip it (existing `proofs_update_own` covers this).
2. New `public.contributions`:
   - `id uuid pk default gen_random_uuid()`
   - `proof_id uuid not null references proofs(id) on delete cascade`
   - `contributor_id uuid not null references profiles(id) on delete cascade`
   - `owner_id uuid not null references profiles(id) on delete cascade`
   - `observation text not null`, `next_step text not null`
   - `status text not null default 'pending' check (status in ('pending','accepted'))`
   - `created_at timestamptz default now()`, `accepted_at timestamptz`
   - `is_demo boolean default false`, `demo_seed_id text` (+ partial unique index
     on `demo_seed_id where demo_seed_id is not null` for idempotent seeding)
   - `unique (proof_id, contributor_id)` — one contribution per person per proof
   - `check (contributor_id <> owner_id)` — no contributing to your own proof
   - Indexes: `(proof_id)`, `(contributor_id)`, `(owner_id)`.
3. RLS (enable; mirror existing policy style):
   - **no client INSERT policy** — submission is RPC-only (`submit_contribution`),
     so the G1 eligibility gate is enforced server-side, not just in the UI.
   - select: `auth.uid() = contributor_id OR auth.uid() = owner_id`.
   - **no client UPDATE policy** — acceptance is RPC-only (no client-set status).
   - Open-proof discovery uses `proofs.open_for_contributions` (cohort-readable),
     not the contributions table, so the queue needs no broad contributions read.
   - (Service role bypasses RLS for demo seeding.)

## Trust + counters (extends Phase A; in migration 024)

- `record_contribution_trust(p_contribution_id uuid)` — SECURITY DEFINER,
  `set search_path = public, pg_temp`, EXECUTE granted to `authenticated` only:
  - load the contribution; require it exists, `status = 'pending'`, and its
    `owner_id = auth.uid()` (only the proof owner accepts); else raise.
  - `update contributions set status='accepted', accepted_at=now()`.
  - `_insert_trust(contributor_id, 'accepted-contribution', 'Contribution accepted', p_contribution_id::text)`
    (idempotent via the Phase-A unique index on `trust_events`).
  - `_recompute_profile_counts(contributor_id)`.
- Extend `_recompute_profile_counts(p_uid)` (replace in 024, additive) to also set
  `contribution_count = (select count(*) from contributions where contributor_id = p_uid and status='accepted')`.
- `submit_contribution(p_proof_id uuid, p_observation text, p_next_step text)` —
  SECURITY DEFINER, search_path pinned, EXECUTE to `authenticated` only. Enforces
  the **G1 gate server-side** and the submission rules:
  - caller is eligible: `proof_count >= 1 AND feedback_given_count >= 1` (read from
    the caller's profile counters, which Phase A keeps drift-free).
  - the target proof exists, `open_for_contributions = true`, and is **not** owned
    by the caller.
  - no existing contribution by this caller on this proof (the unique constraint
    also backstops this).
  - insert a `pending` row with `contributor_id = auth.uid()`, `owner_id =`
    the proof's `user_id`; return the new id. (The insert fires the owner
    notification trigger.)
- The accept RPC stays purely owner-validated. Phase-A internal helpers
  (`_insert_trust`, `_recompute_profile_counts`, `_trust_points`) remain revoked
  from clients and are called only from within these SECURITY DEFINER functions.

## Notifications (reuse migration-020 SECURITY DEFINER fan-out)

- Trigger `notify_on_contribution` (AFTER INSERT on contributions): insert a
  notification for the proof **owner** ("New contribution on your proof").
- The accept RPC inserts the **contributor's** notification ("Your contribution
  was accepted") — a cross-user write, safe because the RPC is owner-validated.
- Both use the existing `notifications` table + realtime bell; no new client wiring.

## App wiring

- `lib/betaTypes.ts`: `Contribution` type; `BetaAppSnapshot.contributions`;
  `BetaUserBundle.contributions`; extend `Proof` with `openForContributions?`,
  `contributionFocus?`.
- `lib/supabase/betaRepository.ts`:
  - `loadUserBundle`: load contributions where `contributor_id = me OR owner_id = me`;
    map `proofs.open_for_contributions` / `contribution_focus`.
  - `submitContribution(client, { proofId, observation, nextStep })` —
    `rpc('submit_contribution', { p_proof_id, p_observation, p_next_step })`
    (owner_id + eligibility resolved server-side).
  - `acceptContribution(client, contributionId)` — `rpc('record_contribution_trust', { p_contribution_id })`.
  - `setProofOpen(client, proofId, open, focus)` — update the two proof columns.
- `components/beta/AppStateProvider.tsx`: optimistic `submitContribution`,
  `acceptContribution`, `toggleProofOpen`; selectors `getOpenProofs()` (open,
  not mine), `getContributionsForProof(proofId)`, `isEligibleToContribute()`
  (proofCount ≥ 1 && feedbackGivenCount ≥ 1); new `BetaEventType`s
  `contribution_submitted`, `contribution_accepted`; logged non-blocking.

## UI (no bottom-nav redesign; preserve warm/gold brand)

- **Replace** `app/contribute/page.tsx` (legacy v8) with a beta `AppShell`
  **Contribute queue**: lists open cohort proofs (excluding own) with owner +
  focus + a Contribute action; entry links from Home (a card) and Profile.
- **Contribution composer** (`observation` + `next_step`, bounded, beginner-safe,
  no rating). If not eligible (G1): calm locked copy — "Contributing unlocks
  after your first proof and your first feedback."
- **`/proof/[id]` role-aware additions:**
  - owner: "Open for contributions" toggle + focus field; list of received
    contributions, each with an **Accept** button (accepted ones show a calm
    "Accepted" state).
  - eligible non-owner, proof open, not already contributed: the composer.
- Copy: "Contribute", "Open for contributions", "Accepted", "Your contribution
  was accepted." No likes/followers/leaderboards/clout.

## Demo seeding (light, demo-tagged; additive to scripts/seed-demo-data.ts + shared)

- Mark a handful of demo proofs `open_for_contributions=true` with a focus.
- Insert a few demo `contributions` (mostly pending, some accepted) via
  `demo_seed_id` upserts, so the queue and the accepted state are visible in demo
  mode. No fake trust beyond what an accepted contribution legitimately implies.

## Error / empty states

- Empty queue: "No open requests right now. Check back soon."
- Submit failure: "We couldn't send your contribution yet — your text is still
  here, try again." (text preserved, same pattern as proof submit).
- Accept is best-effort on the trust tail: the status flip is authoritative; a
  trust hiccup self-heals via recompute (mirrors Phase A M1 handling).

## Testing & verification

- Migration via MCP: assert `contributions` table + constraints + RLS exist
  (no client insert/update policies); `submit_contribution` rejects an ineligible
  caller / a closed proof / the owner / a duplicate, and inserts pending otherwise;
  `record_contribution_trust` rejects a non-owner, accepts as owner, is
  idempotent, awards the contributor `accepted-contribution`, and
  `_recompute_profile_counts` now sets `contribution_count`.
- Security advisor: helpers stay revoked; `record_contribution_trust` +
  `notify_on_contribution` have pinned search_path; the new RPC being
  authenticated-executable is by design (same as Phase A action RPCs).
- `npm run typecheck` + `npm run build`.
- Visual (demo mode): Contribute queue renders, composer gates by G1, owner
  accept flow works, light + dark, no broken states.
- Live signed-in E2E (real JWT) recorded in the manual QA checklist — can't be
  forged headlessly.

## Out of scope (deferred)

- Standalone (non-proof) help requests / Q&A board (rejected M2).
- Trust-level gate beyond G1 (rejected G2).
- Contribution editing/withdrawal, threaded discussion on a contribution.
- Reputation surfaces, contributor leaderboards (anti-clout — never).

## Acceptance criteria

1. An owner can mark a proof open for contributions with a focus.
2. An eligible member (G1) can submit exactly one contribution per open proof;
   the gate is enforced server-side (`submit_contribution` rejects ineligible
   callers, closed proofs, own proofs, and duplicates); non-eligible members also
   see a calm locked state in the UI; own proofs are excluded.
3. Only the proof owner can accept; accepting awards the contributor exactly one
   `accepted-contribution` (+15) and bumps their `contribution_count`.
4. No client can set a contribution to `accepted` directly (RPC-only); no
   client-minted trust (Phase A invariant preserved).
5. Owner is notified of new contributions; contributor is notified on accept.
6. Contribute queue + composer + accept render correctly in light and dark.
7. Migrations 010–023 untouched; 024 additive + idempotent; `typecheck` + `build`
   green; security advisor clean of new problems.
