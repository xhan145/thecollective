# V9 Engagement And Media Lanes

V9 keeps the Collective loop intact:

Discover -> Practice -> Prove -> Feedback -> Trust -> Contribute

The goal is to make engagement with other people's content useful instead of popularity-driven. Collective should not optimize for generic like buttons. It should ask: can this user reflect, ask for context, try a version of the practice, save the prompt, or give focused feedback?

## Engagement Actions

Feed and contribution cards use intent actions:

- Reflect
- Ask context
- Try
- Save prompt
- Give feedback
- Review
- Next step

These actions are designed to move users toward practice, proof, feedback, and contribution. Future analytics should track these as contribution signals, not vanity metrics.

## Photo And Video Split

The home feed now includes two mobile swipe lanes:

- Photo proof: quick, concrete, low-friction visual context.
- Video proof: richer context with higher effort and stronger safety needs.

The lanes are separated because photo and video proof carry different product meanings. Photo proof is often fast evidence of completion. Video proof can show effort, pacing, tone, and context, but it also requires tighter moderation and feedback boundaries.

## Feed Algorithm

The passive -> bridge -> active flow stays in place. V9 adds a light contribution-fit signal so cards that can produce useful engagement have a small ranking advantage without turning the feed into social entertainment.

The ranking still prioritizes:

- relevance
- usefulness
- actionability
- proof strength
- trust weight
- recency
- low-friction boost
- mode boost
- passive penalty

## Demo Mode

No Supabase or OpenAI keys are required. Photo/video lanes use demo proof objects, and engagement actions route to existing prototype surfaces such as `/proof/new`, `/practice/speak-up-1`, and `/contribute`.

## Future Work

- Store engagement intent events server-side.
- Add reviewer reputation for consistently useful feedback.
- Add moderation review states for photo and video proof.
- Add safe media analysis after extraction/transcription layers exist.
- Add user controls for hiding or limiting video-heavy surfaces.
