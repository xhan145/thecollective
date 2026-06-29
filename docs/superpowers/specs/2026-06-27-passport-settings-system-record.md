# Passport / Profile / Settings System — Build Record

**Date:** 2026-06-27
**Status:** Shipped to `main` across 4 sub-projects (user delegated full autonomy).
**Source brief:** `Collective_Passport_Settings_Dev_Prompt` (PDF) + pixel-soft + UUPM requirements.

This records sub-projects 2–4, which were built directly under an explicit
"go and don't stop till done, push without approval" instruction. Sub-project 1
has its own spec (`2026-06-27-pixel-soft-customization-design.md`).

## What shipped

### SP1 — Pixel-soft + Customization (commit e6fe40a)
Configurable retro pixel layer (off/soft/medium, Soft whole-app default) +
`/settings/customization`. See dedicated spec.

### SP2 — Passport screen (commit 1240711)
- **Migration 033**: `profiles` += headline / current_focus_skill / introduction_summary / open_to_introductions; new `profile_details` (guided intro) + `pinned_proofs`. RLS read-own/write-own with WITH CHECK.
- `/passport`: ProfileHeader, guided IntroductionCard, BadgeMedallionRow (reuses the pure `evaluateLocalBadges` over real counts — no new badge store), Overview/Proof/Feedback/Contribution tabs, pinned proofs, account rail, 3-dot PassportMenu (bottom sheet).
- `/passport/edit`, `/passport/edit-introduction`, `/passport/pinned-proofs`.
- Nav **Profile→Passport** (label + route); `/profile` redirects to `/passport`.
- Reuses Trust-V2 counts + the achievements system — **no** `user_badges`/`profile_stats` duplication.

### SP3+SP4 — Settings architecture + privacy backend (commit 05424f7)
- **Migration 034**: `user_settings` + `blocked_users` + `introduction_requests`. RLS read-own/write-own with WITH CHECK (all 5 new tables verified: RLS on, 3 policies each).
- Typed `UserSettings` + `useUserSettings` hook (Supabase, localStorage demo fallback) + `settingsRepository`.
- Grouped `/settings` (Account / Privacy & Visibility / Notifications / Preferences / Support / Sign out) via `SettingsKit`.
- 16 settings pages: account, change-password (supabase auth), profile/proof-visibility (explicit Save — server-confirmed for privacy), introduction-preferences, blocked-users, push/email/feedback-notifications, feedback-preferences, content-preferences, theme, help, contact-support, give-feedback, sign-out (confirm).

## UUPM
`ui-ux-pro-max` is a design-time Claude skill, not an npm package — no runtime adapter built (would be dead code), per the brief's "don't break the build forcing unknown deps."

## Verified
`tsc` clean; `next build` green (all routes compile); migrations applied to prod + RLS confirmed; `scripts/check-customization.ts` passes. No follower/like/leaderboard/clout metrics anywhere; cream/gold brand; beginner-safe copy.

## Deliberately NOT done (scoped follow-ons)
- **Blocked-user runtime enforcement**: tables + RLS + the unblock UI exist, but there is no "Block" entry-point yet and the feed/proof lists don't filter blocked authors. Needs a block action + author filtering (and ideally RLS cross-checks).
- **Introduction-request flow** (send/accept/decline): table + RLS exist, but the flow needs a *view-another-member's-passport* surface, which isn't built (Passport is own-only today).
- **Profile photo upload** (initials-only for now; noted in `/passport/edit`).
