import assert from "node:assert";
import { assertBrandSafe } from "../lib/ai/outputPolicy";

// passes clean, beginner-safe copy
assertBrandSafe(["One small next step is to say one clear thing.", "You practiced something real."]);

// throws on forbidden phrases
for (const bad of ["Your confidence score is 42", "Climb the leaderboard", "This proves you are insecure", "get more followers"]) {
  let threw = false;
  try { assertBrandSafe([bad]); } catch { threw = true; }
  assert.ok(threw, `expected brand violation for: ${bad}`);
}

console.log("ai-output-policy checks passed");
