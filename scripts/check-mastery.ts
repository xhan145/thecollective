// Unit checks for lib/mastery.ts (run: npx tsx scripts/check-mastery.ts)
import {
  directionProgress,
  levelStatus,
  nextMasteryStep,
  previousLevelName,
  resolveStarterPromptId,
  skillProgress,
} from "../lib/mastery";
import type { Direction, PracticePrompt, Skill } from "../lib/betaTypes";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const lvl = (skillId: string, n: number, dir = "d1"): PracticePrompt => ({
  id: `${skillId}.${n}`,
  directionId: dir,
  title: `${skillId} L${n}`,
  description: "",
  prompt: "",
  type: "proof",
  estimatedMinutes: 3,
  beginnerSafe: true,
  skillId,
  levelNumber: n,
  levelName: ["Try it", "Repeat it", "Explain it", "Apply it", "Help someone else with it"][n - 1],
});

const fallback: PracticePrompt = {
  id: "conf-s1",
  directionId: "d1",
  title: "Fallback",
  description: "",
  prompt: "",
  type: "proof",
  estimatedMinutes: 3,
  beginnerSafe: true,
};

const s1: Skill = { id: "s1", slug: "s1", name: "Speaking Clearly", directionId: "d1", levelPromptIds: ["s1.1", "s1.2", "s1.3", "s1.4", "s1.5"] };
const s2: Skill = { id: "s2", slug: "s2", name: "Asking Questions", directionId: "d1", levelPromptIds: ["s2.1", "s2.2", "s2.3", "s2.4", "s2.5"] };
const d1: Direction = { id: "d1", slug: "confident-communication", title: "Confident Communication", subtitle: "", description: "", promptIds: [], skillIds: ["s1", "s2"] };

const prompts = [...s1.levelPromptIds.map((_, i) => lvl("s1", i + 1)), ...s2.levelPromptIds.map((_, i) => lvl("s2", i + 1))];

// Lock rule
assert(levelStatus(prompts[0], [], prompts) === "available", "L1 always open");
assert(levelStatus(prompts[1], [], prompts) === "locked", "L2 locked until L1 complete");
assert(levelStatus(prompts[1], ["s1.1"], prompts) === "available", "L2 opens after L1");
assert(levelStatus(prompts[0], ["s1.1"], prompts) === "complete", "completed detected");
assert(levelStatus(prompts[6], ["s1.1"], prompts) === "locked", "other skill unaffected by s1 progress");
assert(levelStatus(fallback, [], prompts) === "available", "fallback prompts always available");
assert(previousLevelName(prompts[1], prompts) === "Try it", "lock hint names previous level");
assert(previousLevelName(prompts[0], prompts) === null, "L1 has no previous");

// Skill + direction progress
const sp = skillProgress(s1, prompts, ["s1.1", "s1.2"]);
assert(sp.done === 2 && sp.total === 5, "skill progress 2/5");
assert(sp.levels[2].status === "available" && sp.levels[3].status === "locked", "ladder statuses in order");
const dp = directionProgress(d1, [s1, s2], prompts, ["s1.1", "s1.2", "s2.1"]);
assert(dp.done === 3 && dp.total === 10, "direction progress 3/10");

// Next step
const data = { directions: [d1], skills: [s1, s2], prompts, completedPracticeIds: ["s1.1"] };
assert(nextMasteryStep("d1", data)?.id === "s1.2", "next = lowest unlocked incomplete");
assert(nextMasteryStep("d1", { ...data, completedPracticeIds: [] })?.id === "s1.1", "fresh user starts at L1");
assert(
  nextMasteryStep("d1", { ...data, completedPracticeIds: s1.levelPromptIds })?.id === "s2.1",
  "full skill rolls to next skill",
);
assert(nextMasteryStep("d1", { ...data, skills: [] }) === undefined, "no mastery content -> undefined");

// Starter id never dead
assert(resolveStarterPromptId("d1", data) === "s1.2", "starter follows next step");
assert(resolveStarterPromptId(null, { directions: [], skills: [], prompts: [fallback], completedPracticeIds: [] }) === "conf-s1", "fallback to first prompt");
assert(resolveStarterPromptId(null, { directions: [], skills: [], prompts: [], completedPracticeIds: [] }) === "conf-s1", "empty snapshot -> seed default");

console.log("mastery checks passed");
