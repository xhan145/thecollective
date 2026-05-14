# Collective v7 Android Agent Prototype

A mobile-first Next.js prototype for Collective: practice, proof, feedback, trust, and contribution.

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

This version runs in demo mode before Supabase/OpenAI keys are connected.

## Test pages

`/`, `/feed-system`, `/onboarding`, `/paths`, `/paths/speak-up`, `/practice/speak-up-1`, `/proof/new`, `/feedback`, `/dashboard`, `/contribute`, `/admin`, `/setup`.
