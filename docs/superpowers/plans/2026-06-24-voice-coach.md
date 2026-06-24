# Voice Coach (spoken AI coaching) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A multi-turn spoken AI coach anchored to a practice/proof: member records a voice turn → Whisper transcribes → gpt-4o-mini reasons (with persona) → ElevenLabs voices the reply → Supabase Realtime delivers it.

**Architecture:** Dedicated `coach_threads`/`coach_messages` + private `coach-audio` bucket. A Next enqueue route inserts a member message + a `pending` coach placeholder and invokes a Supabase Edge Function (Deno) that runs the STT→LLM→TTS pipeline and writes the reply; Realtime pushes `pending → ready/failed` to the client. Safety is defense-in-depth (regex pre-gate per turn + brand-validate output before TTS). Coach is private, earns no trust.

**Tech Stack:** Next.js App Router + TypeScript, Supabase (Postgres, RLS, Storage, Realtime, Edge Functions/Deno), OpenAI (whisper-1, gpt-4o-mini), ElevenLabs (TTS), `@tanstack/react-query` (`useSignedMediaUrl`), `npx tsx` for pure checks.

## Global Constraints

- Migration `026_voice_coach.sql` additive; 010–025 untouched. Apply via Supabase MCP (project `qfzguujtjloskyxcdbon`), then `get_advisors(security)` clean.
- Secrets `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` are **Supabase Edge Function secrets** (server-side only). NEVER `NEXT_PUBLIC_`, never in client code. The Next route uses `getSupabaseServiceClient()` (server) + `getAuthedUser(req)`.
- **Graceful TTS degradation:** if `ELEVENLABS_API_KEY` is missing or TTS errors, still save the coach reply with its transcript, `status:'ready'`, `audio_path: null` — never fail the turn for missing voice.
- **Defense in depth:** every transcribed member turn runs the regex pre-gate BEFORE the model (risky → safe-redirect reply, no model/TTS); coach output passes `assertBrandSafe` before TTS (violation → calm canned reply).
- **Gentle turn cap** default `COACH_TURN_CAP = 6` member turns/thread; calm copy, not a hard error.
- Coach earns **no trust**, never appears in any feed, RLS **owner-only**. Beginner-safe vocabulary; no scores/streaks/leaderboards/likes/clout.
- The Deno Edge Function CANNOT import the Node AI layer (`lib/ai/*` is `server-only`). It carries a **ported** `policy.ts`. The canonical, unit-tested copy lives in `lib/coach/coachPolicy.ts` (Node); the Deno port must mirror it.
- Reuse the shipped `useSignedMediaUrl(bucket, path)` hook for private playback.
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (Git Bash). **Start on branch `voice-coach` off `main`.**

## File Structure

- `supabase/migrations/026_voice_coach.sql` — **create.** Tables + RLS + bucket + realtime publication.
- `lib/coach/coachPolicy.ts` — **create.** Canonical pure logic: `coachSafetyPrecheck`, `COACH_TURN_CAP`/`isAtTurnCap`, `buildCoachContext`, `COACH_SYSTEM_PROMPT`.
- `scripts/check-coach-safety.ts` — **create.** Runnable assertions for the above + `assertBrandSafe`.
- `lib/coach/types.ts` — **create.** `CoachThread`, `CoachMessage`.
- `lib/supabase/coachRepository.ts` — **create.** Mappers + `createOrGetThread`, `listCoachMessages`.
- `app/api/coach/turn/route.ts` — **create.** Enqueue route.
- `supabase/functions/voice-coach/policy.ts` — **create.** Deno port of `coachPolicy.ts`.
- `supabase/functions/voice-coach/index.ts` — **create.** Deno pipeline worker.
- `lib/coach/useCoachThread.ts` — **create.** Realtime subscription + messages state.
- `app/coach/[threadId]/page.tsx` — **create.** Thread screen (record + playback).
- `components/beta/CoachLauncher.tsx` — **create.** "Talk it through" entry.
- `app/practice/page.tsx`, `app/proof/[id]/page.tsx` — **modify.** Add launcher.
- `components/beta/AppShell.tsx` — **modify.** Add `/coach` to `protectedPrefixes`.
- `.env.example`, `docs/BETA_QA.md` — **modify.** Document secrets + QA.

## Reference (verified current patterns)

- Realtime channel pattern (mirror), from `AppStateProvider.tsx`:
  `supabase.channel(\`notifications:${uid}\`).on("postgres_changes", { event, schema:"public", table, filter:\`user_id=eq.${uid}\` }, cb).subscribe()`.
- `protectedPrefixes` array in `components/beta/AppShell.tsx:16`.
- Protected API route pattern: `export const runtime = "nodejs";` + `getSupabaseServiceClient()` (from `lib/supabase/server`) + `getAuthedUser(req)` (from `lib/supabase/serverAuth`).
- Mapper style: snake→camel, `?? null`/`?? []` defaults (see `mapNotification`).
- `getSupabaseClient()` (browser) from `lib/supabase/client`.

---

## SLICE 1 — Backend (data model + pipeline + enqueue)

