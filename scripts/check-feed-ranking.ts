import assert from "node:assert";
import { rankFeed } from "../lib/feed/rankProofFeed";
import { levelRank } from "../lib/betaTrust";
import type { Proof, UserProfile } from "../lib/betaTypes";

const U = (id: string, trustScore: number, extra: Partial<UserProfile> = {}): UserProfile => ({
  id, displayName: id, initials: "X", role: "member", cohortId: "c", directionIds: ["direction-confidence"],
  createdAt: "2026-01-01", currentDirectionId: "direction-confidence", trustScore, ...extra,
});
const P = (id: string, userId: string, directionId: string, isDemo = false, createdAt = "2026-06-01"): Proof => ({
  id, userId, promptId: "p", directionId, title: id, body: "", mediaType: "text", attachments: [],
  status: "submitted", visibility: "private", feedbackIds: [], isDemo, createdAt,
} as Proof);

// levelRank tiers
assert.equal(levelRank({ trustScore: 0 }), 0, "New=0");
assert.equal(levelRank({ trustScore: 50 }), 2, "Reliable=2");
assert.equal(levelRank({ trustScore: 250 }), 4, "Contributor=4");
assert.equal(levelRank({}), 0, "missing=0");

const viewer = U("me", 50); // Reliable, rank 2
const authors: Record<string, UserProfile> = {
  ahead1: U("ahead1", 100), // rank 3 (d=+1)
  ahead3: U("ahead3", 250), // rank 4... d=+2; use a far one below
  same: U("same", 60),      // rank 2 (d=0)
  behind: U("behind", 0),   // rank 0 (d=-2)
  me: viewer,
};
const proofs: Proof[] = [
  P("pAhead1", "ahead1", "direction-confidence"),
  P("pSame", "same", "direction-confidence"),
  P("pBehind", "behind", "direction-confidence"),
  P("pOther", "same", "direction-momentum"),  // other direction -> lower interest
  P("pOwn", "me", "direction-confidence"),     // own -> excluded
];
const ranked = rankFeed(viewer, proofs, authors, {});

// own excluded
assert.ok(!ranked.some((r) => r.proof.id === "pOwn"), "own proof excluded");
// relation signs
assert.equal(ranked.find((r) => r.proof.id === "pAhead1")!.relation, "ahead", "ahead relation");
assert.equal(ranked.find((r) => r.proof.id === "pSame")!.relation, "same", "same relation");
assert.equal(ranked.find((r) => r.proof.id === "pBehind")!.relation, "behind", "behind relation");
// slightly-ahead (d=+1) outranks same-direction same-level? d=+1 (3.5) > d=0 (3)
const iAhead1 = ranked.findIndex((r) => r.proof.id === "pAhead1");
const iSame = ranked.findIndex((r) => r.proof.id === "pSame");
assert.ok(iAhead1 < iSame, "slightly-ahead outranks same-level");
// exact direction beats other direction
const iSame2 = ranked.findIndex((r) => r.proof.id === "pSame");
const iOther = ranked.findIndex((r) => r.proof.id === "pOther");
assert.ok(iSame2 < iOther, "exact direction beats other direction");
// never empty for non-empty input
assert.ok(ranked.length > 0, "non-empty");

// useful boost capped: a same-level proof with many usefuls rises but stays bounded
const ranked2 = rankFeed(viewer, [P("a", "same", "direction-confidence"), P("b", "same", "direction-confidence")], authors, { a: 100 });
assert.equal(ranked2[0].proof.id, "a", "useful boost orders within tier");

console.log("feed-ranking checks passed");
