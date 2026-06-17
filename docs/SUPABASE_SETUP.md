# Collective Web Beta — Supabase setup

The web beta runs in **demo mode** (localStorage) with no backend. Add Supabase
env vars and run the SQL below to switch it to a **live backend**: real
email/password accounts, and proofs / feedback / trust / practice completions /
app feedback / proof media that persist per user and sync across devices.

Directions & practices now live in Supabase tables (migration 013), seeded with
the launch content; the app falls back to the in-app seed if those tables are
empty/unreachable.

## 1. Environment variables

In `.env.local` (local) and Vercel → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_APP_URL=https://<your-domain>      # http://localhost:3000 locally
```

When `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present the
app automatically uses Supabase; otherwise it stays in demo mode.

## 2. Run the SQL (Dashboard → SQL Editor, in order)

1. `supabase/migrations/010_collective_beta_schema.sql` — core tables
2. `supabase/migrations/011_collective_beta_rls.sql` — RLS + a trigger that
   auto-creates a `profiles` row for every new auth user
3. `supabase/migrations/012_collective_beta_storage.sql` — `collective-proof-media`
   bucket + policies
4. `supabase/migrations/013_directions_practices.sql` — directions + practices tables, RLS, seed
5. `supabase/migrations/014_profile_extras.sql` — profile fields (username, onboarding_completed, counters) + updated new-user trigger
6. `supabase/migrations/015_feedback_and_appfeedback.sql` — structured feedback notes + app_feedback rating/status

(The older `supabase/*.sql` files are from the legacy prototype — ignore them.)

## Closed-beta QA checklist (run on the preview or production)

1. Create a new account at `/signup` (display name, username, email, password).
2. Confirm a `profiles` row exists (username set, `onboarding_completed = false`).
3. Complete onboarding → row updates `current_direction_id` + `onboarding_completed = true`.
4. Directions on Home/Directions load from the `directions` table.
5. Start a practice → `practice_completions` + `trust_events` rows; `profiles.practice_count` ++.
6. Submit proof → `proofs` row; `proof_count` ++; `trust_score` rises (+proof points).
7. Give feedback on another member's proof → `feedback` row with clarity/useful/next_step notes; `feedback_given_count` ++.
8. Submit app feedback at `/app-feedback` → `app_feedback` row (category, rating, message, screen).
9. Log out, log back in → all data persists.
10. Second account cannot read the first account's private proofs/trust events (RLS).

## 3. Auth settings (Dashboard → Authentication → URL Configuration)

- **Site URL:** your `NEXT_PUBLIC_APP_URL`
- **Redirect URLs:** add (local + production)
  - `http://localhost:3000/auth`, `/login`, `/signup`
  - `https://<your-domain>/auth`, `/login`, `/signup`

Email + password is used. If "Confirm email" is on (default), new users confirm
via the email link before signing in.

## 4. Verify

1. `npm run dev`, open `/auth` → it now shows an email/password form (not the
   demo buttons).
2. Create an account, complete a practice, submit a proof, give feedback.
3. In Supabase → Table Editor confirm rows in `profiles`, `proofs`, `feedback`,
   `trust_events`, `practice_completions`. Media lands in Storage →
   `collective-proof-media/{user_id}/{proof_id}/`.

## Demo Population Seed Layer (second-tier)

Fills your Supabase project with a realistic, beginner-safe demo ecosystem so
closed-beta demos and screenshots feel alive — **without** faking traction.
Every demo row is tagged `is_demo = true` and `demo_cohort = 'second-tier-demo-v1'`
and is cleanly removable.

**What it creates (standard size):** ~60 demo members (`demo+{username}@collective.local`),
~250 proofs, ~250 practice completions, ~180 structured feedback notes, modest
trust events + counters. Sizes: `small` (24/80) · `standard` (60/250) · `large`
(90/400). Default `standard`; `large` is never generated unless you set it.

**Media:** lightweight SVG thumbnails in `/public/demo/` (avatars + proof cards),
referenced by `media_url` — deploys with Vercel, zero Storage cost. Uploading
real placeholder media to Storage is opt-in via `DEMO_UPLOAD_TO_STORAGE=true`.

**Prerequisites:** run migration `016_demo_metadata.sql` (after 010–015), and set
in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
(server-only — never `NEXT_PUBLIC`), `DEMO_USER_PASSWORD`, `ALLOW_DEMO_SEED=true`.

```bash
npm run demo:assets        # (re)generate /public/demo SVG assets
npm run seed:demo:dry      # plan only — no writes, no key required
npm run seed:demo          # create demo users + content
npm run seed:demo:reset    # delete ONLY demo data (real users/content untouched)
npm run seed:demo:media    # media-only pass
```

**Safety:** the seed refuses to run without the service-role key and
`ALLOW_DEMO_SEED=true` (or `--yes`); production requires both. `--reset` deletes
only `is_demo` rows and `demo+*@collective.local` auth users — never real
profiles, proofs, feedback, auth users, or non-demo storage files.

**Feed behavior:** real proof is always prioritized over demo (sorted real-first);
set `NEXT_PUBLIC_INCLUDE_DEMO_CONTENT=false` to hide demo content entirely, or
`NEXT_PUBLIC_SHOW_DEMO_BADGES=true` to show a subtle "Sample" label.

> Do not represent demo data as real traction. It exists to make the product
> legible during closed beta, not to imply adoption.

## Security notes (closed beta)

- Any authenticated member can read cohort proofs and member display names — the
  intended closed-beta behavior. Keep sign-ups limited.
- `collective-proof-media` is a **public** bucket for MVP convenience (media
  renders directly). Switch to private + signed URLs before any public launch.
- `trust_events` insert is open to authenticated users so a recipient's client
  can credit a feedback author on "mark helpful". Move trust writes to a server
  RPC/Edge Function to harden later.
