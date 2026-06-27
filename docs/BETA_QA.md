# Closed Beta Readiness — Setup, QA & Limitations

This is the single reference for running Collective with 10–25 real closed-beta
testers on live Supabase. Additive to migrations 010–021; the new migration is
`022_beta_access.sql`.

## 1. Required environment variables

```
# Core
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...            # server-only, NEVER NEXT_PUBLIC
NEXT_PUBLIC_APP_URL=https://your-domain

# Closed beta access
NEXT_PUBLIC_REQUIRE_INVITE_CODE=false    # true = invite gate on
BETA_INVITE_ADMIN_SECRET=                # server-only (reserved)
ADMIN_EMAILS=you@example.com,teammate@example.com   # server-only, /admin/beta access

# Demo content (turn OFF when going live to real testers if you want an empty app)
NEXT_PUBLIC_DEMO_SEED=true
NEXT_PUBLIC_INCLUDE_DEMO_CONTENT=true
```

> Do not paste env values with a BOM (PowerShell `Out-File` adds one). Use UTF-8
> without BOM, or the first variable (`NEXT_PUBLIC_SUPABASE_URL`) is read as
> undefined and the app falls back to "backend not configured".

## 2. Migration order (apply in the Supabase SQL editor or CLI)

1. `010_collective_beta_schema.sql`
2. `011_collective_beta_rls.sql`
3. `012_collective_beta_storage.sql`
4. `013_directions_practices.sql`
5. `014_profile_extras.sql`
6. `015_feedback_and_appfeedback.sql`
7. `016`–`021` (demo metadata, practices, engagement, notifications, AI lab)
8. `022_beta_access.sql`  ← this pass (beta_invites, profile beta flags, beta_events)

Each migration is idempotent (`if not exists` / `drop policy if exists`). Safe to re-run.

## 3. Invite code setup

The gate is controlled by `NEXT_PUBLIC_REQUIRE_INVITE_CODE`.

- **false (default):** signup works normally, no code required. Good for dev.
- **true:** signup requires a valid code; protected routes require `beta_access`.

Create codes (service role, server-side):

```
# random 1-use code
npm run beta:invite

# options
npm run beta:invite -- --code BETA-FRIENDS --max-uses 10 --email tester@x.com \
  --expires 2026-12-31 --notes "first wave"
```

Or via SQL:

```sql
insert into public.beta_invites (code, max_uses, notes)
values ('BETA-FRIENDS', 10, 'first wave');
```

A code is valid when: it exists, `status='active'`, not expired, `use_count < max_uses`,
and (if `email` is set) it matches the signing-up user's email. On redemption the
server route increments `use_count`, flips `status` to `used` at the cap, and sets
`profiles.beta_access=true / invite_code / beta_joined_at`.

## 4. Admin dashboard

Route: **`/admin/beta`**. Access = `profiles.role='admin'` OR the signed-in email is
in `ADMIN_EMAILS`. Shows user/proof/feedback counts (real vs demo), onboarding-incomplete
and signed-up-no-proof lists, recent proofs, and the app-feedback inbox with an inline
status control (`new → reviewing → planned → resolved → dismissed`). All reads/writes go
through service-role server routes (`/api/admin/beta`, `/api/admin/app-feedback`); the
service key is never exposed to the browser.

## 5. Storage notes

- Bucket: **`collective-proof-media`** (see migration 012 / `lib/supabase/client.ts`).
- Upload path: `${user_id}/${proof_id}/${timestamp}-${filename}`.
- The DB stores the **storage path**; public URLs are derived at read time.
- MVP limits (enforced client-side before upload): image 10 MB, audio 25 MB, video 100 MB.
- **Public-vs-signed:** if the bucket is public for MVP convenience, that is acceptable
  for this closed beta only — move to signed URLs before a wider launch.

## 6. Proof upload limitations

- **Text + image** proof is the reliable beta path.
- **Audio/video** uploads share the same generic storage path and are size-capped, but
  have not been load-tested at scale in this pass. If a tester reports trouble, ask them
  to use a short written reflection or an image for now.
