# Media Proof MVP

Collective is a practice log, proof journal, feedback circle, trust-building system, and contribution pathway. This MVP adds image and video proof without turning the product into a popularity feed.

## What Changed

- Users can submit proof with a reflection, practice area, visibility setting, and optional image or video media.
- The proof screen previews selected media, allows removing it, shows upload progress, supports draft saving, and works in demo mode.
- The home feed includes proof cards that show media type, reflection, practice area, feedback count, trust signal, and a Give feedback action.
- Feedback uses beginner-safe prompts: be specific, kind, and useful; respond to the practice, not the person; help them take the next step.
- Trust is represented through contribution and practice events, not likes, followers, or popularity.

## File Rules

- Images: JPG, JPEG, PNG, WEBP up to 10 MB.
- Videos: MP4, MOV, WEBM up to 100 MB.

Unsupported or oversized files should show friendly errors and preserve the user's reflection.

## Demo Mode

If Supabase Storage is not configured, `lib/mediaUpload.ts` returns a local preview URL and marks the upload as mock/demo. The app still renders and the proof flow can continue.

## Supabase-Ready Plan

Use a private bucket named `proof-media`. Store storage paths in the database. Use signed URLs for temporary viewing. Never make uploaded proof media public by default.

Schema planning lives in:

- `supabase/proof_media.sql`
- `supabase/media_proof_mvp.sql`

## AI Boundaries

AI can summarize a proof submission, suggest reflection prompts, suggest safe feedback prompts, flag low-quality feedback, and help improve the proof description.

AI must not judge user worth, decide trustworthiness, replace human feedback, give medical/legal/therapy advice, or generate fake proof.

## Local Test

1. Run `npm install`.
2. Run `npm run build`.
3. Open `/proof/new`.
4. Add a title and reflection.
5. Select a practice area.
6. Upload a JPG/PNG/WEBP or MP4/MOV/WEBM file.
7. Remove and reselect media.
8. Save draft.
9. Submit proof.
10. Confirm `/feedback`, `/dashboard`, and `/` still render.

## Known Limitations

- Uploads are mock/demo until Supabase Storage is connected.
- Video thumbnails are planned but not generated durably yet.
- Feedback persistence is local demo state.
- Trust events are mocked for the prototype.

## Next Recommended Codex Prompt

Wire the media proof MVP to Supabase Storage and database tables. Keep demo mode active, upload files to a private `proof-media` bucket, store only storage paths, create signed URLs for temporary viewing, and add RLS policies for private, feedback-only, and public proof visibility.
