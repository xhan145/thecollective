import assert from "node:assert";
import { severityOf, isCredibleReporter, shouldHide, REPORT_REASONS, MILD_THRESHOLD } from "../lib/moderation";

// severity mapping
assert.equal(severityOf("harassment"), "severe", "harassment severe");
assert.equal(severityOf("unsafe"), "severe", "unsafe severe");
assert.equal(severityOf("sexual_or_violent"), "severe", "sexual_or_violent severe");
assert.equal(severityOf("spam"), "mild", "spam mild");
assert.equal(severityOf("low_quality"), "mild", "low_quality mild");
assert.equal(severityOf("off_topic"), "mild", "off_topic mild");
assert.equal(severityOf("other"), "mild", "other mild");

// credible reporter gate
assert.equal(isCredibleReporter(0), true, "fresh reporter credible");
assert.equal(isCredibleReporter(39), true, "39 credible");
assert.equal(isCredibleReporter(40), false, "40 not credible");
assert.equal(isCredibleReporter(70), false, "held reporter not credible");

// hide decision — severe hides on 1 credible; not on 1 non-credible
assert.equal(shouldHide("harassment", true, 1), true, "severe+credible hides at 1");
assert.equal(shouldHide("harassment", false, 1), false, "severe+non-credible does not hide");
assert.equal(shouldHide("unsafe", true, 1), true, "unsafe credible hides");
// mild hides only at threshold, regardless of credibility
assert.equal(shouldHide("spam", true, 1), false, "mild 1 no hide");
assert.equal(shouldHide("spam", true, MILD_THRESHOLD - 1), false, "mild below threshold no hide");
assert.equal(shouldHide("spam", true, MILD_THRESHOLD), true, "mild at threshold hides");
assert.equal(shouldHide("off_topic", false, MILD_THRESHOLD + 1), true, "mild above threshold hides");

// taxonomy integrity
assert.equal(REPORT_REASONS.length, 7, "7 reasons");
for (const r of REPORT_REASONS) {
  assert.equal(r.severity, severityOf(r.id), `${r.id} severity consistent`);
  assert.ok(r.label && r.help, `${r.id} has label + help`);
}
assert.equal(REPORT_REASONS.filter((r) => r.severity === "severe").length, 3, "3 severe reasons");

console.log("moderation checks passed");