- A failed file upload never erases the written reflection — the text proof still saves.

## 7. Manual beta QA checklist

- [ ] Apply migrations 010–022 in order
- [ ] Confirm env vars are set (no BOM)
- [ ] `directions` and `practices` rows exist (onboarding picker is non-empty)
- [ ] Create an invite code (`npm run beta:invite`)
- [ ] Visit `/signup`
- [ ] (gate on) Try an invalid invite code → calm error, no access
- [ ] (gate on) Try a valid invite code → access granted
- [ ] Confirm a `profiles` row exists for the new user (trigger works)
- [ ] (gate on) Confirm `beta_access=true`, `invite_code`, `beta_joined_at` set
- [ ] Complete onboarding → confirm `current_direction_id` saved, `onboarding_completed=true`
- [ ] Start a practice → `practice_completions` row created
- [ ] Submit a text proof → `proofs` row exists, appears in app, success state shows
- [ ] Submit an image proof → `proof_attachments` + storage path saved, thumbnail shows
- [ ] Force a failure (offline) → text is preserved, calm retry copy shows
- [ ] Submit structured feedback (clarity / useful / next step) → `feedback` row + renders
- [ ] Confirm counters update for the acting user (profile stats)
- [ ] Submit app feedback → appears in `/admin/beta`
- [ ] In `/admin/beta`, change an app-feedback status → persists
- [ ] Log out, log back in → data persists
- [ ] Confirm `/auth`, `/signup`, `/onboarding`, `/access` show no bottom nav / FAB
- [ ] Confirm the bottom FAB is centered on mobile widths (320–430)
- [ ] Trust integrity (migration 023): as a signed-in member, confirm proof / practice /
      feedback / mark-helpful each add exactly one trust event; confirm a feedback
      recipient's `feedback_received_count` updates without them re-submitting; confirm a
      direct `supabase.from('trust_events').insert(...)` (or `rpc('_insert_trust', …)`)
      from the browser console is rejected.
- [ ] Contribute (migration 024): mark a proof open for contributions; as a second
      eligible member, submit a contribution (observation + next step); as the owner,
      accept it; confirm the contributor gets +15 and their contribution_count rises;
      confirm an ineligible member sees the locked state; confirm a non-owner cannot
      accept (rpc rejects).
- [ ] `npm run typecheck` and `npm run build` pass

## 8. Known limitations (technical debt)

