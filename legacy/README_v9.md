# Collective v9 Android Agent Prototype

A mobile-first Next.js prototype for Collective: discover, practice, prove, feedback, trust, and contribution.

## Run in Replit

Paste Prompt 1 from `docs/REPLIT_AGENT_PROMPTS.md` into Replit Agent. Manual fallback:

```bash
npm install
npm run dev
```

## Local validation

The project has been validated from the repository root with:

```bash
npm install
npm run build
npm run typecheck
```

Demo mode renders without Supabase or OpenAI keys. Connect those services later from `/setup` when you are ready to move beyond the local prototype flow.

## Important

This version runs in demo mode before Supabase/OpenAI keys are connected. V8 added multimodal proof submission for text, images, videos, audio, documents/PDFs, screenshots, links, and checklist/reflection proof. V9 adds Collective-style engagement actions, separate mobile swipe lanes for photo proof and video proof, and a buildable image/video media proof MVP.

## V9 engagement

Collective does not use generic like buttons in this prototype. Engagement is based on useful intent: reflect, ask context, try the practice, save a prompt, give feedback, review, and suggest a next step.

## Media proof MVP

The media proof MVP supports image and video selection, preview, removal, draft saving, mock upload progress, beginner-safe visibility settings, proof feed cards, feedback composer UI, AI support helpers, and trust-score helpers.

See `docs/MEDIA_PROOF_MVP.md` and `supabase/media_proof_mvp.sql`.

## Native Android MVP

This repo now also includes an Android Studio-ready native MVP foundation in `android-native/`.

Open `android-native/` in Android Studio to run the Kotlin + Jetpack Compose app. See `README_ANDROID.md` for setup, testing, and current limitations.

## Test pages

`/`, `/feed-system`, `/onboarding`, `/paths`, `/paths/speak-up`, `/practice/speak-up-1`, `/proof/new`, `/feedback`, `/dashboard`, `/contribute`, `/admin`, `/setup`.
