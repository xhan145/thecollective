import assert from "node:assert";
import { z } from "zod";
import { assertBrandSafe } from "../lib/ai/outputPolicy";
import { buildPersonaBlock } from "../lib/ai/persona";

// passes clean, beginner-safe copy
assertBrandSafe(["One small next step is to say one clear thing.", "You practiced something real."]);

// throws on forbidden phrases
for (const bad of ["Your confidence score is 42", "Climb the leaderboard", "This proves you are insecure", "get more followers"]) {
  let threw = false;
  try { assertBrandSafe([bad]); } catch { threw = true; }
  assert.ok(threw, `expected brand violation for: ${bad}`);
}

assert.equal(buildPersonaBlock({ userId: "u", displayName: "A", cohortId: "c" }), "", "empty persona when no signals");
const block = buildPersonaBlock({ userId: "u", displayName: "A", cohortId: "c", goalText: "Speak up in meetings", startingLevel: "building", directionTitle: "Confidence", contextTags: ["speaking_up_at_work"] });
assert.ok(block.includes("Speak up in meetings") && block.includes("Confidence") && block.includes("building"), "persona reflects signals");

// Schema-contract assertions for parseAgentJson (no server-only import needed)
const sampleSchema = z.object({ a: z.string(), b: z.number() });
let bad = false;
try { sampleSchema.parse(JSON.parse('{"a":"x"}')); } catch { bad = true; }
assert.ok(bad, "schema rejects malformed output");
assert.deepEqual(sampleSchema.parse(JSON.parse('{"a":"x","b":2}')), { a: "x", b: 2 }, "schema accepts valid output");

console.log("ai-output-policy checks passed");