### Task 1: Migration 026 (tables, RLS, bucket, realtime)

**Files:** Create `supabase/migrations/026_voice_coach.sql`

- [ ] **Step 1: Branch**
```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b voice-coach
```

- [ ] **Step 2: Write `supabase/migrations/026_voice_coach.sql`**
```sql
-- 026_voice_coach.sql — spoken AI coach (additive). Owner-only, private, no trust.
create table if not exists public.coach_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id text,
  proof_id uuid references public.proofs(id) on delete set null,
  title text,
  turn_count int not null default 0,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists coach_threads_user_idx on public.coach_threads(user_id, last_message_at desc);

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.coach_threads(id) on delete cascade,
  role text not null check (role in ('member','coach')),
  transcript text,
  audio_path text,
  status text not null check (status in ('pending','ready','failed')) default 'ready',
  error text,
  created_at timestamptz not null default now()
);
create index if not exists coach_messages_thread_idx on public.coach_messages(thread_id, created_at);

alter table public.coach_threads enable row level security;
alter table public.coach_messages enable row level security;

drop policy if exists coach_threads_owner on public.coach_threads;
create policy coach_threads_owner on public.coach_threads
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists coach_messages_owner on public.coach_messages;
create policy coach_messages_owner on public.coach_messages
  for all
  using (exists (select 1 from public.coach_threads t where t.id = thread_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.coach_threads t where t.id = thread_id and t.user_id = auth.uid()));

-- Realtime for the coach reply (pending -> ready/failed).
alter publication supabase_realtime add table public.coach_messages;

-- Private audio bucket (member recordings + generated replies).
insert into storage.buckets (id, name, public)
values ('coach-audio', 'coach-audio', false)
on conflict (id) do nothing;

drop policy if exists coach_audio_owner_rw on storage.objects;
create policy coach_audio_owner_rw on storage.objects
  for all to authenticated
  using (bucket_id = 'coach-audio' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'coach-audio' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 3: Apply via Supabase MCP** (project `qfzguujtjloskyxcdbon`): use `apply_migration` with name `026_voice_coach` and the SQL above. Then run `get_advisors(type: "security")` and confirm no new errors referencing `coach_threads`/`coach_messages`/`coach-audio`. (Idempotent — safe to re-apply.)

- [ ] **Step 4: Verify columns**: `execute_sql` →
```sql
select table_name, count(*) from information_schema.columns
where table_name in ('coach_threads','coach_messages') group by table_name;
```
Expected: `coach_threads` 8, `coach_messages` 7.

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/026_voice_coach.sql
git commit -m "feat(db): coach threads/messages + private coach-audio bucket (026)"
```

---

### Task 2: Canonical coach policy + pure check

**Files:** Create `lib/coach/coachPolicy.ts`, `scripts/check-coach-safety.ts`

**Interfaces:**
- Produces:
  - `coachSafetyPrecheck(text: string): { ok: boolean; redirect?: string }`
  - `COACH_TURN_CAP: number`; `isAtTurnCap(turnCount: number): boolean`
  - `buildCoachContext(input: { goalText?: string|null; startingLevel?: string|null; contextTags?: string[]; anchorTitle?: string|null; history: { role: "member"|"coach"; transcript: string }[]; latest: string }): string`
  - `COACH_SYSTEM_PROMPT: string`

- [ ] **Step 1: Create `lib/coach/coachPolicy.ts`**
```ts
// Canonical (Node) coach policy. The Deno Edge Function carries a mirrored port at
// supabase/functions/voice-coach/policy.ts — keep the two in sync. Pure, no I/O.

const CRISIS = [/\bkill myself\b/i, /\bsuicide\b/i, /\bend my life\b/i, /\bhurt myself\b/i, /\bself[-\s]?harm\b/i];
const HARASSMENT = [/\bworthless\b/i, /\bstupid\b/i, /\bidiot\b/i, /\bshut up\b/i];
const PRIVATE_INFO = [/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b(password|api key|secret key|service role)\b/i];

const CRISIS_REDIRECT =
  "It sounds like you're going through something heavy. This coach can't help with that safely — please reach out to a person you trust or a local crisis line. We can pick practice back up whenever you're ready.";
const GENTLE_REDIRECT =
  "Let's keep this to your practice. Try rephrasing without names, contact details, or harsh wording, and we'll take one small step.";

/** Runs BEFORE the model on each transcribed member turn. */
export function coachSafetyPrecheck(text: string): { ok: boolean; redirect?: string } {
  if (CRISIS.some((re) => re.test(text))) return { ok: false, redirect: CRISIS_REDIRECT };
  if (PRIVATE_INFO.some((re) => re.test(text))) return { ok: false, redirect: GENTLE_REDIRECT };
  if (HARASSMENT.some((re) => re.test(text))) return { ok: false, redirect: GENTLE_REDIRECT };
  return { ok: true };
}

export const COACH_TURN_CAP = 6;
export function isAtTurnCap(turnCount: number): boolean {
  return turnCount >= COACH_TURN_CAP;
}

export const COACH_SYSTEM_PROMPT = `
You are Collective's Voice Coach — a calm, beginner-safe practice coach.
Respond to what the member said in 2-4 short spoken sentences. Name one small next step.
Reflect the practice, never judge the person. This is support, not authority.
Do not: score/rank confidence, skill, worth, or trust; promise outcomes; use clout,
popularity, or performative language; diagnose feelings or give therapy.
`.trim();

/** Build the user-turn prompt: persona + anchor + recent turns + the latest transcript. */
export function buildCoachContext(input: {
  goalText?: string | null;
  startingLevel?: string | null;
  contextTags?: string[];
  anchorTitle?: string | null;
  history: { role: "member" | "coach"; transcript: string }[];
  latest: string;
}): string {
  const lines: string[] = [];
  if (input.anchorTitle) lines.push(`Practice/Proof: ${input.anchorTitle}`);
  if (input.startingLevel) lines.push(`Starting level: ${input.startingLevel}`);
  if (input.goalText) lines.push(`Their goal (their words): ${input.goalText}`);
  if (input.contextTags?.length) lines.push(`Why now: ${input.contextTags.join(", ")}`);
  const recent = input.history.slice(-6).map((m) => `${m.role === "member" ? "Member" : "Coach"}: ${m.transcript}`).join("\n");
  if (recent) lines.push(`Recent conversation:\n${recent}`);
  lines.push(`Member just said: ${input.latest}`);
  return lines.join("\n");
}
```

