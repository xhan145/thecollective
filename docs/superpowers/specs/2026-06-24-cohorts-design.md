# Cohorts — focused practice groups (design)

Date: 2026-06-24
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind + Supabase)

## Problem

"Cohorts" today is a single hardcoded tag (`profiles.cohort_id default 'founding-circle'`) —
no groups feature. The Phase 2 dossier wants real cohorts (public/private/invite). In *this*
product (level-matched knowledge transfer, anti-clout, "Warm Proof-Based Growth" Gen-Z theme),
a cohort should be a **focused practice community around a shared interest/direction** where the
feed + level-matching + tips you've built run **scoped to the group** — giving people "their
people for this practice" without becoming a follower graph or leaderboard.

This is the first of two decomposed specs ("cohorts + contributor roles"); **contributor roles
(Practitioner→Steward) are a separate later spec** that layers on Trust V2.

## Decisions (locked during brainstorm)

- **Cohort = focused practice group** around a shared interest/direction (A). Three visibility
  types: **public** (anyone joins), **request** (owner approves), **invite** (private, code).
- **Per-cohort feed, membership-based, multi-join** (A): a member belongs to many cohorts; each
  cohort page shows the ranked feed of its members' proofs (reusing `rankFeed`). The **global feed
  is unchanged**. No per-proof tagging.
- **Creation gated to Reliable+** (`levelRank ≥ 2`); roles = **owner + member** only (owner is a
  responsibility, not a clout badge).
- **Discovery:** a dedicated `/cohorts` surface, **interest-first**; invite-only cohorts unlisted.
- All membership/role writes via **SECURITY-DEFINER RPCs** (no client forgery).
- **Founding-circle migration:** seed a real `founding-circle` public cohort + backfill all
  members; nothing breaks.
- Theme: **Warm Proof-Based Growth** — calm core (80%) + light expressive cohort identity (15%)
  + sparing milestone stamps (5%). **No member-count-as-status, no member leaderboard.**

## Data model — migration `030_cohorts.sql` (additive; after 029)

- **`cohorts`**: `id uuid pk`, `name text not null`, `description text`, `direction_id text`
  (interest anchor, nullable), `visibility text not null check (visibility in ('public','request','invite'))`,
  `accent text` (warm palette key for the banner gradient; nullable), `owner_id uuid references profiles(id) on delete set null`,
  `is_demo boolean not null default false`, `demo_cohort text`, `demo_seed_id text`, `created_at timestamptz not null default now()`.
- **`cohort_members`**: `id uuid pk`, `cohort_id uuid not null references cohorts(id) on delete cascade`,
  `user_id uuid not null references profiles(id) on delete cascade`, `role text not null check (role in ('owner','member')) default 'member'`,
  `joined_at timestamptz not null default now()`, `unique(cohort_id, user_id)`. Indexes `(cohort_id)`, `(user_id)`.
- **`cohort_join_requests`**: `id uuid pk`, `cohort_id`, `user_id`, `status text not null check (status in ('pending','approved','declined')) default 'pending'`,
  `created_at`, `unique(cohort_id, user_id)`.
- **`cohort_invites`**: `id uuid pk`, `cohort_id`, `code text not null unique`, `created_by uuid`, `created_at` (mirrors `beta_invites`).

## RLS + RPCs (server-enforced)

- **RLS reads:** `cohorts` — public/request rows readable by any authenticated; invite rows readable
  only by their members. `cohort_members` — readable by members of that cohort. `cohort_join_requests`
  — readable by the requester or the cohort owner. `cohort_invites` — owner only. **All inserts/updates
  to these tables denied to clients** (`with check (false)` / no policy); only the RPCs (definer) + service role write.
- **Action RPCs (SECURITY DEFINER; granted to `authenticated`; helpers revoked from public/anon/authenticated):**
  - `create_cohort(p_name text, p_description text, p_direction_id text, p_visibility text, p_accent text) returns uuid`
    — raises unless `levelRank(caller) >= 2` (Reliable; computed from `profiles.trust_score` via the tier function);
    inserts the cohort + an `owner` `cohort_members` row; returns the cohort id.
  - `join_cohort(p_cohort_id uuid)` — only for `public` cohorts; inserts a `member` row (idempotent on the unique).
  - `request_join(p_cohort_id uuid)` — only for `request` cohorts; upserts a `pending` request; notifies the owner.
  - `approve_request(p_request_id uuid)` / `decline_request(p_request_id uuid)` — owner-only; approve adds a `member` row + notifies the requester.
  - `redeem_cohort_invite(p_code text)` — resolves the code → adds a `member` row to that cohort.
  - `leave_cohort(p_cohort_id uuid)` — removes the caller's membership (an owner cannot leave their own cohort without transfer — v1: owner leave is blocked with a calm error).
  - `remove_member(p_cohort_id uuid, p_user_id uuid)` — owner-only; removes a member (not the owner).
- `levelRank`/`trustLevelForPoints` already exist (Trust V2). The gate uses the same tier thresholds.

## Scoped feed (reuses shipped feed)