1. **Receiver counters — FIXED in migration 023 (Phase A).** Trust writes + counter
   recompute now run through `SECURITY DEFINER` RPCs that recompute every affected user
   server-side (e.g. `record_feedback_trust` recomputes both giver and recipient), and
   direct `trust_events` inserts are denied (`with check (false)`) so trust is no longer
   client-mintable. Remaining nuance: another user's *live* session still reflects the
   change only on their next load (we don't push into their session). The old per-user
   `refreshProfileStats` client helper was replaced by `recomputeProfileCounts` (a thin
   wrapper over the own-id `recompute_profile_counts` RPC).
2. **Trust point values unchanged.** Existing `TRUST_POINTS` (proof 5 / feedback 3 /
   practice 5 / helpful 7) were preserved rather than re-mapped to the brief's
   suggested 3/2/1, because changing them silently re-scores all existing + demo trust
   and level thresholds. Re-tune deliberately in a dedicated trust pass if desired.
3. **Audio/video** upload is size-capped but not load-tested at scale.
4. **Storage** may be public for MVP — move to signed URLs before wider launch.
5. **Email confirmation flow:** if Supabase email confirmation is ON, a user with an
   invite confirms → signs in → redeems the code at `/access` (the gate handles this).

## 9. Recommended next phase

- `SECURITY DEFINER` RPCs for cross-user counter refresh + a single
  `submit_proof_with_trust` / `submit_feedback_with_trust` path (server-validated, no
  client-submitted trust points).
- Signed-URL proof media + basic media moderation.
- Beta funnel view in `/admin/beta` built on `beta_events`.
- Audio/video upload hardening (resumable uploads, progress, retries).

## 10. Knowledge Tips

### Tables
- **`practice_tips`** — user-submitted text tips (≤280 chars) anchored to a specific practice. RLS: authors can insert/delete their own rows; all authenticated users can read.
- **`tip_reports`** — member reports on a tip (one per member per tip). RLS: authenticated users can insert/select their own rows; service role sees all.

### Submit gate
A tip can only be submitted by a user who has **completed the practice** (`practice_completions` row exists for that `practice_id` + `user_id`). The server route (`POST /api/tips`) enforces this before insert. Reported tips go to `POST /api/tips/report`.

### Trust types
| Event | Points | Cap |
|---|---|---|
| `tip-submit` | +1 | Once per tip (capped) |
| `useful-tip` | +6 | Once per tip per receiver (via DB trigger); folds into Contribution trust |

Trust is recorded by `record_tip_submit_trust(p_tip_id, p_uid)` and a `useful_marks` trigger on `target_type='tip'`. Both are `SECURITY DEFINER` and cannot be called directly from the browser.

### Safety layers
1. **Regex pre-gate** — deterministic input check (`contentSafetyPrecheck` in `lib/safety/contentSafety.ts`) runs before any DB insert.
2. **AI moderation** — OpenAI `omni-moderation-latest` content check (graceful: fails open to mock on any error).
3. **Member report → admin** — any authenticated member can flag a tip; reports surface in `/admin/beta` under "Reported tips" (read-only, no auto-action).

### Verification
```bash
npx tsx scripts/check-tips.ts
```
Expected output: `tips checks passed`

## 11. AI layer (real model)

- Provider: OpenAI `gpt-4o-mini` via the `openai` SDK, server-only (`OPENAI_API_KEY`).
- No key set → mock mode (identical to today). Key set → 5 agents return real,
  persona-aware coaching; any error/parse/schema/brand failure falls back to mock.
- Safety: deterministic input pre-gate (`reviewTextSafety`) + output brand/schema
  validation (`assertBrandSafe` + zod). Off-brand/malformed output never reaches a user.
- `COLLECTIVE_PANEL`/demo panel stays mock by design.
- Verify pure layer: `npx tsx scripts/check-ai-output-policy.ts`.

## 12. Spam enforcement (migration 029)

### Columns

`proofs`, `practice_tips`, and `feedback` each have two new boolean columns (both default `false`):

- **`held`** — content is quarantined; hidden from other members' read paths until cleared.
- **`removed`** — content has been permanently removed by an admin; not shown to anyone.

### How held is stamped

A `BEFORE INSERT` trigger (`trg_stamp_held`) runs on all three tables. If the inserting
author's `profiles.spam_signal >= 70` at insert time, the row is inserted with `held = true`
automatically. The trigger runs as `SECURITY DEFINER`; clients cannot bypass it.

### Self-heal (auto-release)

When `_recompute_profile_counts(uid)` recalculates a user's spam signal and the result
drops below 40, all non-removed held rows for that author are released (`held = false`)
automatically. This means good behavior over time restores content visibility without
admin action.

### Admin actions

Admins can act on held content via **`POST /api/admin/moderation`** (admin-only route,
service-role only):

| Action   | Effect                                      |
|----------|---------------------------------------------|
| `clear`  | Sets `held = false, removed = false` (visible again) |
| `remove` | Sets `held = true, removed = true` (permanently removed) |

Request body: `{ action: "clear" | "remove", kind: "proof" | "tip" | "feedback", id: "<uuid>" }`

The held-content list is visible at **`/admin/beta`** under "Held content (pending review)".
Each row shows the content kind, a truncated preview, and Clear / Remove buttons.
The listing only shows items with `held = true`; removed items remain held and drop off
automatically once an admin marks them removed (they won't appear again).

### Read-path hiding

- **Proofs / feedback bundle**: server routes exclude `held = true` rows from other
  members' feeds. Authors always see their own content regardless of held status.
- **Practice tips**: the `listTips` function filters out `held = true` rows for non-authors.

### Beginner-safe framing

Content held by the system is described to the author as "being reviewed" rather than
"flagged as spam." No public shaming; no permanent ban without admin review.

### Verification

```bash
npx tsx scripts/check-spam-enforcement.ts
```
Expected output: `spam-enforcement checks passed`

## 13. Cohorts

Cohorts let members practice together in scoped groups. Added by migration 030.

### Database tables

| Table | Purpose |
|---|---|
| `cohorts` | Group metadata (name, description, direction, visibility, accent) |
| `cohort_members` | Membership rows with `role` (`owner` / `member`) |
| `cohort_join_requests` | Pending join requests for `request`-visibility cohorts |
| `cohort_invites` | Single-use invite codes for `invite`-visibility cohorts |

### Create gate

A user must have `trust_score >= 50` (the "Reliable" level) to create a cohort. Enforced client-side by `canCreateCohort(profile)` in `lib/cohorts/access.ts` and server-side by the `create_cohort` RPC (`SECURITY DEFINER`).

### Visibility join paths

| Visibility | How to join |
|---|---|
| `public` | Click "Join cohort" — immediate via `join_cohort` RPC |
| `request` | Click "Request to join" — creates a `cohort_join_requests` row; owner approves or declines via `approve_join_request` / `decline_join_request` RPCs |
| `invite` | Redeem a code at `/cohorts` invite field — `redeem_cohort_invite` RPC validates and admits |

### RPC-only writes

All cohort mutations go through `SECURITY DEFINER` RPCs. Clients cannot insert/update/delete `cohort_members` or `cohort_join_requests` directly; RLS policies deny direct writes to those tables.

### Scoped feed

`getCohortFeed(cohortId, proofs)` in the provider receives only proofs belonging to current cohort members. The caller pre-filters before passing to `rankFeed`:

```ts
const memberIds = new Set(members.map((m) => m.userId));
const scopedProofs = feedProofs.filter((p) => memberIds.has(p.userId));
```

- **Held proofs excluded**: `listCohortProofs` (server) omits rows where `held = true` for non-authors, matching the global feed hiding rule.
- **Non-member proofs excluded**: only `cohort_members` rows contribute.

### Founding-circle backfill

Migration 030 seeds a **public** "Founding Circle" cohort (`id = 00000000-0000-0000-0000-0000000f0001`, `visibility = 'public'`) and backfills every existing beta member (`profiles.cohort_id = 'founding-circle'`) as a `member` row. Ownership is assigned to the first profile whose `role` is `founder`/`admin`; if no such profile exists (as on the current prod instance, where access is governed by `ADMIN_EMAILS` rather than a profile role), the Founding Circle is intentionally **ownerless** — it is a system "everyone" cohort, not a user-moderated group, and being public it needs no owner to function (members join/leave freely). User-created cohorts always have an owner (the creator, set by `create_cohort`).

### QA checklist (cohorts)

- [ ] Apply migration 030 (idempotent)
- [ ] Confirm `cohorts`, `cohort_members`, `cohort_join_requests`, `cohort_invites` tables exist
- [ ] As a user with `trust_score < 50`: "Create" button should NOT appear on `/cohorts`
- [ ] As a user with `trust_score >= 50`: "Create" button appears; filling the form calls `create_cohort` RPC
- [ ] Public cohort: "Join cohort" → immediate membership, scoped feed shows member proofs
- [ ] Request cohort: "Request to join" → calm "Request sent" message; owner inbox shows the request
- [ ] Owner approves request → member appears in members list, feed updates
- [ ] Owner declines request → request disappears
- [ ] Owner removes a member → member removed, not in members list
- [ ] Invite cohort: no join button shown, only "Invite only" note; redeeming a valid code at `/cohorts` joins the cohort
- [ ] Owner sees no "Leave" control; member sees quiet "Leave" button; non-member sees join control
- [ ] Scoped feed shows only members' proofs (not outsiders')
- [ ] Milestone stamp appears when `feedProofs.length >= 25`
- [ ] No member counts used as status signals; no leaderboard

### Verification

```bash
npx tsx scripts/check-cohorts.ts
```
Expected output: `cohorts checks passed`

## 14. Contributor roles

### Capability ladder

The single source of truth is **`lib/roles.ts`** (`hasCapability`, `tierForProfile`, `TIER_CAPABILITIES`). Tier is derived purely from `trust_score` — never written directly. Existing thresholds are unchanged.

| Tier | Trust score | Capabilities unlocked at this tier |
|---|---|---|
| New | `<20` | — |
| Practicing | `≥20` | — |
| Reliable | `≥50` | `give_feedback`, `host_cohort` |
| Helpful | `≥100` | `mentor_visibility`, `cohort_guide` |
| Contributor | `≥200` | `welcome_newcomers`, `steward` |

Capabilities are cumulative: a Contributor has all of the above.

### Mentor opt-in

- Column: `profiles.mentor_opt_in` (boolean, default `false`)
- Effective at: **Helpful+** (requires `mentor_visibility` capability)
- UI: quiet toggle on own profile card (visible only to the profile owner)
- Effect: the member appears in the "People to learn from in this direction" strip on `/directions` for other members who share their current direction
- Guard: computed inline in `app/directions/page.tsx` — a candidate is listed when `mentorOptIn` is true AND `hasCapability(candidate, "mentor_visibility")` (Helpful+) AND they share the viewer's direction. Capability derives from `trust_score`, so it cannot be forged client-side

### Guide role (service-only, no moderation)

- Role value: `"guide"` in `cohort_members.role` (alongside `"owner"` / `"member"`)
- Purpose: a calm service signal — guides are listed as someone to learn from inside a cohort; they have **no moderation powers** (cannot approve/decline requests, remove members, or perform any owner-only action)
- Set by: RPC `set_cohort_guide(p_cohort_id, p_user_id, p_is_guide)` — owner-only; enforced `SECURITY DEFINER`
- Target: the target member must be **Helpful+** (`cohort_guide` capability) to become a guide; if they later drop below Helpful, they retain the role until the owner changes it
- UI: on the cohort detail page (owner-only members list), a quiet "Make guide" / "Remove guide" button appears next to any member who is guide-eligible or already a guide; a `Guide` badge renders next to that member's name

### Welcome-newcomers (derived, Contributor)

- Capability `welcome_newcomers` is unlocked at **Contributor** (`≥200` trust)
- It is derived automatically from trust score — no opt-in required
- Effect: the Contributor's own profile card shows a quiet "Steward" stamp, and `/directions` shows them a "Say hi to someone new" strip listing New-tier members in their direction (a "Say hi" action opens a peer note). Newcomers are selected by `tierForProfile(u) === "New"` + shared direction — there is no time window
- No extra column; no write; purely computed in `lib/roles.ts` from existing snapshot data

### Anti-clout guardrails

- No trust counts, tier labels, or capability names are shown in social feeds or other members' views
- Badges (Guide, Steward) describe a service function, not a status rank
- Mentor and guide listings are framed as "someone to learn from" / "cohort guide" — not leaderboard positions
- No notification is sent when a user's tier changes; tier is only surfaced in the user's own profile card
- The admin panel (`/admin/beta`) is the only place where trust scores are visible to non-owners

### QA checklist (contributor roles)

- [ ] Apply migrations 031 (mentor_opt_in column + guide role + set_cohort_guide RPC)
- [ ] As a Helpful+ member, opt in as mentor → appears in the "People to learn from" strip on `/directions` for other members who share that direction
- [ ] As a non-Helpful+ member, mentor toggle should NOT appear
- [ ] As a cohort owner, open the members list; a Helpful+ member shows "Make guide" button
- [ ] As a cohort owner, click "Make guide" → member's row gains a quiet "Guide" badge; button changes to "Remove guide"
- [ ] As a cohort owner, click "Remove guide" → badge disappears; button reverts to "Make guide"
- [ ] A guide member has no approve/decline/remove controls — only the owner does
- [ ] A non-Helpful+ member in the cohort shows no guide toggle
- [ ] As a Contributor, "Steward" badge appears on own profile card; welcome strip visible to newcomers in same direction
- [ ] No tier labels or trust counts appear in any social feed or other member's view

### Verification

```bash
npx tsx scripts/check-roles.ts
```
Expected output: `roles checks passed`