- [ ] **Step 2: Create `scripts/check-coach-safety.ts`**
```ts
import assert from "node:assert";
import { coachSafetyPrecheck, isAtTurnCap, COACH_TURN_CAP, buildCoachContext } from "../lib/coach/coachPolicy";
import { assertBrandSafe } from "../lib/ai/outputPolicy";

// pre-gate: crisis + private info + harassment blocked; clean passes
assert.equal(coachSafetyPrecheck("I want to kill myself").ok, false, "crisis blocked");
assert.equal(coachSafetyPrecheck("my email is a@b.com").ok, false, "private info blocked");
assert.equal(coachSafetyPrecheck("you are an idiot").ok, false, "harassment blocked");
assert.equal(coachSafetyPrecheck("I practiced saying one clear thing").ok, true, "clean passes");
assert.ok(coachSafetyPrecheck("suicide").redirect, "redirect text present on block");

// turn cap
assert.equal(isAtTurnCap(COACH_TURN_CAP - 1), false, "under cap allowed");
assert.equal(isAtTurnCap(COACH_TURN_CAP), true, "at cap blocked");

// context builder: includes persona+anchor, omits absent, no cross-user data, includes latest
const ctx = buildCoachContext({ goalText: "Speak up in meetings", startingLevel: "building", anchorTitle: "Say one clear thing", contextTags: ["speaking_up_at_work"], history: [{ role: "member", transcript: "I tried" }], latest: "It felt hard" });
assert.ok(ctx.includes("Speak up in meetings") && ctx.includes("Say one clear thing") && ctx.includes("It felt hard"), "context reflects inputs");
const empty = buildCoachContext({ history: [], latest: "hi" });
assert.ok(!empty.includes("goal") && empty.includes("hi"), "omits absent persona");

// brand-safe output reused
let threw = false; try { assertBrandSafe(["your confidence score is 9"]); } catch { threw = true; }
assert.ok(threw, "brand policy still catches forbidden output");

console.log("coach-safety checks passed");
```

- [ ] **Step 3: Run + typecheck + commit**
```bash
npx tsx scripts/check-coach-safety.ts
npm run typecheck
git add lib/coach/coachPolicy.ts scripts/check-coach-safety.ts
git commit -m "feat(coach): canonical safety/turn-cap/context policy + runnable check"
```
Expected: `coach-safety checks passed`; typecheck clean.

---

### Task 3: Coach repository + types + enqueue route

**Files:** Create `lib/coach/types.ts`, `lib/supabase/coachRepository.ts`, `app/api/coach/turn/route.ts`

**Interfaces:**
- Produces: `CoachThread`, `CoachMessage`; `mapCoachThread`, `mapCoachMessage`, `createOrGetThread(client, userId, anchor)`, `listCoachMessages(client, threadId)`; `POST /api/coach/turn`.

- [ ] **Step 1: Create `lib/coach/types.ts`**
```ts
export type CoachMessageRole = "member" | "coach";
export type CoachMessageStatus = "pending" | "ready" | "failed";

export type CoachThread = {
  id: string;
  userId: string;
  promptId: string | null;
  proofId: string | null;
  title: string | null;
  turnCount: number;
  lastMessageAt: string;
  createdAt: string;
};

export type CoachMessage = {
  id: string;
  threadId: string;
  role: CoachMessageRole;
  transcript: string | null;
  audioPath: string | null;
  status: CoachMessageStatus;
  error: string | null;
  createdAt: string;
};
```

