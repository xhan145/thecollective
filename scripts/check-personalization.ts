import assert from "node:assert";
import { getNextPractice, getPersonalizedPractices } from "../lib/personalization";
import type { PracticePrompt } from "../lib/betaTypes";

const P = (id: string, directionId: string, level: any, contextTags: any[] = []): PracticePrompt => ({
  id, directionId, title: id, description: "", prompt: "", type: "reflection", estimatedMinutes: 5,
  beginnerSafe: true, level, contextTags,
});
const prompts: PracticePrompt[] = [
  P("c-start-1", "direction-confidence", "starter", ["speaking_up_at_work"]),
  P("c-build-1", "direction-confidence", "building", ["personal_growth"]),
  P("c-comf-1", "direction-confidence", "comfortable", []),
  P("m-start-1", "direction-momentum", "starter", []),
];

// direction filter
const conf = getPersonalizedPractices({ currentDirectionId: "direction-confidence", startingLevel: "starter", contextTags: [] }, prompts);
assert.ok(conf.every((p) => p.directionId === "direction-confidence"), "direction filter");

// exact level ranks above others; context overlap boosts
const ranked = getPersonalizedPractices({ currentDirectionId: "direction-confidence", startingLevel: "starter", contextTags: ["speaking_up_at_work"] }, prompts);
assert.equal(ranked[0].id, "c-start-1", "exact level + context wins");

// never empties (unknown direction falls back)
const fb = getPersonalizedPractices({ currentDirectionId: "nope", startingLevel: "starter", contextTags: [] }, prompts);
assert.ok(fb.length > 0, "never empty");

// next skips completed
const next = getNextPractice({ currentDirectionId: "direction-confidence", startingLevel: "starter", contextTags: [] }, prompts, ["c-start-1"]);
assert.ok(next && next.id !== "c-start-1", "skips completed");

console.log("personalization checks passed");
