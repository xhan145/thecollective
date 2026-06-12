# Collective Android MVP

This folder adds a native Android Studio-ready MVP foundation for Collective while keeping the existing Next.js prototype intact.

## What to open

Open this folder in Android Studio:

```text
android-native
```

The native app package is:

```text
com.collective.app
```

The Android app name is:

```text
Collective
```

## Repo audit result

The active repository is a web-only Next.js prototype. It has `package.json`, Next app-router screens, React components, Tailwind styling, Supabase-ready docs, and media proof prototype logic. It did not have native Android files before this pass: no `settings.gradle.kts`, Android app module, Android manifest, or `MainActivity`.

Chosen path: Path C. A new native Kotlin + Jetpack Compose + Material 3 Android project now lives in `android-native/`.

## What is implemented

- Home / Practice Feed
- Communication Confidence path detail
- Today's Practice / Submit Proof
- Progress dashboard
- Profile placeholder
- Mockup-style 5-tab bottom navigation with an elevated center Create action
- Local in-memory data repository
- Static image/video proof placeholders
- Calm premium Android design system with warm cream, forest green, gold, purple, peach, and sage accents

The four supplied mockups were translated into the first native Android prototype pass:

- Home feed
- Communication Confidence path detail
- Today's Practice / submit proof
- Progress dashboard

## Android Studio steps

1. Open Android Studio.
2. Choose `Open`.
3. Select:

```text
C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local\android-native
```

4. Let Gradle sync.
5. Choose the `app` run configuration.
6. Pick a Pixel-style emulator or a connected Android device.
7. Press Run.

## SDK and JDK assumptions

- Android Studio is installed.
- Android SDK is installed under the normal Windows Android SDK location.
- Android Studio's bundled JDK can run the project.
- The project targets Android API 36 and minSdk 26.
- It uses Android Gradle Plugin 9.2.1, AGP built-in Kotlin, the Compose compiler Gradle plugin, and the Compose BOM.
- The mockup build currently uses a small local Compose route state so it can compile without downloading an extra navigation dependency.

## Gradle commands

If your Android Studio project has a Gradle wrapper available, run these from `android-native/`:

```bash
./gradlew assembleDebug
./gradlew test
./gradlew lint
```

On Windows PowerShell:

```powershell
.\gradlew.bat assembleDebug
.\gradlew.bat test
.\gradlew.bat lint
```

The Gradle wrapper is included in `android-native/` and points to Gradle 9.4.1. The wrapper will download Gradle on first use if it is not already cached.

## How to test the MVP flow

1. Open the app.
2. Confirm Home shows the calm practice feed from the mockup.
3. Tap the `Communication` chip or `Paths` tab to open the path detail.
4. Tap `Start Practice` or the center `+` action.
5. Toggle `Record Intro` and choose a proof type.
6. Choose visibility and add an optional reflection.
7. Tap `Share Proof` and confirm the supportive snackbar appears.
8. Open Progress and confirm the dashboard matches the supplied mockup direction.

## Current media status

This pass is a polished static-but-interactive prototype. It shows image/video proof placeholders and proof-type choices, but it does not open the camera, pick real media, or upload files yet. This keeps the MVP runnable without Supabase, Firebase, auth, or device permissions.

## AI placeholder status

`AiSupportService` returns local helper text only. It does not call OpenAI. It does not judge trust, replace human feedback, generate fake proof, or give medical/legal/therapy advice.

## Known limitations

- Data is in-memory only and resets when the app restarts.
- Media previews are static placeholders.
- There is no real camera, file picker, or video upload yet.
- There is no authentication.
- There is no Supabase Storage connection yet.
- The local prototype uses simple Compose route state. Navigation Compose can be added later if you want a fuller route stack.

## Future backend/storage notes

Next build slice:

- Add Supabase auth only after the local loop feels right.
- Add private `proof-media` storage bucket uploads.
- Store only media storage paths in the database.
- Generate signed URLs for temporary viewing.
- Keep demo mode available if Supabase is not configured.

## Troubleshooting

Gradle sync failed:

- Confirm Android Studio is opening `android-native/`, not the repo root.
- Confirm the Android SDK is installed.
- Let Android Studio download missing Gradle, Android Gradle Plugin, Kotlin, and Compose dependencies.

No emulator configured:

- Open Device Manager in Android Studio.
- Create a Pixel device with a recent Android image.

Physical device does not appear:

- Enable Developer Options and USB debugging.
- Trust the computer prompt on the device.

App launches but data is mock:

- That is expected for this MVP pass.

Media picker limitations:

- Some providers may not expose file size or MIME type cleanly.
- If size is unavailable, the app still lets the prototype flow continue when the MIME type is supported.
