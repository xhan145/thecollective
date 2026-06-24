import type { Proof, UserProfile } from "@/lib/betaTypes";
import { levelRank } from "@/lib/betaTrust";
import { shouldShowDemoActivity } from "@/lib/feedAlgorithm";

export type FeedRelation = "ahead" | "same" | "behind";
export type RankedProof = { proof: Proof; relation: FeedRelation; authorRank: number };

const DEMO_LIMIT = 8;

function interestScore(viewer: UserProfile, proof: Proof): number {
  let s = 0;
  if (proof.directionId && proof.directionId === viewer.currentDirectionId) s += 5;
  else if (proof.directionId && viewer.directionIds?.includes(proof.directionId)) s += 1.5;
  else s += 0.1; // floor — kept, never dropped
  return s;
}

function levelScore(delta: number): number {
  if (delta === 1) return 3.5;
  if (delta === 0) return 3;
  if (delta === 2) return 2;
  if (delta === -1) return 2;
  if (delta >= 3) return 0.5;
  return 0.25; // delta <= -2
}

function usefulScore(count: number): number {
  return Math.min(count, 5) * 0.4;
}

function relationFor(delta: number): FeedRelation {
  return delta > 0 ? "ahead" : delta < 0 ? "behind" : "same";
}

/** Blended, deterministic feed ranking. Real proofs always above demo; own proofs excluded. */
export function rankFeed(
  viewer: UserProfile,
  proofs: Proof[],
  authorsById: Record<string, UserProfile>,
  usefulCountByProof: Record<string, number>,
): RankedProof[] {
  const viewerRank = levelRank(viewer);
  const rankOne = (proof: Proof): RankedProof & { score: number } => {
    const author = authorsById[proof.userId];
    const authorRank = author ? levelRank(author) : viewerRank;
    const delta = authorRank - viewerRank;
    const score =
      interestScore(viewer, proof) + levelScore(delta) + usefulScore(usefulCountByProof[proof.id] ?? 0);
    return { proof, relation: relationFor(delta), authorRank, score };
  };

  const sortTier = (list: Proof[]) =>
    list
      .map(rankOne)
      .sort((a, b) => b.score - a.score || (a.proof.createdAt < b.proof.createdAt ? 1 : -1))
      .map(({ proof, relation, authorRank }) => ({ proof, relation, authorRank }));

  const own = (p: Proof) => p.userId === viewer.id;
  const real = proofs.filter((p) => !p.isDemo && !own(p));
  const demo = proofs.filter((p) => p.isDemo && !own(p));

  const rankedReal = sortTier(real);
  if (!shouldShowDemoActivity(real.length)) return rankedReal;
  const limit = Math.max(0, DEMO_LIMIT - real.length) || (real.length === 0 ? DEMO_LIMIT : 0);
  const rankedDemo = sortTier(demo).slice(0, limit);
  return [...rankedReal, ...rankedDemo];
}
