# Collective closed-beta — Firebase schema & setup

This document describes the Firestore / Storage / Auth structure the closed-beta loop is designed for.
The app currently runs on in-memory mock repositories; the real `Firebase*Repository` classes are
implemented and compiled (see `beta/repository/firebase/`) but only constructed when
`BetaConfig.USE_FIREBASE == true`. Nothing in the app touches Firebase while the flag is `false`.

## Remaining setup steps (to go live)

1. Create a Firebase project and add an Android app with applicationId `com.collective.app`.
2. Download `google-services.json` into `app/`.
3. Add the plugin:
   - Root `build.gradle.kts` → `plugins { id("com.google.gms.google-services") version "4.4.2" apply false }`
   - `app/build.gradle.kts` → `plugins { id("com.google.gms.google-services") }`
   (Firebase SDK dependencies are already declared in `app/build.gradle.kts`.)
4. Enable Firebase Auth (start with Anonymous or Email link for the 10 testers), Cloud Firestore, and
   Storage in the console.
5. Seed `directions/*`, `practicePrompts/*`, and the `cohorts/founding-circle` doc + member docs
   (mirror `beta/data/BetaSeed.kt`).
6. Flip `BetaConfig.USE_FIREBASE = true`. `createBetaRepositories(scope)` then returns the Firebase set;
   no other code changes (every caller depends only on the repository interfaces).

## Firestore collections

```
users/{userId}
  - id, displayName, photoUrl?, cohortId, selectedDirectionId?, trustLevel (String enum),
    trustScore (Number), createdAt (Number, epoch millis)

cohorts/{cohortId}
  - id, name, inviteCode?, isClosed (Bool), createdAt
cohorts/{cohortId}/members/{userId}      // membership mirror (id + role); profile lives in users/{userId}

directions/{directionId}
  - id, title, description, wedge, isActive (Bool)

practicePrompts/{promptId}
  - id, directionId, title, shortDescription, estimatedMinutes (Number),
    proofTypes (Array<String enum>), difficulty (String enum), isActive (Bool),
    whyItHelps, examples (Array<String>)

cohorts/{cohortId}/proofs/{proofId}
  - id, ownerUserId, ownerDisplayName, cohortId, directionId, promptId, promptTitle,
    reflectionText, status (String enum), feedbackCount (Number), createdAt, updatedAt,
    attachments (Array<Map>): { id, type (String enum), localUri?, remoteUrl?, mimeType?, durationMs?, createdAt }

cohorts/{cohortId}/proofs/{proofId}/feedback/{feedbackId}
  - id, proofId, proofOwnerUserId, giverUserId, giverDisplayName, cohortId,
    whatWorked, suggestion, encouragement, isMarkedHelpful (Bool), createdAt

cohorts/{cohortId}/trustEvents/{trustEventId}
  - id, userId, cohortId, type (String enum), points (Number), sourceId?, createdAt

invites/{inviteCode}
  - code, cohortId, claimed (Bool), claimedByUserId?

cohorts/{cohortId}/appFeedback/{appFeedbackId}        // founder/dev only; NEVER social content
  - id, userId, userDisplayName, cohortId, type (String enum), screen (String enum),
    message, importance (String enum), suggestedImprovement?, status (String enum), createdAt
```

`TrustSummary` is **not** stored — it is computed client-side from `trustEvents` (and the denormalized
`trustScore`/`trustLevel` on `users/{userId}`, which the trust repository updates on each event).

## Storage paths

```
proofs/{cohortId}/{userId}/{proofId}/{attachmentId}
```
On submit, each local attachment Uri is uploaded here; the resulting download URL is written back to the
attachment's `remoteUrl` field in the proof document. App feedback has no media in this phase.

## Security-rule sketch (cohort-scoped, beginner-safe)

- A user may read `cohorts/{c}/proofs/**` and `directions/**`, `practicePrompts/**` only if they are a
  member of cohort `c` (membership doc exists under `cohorts/{c}/members/{uid}`).
- A user may create a proof only with `ownerUserId == request.auth.uid`.
- A user may create feedback only with `giverUserId == request.auth.uid` and only on a proof they do
  **not** own. Only the proof owner may set `isMarkedHelpful = true`.
- `trustEvents` are write-restricted (ideally Cloud Functions / trusted writes) so trust cannot be
  self-awarded; for the beta they may be client-written but should be locked down before launch.
- `appFeedback` is readable only by the founder/admin uid; any cohort member may create their own.
  App feedback never grants trust and never appears in the proof feed (enforced in code: the
  AppFeedbackRepository has no TrustRepository dependency and is never read by the feed).
```
```