- A cohort page loads proofs whose author is in `cohort_members(cohort_id)` and runs
  `rankFeed(viewer, those proofs, authorsById, usefulCountByProof)` — same level-matching,
  relationship chips, and useful/learn-from/feedback actions. The `held=false`/quarantine filter
  still applies (a cohort never surfaces held content). Global feed untouched; proof posting unchanged.

## Provider / repository

- `lib/cohorts/types.ts`: `Cohort`, `CohortMember`, `CohortJoinRequest`, `CohortInvite`, `CohortVisibility`, `CohortRole`.
- `lib/cohorts/access.ts` (pure): `canCreateCohort(profile) = levelRank(profile) >= 2`.
- `lib/supabase/cohortsRepository.ts`: mappers; reads `listCohorts({ directionIds })`, `getCohort(id)`,
  `listMembers(cohortId)`, `listMyCohorts(userId)`, `listOwnerRequests(cohortId)`, `listCohortProofs(cohortId)`;
  RPC callers `createCohort`, `joinCohort`, `requestJoin`, `approveRequest`, `declineRequest`,
  `redeemCohortInvite`, `leaveCohort`, `removeMember`.
- Provider: a light `myCohorts: Cohort[]` in the snapshot (for the switcher) + on-demand
  `loadCohort(id)` / `getCohortFeed(id)` (mirrors the `loadTips` load-on-demand pattern; no global-snapshot bloat).
- `AppShell.tsx`: add `/cohorts` to `protectedPrefixes`.

## UI (Warm Proof-Based Growth)

- `/cohorts` — **browse** (interest-first: your-directions cohorts, then other public/request; no member
  counts) + **"Your cohorts"** switcher + a **Create** button (shown only when `canCreateCohort`, enforced server-side).
- `/cohorts/new` — calm create form (name, description, direction, visibility, accent picker).
- `/cohorts/[id]` — cohort page: soft **accent banner** + description (15% expressive), the **scoped
  feed** + **member proof gallery**, join/leave control (by visibility), and for the owner a **requests
  inbox** (approve/decline, reusing notifications) + member management (remove). A sparing collective
  **milestone stamp** (5%). Beginner-safe copy; no counts/leaderboard.

## Founding-circle migration

In `030`: insert a `cohorts` row `founding-circle` (public, owner = an existing admin/founder profile or
`null`), then backfill `cohort_members` from every `profiles` row's current `cohort_id='founding-circle'`
(role `member`; the founder/admin row gets `owner` if owner is null). Legacy `profiles.cohort_id` stays
(harmless). Demo: seed 1–2 `is_demo=true` cohorts with demo members so the demo path shows populated cohorts.

## Testing & verification

- Pure (`npx tsx scripts/check-cohorts.ts`): `canCreateCohort` band (rank 1 false, rank 2 true); the
  membership-scoped feed filter (only members' proofs enter the cohort feed; held excluded).
- SQL (MCP, post-apply): a non-Reliable caller `create_cohort` raises; a non-owner `approve_request`/
  `remove_member` raises; `redeem_cohort_invite` adds membership; a client cannot directly insert into
  `cohort_members` or set `role='owner'` (RLS denies; RPC-only). `get_advisors(security)` clean.
- `npm run typecheck` + `npm run build` green; preview: browse → create gated → join (each visibility) →
  scoped feed renders, light + dark.

## Acceptance criteria

1. Reliable+ members can create public/request/invite cohorts; non-Reliable cannot (server-enforced).
2. Members join per visibility: public instant, request → owner approval, invite → code. Multi-join supported.
3. Each cohort page shows a level-matched feed scoped to its members (held content excluded) + calm
   expressive identity (accent banner, proof gallery).
4. Owner moderates: approve/decline requests, remove members; owner/member are the only roles; no role/membership forgery from clients.
5. Founding-circle backfilled (all existing members auto-joined); nothing breaks; global feed unchanged.
6. No member-count-as-status, no leaderboard; beginner-safe copy; migration additive (010–029 untouched);
   pure + typecheck + build green; advisors clean.

## Build slices (for the plan)

1. **DB** — migration 030 (tables + RLS + action RPCs + founding-circle backfill + demo seed) applied via
   MCP; `lib/cohorts/types.ts` + `lib/cohorts/access.ts` (`canCreateCohort`) + `scripts/check-cohorts.ts`.
2. **Repo + provider** — `cohortsRepository` + `myCohorts` snapshot + `loadCohort`/`getCohortFeed`.
3. **UI** — `/cohorts` browse + your-cohorts + create (gated), `/cohorts/[id]` cohort page (scoped feed,
   members, join/owner controls, requests inbox, theme touches); docs + final verify.

## Scope — out (own follow-ups)

- Contributor roles (Practitioner→Steward) — the separate decomposed spec.
- Guide / co-moderator roles inside a cohort.
- Cohort chat/messaging, cohort-authored practices/content, sub-cohorts, cohort search (browse-by-direction only v1).
- Owner transfer (v1 blocks owner leave instead).

## Known limitations / next

- Cohort feed is membership-based; a member in many cohorts shares progress with all (intended).
- Invite codes are a controlled gate, not high-security secrets (same posture as `beta_invites`).
- Milestone stamps are cosmetic/collective only; not tied to trust or surfaced as ranking.
