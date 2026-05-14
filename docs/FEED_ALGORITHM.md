# Feed Algorithm

The homepage feed is a core product system. It should guide passive scrolling into action:

Passive -> Bridge -> Active

Passive examples include proof posts, reflections, stories, milestones, and progress updates. Bridge examples include prompt previews, feedback examples, reflection questions, and "someone like you tried this." Active examples include starting practice, submitting proof, giving feedback, or joining a path.

The ranking logic remains in `lib/feedAlgorithm.ts` and keeps rewarding usefulness, actionability, proof strength, trust, recency, low friction, and mode.

## Media Proof Signals

- Video proof can have higher proof strength because it shows effort and context, but it also has higher friction.
- Image and screenshot proof can be quick and concrete, making them strong bridge cards.
- Text and checklist proof are low-friction ways to prove small practices.
- Audio proof can be especially useful in confidence and communication paths because tone and pacing matter.
- Contribution potential increases when reviewers can see proof type, media kind, and feedback request before opening a proof.

Media-rich proof should never turn the feed into random social content. Every card must still point toward practice, proof, feedback, trust, or contribution.
