# Collective v0.5 Alpha: Local Product Loop

Collective v0.5 Alpha turns the Android prototype into a working offline loop:

Discover → Practice → Prove → Get Feedback → Build Trust → Contribute

## What Persists Locally

- Practice completions
- Proof submissions
- Feedback submissions
- Trust events
- Activity rows
- AI helper runs
- Lightweight preferences

The app still works with no backend, no API keys, no auth, and no on-device model file.

## Persistence Implementation

The requested Room/DataStore package structure exists:

- `data.local.db`
- `data.local.dao`
- `data.local.entity`
- `data.local.mapper`
- `data.local.datastore`

Room and DataStore artifacts were not available in the offline Gradle cache. To keep the app buildable, v0.5 uses:

- DAO/entity/mapper contracts shaped for Room migration
- a local JSON table store backed by `SharedPreferences`
- a DataStore-compatible preferences facade backed by `SharedPreferences` + `StateFlow`

When dependencies are available, `CollectiveLocalDatabase` can be replaced by a real Room `@Database`, and `CollectivePreferencesDataStore` can switch to Preferences DataStore.

## AI Run Logging

Every local AI helper can log:

- assist kind
- input summary
- output summary
- risk level
- confidence score
- trace summary
- timestamp

Logs remain local.

## AI Quality Lab

Route:

- `aiQualityLab`

Access:

- Profile → AI Quality Lab
- Prototype Map → AI Quality Lab

The lab shows:

- local run count
- recent AI runs
- AI Signal Map
- seed eval cases

It is for inspection and quality work, not user scoring.

## Local Loop Behavior

- Finish Practice saves a practice completion, trust event, and activity row.
- Share Proof safety-reviews the proof, saves it locally, records trust, and updates activity.
- Send Feedback saves feedback, records trust, and updates activity.
- Progress and Profile read local counts.
- Home shows local proof evidence when present.
