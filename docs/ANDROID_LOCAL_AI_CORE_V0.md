# Collective Local AI Core v0

Collective Local AI Core v0 is a local, offline-first support layer for the Android prototype.

It is not a chatbot, coach, authority, or trust scorer. It appears only as optional collapsed helpers inside existing product flows.

## Where It Appears

- Practice: `Adjust this practice`
- Proof: `Clarify my reflection`
- Feedback: `Make this feedback more useful`
- Progress: `Summarize my progress`
- Profile: `Review evidence profile`

Each helper can be opened, closed, ignored, or inspected. The user's words remain theirs.

## Packages

- `com.collective.app.ai.local`: local signal extraction and suggestion engine.
- `com.collective.app.ai.model`: AI request/response schemas and reasoning trace models.
- `com.collective.app.ai.prompt`: prompt boundaries and eval cases.
- `com.collective.app.ai.repository`: repository interface and mock local implementation.
- `com.collective.app.ai.visualization`: quiet neural trace visualization.
- `com.collective.app.ai.dataset`: seed dataset records, schemas, and JSONL exporter.

## Local Intelligence

The v0 engine uses simple local signals:

- text specificity
- reflection language
- feedback intent
- next-step readiness
- practice step count
- consistency/momentum signals

These are intentionally lightweight and explainable. They do not require internet, API keys, or private model access.

## Dataset Prep

Seed records live in `SeedDataset.kt`.

The dataset is structured around:

- user input
- product context
- ideal response
- values to preserve
- behaviors to avoid

`DatasetExporter.toJsonLines()` can produce JSONL-style records for future offline review or server-side model/eval work.

## Neural Net Visualization

`LocalNeuralTraceView` shows a small abstract trace:

- input signals
- hidden principle layer
- suggested output

This is not a claim of model internals. It is a calm explanation of how the local heuristic suggestion was formed.

## Guardrails

AI must not:

- diagnose the user
- declare trust
- rank people
- fabricate progress
- use clout language
- rewrite words without permission
- replace human feedback

AI should:

- preserve user meaning
- offer one next step
- stay optional
- stay specific, kind, and practical