- [ ] **Step 2: Create `lib/supabase/coachRepository.ts`**
```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoachMessage, CoachThread } from "@/lib/coach/types";

export function mapCoachThread(row: any): CoachThread {
  return {
    id: row.id,
    userId: row.user_id,
    promptId: row.prompt_id ?? null,
    proofId: row.proof_id ?? null,
    title: row.title ?? null,
    turnCount: row.turn_count ?? 0,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
  };
}

export function mapCoachMessage(row: any): CoachMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    role: row.role,
    transcript: row.transcript ?? null,
    audioPath: row.audio_path ?? null,
    status: row.status,
    error: row.error ?? null,
    createdAt: row.created_at,
  };
}

/** Find the member's existing thread for an anchor, or create one. */
export async function createOrGetThread(
  client: SupabaseClient,
  userId: string,
  anchor: { promptId?: string | null; proofId?: string | null; title?: string | null },
): Promise<CoachThread> {
  let q = client.from("coach_threads").select("*").eq("user_id", userId).limit(1);
  if (anchor.proofId) q = q.eq("proof_id", anchor.proofId);
  else if (anchor.promptId) q = q.eq("prompt_id", anchor.promptId);
  const { data: existing } = await q;
  if (existing && existing[0]) return mapCoachThread(existing[0]);

  const { data, error } = await client
    .from("coach_threads")
    .insert({ user_id: userId, prompt_id: anchor.promptId ?? null, proof_id: anchor.proofId ?? null, title: anchor.title ?? null })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message || "Could not create coach thread");
  return mapCoachThread(data);
}

export async function listCoachMessages(client: SupabaseClient, threadId: string): Promise<CoachMessage[]> {
  const { data } = await client.from("coach_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
  return (data ?? []).map(mapCoachMessage);
}
```

- [ ] **Step 3: Create `app/api/coach/turn/route.ts`**
```ts
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/serverAuth";
import { isAtTurnCap } from "@/lib/coach/coachPolicy";

export const runtime = "nodejs";

/** Enqueue one coach turn: insert member msg + pending coach placeholder, invoke the Edge Function. */
export async function POST(req: Request) {
  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { threadId, audioPath } = (await req.json()) as { threadId?: string; audioPath?: string };
  if (!threadId || !audioPath) return NextResponse.json({ error: "Missing threadId or audioPath." }, { status: 400 });

  const { data: thread } = await service.from("coach_threads").select("*").eq("id", threadId).single();
  if (!thread || thread.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (isAtTurnCap(thread.turn_count ?? 0)) return NextResponse.json({ error: "turn_cap" }, { status: 409 });
  // audioPath must be under this user's folder.
  if (!audioPath.startsWith(`${user.id}/`)) return NextResponse.json({ error: "Bad path" }, { status: 400 });

  const { data: memberMsg, error: mErr } = await service
    .from("coach_messages")
    .insert({ thread_id: threadId, role: "member", audio_path: audioPath, status: "ready" })
    .select("id").single();
  if (mErr || !memberMsg) return NextResponse.json({ error: "Could not save turn." }, { status: 500 });

  const { data: coachMsg, error: cErr } = await service
    .from("coach_messages")
    .insert({ thread_id: threadId, role: "coach", status: "pending" })
    .select("id").single();
  if (cErr || !coachMsg) return NextResponse.json({ error: "Could not start coach reply." }, { status: 500 });

  // Fire-and-forget the Edge Function (service role). Do not await its completion.
  void service.functions.invoke("voice-coach", {
    body: { threadId, memberMessageId: memberMsg.id, coachMessageId: coachMsg.id },
  });

  return NextResponse.json({ ok: true, memberMessageId: memberMsg.id, coachMessageId: coachMsg.id }, { status: 202 });
}
```

- [ ] **Step 4: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add lib/coach/types.ts lib/supabase/coachRepository.ts app/api/coach/turn/route.ts
git commit -m "feat(coach): repository + types + enqueue turn route"
```
Expected: typecheck clean; compiled.

---

### Task 4: Edge Function pipeline (Deno) + policy port

**Files:** Create `supabase/functions/voice-coach/policy.ts`, `supabase/functions/voice-coach/index.ts`

**Interfaces:**
- Consumes: invoked with `{ threadId, memberMessageId, coachMessageId }`; service role via env.
- Produces: writes member transcript + coach reply (`ready`/`failed`) rows; uploads reply audio.

- [ ] **Step 1: Create `supabase/functions/voice-coach/policy.ts`** (Deno port — mirror `lib/coach/coachPolicy.ts` exactly):
```ts
// Deno port of lib/coach/coachPolicy.ts. Keep in sync with the canonical Node copy.
const CRISIS = [/\bkill myself\b/i, /\bsuicide\b/i, /\bend my life\b/i, /\bhurt myself\b/i, /\bself[-\s]?harm\b/i];
const HARASSMENT = [/\bworthless\b/i, /\bstupid\b/i, /\bidiot\b/i, /\bshut up\b/i];
const PRIVATE_INFO = [/\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, /\b(password|api key|secret key|service role)\b/i];
const FORBIDDEN = [/\bconfidence score\b/i, /\b(trust|skill|worth)\s+score\b/i, /\bleaderboard\b/i, /\bfollowers?\b/i, /\bgo viral\b/i, /\bclout\b/i, /\byou failed\b/i, /\bthis proves you are\b/i];

