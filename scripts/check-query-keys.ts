import assert from "node:assert";
import { qk } from "../lib/query/keys";

// deterministic: same inputs -> deep-equal arrays
assert.deepEqual(qk.signedUrl("coach-audio", "a/b"), qk.signedUrl("coach-audio", "a/b"), "stable for same inputs");
// distinct inputs -> different keys
assert.notDeepEqual(qk.signedUrl("coach-audio", "a/b"), qk.signedUrl("coach-audio", "a/c"), "path changes key");
assert.notDeepEqual(qk.signedUrl("coach-audio", "a/b"), qk.signedUrl("proof", "a/b"), "bucket changes key");
// shape
assert.deepEqual(qk.signedUrl("b", "p"), ["signed-url", "b", "p"], "expected shape");

console.log("query-keys checks passed");
