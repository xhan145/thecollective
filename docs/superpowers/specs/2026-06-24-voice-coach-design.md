# Voice Coach (spoken AI coaching) — design

Date: 2026-06-24
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind + Supabase)

## Problem

Members practice and submit proof, but coaching is text-only and one-shot. Our new
partner (Michael) proposed a media pipeline: record audio → transcribe → LLM → human
voice reply → notify. We want a **spoken AI coach**: a member records a voice turn, it's
transcribed, the AI reasons (with their personalization context), and the coach **replies
in a human voice** — a multi-turn conversation anchored to a practice or proof. It must
stay calm, beginner-safe, and anti-clout (coach activity earns no trust and is never
shown publicly).

~80% of Michael's pipeline already exists on our stack (Supabase Storage uploads, an async
path, Supabase Realtime sockets, and the OpenAI AI layer just shipped). The genuinely new
parts are **in-browser recording**, the **transcribe → reason → voice-reply** chain, and a
private conversation store.

## Decisions (locked during brainstorm)

- **A spoken AI coach** (not just transcription). Member records → Whisper STT → gpt-4o-mini
  → ElevenLabs TTS → Realtime notify.
- **Multi-turn** conversation, **anchored to a practice or proof** (always has real context).
- **Async pipeline via a Supabase Edge Function** + Supabase Realtime (Michael's pattern on
  our stack); the Next route enqueues and returns immediately.
- **Dedicated tables** (`coach_threads`, `coach_messages`) — the existing
  `conversations`/`messages` don't fit (NOT NULL human `recipient_id`/`sender_id`,
  `initiator <> recipient` check; the AI has no profile row).
- **Defense-in-depth safety** + **gentle turn cap**; coach earns **no trust**, never in feeds,
  RLS owner-only.
- Playback uses the shipped `useSignedMediaUrl` hook against a private `coach-audio` bucket.

## Data model — migration `026_voice_coach.sql` (additive; after 025)

- **`coach_threads`**: `id uuid pk`, `user_id uuid not null references profiles(id) on delete cascade`,
  `prompt_id text` (practice anchor, nullable), `proof_id uuid references proofs(id) on delete set null`,
  `title text`, `turn_count int not null default 0`, `last_message_at timestamptz not null default now()`,
  `created_at timestamptz not null default now()`.
- **`coach_messages`**: `id uuid pk`, `thread_id uuid not null references coach_threads(id) on delete cascade`,
  `role text not null check (role in ('member','coach'))`, `transcript text`, `audio_path text`,
  `status text not null check (status in ('pending','ready','failed')) default 'ready'`,
  `error text`, `created_at timestamptz not null default now()`.
  Indexes: `(thread_id, created_at)`.
- **RLS (owner-only):** enable on both. `coach_threads`: all ops where `user_id = auth.uid()`.
  `coach_messages`: all ops where the parent thread's `user_id = auth.uid()` (via `exists`
  subquery). No public/cohort read. Service role (Edge Function) bypasses RLS for writes.
- **Realtime:** add `coach_messages` to the `supabase_realtime` publication so the client
  receives `pending → ready/failed` updates.
- **Storage:** private bucket `coach-audio`; Storage RLS so a user can read/write only paths
  prefixed `{auth.uid()}/...`. Holds both member recordings and generated replies.

## Components

**New:**
- `supabase/migrations/026_voice_coach.sql` — the schema above.
- `supabase/functions/voice-coach/index.ts` (Deno Edge Function) — the async worker.
- `supabase/functions/voice-coach/policy.ts` — ported safety regex + forbidden-language list
  + coach system prompt (Deno copy of the Node policy; see Safety).
- `app/api/coach/turn/route.ts` — enqueue route: insert member + pending coach rows, invoke
  the Edge Function, return 202.
- `lib/supabase/coachRepository.ts` — mappers + reads: `createOrGetThread(anchor)`,
  `listCoachMessages(threadId)`, types `CoachThread`/`CoachMessage`.
- `app/coach/[threadId]/page.tsx` — the coach thread screen: record (MediaRecorder), upload,
  realtime-updating transcript list + audio playback, turn-cap state.
- `components/beta/CoachLauncher.tsx` — a "Talk it through" entry button placed on the
  practice + proof screens.
- A realtime subscription hook `lib/coach/useCoachThread.ts` (subscribe to `coach_messages`
  for the thread; mirrors the notifications channel pattern).
- Pure checks: `scripts/check-coach-safety.ts` (safety pre-gate + assertBrandSafe + turn-cap +
  context-builder), runnable via `npx tsx` where the logic is Node-importable; the Deno copy is
  covered by `deno check` + a dry-run.

**Modified:**
- `app/practice/page.tsx`, `app/proof/[id]/page.tsx` — add the `CoachLauncher` entry.
- `components/beta/AppShell.tsx` — add `/coach` to `protectedPrefixes`.
- `.env.example` / `docs/BETA_QA.md` — document `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`,
  and the Edge Function secrets.

## Pipeline (data flow)

