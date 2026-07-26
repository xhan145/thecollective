# 30-Second Voice/Video Introduction Clips — Design

**Date:** 2026-07-26
**Status:** Approved (user approved the design; build authorized to run autonomously)
**Package:** Founding-cohort beta add-on. Own branch `feat/intro-clips` off `origin/main`, own PR, gated by an adversarial multi-agent review before opening.

## Goal

Let a member add one short self-introduction — **voice OR video (their choice), hard-capped at 30 seconds** — to their passport. When another member visits their profile (`/member/[id]`), they can play the clip before deciding to ask for an introduction. This reinforces Collective's **introductions** model (request → accept), rather than a friends/follow model. The existing one-way "Learn from" connection is untouched.

## Context (verified on 2026-07-26)

- There is **no "friends"/"follow"** feature. The nearest thing is a one-way "Learn from" button (`member_connections`), which stays as-is (it drives feed ranking).
- An **introductions system already exists** and is fully wired: `introduction_requests` (pending/accepted/declined), guided intro content (`profile_details`), profile fields (`headline`, `open_to_introductions`, `introduction_summary`), the member passport `/member/[id]`, "Ask for an introduction", and the accept/decline inbox on `/passport`.
- **Profile visiting already works**: proof author names link to `/member/[id]`.
- The genuinely new surface is the **30s clip**. Everything else is small wiring.
- Live DB is *ahead* of git `main`: migrations 042–049 (Packages 0/4, still open PRs) are already applied to the live project. `collective-proof-media` is therefore already private on live. To avoid a filename collision with the reserved 042–049 on those branches, this migration is numbered **050**.

## Global Constraints

- **Approved vocabulary only** (anti-clout): no likes, followers, view counts, leaderboards, or public counts. A clip is a self-introduction, never a popularity signal. No "plays" count is stored or shown.
- **Trust never shown as a number** — unchanged; not touched here.
- **Clients never write privileged profile columns directly.** Per `036_profile_column_guard`, `profiles` client UPDATE is restricted to an allowlist. The new `intro_clip_*` columns are deliberately **excluded** from that allowlist; they are written only through SECURITY DEFINER RPCs. Do **not** add them to the 036 grant.
- **Additive migration only.** No destructive changes. New bucket + new columns + new RPCs + new storage policies.
- Next.js 16 App Router, TypeScript strict, Tailwind, Supabase, react-query. Mirror existing patterns (`uploadProofFile`, `useSignedMediaUrl`, `passportRepository`, `memberRepository`).

## Data model — migration `050_intro_clips.sql`

### Profile columns (additive)
```sql
alter table public.profiles add column if not exists intro_clip_path text;
alter table public.profiles add column if not exists intro_clip_kind text
  check (intro_clip_kind in ('audio','video'));
alter table public.profiles add column if not exists intro_clip_duration_seconds int
  check (intro_clip_duration_seconds is null or (intro_clip_duration_seconds between 1 and 30));
alter table public.profiles add column if not exists intro_clip_updated_at timestamptz;
```
These columns are **server-only writable** (not added to the 036 allowlist). Reads: `profiles` is already broadly readable in the community; exposing the `intro_clip_path` string is harmless because the object is in a **private** bucket — the path is useless without a signed URL, and signing is gated by storage RLS.