const CRISIS_REDIRECT = "It sounds like you're going through something heavy. This coach can't help with that safely — please reach out to a person you trust or a local crisis line. We can pick practice back up whenever you're ready.";
const GENTLE_REDIRECT = "Let's keep this to your practice. Try rephrasing without names, contact details, or harsh wording, and we'll take one small step.";

export function coachSafetyPrecheck(text: string): { ok: boolean; redirect?: string } {
  if (CRISIS.some((re) => re.test(text))) return { ok: false, redirect: CRISIS_REDIRECT };
  if (PRIVATE_INFO.some((re) => re.test(text))) return { ok: false, redirect: GENTLE_REDIRECT };
  if (HARASSMENT.some((re) => re.test(text))) return { ok: false, redirect: GENTLE_REDIRECT };
  return { ok: true };
}
export function brandSafe(text: string): boolean {
  return !FORBIDDEN.some((re) => re.test(text));
}
export const COACH_SYSTEM_PROMPT = `
You are Collective's Voice Coach — a calm, beginner-safe practice coach.
Respond to what the member said in 2-4 short spoken sentences. Name one small next step.
Reflect the practice, never judge the person. This is support, not authority.
Do not: score/rank confidence, skill, worth, or trust; promise outcomes; use clout,
popularity, or performative language; diagnose feelings or give therapy.
`.trim();
const CANNED = "Thanks for sharing that. One small next step: try it once more, a little slower, and notice what changes.";
export const CANNED_REPLY = CANNED;
```

- [ ] **Step 2: Create `supabase/functions/voice-coach/index.ts`**
```ts
// Deno Edge Function: STT -> safety -> LLM -> brand-check -> TTS -> write reply row.
// Secrets: SB_URL/SERVICE_ROLE auto-injected as SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY;
// OPENAI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID set via `supabase secrets set`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { coachSafetyPrecheck, brandSafe, COACH_SYSTEM_PROMPT, CANNED_REPLY } from "./policy.ts";

const BUCKET = "coach-audio";

