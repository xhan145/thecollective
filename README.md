# SIGNAL//FLOW

Find them before they break.

SIGNAL//FLOW is an AI-powered underground music discovery MVP. Artists upload tracks into The Flow, the mock Mekhane Engine generates a Signalprint, admins approve tracks, and Scouts discover, Save, Skip, or Back artists before they break.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage
- Mobile-first dark UI
- Mock Signalprint generator, no real AI API required

## Local Setup

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

If Supabase variables are missing, the app runs in demo mode with local seed data so the UI and core flows can still be reviewed.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values when connecting Supabase:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_DEV_TOOLS=false
```

Do not commit real secrets.

## Supabase Setup

Run these SQL files in order from `supabase/migrations`:

1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_seed_demo_data.sql`
4. `004_storage_buckets.sql`

Storage buckets:

- `track-audio`
- `track-artwork`

Both are public for MVP playback. Tighten storage access before production if track privacy is required.

## Core Routes

Public:

- `/`
- `/about`
- `/auth`

Artist:

- `/artist/onboarding`
- `/artist/dashboard`
- `/artist/upload`
- `/artist/tracks/[id]`
- `/artist/tracks/[id]/analytics`

Scout:

- `/scout/onboarding`
- `/discover`
- `/scout/profile`
- `/saved`
- `/backed`

Admin:

- `/admin`
- `/admin/tracks`
- `/admin/reports`

Legacy MVP paths such as `/home`, `/profile`, `/practice`, and `/proof/new` redirect into the SignalFlow flow.

## Test The MVP Flow

Demo mode:

1. Visit `/discover`.
2. Play the demo track.
3. Save, Skip, and Back after 15 seconds of playback.
4. Visit `/saved`, `/backed`, and `/scout/profile`.
5. Visit `/artist/dashboard`, open a track, and inspect First 50 analytics.
6. Visit `/admin/tracks` to see the pending demo track.

With Supabase:

1. Sign up as an artist from `/auth?mode=signup&role=artist`.
2. Complete `/artist/onboarding`.
3. Upload a track at `/artist/upload` and confirm rights.
4. Confirm the track enters `pending_review` and has a `track_analysis` row.
5. Use `/admin/tracks` as an admin user to approve the track.
6. Sign up as a Scout, complete `/scout/onboarding`, then visit `/discover`.
7. Play, Save, Skip, and Back. Backing unlocks after 15 seconds and creates a permanent receipt.
8. Return to `/artist/tracks/[id]/analytics` to see First 50 progress.

## Verification

Current checks:

```bash
npm run typecheck
npm run build
```

There is no lint or test script in this package yet.

## Brand Assets

The supplied SignalFlow media kit has been extracted to `public/brand` and is used for the logo, landing hero, manifest icon, and app metadata.

## Known Limitations

- The Mekhane Engine is a deterministic mock generator using genre and mood tags.
- Admin authorization is represented by the `users.role = 'admin'` database role. Promote admins manually in Supabase for real deployments.
- First 50 progress is calculated from unique listen events; automatic graduation into First 250 or Rising is intentionally left as a TODO.
- Recommendation logic is simple preference overlap plus First 50 scarcity, not a complex ML recommender.
- Demo mode actions acknowledge interactions in the UI but do not persist without Supabase.
