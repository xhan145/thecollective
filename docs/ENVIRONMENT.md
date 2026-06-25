# Collective — Environment Variables

Reference for configuring the app across **local dev**, **Vercel (prod)**, and **Supabase Edge Functions**.

> **Supabase project:** `qfzguujtjloskyxcdbon`
> Fill in real values from the Supabase / OpenAI / ElevenLabs dashboards — none are committed.

---

## 1. Required — Core app (Supabase)

Set these in **`.env.local`** (local) **and** in **Vercel → Project → Settings → Environment Variables** (prod).

| Variable | Scope | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase → Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only secret** | Supabase → Settings → API → `service_role` key |

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qfzguujtjloskyxcdbon.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

⚠️ `SUPABASE_SERVICE_ROLE_KEY` must **never** be exposed to the client (no `NEXT_PUBLIC_` prefix). It's used only in server routes / API handlers.

---

## 2. AI layer (OpenAI) — server-only

The AI coaching layer runs **real OpenAI** when `OPENAI_API_KEY` is present, and falls back to a **safe mock** (canned, beginner-safe responses) when it's absent. So prod is safe with or without the key — set it to turn real AI on.

| Variable | Required? | Default | Notes |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | For real AI | — | **Server-only.** No key ⇒ mock mode. |
| `COLLECTIVE_AI_MODEL` | No | `gpt-4o-mini` | Override the model. |
| `COLLECTIVE_AI_MAX_TOKENS` | No | `512` | Per-response cap. |
| `COLLECTIVE_AI_TIMEOUT_MS` | No | `15000` | Request timeout. |
| `COLLECTIVE_AI_SKIP_AGENT_LOGS` | No | `false` | Disable agent-run logging. |

```bash
OPENAI_API_KEY=
COLLECTIVE_AI_MODEL=gpt-4o-mini
COLLECTIVE_AI_MAX_TOKENS=512
COLLECTIVE_AI_TIMEOUT_MS=15000
COLLECTIVE_AI_SKIP_AGENT_LOGS=false
```

---

## 3. Admin & email (optional)

| Variable | Required? | Notes |
| --- | --- | --- |
| `ADMIN_EMAILS` | For admin access | Comma-separated emails that can reach `/admin/*` (incl. the trust **spam-review** list). |
| `RESEND_API_KEY` | Only if sending email | Resend API key. |

```bash
ADMIN_EMAILS=you@example.com
RESEND_API_KEY=
```

---

## 4. Beta / feature flags (public, optional)

Sensible defaults exist; override as needed. Safe in Vercel + `.env.local`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | — | Canonical site URL (used in links). |
| `NEXT_PUBLIC_REQUIRE_INVITE_CODE` | `true` | Closed-beta invite gate on signup. |
| `NEXT_PUBLIC_DEMO_SEED` | `true` | Local demo personalization seed (any value except `false` = on). |
| `NEXT_PUBLIC_INCLUDE_DEMO_CONTENT` | `true` | Show demo proofs alongside real ones in the feed. |
| `NEXT_PUBLIC_ENABLE_DEV_TOOLS` | `false` | Dev-only tooling. |

```bash
NEXT_PUBLIC_APP_URL=https://your-prod-domain
NEXT_PUBLIC_REQUIRE_INVITE_CODE=true
NEXT_PUBLIC_DEMO_SEED=true
NEXT_PUBLIC_INCLUDE_DEMO_CONTENT=true
NEXT_PUBLIC_ENABLE_DEV_TOOLS=false
```

---

## 5. Supabase Edge Function secrets — Voice Coach (set via Supabase CLI, NOT Vercel)

The Voice Coach feature (record → Whisper → GPT → ElevenLabs → Realtime) runs in a **Supabase Edge Function**. Its keys are **Edge Function secrets**, set with the Supabase CLI — they do **not** belong in Vercel or `.env.local`.

```bash
supabase secrets set \
  OPENAI_API_KEY=sk-... \
  ELEVENLABS_API_KEY=... \
  ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

| Secret | Notes |
| --- | --- |
| `OPENAI_API_KEY` | Whisper (STT) + GPT (reasoning). |
| `ELEVENLABS_API_KEY` | Text-to-speech voice reply. **Missing ⇒ coach still replies in text** (no audio) — graceful. |
| `ELEVENLABS_VOICE_ID` | A calm ElevenLabs voice id. |

> Voice Coach is spec'd but **not yet built/deployed** — these are only needed once that feature ships.

---

## 6. Seed script only (local CLI — never deployed)

Used by `scripts/seed-demo-data` when (re)seeding demo content locally. Do **not** set in Vercel.

```bash
ALLOW_DEMO_SEED=true
DEMO_SEED_SIZE=standard
DEMO_USER_PASSWORD=
DEMO_UPLOAD_TO_STORAGE=false   # keep false — demo stores metadata only, no file uploads
PACK_DIR=
```

---

## Notes & gotchas

- **Legacy (ignore):** `NEXT_PUBLIC_FIREBASE_*` and all `VITE_*` variables are leftovers from an earlier stack. The app is **Supabase-only** now; these are unused.
- **`.env.local` BOM gotcha:** do **not** create/edit `.env.local` with PowerShell `Out-File` — it writes a UTF-8 **BOM** that corrupts the first variable (`NEXT_PUBLIC_SUPABASE_URL` parses as `undefined`, surfacing as "A backend is not configured"). Use an editor that saves **UTF-8 without BOM**.
- **Server-only vars** (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `ADMIN_EMAILS`) must never carry a `NEXT_PUBLIC_` prefix.
- **Minimum to boot the app:** the three Section 1 Supabase vars. Everything else is feature-gated and degrades gracefully when absent.