Deno.serve(async (req) => {
  const { threadId, memberMessageId, coachMessageId } = await req.json();
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const elevenKey = Deno.env.get("ELEVENLABS_API_KEY");
  const voiceId = Deno.env.get("ELEVENLABS_VOICE_ID") || "21m00Tcm4TlvDq8ikWAM";
  const db = createClient(url, serviceKey);

  const fail = async (msg: string) => {
    await db.from("coach_messages").update({ status: "failed", error: msg }).eq("id", coachMessageId);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 200 });
  };
  const finish = async (transcript: string, audioPath: string | null) => {
    await db.from("coach_messages").update({ transcript, audio_path: audioPath, status: "ready" }).eq("id", coachMessageId);
    const { data: t } = await db.from("coach_threads").select("turn_count").eq("id", threadId).single();
    await db.from("coach_threads").update({ turn_count: (t?.turn_count ?? 0) + 1, last_message_at: new Date().toISOString() }).eq("id", threadId);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    if (!openaiKey) return await fail("AI is not configured.");
    // (a) member audio
    const { data: member } = await db.from("coach_messages").select("audio_path").eq("id", memberMessageId).single();
    if (!member?.audio_path) return await fail("Missing member audio.");
    const dl = await db.storage.from(BUCKET).download(member.audio_path);
    if (dl.error || !dl.data) return await fail("Could not read audio.");

    // (b) Whisper transcription
    const form = new FormData();
    form.append("file", dl.data, "turn.webm");
    form.append("model", "whisper-1");
    const sttRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST", headers: { Authorization: `Bearer ${openaiKey}` }, body: form,
    });
    if (!sttRes.ok) return await fail("Transcription failed.");
    const transcript = ((await sttRes.json()).text ?? "").trim();
    await db.from("coach_messages").update({ transcript }).eq("id", memberMessageId);

    // (c) safety pre-gate
    const gate = coachSafetyPrecheck(transcript);
    if (!gate.ok) return await finish(gate.redirect!, null);

    // (d) context
    const { data: thread } = await db.from("coach_threads").select("user_id, prompt_id, proof_id, title").eq("id", threadId).single();
    const { data: profile } = await db.from("profiles").select("goal_text, starting_level, context_tags").eq("id", thread?.user_id).single();
    const { data: history } = await db.from("coach_messages").select("role, transcript").eq("thread_id", threadId).eq("status", "ready").order("created_at", { ascending: true });
    const persona: string[] = [];
    if (thread?.title) persona.push(`Practice/Proof: ${thread.title}`);
    if (profile?.starting_level) persona.push(`Starting level: ${profile.starting_level}`);
    if (profile?.goal_text) persona.push(`Their goal: ${profile.goal_text}`);
    if (profile?.context_tags?.length) persona.push(`Why now: ${profile.context_tags.join(", ")}`);
    const recent = (history ?? []).filter((m: any) => m.transcript).slice(-6).map((m: any) => `${m.role === "member" ? "Member" : "Coach"}: ${m.transcript}`).join("\n");
    const userPrompt = [...persona, recent && `Recent conversation:\n${recent}`, `Member just said: ${transcript}`].filter(Boolean).join("\n");

    // (e) gpt-4o-mini
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: Deno.env.get("COLLECTIVE_AI_MODEL") || "gpt-4o-mini", max_tokens: 300, messages: [{ role: "system", content: COACH_SYSTEM_PROMPT }, { role: "user", content: userPrompt }] }),
    });
    if (!chatRes.ok) return await fail("Coach reply failed.");
    let reply = (((await chatRes.json()).choices?.[0]?.message?.content) ?? "").trim();
    if (!reply || !brandSafe(reply)) reply = CANNED_REPLY;

    // (f) ElevenLabs TTS — graceful: missing key/error -> save text reply, audio_path null
    let audioPath: string | null = null;
    if (elevenKey) {
      try {
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: { "xi-api-key": elevenKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
          body: JSON.stringify({ text: reply, model_id: "eleven_turbo_v2" }),
        });
        if (ttsRes.ok) {
          const bytes = new Uint8Array(await ttsRes.arrayBuffer());
          const path = `${thread?.user_id}/${threadId}/${crypto.randomUUID()}.mp3`;
          const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: "audio/mpeg", upsert: false });
          if (!up.error) audioPath = path;
        }
      } catch (_) { /* graceful: keep audioPath null */ }
    }
    return await finish(reply, audioPath);
  } catch (e) {
    return await fail("Coach pipeline error.");
  }
});
```

- [ ] **Step 3: `deno check`** (if Deno is installed): `deno check supabase/functions/voice-coach/index.ts`. If Deno is not installed locally, skip with a note in the report (the function is validated at `supabase functions deploy` time) — do NOT block the task on a missing local Deno.

- [ ] **Step 4: Verify the Node↔Deno policy parity** — confirm `coachSafetyPrecheck` regex arrays + redirect strings + `COACH_SYSTEM_PROMPT` match between `lib/coach/coachPolicy.ts` and `supabase/functions/voice-coach/policy.ts`:
```bash
diff <(grep -A6 "const CRISIS" lib/coach/coachPolicy.ts) <(grep -A6 "const CRISIS" supabase/functions/voice-coach/policy.ts) && echo "CRISIS parity OK"
```
(Expected identical CRISIS/HARASSMENT/PRIVATE_INFO lines + identical system prompt.)

- [ ] **Step 5: Commit**
```bash
git add supabase/functions/voice-coach/policy.ts supabase/functions/voice-coach/index.ts
git commit -m "feat(coach): voice-coach Edge Function (Whisper->gpt-4o-mini->ElevenLabs) + policy port"
```

> **Deploy note (not a code step):** the function is deployed with `supabase functions deploy voice-coach` and secrets set via `supabase secrets set OPENAI_API_KEY=… ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_ID=…`. Document in Task 8; deployment happens outside this branch's automated checks.

---

## SLICE 2 — UI (record, playback, thread, launchers)

### Task 5: Realtime hook + coach thread screen

**Files:** Create `lib/coach/useCoachThread.ts`, `app/coach/[threadId]/page.tsx`

**Interfaces:**
- Consumes: `getSupabaseClient`, `mapCoachMessage`, `listCoachMessages` (Task 3), `useSignedMediaUrl`, `isAtTurnCap`/`COACH_TURN_CAP` (Task 2).
- Produces: `useCoachThread(threadId)` → `{ messages, loading }`; the thread page.

- [ ] **Step 1: Create `lib/coach/useCoachThread.ts`**
```ts
"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { listCoachMessages, mapCoachMessage } from "@/lib/supabase/coachRepository";
import type { CoachMessage } from "@/lib/coach/types";

/** Load a thread's messages and stream inserts/updates (pending -> ready/failed) via Realtime. */
export function useCoachThread(threadId: string): { messages: CoachMessage[]; loading: boolean } {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !threadId) { setLoading(false); return; }
    let active = true;
    listCoachMessages(supabase, threadId).then((rows) => { if (active) { setMessages(rows); setLoading(false); } });

    const upsert = (row: any) => {
      const m = mapCoachMessage(row);
      setMessages((cur) => {
        const i = cur.findIndex((x) => x.id === m.id);
        if (i === -1) return [...cur, m];
        const next = cur.slice(); next[i] = m; return next;
      });
    };
    const channel = supabase
      .channel(`coach:${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "coach_messages", filter: `thread_id=eq.${threadId}` }, (p) => upsert(p.new))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "coach_messages", filter: `thread_id=eq.${threadId}` }, (p) => upsert(p.new))
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [threadId]);

  return { messages, loading };
}
```

- [ ] **Step 2: Create `app/coach/[threadId]/page.tsx`** (record → upload → POST; render messages; coach audio via `useSignedMediaUrl`):
```tsx
"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { PageHeader, Button } from "@/components/beta/ui";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useCoachThread } from "@/lib/coach/useCoachThread";
import { useSignedMediaUrl } from "@/lib/media/useSignedMediaUrl";
import { isAtTurnCap } from "@/lib/coach/coachPolicy";
import type { CoachMessage } from "@/lib/coach/types";

function CoachAudio({ path }: { path: string }) {
  const { url } = useSignedMediaUrl("coach-audio", path);
  if (!url) return null;
  return <audio controls src={url} className="mt-2 w-full" />;
}

function Bubble({ m }: { m: CoachMessage }) {
  const mine = m.role === "member";
  return (
    <div className={`rounded-2xl p-3 text-sm leading-6 ${mine ? "bg-[#FFF1C7] text-[#7A5300]" : "bg-[#FFFDF8] border border-[#EFE7D8] text-[#111111]"}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#9B958B]">{mine ? "You" : "Coach"}</p>
      {m.status === "pending" ? <p className="text-[#6E6E6E]">Coach is thinking…</p>
        : m.status === "failed" ? <p className="text-[#6E6E6E]">Something went wrong. Try again.</p>
        : <p>{m.transcript}</p>}
      {!mine && m.status === "ready" && m.audioPath && <CoachAudio path={m.audioPath} />}
    </div>
  );
}

