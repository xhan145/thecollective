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
