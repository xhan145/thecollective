import type { UserProfile } from "@/lib/betaTypes";
import { levelRank } from "@/lib/betaTrust";
import type { PracticeTip } from "./types";

/** Rank a practice's tips by author level + usefulness. Real before demo; own excluded; deterministic. */
export function rankTips(
  viewer: UserProfile | null,
  tips: PracticeTip[],
  authorsById: Record<string, UserProfile>,
  usefulCountByTip: Record<string, number>,
): PracticeTip[] {
  const score = (t: PracticeTip) => {
    const author = authorsById[t.authorId];
    const authorRank = author ? levelRank(author) : 0;
    return authorRank * 1.5 + Math.min(usefulCountByTip[t.id] ?? 0, 5) * 1;
  };
  const sortTier = (list: PracticeTip[]) =>
    list.slice().sort((a, b) => score(b) - score(a) || (a.createdAt < b.createdAt ? 1 : -1));
  const own = (t: PracticeTip) => !!viewer && t.authorId === viewer.id;
  const real = tips.filter((t) => !t.isDemo && !own(t));
  const demo = tips.filter((t) => t.isDemo && !own(t));
  return [...sortTier(real), ...sortTier(demo)];
}
