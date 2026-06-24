# Feed Algorithm — level-matched knowledge transfer (design)

Date: 2026-06-24
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind + Supabase)

## Problem

The feed is a flat recency list (real proofs first, then demo padding). It does nothing to
match people by interest or level. The product north star: an anti-brain-rot social feed
where even passive scrolling feels productive — you watch people slightly ahead of you
learn, get ideas, and contribute to people behind you. Everything is geared around
**knowledge transfer**, ranked by **contribution-earned level + shared interest**, never
popularity. (Aligns with the Phase 2 dossier: "reward useful contribution rather than
popularity." No likes/followers/leaderboards/clout. No certificates.)

## Decisions (locked during brainstorm)

- **Level axis = earned trust tier.** `levelRank(profile)` derived from `trustLevelForPoints(profile.trustScore)` → 0–4 over `[New, Practicing, Reliable, Helpful, Contributor]`. Self-reported `startingLevel` is NOT the level axis (a New user simply starts at rank 0 — natural cold start).
- **One blended, ranked feed** (not banded), with per-card relationship cue + action.
- **Interest scope:** active-direction spine + `contextTags` boost + a light bleed-in from the viewer's other directions (never a hard wall, so the feed isn't thin early).
- **Gate:** giving feedback to people behind you requires **Reliable+ (rank ≥ 2)**. Useful-swipe and learn-from are open to everyone.
- **Format:** enhance the current `ProofCard` list (handles all proof types). The full-screen video swipe feed is a later presentation follow-up.
- **No new schema, no provider state changes** — pure ranking + presentation over existing data (`trustScore` on profiles, `usefulCountByProof`, `connections`, feedback).

## Level model

`lib/betaTrust.ts` gains `levelRank(profile: { trustScore?: number }): number` =
index of `trustLevelForPoints(profile.trustScore ?? 0)` in the tier list (0–4). Single
source of truth, reused by `rankFeed` and the card's `canGiveFeedback`. Missing
`trustScore` → 0.

## Ranking function (pure, in `lib/feedAlgorithm.ts`)

```
rankFeed(
  viewer: UserProfile,
  proofs: Proof[],
  authorsById: Record<string, UserProfile>,
  usefulCountByProof: Record<string, number>,
): RankedProof[]

type RankedProof = { proof: Proof; relation: "ahead" | "same" | "behind"; authorRank: number };
```

For each proof (excluding the viewer's own): `score = interest + level + useful`.

- **interest:** `proof.directionId === viewer.currentDirectionId` → +5; else if `proof.directionId ∈ viewer.directionIds` → +1.5; plus `contextTags` overlap × +0.75 each; no match → small floor (e.g. +0.1, kept not dropped).
- **level** by `d = authorRank − viewerRank`: `d=+1` → +3.5; `d=0` → +3; `d=+2` → +2; `d=−1` → +2; `d≥+3` → +0.5; `d≤−2` → +0.25.
- **useful (capped):** `min(usefulCount, 5) × 0.4`.
- **relation:** `d>0` → "ahead", `d===0` → "same", `d<0` → "behind".

Sort by `score` desc, then `proof.createdAt` desc. **Invariants:** real proofs (`!isDemo`)
always sort above demo (partition then rank within each tier, real tier first); demo only
included when `shouldShowDemoActivity(realCount)` (existing), padded to the existing limit.
Never returns empty for a non-empty input. Deterministic (no Date.now/random).

## Card cues & gated actions

`ProofCard` gains optional props `relation?: "ahead"|"same"|"behind"` and
`canGiveFeedback?: boolean`. Rendering:

| relation | chip | actions |
| --- | --- | --- |
| ahead | "▲ Learn from" | Learn from · Useful |
| same | "● Around your level" | Useful · Learn from |
| behind | "▼ You're ahead here" | Useful · Give feedback (only if `canGiveFeedback`) |

- **Useful** on every card (existing `toggleUseful`; no count shown).
- **Give feedback** on "behind" cards only when `canGiveFeedback` (viewer rank ≥ 2);
  otherwise simply absent (no lock/upgrade nudge). Deep-links to the existing feedback composer.
- **Learn from** uses existing `toggleLearnFrom` (ahead + same).
- Beginner-safe copy; "behind" framed as "you're ahead here / help someone", never labeling
  the other person. No ranks/scores/numbers rendered — only the relative chip.
- Cards rendered outside the feed (e.g. Home "Recent proof") pass neither prop → render
  exactly as today (backward-compatible).

## Integration

- `app/feed/page.tsx`: replace the flat concat with `rankFeed(currentUser, snapshot.proofs,
  authorsById, snapshot.usefulCountByProof)`; map each `RankedProof` to a `ProofCard` with
  `relation` + `canGiveFeedback = levelRank(currentUser) >= 2`. `authorsById` built from
  `snapshot.users`. Keep the existing "N real proofs shown first" banner + empty state.
- `lib/betaTrust.ts`: add `levelRank`.
- `components/beta/ProofComponents.tsx`: add the two optional props + chip/action rendering.
- No provider, repository, or schema changes.

## Testing & verification

- Pure (`npx tsx scripts/check-feed-ranking.ts`): exact-direction > other-direction >
  no-match; `d=+1` outranks `d=+3`; same-level ranks high; own proofs excluded; real always
  above demo; useful boost capped; `relation` sign correct; never empty for non-empty input;
  `levelRank` cases (New→0 … Contributor→4; missing→0).
- `npm run typecheck` + `npm run build` green.
- Preview: mid-tier viewer → blended feed with correct chips; New viewer → mostly ahead/same,
  no "Give feedback"; Reliable+ viewer → "Give feedback" on behind cards; light + dark.

## Acceptance criteria

1. Feed is a single blended stream ranked by interest (active-direction spine + contextTags +
   light bleed) × relative earned-level (favoring same / slightly-ahead, some behind) × capped
   useful-quality.
2. Each card shows a relative-level chip + the right knowledge-transfer action.
3. "Give feedback" gated to Reliable+; useful + learn-from open to all; own proofs excluded.
4. Real-over-demo preserved; nothing clout/number rendered; beginner-safe copy.
5. No new schema or provider state; pure + typecheck + build green.

## Scope — out (own follow-ups)

- Full-screen video swipe feed (later presentation; reuses `useSignedMediaUrl`).
- Trust System V2 mechanics (how `trustScore` is earned + spam protection) — this feed
  *consumes* the existing `trustScore`; tuning earning is the parked Trust V2 brainstorm.
- Dedicated "people you learn from" discovery surface beyond the feed.
- Pagination/infinite scroll (renders the ranked set for now; paginate later with
  react-query/`useSignedMediaUrl`).
- Possible rename "The Collective Knowledge Transfer" — naming only, not this spec.

## Known limitations / next

- `trustScore` quality depends on Trust V2; until then the level axis is as good as current
  trust points. Feed logic is independent and improves automatically as trust earning improves.
- Demo authors' `trustScore` drives their relation too — fine for a populated demo; real
  proofs still rank first regardless.
