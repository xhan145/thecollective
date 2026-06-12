# Android Phase 3: Backend-Ready Foundation + Collective AI Core v0

This phase keeps the polished local Android prototype intact while adding seams for real product infrastructure.

## Backend-Ready Architecture

New Android packages:

- `com.collective.app.core.config`: demo/remote config flags and planned bucket name.
- `com.collective.app.core.result`: simple result wrapper for repository calls.
- `com.collective.app.data.model`: backend-ready proof, media, feedback, trust, auth, and path models.
- `com.collective.app.data.local`: local in-memory data source for demo mode.
- `com.collective.app.data.remote`: Supabase-ready placeholder adapters.
- `com.collective.app.data.repository`: repository interfaces and mock/default implementations.

The app still defaults to local demo mode. Missing Supabase credentials must not block rendering.

## Media Proof Scaffolding

Proof submission now supports Android file picking for image, video, and audio proof files.

Current behavior:

- Validates file type.
- Validates prototype size limits.
- Shows friendly errors.
- Creates a local demo media record.
- Prepares a future Supabase Storage path for `proof-media`.

No real upload is performed yet.

## Collective AI Core v0

New Android AI packages:

- `com.collective.app.ai.model`: request/response schemas.
- `com.collective.app.ai.prompt`: prompt boundaries and eval cases.
- `com.collective.app.ai.repository`: AI repository interface and mock implementation.
- `com.collective.app.ai.AiSafetyPolicy`: beginner-safe language checks.
- `com.collective.app.ai.CollectiveAiCore`: local entry point and future endpoint route names.

AI appears only as small assists in proof and feedback flows:

- Reflection helper
- Feedback draft helper
- Safety review

AI boundaries:

- AI supports reflection and feedback.
- AI does not decide trust.
- AI does not judge user worth.
- AI does not generate fake proof.
- AI does not replace human feedback.
- Android must not contain private API keys.

Future server-side function routes:

- `/ai/reflection-assist`
- `/ai/feedback-draft`
- `/ai/safety-review`
- `/ai/proof-summary`

## Eval Cases

The v0 eval cases live in `AiEvalCases.kt` and cover:

- Not overclaiming video/audio/image analysis.
- Avoiding vague feedback.
- Preventing AI-decided trust.
- Keeping corrections beginner-safe.
