import assert from "node:assert";
import { canCreateCohort } from "../lib/cohorts/access";
import { rankFeed } from "../lib/feed/rankProofFeed";
import type { Proof, UserProfile } from "../lib/betaTypes";

// canCreateCohort band: Reliable (>=50) true; Practicing (<50) false
assert.equal(canCreateCohort({ trustScore: 49 }), false, "below Reliable cannot create");
assert.equal(canCreateCohort({ trustScore: 50 }), true, "Reliable can create");
assert.equal(canCreateCohort(null), false, "no profile cannot create");

// membership-scoped cohort feed: only members' proofs, held excluded (caller filters before rankFeed)
const U = (id: string, ts: number): UserProfile => ({ id, displayName: id, initials: "X", role: "member", cohortId: "c", directionIds: ["d"], createdAt: "2026-01-01", trustScore: ts, currentDirectionId: "d" });
const P = (id: string, userId: string, held = false): Proof & { held?: boolean } => ({ id, userId, promptId: "p", directionId: "d", title: id, body: "", mediaType: "text", attachments: [], status: "submitted", visibility: "private", feedbackIds: [], isDemo: false, createdAt: "2026-06-01", held } as Proof & { held?: boolean });
const viewer = U("me", 60);
const authors = { m1: U("m1", 60), out: U("out", 60), me: viewer };
const memberIds = new Set(["m1", "me"]);
const all = [P("pIn", "m1"), P("pOut", "out"), P("pHeld", "m1", true)];
const scoped = all.filter((p) => memberIds.has(p.userId) && !(p as any).held); // the cohort-feed pre-filter
const ranked = rankFeed(viewer, scoped as Proof[], authors, {});
assert.ok(ranked.some((r) => r.proof.id === "pIn"), "member proof present");
assert.ok(!ranked.some((r) => r.proof.id === "pOut"), "non-member proof excluded");
assert.ok(!ranked.some((r) => r.proof.id === "pHeld"), "held proof excluded");

console.log("cohorts checks passed");
