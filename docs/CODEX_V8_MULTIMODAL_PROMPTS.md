# Codex V8 Multimodal Prompts

Use these prompts when extending V8.

## Implement Real Uploads

Wire `lib/media/proofMedia.ts` to Supabase Storage. Preserve demo mode. Upload files to the private `proof-media` bucket, store only `storage_path` and metadata, and return signed URLs for temporary viewing.

## Add AI Media Extraction

Add a server-side extraction layer before AI feedback. Do not send raw large binaries directly to OpenAI. Extract safe summaries first:

- Image: caption and visible text
- Video: thumbnail summary and transcript
- Audio: transcript
- Document: extracted text summary

## Improve Feedback

Use path title, prompt instruction, proof type, reflection, feedback request, and safe media-derived text. Return structured JSON with summary, whatWorked, whatCouldImprove, nextStep, reflectionQuestion, riskLevel, confidenceScore, and mediaNotes.

## Test Matrix

Confirm demo mode and connected mode for:

- Text
- Image
- Video
- Audio
- Document/PDF
- Screenshot
- Link
- Checklist/reflection