```
1. Client: MediaRecorder → upload blob to coach-audio/{userId}/{threadId}/{uuid}.webm
   (authed Supabase client).
2. POST /api/coach/turn { threadId, audioPath }:
   - verify thread.user_id == auth.uid(); reject if turn_count >= cap
   - insert coach_messages { role:'member', audio_path, status:'ready' }
   - insert coach_messages { role:'coach', status:'pending' }  ← placeholder
   - invoke Edge Function voice-coach { threadId, memberMessageId, coachMessageId }
   - return 202
3. Edge Function (service role):
   a. download member audio
   b. OpenAI Whisper (whisper-1) → transcript; write onto member message
   c. SAFETY PRE-GATE (regex) → risky? write coach message as a calm safe-redirect
      (status:'ready'), skip model+TTS, stop
   d. load thread anchor (practice/proof), last N turns, member persona
   e. gpt-4o-mini: collectiveAiPolicy + coach system prompt + persona + anchor + history
      → reply text → assertBrandSafe (fallback to a calm canned line on violation)
   f. ElevenLabs TTS (calm voice) → upload reply audio to coach-audio
   g. UPDATE the pending coach message → { transcript: replyText, audio_path, status:'ready' };
      bump thread.turn_count + last_message_at
   on ANY failure b–f: set coach message status:'failed' + calm error
4. Supabase Realtime (coach_messages, filtered to thread) → client renders transcript +
   playable audio (signed URL via useSignedMediaUrl). status:'failed' → calm retry.
```

Idempotency: the pipeline keys off the `coachMessageId` placeholder (a retry updates that one
row — no duplicate replies; a `failed` row can be re-driven by re-invoking with the same id).

## Safety (defense in depth)

1. **Input pre-gate** on every transcribed member turn (regex policy) *before* the model;
   crisis/harassment/sexual/medical-boundary/private-info → calm safe-redirect coach reply,
   **no model/TTS spend**.
2. **Output validation:** coach reply text must pass `assertBrandSafe` + parse expectations
   before TTS; any miss → a calm canned reply (never voiced off-brand).
3. **Duplication note (accepted):** the Edge Function is Deno; the Node AI layer (`runAgent`,
   `outputPolicy`) is `server-only` and can't be imported. `supabase/functions/voice-coach/policy.ts`
   is a **port** of the regex + forbidden list + coach system prompt. Two copies to keep in sync;
   a shared package is a deferred cleanup.

## Guardrails / brand

- Gentle per-thread **turn cap** (default 6 member turns) with calm copy; not a hard wall.
- Coach activity earns **no trust**, never appears in any feed, RLS **owner-only** (private).
- Beginner-safe voice + system prompt; the coach is a support tool, never an authority.
- Audio retention/auto-expiry is a noted future, not v1.

## Providers / secrets

- OpenAI Whisper `whisper-1` (STT) + `gpt-4o-mini` (reasoning, reuses persona+policy) +
  ElevenLabs (TTS, configurable calm `ELEVENLABS_VOICE_ID`).
- `OPENAI_API_KEY` + `ELEVENLABS_API_KEY` set as **Supabase Edge Function secrets**
  (`supabase secrets set`) — server-side only, never client/`NEXT_PUBLIC_`.
- **Cost:** most expensive path in the app (3 API calls + audio/turn). Turn cap +
  one-reply-per-turn bound it; rough per-turn cost noted at build time so it's a conscious choice.

## Testing & verification

- Pure (`npx tsx scripts/check-coach-safety.ts`): safety pre-gate (forbidden → redirect; clean
  passes), `assertBrandSafe`, turn-cap helper (< cap allow, == cap block), context builder
  (persona + anchor included, absent omitted, no cross-user data).
- `npm run typecheck` + `npm run build` green (route, repo, hooks, UI).
- Edge Function: `deno check`; local dry-run with a stubbed audio file → writes `ready` (or
  `failed` on injected error). External calls exercised only with keys set (documented).
- Realtime: confirm a `pending → ready` update reaches a subscribed client.
- Migration `026`: apply via MCP; confirm tables + RLS + bucket; `get_advisors` clean.

## Acceptance criteria

1. From a practice/proof, a member opens a coach thread, records a turn, and receives a
   **spoken** coach reply + transcript via Realtime (`pending → ready`).
2. Multi-turn within a thread, up to a gentle turn cap with calm copy.
3. Every member turn is safety-pre-gated; risky input → safe-redirect with no model/TTS;
   coach output is brand-validated before it is voiced.
4. All keys server-side in the Edge Function; nothing client-exposed; coach data RLS owner-only,
   earns no trust, never in feeds.
5. Playback uses `useSignedMediaUrl` against private `coach-audio`, muted-autoplay-safe.
6. Migration `026` additive (010–025 untouched); typecheck + build + pure checks green.

## Scope — out (own follow-ups)

- Coach inbox/history UI beyond opening from a practice/proof (v1: one active thread per anchor).
- Audio auto-expiry/retention policy.
- Streaming/barge-in audio, voice-selection UI, multi-language.
- Trust/feed integration (coach stays private).
- Shared Node/Deno policy package (accept the port duplication for now).

## Build note (for planning)

Largest feature to date (migration + Edge Function + route + recording UI + realtime +
playback). Plan in **2–3 slices**: (1) data model + Edge Function pipeline + enqueue route
(backend, testable via dry-run + realtime), (2) recording + playback + thread UI + launchers,
(3) polish/guardrail copy + docs. Each slice ships independently testable.
