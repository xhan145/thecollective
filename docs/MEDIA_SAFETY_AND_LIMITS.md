# Media Safety And Limits

V8 accepts media proof, but it treats media as sensitive by default.

## Prototype Limits

- Images: 10 MB
- Screenshots: 10 MB
- Audio: 50 MB
- Video: 200 MB
- Documents/PDFs: 25 MB

Unsupported or oversized files should show a helpful validation message and never start an upload.

## Privacy Defaults

Proof starts private. Users may choose selected reviewers, path members, or public later. Never make media public by default.

## Review Safety

Reviewers should see proof type, media kind, feedback request, visibility, and a safety note before opening a proof. Feedback should focus on the user's stated request and avoid appearance-based, diagnostic, or personal attacks.

## Moderation TODOs

- Add MIME sniffing on the server, not only client-side checks.
- Add upload scanning before signed URL access.
- Add report/flag flows for media proof.
- Add admin review queues for flagged media.
- Add retention and deletion controls for sensitive proof.

## Vercel Deployment Notes

Use environment variables for Supabase and OpenAI. Do not commit `.env.local`. Keep uploads going directly to Supabase Storage rather than through serverless request bodies.
