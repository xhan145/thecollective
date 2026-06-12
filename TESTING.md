# Collective Closed Beta — Test Checklist

1. Open production app URL on iPhone Safari.
2. Add to Home Screen.
3. Launch from Home Screen.
4. Sign up with invited test email.
5. Confirm profile is created.
6. Choose Confident Communication.
7. Start "Record a 60-second explanation."
8. Mark practice complete.
9. Submit proof with text only.
10. Submit another proof with image/audio/video if supported.
11. View proof detail.
12. Use AI reflection.
13. Open Activity.
14. Give feedback to another proof.
15. Mark feedback helpful from receiver account.
16. Confirm trust stage updates.
17. Submit closed beta app feedback.
18. Confirm beta_feedback row appears in Supabase.
19. Confirm proof row appears in Supabase.
20. Confirm uploaded media appears in Supabase Storage.
21. Confirm app still works after refresh.
22. Confirm app still works from iPhone Home Screen.

## Supabase tables to inspect (Dashboard → Table Editor)

- `profiles`
- `practice_logs`
- `proofs`
- `feedback`
- `trust_events`
- `notifications`
- `beta_feedback`

## Storage to inspect (Dashboard → Storage)

- `proof-media/{user_id}/{proof_id}/…`
- `beta-feedback-media/{user_id}/{row_id}/…`

## Expected trust behavior

| Action | Event | Points |
|---|---|---|
| Complete practice | practice_completed | +1 |
| Submit proof | proof_submitted | +2 |
| Give feedback | feedback_given | +2 |
| Feedback marked helpful | feedback_marked_helpful | +5 (giver) |
| Someone tries a practice from your proof | practice_remixed_from_proof | +3 (original poster) |
| Submit beta feedback | beta_feedback_submitted | +1 |

Stages: Starting 0–9 · Building 10–29 · Trusted 30–74 · Contributor 75+
(points are internal — only the stage label is shown).
