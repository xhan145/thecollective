# Collective Web Beta + Android Prototype

A mobile-first Collective prototype for the core loop: discover, practice, prove, feedback, trust, and contribution.

The current web beta is a warm cream/gold PWA shell for iPhone Safari and mobile browsers. It works in demo mode without backend credentials and keeps proof, feedback, trust, and app feedback local until Firebase is connected.

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
npm run typecheck
npm run build
```

Demo mode renders without Supabase, OpenAI, or Firebase keys. Connect Firebase later when you are ready to move beyond local browser persistence.

If local Windows builds fail with `Failed to load SWC binary for win32/x64`, see `docs/WEB_DEPLOYMENT.md`. In this workspace, TypeScript passes and the remaining blocker is the local Next compiler binary/package environment.

## Web beta routes

`/`, `/auth`, `/home`, `/directions`, `/practice`, `/proof/new/:promptId`, `/proof/:proofId`, `/proof/:proofId/feedback`, `/feed`, `/profile`, `/app-feedback`, `/install`, `/beta-feedback-review`.

## iPhone PWA install

Open `/install` in Safari, tap Share, choose Add to Home Screen, then tap Add.

## Firebase setup

Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Leaving these blank keeps the app in demo mode.

See `docs/WEB_DEPLOYMENT.md` for deployment notes.

## AI support layer

The web beta includes mock-safe AI support for:

- Practice prep
- Reflection help
- Peer feedback coaching
- Feedback summaries
- AI helpfulness feedback

AI is support, not authority. It does not decide trust, generate proof, submit feedback automatically, or grade users.

See `docs/AI_SUPPORT_LAYER.md`.

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
