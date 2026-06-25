import assert from "node:assert";
import { rankTips } from "../lib/tips/rankTips";
import { coachSafetyPrecheck } from "../lib/coach/coachPolicy";
import type { UserProfile } from "../lib/betaTypes";
import type { PracticeTip } from "../lib/tips/types";

const U = (id: string, trustScore: number): UserProfile => ({
  id, displayName: id, initials: "X", role: "member", cohortId: "c", directionIds: ["d"], createdAt: "2026-01-01", trustScore,
});
const T = (id: string, authorId: string, isDemo = false, createdAt = "2026-06-01"): PracticeTip => ({
  id, promptId: "conf-s1", authorId, body: "what helped", isDemo, createdAt,
});

const viewer = U("me", 50);
const authors: Record<string, UserProfile> = { hi: U("hi", 250), lo: U("lo", 0), me: viewer };
const tips: PracticeTip[] = [T("tLo", "lo"), T("tHi", "hi"), T("tDemo", "hi", true), T("tOwn", "me")];
const ranked = rankTips(viewer, tips, authors, { tLo: 0, tHi: 0 });

assert.ok(!ranked.some((t) => t.id === "tOwn"), "own tip excluded");
assert.equal(ranked[0].id, "tHi", "higher-level author ranks first");
assert.ok(ranked.findIndex((t) => t.id === "tDemo") > ranked.findIndex((t) => t.id === "tLo"), "real before demo");
// usefulness boost
const ranked2 = rankTips(viewer, [T("a", "lo"), T("b", "lo")], authors, { a: 5, b: 0 });
assert.equal(ranked2[0].id, "a", "useful boost within tier");
// safety reuse
assert.equal(coachSafetyPrecheck("my email is a@b.com").ok, false, "regex blocks private info in tips");
assert.equal(coachSafetyPrecheck("breathe before you start").ok, true, "clean tip passes");

console.log("tips checks passed");
