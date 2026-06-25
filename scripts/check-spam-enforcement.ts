import assert from "node:assert";
import { isFlagged, isQuarantined, shouldAutoRelease, SPAM_FLAG, SPAM_QUARANTINE } from "../lib/trust/trustV2";

assert.equal(SPAM_FLAG, 40); assert.equal(SPAM_QUARANTINE, 70);
// flag band
assert.equal(isFlagged(39), false, "39 not flagged");
assert.equal(isFlagged(40), true, "40 flagged");
// quarantine band
assert.equal(isQuarantined(69), false, "69 not quarantined");
assert.equal(isQuarantined(70), true, "70 quarantined");
// auto-release band
assert.equal(shouldAutoRelease(40), false, "40 not released");
assert.equal(shouldAutoRelease(39), true, "39 released");
assert.equal(shouldAutoRelease(0), true, "0 released");

console.log("spam-enforcement checks passed");
