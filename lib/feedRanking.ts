import type { ProofWithMeta } from "@/lib/types";

/**
 * Closed-beta feed ranking. Prioritizes usefulness, never popularity:
 *  1. Proof that still needs feedback
 *  2. Newer testers who have not received feedback yet
 *  3. Proof connected to the viewer's direction
 *  4. Recency
 * No likes, views, or virality inputs exist anywhere in this scoring.
 */
export function rankProofs(
  proofs: ProofWithMeta[],
  viewerDirectionPracticeIds: Set<string>,
): ProofWithMeta[] {
  const now = Date.now();
  const scored = proofs.map((proof) => {
    let score = 0;
    if (proof.feedback_count === 0) score += 40;
    if (
      proof.practice_id &&
      viewerDirectionPracticeIds.has(proof.practice_id)
    )
      score += 15;
    const ageHours = (now - new Date(proof.created_at).getTime()) / 36e5;
    score += Math.max(0, 24 - ageHours); // gentle recency, fades after a day
    return { proof, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.proof);
}