### RPCs (SECURITY DEFINER, revoked from anon/public; authenticated-only)
```sql
-- Set/replace the caller's own intro clip. Validates kind, clamps duration 1..30,
-- verifies the path is inside the caller's own {uid}/... folder, and ensures a
-- profile_details row exists so the clip has a defined visibility (defaults 'members').
create function public.set_intro_clip(p_path text, p_kind text, p_duration int) returns void ...

-- Clear the caller's intro clip (used after the object is deleted client-side).
create function public.clear_intro_clip() returns void ...
```
`set_intro_clip` guards:
- `auth.uid()` must be non-null.
- `p_kind in ('audio','video')` else raise.
- `p_duration` clamped to `least(greatest(p_duration,1),30)`.
- `split_part(p_path,'/',1) = auth.uid()::text` (the path must be in the caller's own folder) else raise — prevents pointing your profile at someone else's object.
- `insert into profile_details (user_id) values (auth.uid()) on conflict do nothing` so a visibility row exists (defaults to `'members'`).
- `update profiles set intro_clip_path=p_path, intro_clip_kind=p_kind, intro_clip_duration_seconds=<clamped>, intro_clip_updated_at=now(), updated_at=now() where id=auth.uid()`.

`clear_intro_clip` sets the four columns back to null for `auth.uid()`.

Both: `revoke all ... from public, anon, authenticated;` then `grant execute ... to authenticated;` (definer bypasses the column guard).

### Visibility helper (SECURITY DEFINER)
```sql
create function public.can_view_intro_clip(p_owner uuid) returns boolean ...
```
Returns true iff **viewer is the owner**, OR the owner has a `profile_details` row whose `introduction_visibility in ('members','public')` AND there is **no block in either direction** between viewer and owner. This mirrors `037`'s `profile_details_select_members` gate exactly (owner-always added). Definer so the storage policy can call it without recursive RLS on `profile_details`/`blocked_users`. `grant execute to authenticated`.

## Storage — new **private** bucket `collective-intro-clips`

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('collective-intro-clips','collective-intro-clips', false,
        20971520,  -- 20 MB hard cap (Supabase enforces server-side; ~30s of audio/video)
        array['audio/webm','audio/mp4','audio/mpeg','audio/ogg',
              'video/webm','video/mp4','video/quicktime'])
on conflict (id) do update set public=false,
  file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
```

Storage `objects` RLS (path convention `{uid}/intro/{timestamp}.{ext}`):
- **insert**: `bucket_id='collective-intro-clips' and (storage.foldername(name))[1] = auth.uid()::text` (own folder only) — mirrors `012`.
- **delete**: same own-folder check.
- **select (read)**: `bucket_id='collective-intro-clips' and public.can_view_intro_clip( ((storage.foldername(name))[1])::uuid )`. Authenticated only (no anon). Playback uses `createSignedUrl` via the browser (viewer's auth), so the SELECT policy is evaluated as the viewer.

**Privacy stance (documented):** a clip is **signed-in-members-only**. Intro *text* can be `public`, but the *clip* never signs for anon — deliberately stricter because it is voice/face. `'public'` visibility is treated the same as `'members'` for the clip (both require sign-in). The app-layer gate matches: the member page shows the player only when it could read the owner's `profile_details` under RLS (exactly the same condition), so there is no unauthorized fetch attempt.

## Client

### Types — `lib/betaTypes.ts`
Extend the `Profile` type (whatever the member/user object is called in the snapshot) with:
```ts
introClipPath: string | null;
introClipKind: "audio" | "video" | null;
introClipDurationSeconds: number | null;
```
Map these in the profile row mapper in `lib/supabase/betaRepository.ts` (from `intro_clip_path` / `intro_clip_kind` / `intro_clip_duration_seconds`). Provide null defaults everywhere a `Profile` is constructed (demo seed, `seedSnapshot`).

### Constants — `lib/supabase/client.ts`
```ts
export const INTRO_CLIP_BUCKET = "collective-intro-clips";
```

### Repository — `lib/supabase/introClipRepository.ts` (new)
- `MAX_INTRO_CLIP_SECONDS = 30`, `MAX_INTRO_CLIP_BYTES = 20 * 1024 * 1024`.
- `uploadIntroClip(client, userId, blob, ext, contentType) -> { path } | { error }` — path `${userId}/intro/${Date.now()}.${ext}`, `upsert:false`, mirrors `uploadProofFile`. (Old objects are best-effort deleted on replace; orphans are harmless and covered by the account-deletion note.)
- `setIntroClip(client, path, kind, durationSeconds) -> { error }` — calls `rpc('set_intro_clip', ...)`.
- `clearIntroClip(client, currentPath) -> { error }` — best-effort `storage.remove([currentPath])` then `rpc('clear_intro_clip')`.
- Translate RLS/permission errors to calm copy (mirror `memberRepository`).

### Duration/format helpers — `lib/introClip.ts` (new, pure, unit-tested)
- `pickRecorderMimeType(kind): string | null` — chooses a supported `MediaRecorder` mime (`audio/webm`, `video/webm`, fallbacks), returns null if unsupported.
- `extForMimeType(mime): string` — maps mime → file extension for the storage path.
- `clampDuration(seconds): number` — `min(max(round(seconds),1),30)`.
- `isAcceptableUploadDuration(seconds): boolean` — `seconds <= 30 + 0.5` tolerance.
- `formatClipLength(seconds): string` — e.g. `"0:12"`.

### Recorder component — `components/beta/IntroClipRecorder.tsx` (new, client)
- Pick **Voice** or **Video** (two calm buttons).
- Record path: `navigator.mediaDevices.getUserMedia({audio:true})` or `{audio:true, video:true}` → `MediaRecorder` collecting chunks → **live countdown** (30 → 0) that **auto-stops at 30s** → preview (`<audio>`/`<video>` from an object URL) → Save / Re-record.
- Upload fallback: `<input type="file" accept="audio/*,video/*">` → load into a hidden media element, read `duration`; reject if `> 30s` (`isAcceptableUploadDuration`) or `> MAX_INTRO_CLIP_BYTES`, with calm inline copy.
- On Save: `uploadIntroClip` → on success `setIntroClip(path, kind, clampDuration(measured))` → notify parent.
- Graceful degradation: if `getUserMedia`/`MediaRecorder` unavailable (or permission denied), hide the record option and show upload-only with a one-line explanation. Always revoke object URLs and stop tracks on cleanup/unmount.
- Beginner-safe, calm copy; no jargon. Errors never blame the user.

### Player component — `components/beta/IntroClipPlayer.tsx` (new, client)
- Props: `ownerId`, `path`, `kind`, `durationSeconds`.
- Uses `useSignedMediaUrl(INTRO_CLIP_BUCKET, path)`; renders a native `<audio controls>` or `<video controls playsInline>` with the signed URL, a small "Introduction · 0:NN" label, and a soft frame consistent with `pixel-card`. If `isError` (not authorized / expired) or no path, render nothing.

### Wiring
- **`app/passport/edit-introduction/page.tsx`**: add an "Introduction clip" section — the `IntroClipRecorder` plus, if a clip exists, the `IntroClipPlayer` (own preview) and a "Remove clip" button (`clearIntroClip` → refresh). After save, refresh the current user's profile so the snapshot carries the new `intro_clip_*`.
- **`app/passport/page.tsx`** (own passport): if the user has no clip, a calm one-line nudge linking to `edit-introduction` ("Add a short introduction so people can hear who you are."). If they have one, show the player.
- **`app/member/[id]/page.tsx`**: render `IntroClipPlayer` under the header when `member.introClipPath` exists AND `details` is non-null (i.e., RLS let us read their introduction — the same gate as the storage policy) and not blocked and not self.
- **Provider** (`components/beta/AppStateProvider.tsx`): a method to refresh the current user's profile after clip set/clear so `currentUser`/snapshot reflect it. Reuse the existing profile-refresh path if present; otherwise add a minimal `refreshCurrentUser()`.

## Cross-package dependency (documented, not silently dropped)

Account deletion (`delete_own_account`, Package 4, still an open PR — not on `main`) must, when it merges, also: (a) null `intro_clip_*` on the anonymized profile, and (b) remove the member's objects under `collective-intro-clips`. This is recorded here, in a comment in `050`, and in project memory. `050` does not modify `delete_own_account` because that function does not exist on `main`.

## Error handling

- Recording denied / unsupported → upload-only with calm copy; never a hard failure.
- Upload rejected (too long / too big / wrong type) → inline calm message; nothing persisted.
- `set_intro_clip` failure → surfaced calmly; the uploaded object is left (harmless orphan).
- Signed-URL failure on the player → render nothing (no broken media, no error to the visitor).
- Supabase not configured (demo mode) → the recorder is hidden; nothing crashes.

## Testing / verification

1. **Pure units** (vitest or the repo's test runner if present; else a `scripts/`-style check): `clampDuration`, `isAcceptableUploadDuration`, `extForMimeType`, `pickRecorderMimeType` fallbacks, `formatClipLength`.
2. **`npm run typecheck` + `npm run build`** clean.
3. **Migration applied live via MCP**, then verified in **rolled-back transactions** (RLS simulation): a non-owner with `introduction_visibility='members'` can `can_view_intro_clip` = true; `'private'` → false; blocked pair → false; owner → true. `get_advisors(security)` clean. Confirm `set_intro_clip` rejects a path in someone else's folder and clamps a 45s duration to 30.
4. **Preview QA** (light + dark) via the browser tools: record a 30s clip (auto-stop fires), save, see it on own passport; visit as a second real account and confirm playback; a `private`-intro member shows no player.
5. **Adversarial multi-agent review** before the PR; fix all Critical/Important findings; then open PR and address any Codex comments.

## Out of scope (YAGNI)

- Server-side transcoding / true duration verification (needs a decoder we don't run; the bucket `file_size_limit` is the hard backstop, documented as a known limitation).
- Multiple clips, captions/transcripts, thumbnails, clip on the introduction *request*, editing/trimming, or any analytics. One clip per member, replace-in-place.
