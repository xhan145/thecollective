import {
  DEFAULT_CUSTOMIZATION,
  customizationDataAttributes,
  mergeCustomization,
} from "../lib/settings/customization";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Defaults
assert(DEFAULT_CUSTOMIZATION.pixelStyle === "soft", "default pixelStyle should be soft");
assert(DEFAULT_CUSTOMIZATION.pixelGrid === true, "default pixelGrid should be true");

// merge keeps base + overrides
const merged = mergeCustomization({ pixelStyle: "medium" });
assert(merged.pixelStyle === "medium", "merge override pixelStyle");
assert(merged.density === "comfortable", "merge keeps base density");

// data attributes mapping
const soft = customizationDataAttributes(DEFAULT_CUSTOMIZATION);
assert(soft["data-pixel"] === "soft", "soft -> data-pixel soft");
assert(soft["data-pixel-grid"] === "on", "grid on when pixel soft + grid true");

const off = customizationDataAttributes(mergeCustomization({ pixelStyle: "off" }));
assert(off["data-pixel"] === "off", "off -> data-pixel off");
assert(off["data-pixel-grid"] === "off", "grid forced off when pixel off");

const med = customizationDataAttributes(mergeCustomization({ pixelStyle: "medium" }));
assert(med["data-pixel"] === "medium", "medium -> data-pixel medium");

// reduced motion: explicit OR os preference
assert(customizationDataAttributes(DEFAULT_CUSTOMIZATION, true)["data-motion"] === "reduced", "os reduced-motion -> reduced");
assert(customizationDataAttributes(mergeCustomization({ motion: "reduced" }))["data-motion"] === "reduced", "explicit reduced -> reduced");
assert(customizationDataAttributes(DEFAULT_CUSTOMIZATION, false)["data-motion"] === "full", "full motion by default");

// grid off when user disables grid even at soft
assert(customizationDataAttributes(mergeCustomization({ pixelGrid: false }))["data-pixel-grid"] === "off", "grid off when disabled");

console.log("customization checks passed");
