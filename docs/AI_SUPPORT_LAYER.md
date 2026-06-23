# Collective AI Support Layer

Collective AI is support, not authority. It helps beta users prepare, reflect, improve peer feedback, and summarize feedback, but it never decides trust, judges identity, generates proof, or submits anything automatically.

## Current implementation

The web beta includes:

- `lib/aiTypes.ts`: structured AI models and feedback models.
- `lib/collectiveAiPolicy.ts`: central safety/system policy.
- `lib/aiService.ts`: `AiService`, `mockAiService`, and remote endpoint stub.
- `lib/ai/collective-orchestrator.ts`: safety-first v0 orchestrator for agent-style actions.
- `lib/ai/agents/*`: versioned practice, reflection, feedback, safety, and summary agent prompts.
- `components/beta/AiSupportCard.tsx`: compact response UI with helpfulness feedback.
- `/api/ai/collective`: server route that supports both old `feature` requests and new `action` requests.
- `ai/golden/*.jsonl` and `scripts/ai/evaluate-golden.ts`: mock-mode golden eval foundation.

Mock mode works without real API keys.

## AI moments

1. Practice prep on `/practice`.
2. Reflection help on `/proof/new/:promptId`.
3. Feedback coach on `/proof/:proofId/feedback`.
4. Feedback summary on `/proof/:proofId` when a proof has at least two peer feedback notes.
5. AI helpfulness review in `/beta-feedback-review`.

## Safety rules

AI responses must:

- Stay short.
- Be beginner-safe.
- Avoid judgment, diagnosis, identity labels, and scores.
- Never decide trust.
- Never claim certainty.
- Never send raw media to AI in this phase.
- Always point toward one next small step.

## Firebase-ready collections

Use top-level collections for the MVP:

```text
aiInteractions/{aiInteractionId}
aiUserFeedback/{aiUserFeedbackId}
```

Scoped alternative:

```text
cohorts/{cohortId}/aiInteractions/{aiInteractionId}
cohorts/{cohortId}/aiUserFeedback/{aiUserFeedbackId}
```

Store IDs and text summaries only:

- userId
- cohortId
- feature
- sourceType
- sourceId
- promptId
- proofId
- inputSummary
- structured output
- helpfulness
- issueType
- optional beta comment

Do not store raw video, raw audio, or private media transcripts for this phase.

## Remote AI connection later

Set:

```bash
NEXT_PUBLIC_COLLECTIVE_AI_MOCK_MODE=false
NEXT_PUBLIC_COLLECTIVE_AI_ENDPOINT=/api/ai/collective
COLLECTIVE_AI_MODEL=collective-mock-v0
```

Then add the chosen model provider behind `lib/ai/collective-orchestrator.ts` using private server-side keys only. Do not put model API keys in Android or web clients.
