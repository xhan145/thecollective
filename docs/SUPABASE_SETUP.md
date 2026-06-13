# Collective Web Beta — Supabase setup

The web beta runs in **demo mode** (localStorage) with no backend. Add Supabase
env vars and run the SQL below to switch it to a **live backend**: real
email/password accounts, and proofs / feedback / trust / practice completions /
app feedback / proof media that persist per user and sync across devices.

Static content (directions, prompts, cohorts) stays seeded in the app, so no
content tables are required.

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

1. `supabase/migrations/010_collective_beta_schema.sql` — tables
2. `supabase/migrations/011_collective_beta_rls.sql` — RLS + a trigger that
   auto-creates a `profiles` row for every new auth user
3. `supabase/migrations/012_collective_beta_storage.sql` — `collective-proof-media`
   bucket + policies

(The older `supabase/*.sql` files are from the legacy prototype — ignore them.)

## 3. Auth settings (Dashboard → Authentication → URL Configuration)

- **Site URL:** your `NEXT_PUBLIC_APP_URL`
- **Redirect URLs:** add
  - `http://localhost:3000/auth`
  - `https://<your-domain>/auth`

Email + password is used. If "Confirm email" is on (default), new users confirm
via the email link before signing in.

## 4. Verify

1. `npm run dev`, open `/auth` → it now shows an email/password form (not the
   demo buttons).
2. Create an account, complete a practice, submit a proof, give feedback.
3. In Supabase → Table Editor confirm rows in `profiles`, `proofs`, `feedback`,
   `trust_events`, `practice_completions`. Media lands in Storage →
   `collective-proof-media/{user_id}/{proof_id}/`.

## Security notes (closed beta)

- Any authenticated member can read cohort proofs and member display names — the
  intended closed-beta behavior. Keep sign-ups limited.
- `collective-proof-media` is a **public** bucket for MVP convenience (media
  renders directly). Switch to private + signed URLs before any public launch.
- `trust_events` insert is open to authenticated users so a recipient's client
  can credit a feedback author on "mark helpful". Move trust writes to a server
  RPC/Edge Function to harden later.
