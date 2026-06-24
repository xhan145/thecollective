import assert from "node:assert";
import { TRUST_POINTS_V2, DAILY_CAPS, cappedPoints, consistencyScore, weightedTrustScore } from "../lib/trust/trustV2";

// feedback rebalance
assert.equal(TRUST_POINTS_V2["peer-feedback"], 1, "feedback submit = 1");
assert.equal(TRUST_POINTS_V2["helpful"], 6, "helpful = 6");
assert.equal(TRUST_POINTS_V2["proof"], 5, "proof = 5");

// daily caps: full up to cap, 0 beyond
assert.equal(cappedPoints("proof", 0), 5, "1st proof full");
assert.equal(cappedPoints("proof", 2), 5, "3rd proof full");
assert.equal(cappedPoints("proof", 3), 0, "4th proof zero");
assert.equal(cappedPoints("peer-feedback", 4), 1, "5th feedback full");
assert.equal(cappedPoints("peer-feedback", 5), 0, "6th feedback zero");
assert.equal(cappedPoints("helpful", 99), 6, "helpful uncapped");
assert.equal(cappedPoints("accepted-contribution", 99), 15, "contribution uncapped");

// consistency window
assert.equal(consistencyScore(0), 0, "no weeks");
assert.equal(consistencyScore(8), 32, "8 weeks capped");
assert.equal(consistencyScore(12), 32, "over 8 still capped");
assert.equal(consistencyScore(3), 12, "3 weeks");

// weighted rollup
assert.equal(weightedTrustScore({ practice: 10, feedback: 10, consistency: 10, contribution: 10 }), 55, "10*(1+1.5+1+2)=55");
assert.equal(weightedTrustScore({ practice: 0, feedback: 0, consistency: 0, contribution: 0 }), 0, "zero");

console.log("trust-v2 checks passed");