export default function CoachThreadPage() {
  const params = useParams<{ threadId: string }>();
  const threadId = params.threadId;
  const { messages } = useCoachThread(threadId);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const memberTurns = messages.filter((m) => m.role === "member").length;
  const capped = isAtTurnCap(memberTurns);

  async function start() {
    setError(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); void upload(new Blob(chunksRef.current, { type: "audio/webm" })); };
    recorderRef.current = rec; rec.start(); setRecording(true);
  }
  function stop() { recorderRef.current?.stop(); setRecording(false); }

  async function upload(blob: Blob) {
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { data: u } = await supabase!.auth.getUser();
      const uid = u.user?.id;
      if (!uid) { setError("Please sign in."); return; }
      const path = `${uid}/${threadId}/${crypto.randomUUID()}.webm`;
      const up = await supabase!.storage.from("coach-audio").upload(path, blob, { contentType: "audio/webm" });
      if (up.error) { setError("Upload failed. Try again."); return; }
      const res = await fetch("/api/coach/turn", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threadId, audioPath: path }) });
      if (!res.ok) setError(res.status === 409 ? "You've done plenty for now — take a breath." : "Could not send. Try again.");
    } finally { setBusy(false); }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader title="Talk it through" subtitle="Record a short voice note. Your coach replies." />
        <div className="space-y-3">{messages.map((m) => <Bubble key={m.id} m={m} />)}</div>
        {error && <p className="rounded-2xl bg-[#FFF1C7] p-3 text-sm font-bold text-[#7A5300]">{error}</p>}
        {capped ? (
          <p className="text-center text-sm text-[#6E6E6E]">Let's pause here — you've got plenty to practice.</p>
        ) : (
          <Button className="w-full" disabled={busy} onClick={recording ? stop : start}>
            {recording ? "Stop & send" : busy ? "Sending…" : "Record a turn"}
          </Button>
        )}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 3: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add lib/coach/useCoachThread.ts "app/coach/[threadId]/page.tsx"
git commit -m "feat(coach): realtime thread hook + voice thread screen (record + playback)"
```
Expected: typecheck clean; compiled.

---

### Task 6: Launcher entry + protected route

**Files:** Create `components/beta/CoachLauncher.tsx`; Modify `app/practice/page.tsx`, `app/proof/[id]/page.tsx`, `components/beta/AppShell.tsx`

**Interfaces:**
- Consumes: `createOrGetThread` (Task 3), `getSupabaseClient`, `useBetaApp` (for currentUser).
- Produces: `<CoachLauncher promptId? proofId? title? />` button that creates/opens a thread and routes to `/coach/[threadId]`.

- [ ] **Step 1: Create `components/beta/CoachLauncher.tsx`**
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/beta/ui";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createOrGetThread } from "@/lib/supabase/coachRepository";
import { useBetaApp } from "@/components/beta/AppStateProvider";

export function CoachLauncher({ promptId, proofId, title }: { promptId?: string; proofId?: string; title?: string }) {
  const router = useRouter();
  const { currentUser, supabaseEnabled } = useBetaApp();
  const [busy, setBusy] = useState(false);
  if (!supabaseEnabled) return null; // coach needs the backend (STT/LLM/TTS)

  async function open() {
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { data: u } = await supabase!.auth.getUser();
      const uid = u.user?.id || currentUser?.id;
      if (!uid) return;
      const thread = await createOrGetThread(supabase!, uid, { promptId: promptId ?? null, proofId: proofId ?? null, title: title ?? null });
      router.push(`/coach/${thread.id}`);
    } finally { setBusy(false); }
  }

  return (
    <Button variant="secondary" className="w-full" disabled={busy} onClick={open}>
      {busy ? "Opening…" : "Talk it through with your coach"}
    </Button>
  );
}
```

- [ ] **Step 2: Add `/coach` to `protectedPrefixes`** in `components/beta/AppShell.tsx:16` — add `"/coach"` to the array.

