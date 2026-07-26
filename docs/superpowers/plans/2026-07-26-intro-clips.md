# Intro Clips — Implementation Plan

> Executed inline (autonomous) in the current session. Source of truth: `docs/superpowers/specs/2026-07-26-intro-clips-design.md`. Each task ends testable; adversarial review + live verification gate the PR.

**Goal:** One 30s voice/video self-introduction clip per member on their passport, played on `/member/[id]`, private-bucket + signed URLs, RPC-only writes, mirroring the existing introduction visibility gate.

**Branch:** `feat/intro-clips` off `origin/main`. **Migration:** `050_intro_clips.sql`.

## Global Constraints
- Anti-clout vocab; no plays/counts. Trust untouched.
- `intro_clip_*` columns are server-only (NOT in the 036 client allowlist); writes go through `set_intro_clip` / `clear_intro_clip` (SECURITY DEFINER).
- Additive migration; new private bucket `collective-intro-clips`; storage read gated by `can_view_intro_clip` (mirrors `037`).
- Clip is signed-in-members-only; `'public'` intro text still means members-only for the clip.

## Tasks

### T1 — Migration `050_intro_clips.sql` (author + apply live + verify)
- `profiles` columns: `intro_clip_path`, `intro_clip_kind` (check audio|video), `intro_clip_duration_seconds` (check 1..30 or null), `intro_clip_updated_at`.
- `can_view_intro_clip(uuid)` SECURITY DEFINER (owner OR visibility∈members,public AND no block either way; requires a profile_details row).
- `set_intro_clip(path,kind,duration)` + `clear_intro_clip()` SECURITY DEFINER; validate kind, clamp 1..30, own-folder path check, ensure profile_details row; revoke public/anon, grant authenticated.
- Bucket `collective-intro-clips` private, `file_size_limit=20MB`, `allowed_mime_types` audio/video set.
- storage.objects policies: insert/delete own folder; select via `can_view_intro_clip`.
- Comment block noting the `delete_own_account` cross-package dependency.
- Apply via MCP `apply_migration`; verify with rolled-back RLS simulations; `get_advisors(security)` clean.

### T2 — Pure helpers `lib/introClip.ts` + tests
`clampDuration`, `isAcceptableUploadDuration`, `extForMimeType`, `pickRecorderMimeType`, `formatClipLength`. Unit tests for each.

### T3 — Types + constant + repository
- `lib/supabase/client.ts`: `INTRO_CLIP_BUCKET`.
- `lib/betaTypes.ts`: `Profile` += `introClipPath/introClipKind/introClipDurationSeconds`.
- `lib/supabase/betaRepository.ts`: map the three columns in the profile mapper; null defaults in any Profile construction.
- `lib/supabase/introClipRepository.ts` (new): `uploadIntroClip`, `setIntroClip`, `clearIntroClip`, size/seconds consts, calm error translation.
- `lib/betaData.ts` seedSnapshot / demo Profile construction: null defaults.

### T4 — Recorder + Player components
- `components/beta/IntroClipRecorder.tsx`: voice|video record with 30s auto-stop + live countdown, preview, upload fallback with client-side duration/size checks, graceful degradation, cleanup (revoke URLs, stop tracks).
- `components/beta/IntroClipPlayer.tsx`: signed-URL audio/video player; renders nothing on error/no-path.

### T5 — Wiring
- `app/passport/edit-introduction/page.tsx`: Introduction-clip section (recorder + own preview + remove); refresh current user after save.
- `app/passport/page.tsx`: nudge if none / player if present.
- `app/member/[id]/page.tsx`: player when `member.introClipPath` && `details` (RLS-readable) && !blocked && !self.
- `components/beta/AppStateProvider.tsx`: `refreshCurrentUser()` (or reuse existing) so snapshot reflects the new clip.

### T6 — Verify
- `npm run typecheck` + `npm run build` clean; run the pure tests.
- Preview QA light+dark (record → auto-stop → save → own passport → visit as 2nd account → private member shows no player).

### T7 — Adversarial review → fix → PR
- Multi-lens adversarial review (auth/RLS bypass, storage path spoofing, privacy leak, resource leaks, vocab). Fix Critical/Important. Commit, push, open PR. Address Codex comments; reply + resolve.

## Verification invariants (live, rolled back)
- non-owner + members visibility → `can_view_intro_clip` true; private → false; blocked → false; owner → true.
- `set_intro_clip` with a foreign-folder path → raises; 45s duration → stored as 30.
- advisors(security) clean.
