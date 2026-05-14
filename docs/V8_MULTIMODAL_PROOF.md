# V8 Multimodal Proof

Collective's core loop is Discover -> Practice -> Prove -> Feedback -> Trust -> Contribute. Proof is the bridge between private effort and useful feedback, so V8 expands proof beyond text.

## Accepted Proof Types

- Text
- Image
- Video
- Audio
- Document/PDF
- Screenshot
- Link
- Checklist/reflection

## Why Media Proof Matters

Different growth paths need different evidence. A Speak Up path may benefit from audio because tone matters. A Daily Momentum path may work best with checklist proof. A contribution path may use documents or screenshots to show a before/after. Media proof should still point toward practice, feedback, trust, and contribution rather than becoming random social posting.

## Demo Mode

If Supabase is not connected, the app does not crash. The proof composer validates the selected file, creates demo metadata, stores the latest proof in browser session state, and lets the user continue to feedback. The fallback AI response references the proof type and explains that binary analysis is not active yet.

## Future AI Analysis

This iteration does not send large binary files to OpenAI. The feedback route accepts metadata and reflection only. Future v9/v10 work can add:

- Image analysis
- Video transcript and thumbnail analysis
- Audio transcription
- Document text extraction

## Local Test

Run:

```bash
npm install
npm run build
```

Then test `/proof/new`, submit each proof type in demo mode, and confirm `/feedback` and `/dashboard` display the proof metadata.