- [ ] **Step 3: Place the launcher on Practice** (`app/practice/page.tsx`) — inside the `nextPrompt` area, after the AiSupportCard, add:
```tsx
        {nextPrompt && <CoachLauncher promptId={nextPrompt.id} title={nextPrompt.title} />}
```
and import: `import { CoachLauncher } from "@/components/beta/CoachLauncher";`.

- [ ] **Step 4: Place the launcher on Proof detail** (`app/proof/[id]/page.tsx`) — after the proof's main card, add `<CoachLauncher proofId={proof.id} title={prompt?.title ?? proof.title} />` (use the variables in scope; if the proof object is named differently, match it) and import `CoachLauncher`. If `app/proof/[id]/page.tsx` is a server component, wrap the launcher placement consistent with how other client widgets are embedded there (CoachLauncher is `"use client"`, so it can be rendered directly).

- [ ] **Step 5: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add components/beta/CoachLauncher.tsx components/beta/AppShell.tsx app/practice/page.tsx "app/proof/[id]/page.tsx"
git commit -m "feat(coach): launcher entry on practice/proof + /coach protected route"
```
Expected: typecheck clean; compiled.

---

## SLICE 3 — Polish + docs + verify

### Task 7: Docs + final verification

**Files:** Modify `.env.example`, `docs/BETA_QA.md`

- [ ] **Step 1: Append to `.env.example`**
```bash
cat >> .env.example <<'EOF'

# Voice Coach Edge Function secrets — set with `supabase secrets set` (NOT in Vercel/client).
# ELEVENLABS_API_KEY missing => coach still replies with text, no audio (graceful).
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
EOF
```
(If these keys already exist in `.env.example` from the AI layer, only add the ElevenLabs lines + comment.)

- [ ] **Step 2: Append an AI/Voice-coach QA section to `docs/BETA_QA.md`**
```markdown
## Voice Coach
- Tables: coach_threads, coach_messages (RLS owner-only); private bucket coach-audio.
- Pipeline (Edge Function voice-coach): Whisper STT -> safety pre-gate -> gpt-4o-mini -> brand check -> ElevenLabs TTS -> Realtime.
- Deploy: `supabase functions deploy voice-coach`; secrets via `supabase secrets set OPENAI_API_KEY=… ELEVENLABS_API_KEY=… ELEVENLABS_VOICE_ID=…`.
- Graceful: no ELEVENLABS_API_KEY => text reply only (audio_path null). No OPENAI_API_KEY => coach reply fails (status failed) with calm retry.
- Guardrails: gentle turn cap (6); coach earns no trust, never in feeds, private to the member.
- Verify pure layer: `npx tsx scripts/check-coach-safety.ts`.
```

- [ ] **Step 3: Full verification**
```bash
npx tsx scripts/check-coach-safety.ts
npx tsx scripts/check-ai-output-policy.ts
npm run typecheck
npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: both checks pass; typecheck clean; `✓ Compiled successfully`.

- [ ] **Step 4: Commit**
```bash
git add .env.example docs/BETA_QA.md
git commit -m "docs(coach): document Edge Function secrets + voice-coach QA"
```

> **Out of automated scope (manual, documented):** deploying the Edge Function + setting secrets, and a live end-to-end voice turn. These require the Supabase CLI + real keys and happen outside this branch's checks.

---

## Self-Review

**1. Spec coverage:**
- Dedicated tables + RLS + private bucket + realtime (migration 026) → Task 1. ✓
- Safety pre-gate + brand validation + turn cap + context (canonical + Deno port) → Tasks 2, 4. ✓
- Repo + types + enqueue route (member + pending coach rows, invoke fn, turn-cap guard, path check) → Task 3. ✓
- Edge Function pipeline (Whisper→gpt-4o-mini→brand→ElevenLabs→write+bump), graceful TTS degradation, crisis safe-redirect → Task 4. ✓
- Realtime hook + record/playback thread UI (useSignedMediaUrl) → Task 5. ✓
- Launcher on practice/proof + /coach protected → Task 6. ✓
- Docs/secrets + final verify → Task 7. ✓
- No trust / private / owner-only / beginner-safe → Global Constraints + RLS + policy. ✓

**2. Placeholder scan:** No TBD/TODO. Complete code in each code step. The `deno check` / deploy / live-turn items are explicitly marked out-of-automated-scope with reasons (need Deno/CLI/keys), not hidden placeholders.

**3. Type consistency:** `CoachThread`/`CoachMessage` (Task 3 types) match `mapCoachThread`/`mapCoachMessage` and are consumed by Tasks 5/6. `createOrGetThread(client,userId,anchor)` defined Task 3, used Task 6. `useCoachThread(threadId)→{messages,loading}` defined Task 5, used in the page. `isAtTurnCap`/`COACH_TURN_CAP` defined Task 2, used in Tasks 3 & 5. `coachSafetyPrecheck`/`COACH_SYSTEM_PROMPT` canonical (Task 2) mirrored in the Deno port (Task 4) with a parity check. `useSignedMediaUrl("coach-audio", path)` matches the shipped hook signature. Route returns 202 + `{memberMessageId, coachMessageId}`; Edge Function consumes `{threadId, memberMessageId, coachMessageId}` — consistent.
```
