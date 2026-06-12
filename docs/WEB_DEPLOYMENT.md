# Collective Web Beta Deployment

Collective's web beta runs as a mobile-first Next.js PWA. It is ready for iPhone Safari testing in demo mode and can be connected to Firebase when credentials are available.

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, enter the demo beta, and visit `/install` on an iPhone to add the PWA to the Home Screen.

## Build

```bash
npm run typecheck
npm run build
```

If `next build` fails with `Failed to load SWC binary for win32/x64`, reinstall dependencies on a normal networked Node environment or install the matching fallback package:

```bash
npm install -D @next/swc-wasm-nodejs@16.2.6
```

The app code typechecks cleanly in the current workspace; the known blocker is the local SWC compiler package/environment.

## Deploy target

Vercel is the simplest target for this Next app:

1. Import the repo.
2. Set the project root to `collective-v7-push-ready`.
3. Use `npm install` and `npm run build`.
4. Add the environment variables below.
5. Deploy.

Any static PWA host must support Next.js server output or a Next-compatible adapter.

## Required environment variables

Demo mode works with all Firebase variables blank.

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.example
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_COLLECTIVE_AI_ENABLED=false
NEXT_PUBLIC_COLLECTIVE_AI_MOCK_MODE=true
NEXT_PUBLIC_COLLECTIVE_AI_ENDPOINT=
```

The app also reads the `VITE_FIREBASE_*` names for portability with a future Vite build, but Next deployments should use `NEXT_PUBLIC_FIREBASE_*`.

## PWA files

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/offline.html`
- `public/icons/collective-icon.svg`
- `public/icons/apple-touch-icon.svg`

## iPhone install flow

1. Open the deployed site in Safari.
2. Tap the Share button.
3. Choose Add to Home Screen.
4. Tap Add.

## Current backend status

Firebase config detection is in place and demo mode is safe when credentials are missing. Full Firebase Auth, Firestore, and Storage writes are the next backend pass. Until then, proof, feedback, trust, and app feedback persist locally in the browser session/local storage.

AI support is also mock-safe. Set `NEXT_PUBLIC_COLLECTIVE_AI_MOCK_MODE=false` and point `NEXT_PUBLIC_COLLECTIVE_AI_ENDPOINT` at a serverless endpoint only after the backend stores model keys server-side.
