import assert from "node:assert";
import {
  clampDuration,
  isAcceptableUploadDuration,
  extForMimeType,
  formatClipLength,
  pickRecorderMimeType,
  isAllowedClipMimeType,
  clipKindForMimeType,
  baseMimeType,
  MAX_INTRO_CLIP_SECONDS,
} from "../lib/introClip";

// clampDuration: rounds + bounds to 1..30
assert.equal(clampDuration(45), 30, "45 clamps to 30");
assert.equal(clampDuration(0), 1, "0 floors to 1");
assert.equal(clampDuration(12.4), 12, "rounds down");
assert.equal(clampDuration(12.6), 13, "rounds up");
assert.equal(clampDuration(30), 30, "30 stays 30");
assert.equal(clampDuration(NaN), 1, "NaN -> 1");
assert.equal(clampDuration(Infinity), 1, "Infinity -> 1");

// isAcceptableUploadDuration: <=30 (+0.5 tolerance)
assert.equal(isAcceptableUploadDuration(30), true, "30 ok");
assert.equal(isAcceptableUploadDuration(30.4), true, "within tolerance ok");
assert.equal(isAcceptableUploadDuration(31), false, "31 rejected");
assert.equal(isAcceptableUploadDuration(0), false, "0 rejected");
assert.equal(isAcceptableUploadDuration(-5), false, "negative rejected");
assert.equal(isAcceptableUploadDuration(NaN), false, "NaN rejected");

// baseMimeType
assert.equal(baseMimeType("audio/webm;codecs=opus"), "audio/webm", "strips codecs");
assert.equal(baseMimeType("VIDEO/MP4"), "video/mp4", "lowercases");

// extForMimeType
assert.equal(extForMimeType("audio/webm;codecs=opus"), "webm", "webm audio");
assert.equal(extForMimeType("video/mp4"), "mp4", "mp4");
assert.equal(extForMimeType("video/quicktime"), "mov", "mov");
assert.equal(extForMimeType("audio/mpeg"), "mp3", "mp3");
assert.equal(extForMimeType("audio/mp4"), "m4a", "m4a");
assert.equal(extForMimeType("weird/thing"), "webm", "unknown -> webm");

// formatClipLength
assert.equal(formatClipLength(9), "0:09", "pads seconds");
assert.equal(formatClipLength(75), "1:15", "minutes");
assert.equal(formatClipLength(0), "0:00", "zero");

// pickRecorderMimeType (injected support fn — no browser)
assert.equal(pickRecorderMimeType("audio", () => true), "audio/webm;codecs=opus", "first audio candidate");
assert.equal(pickRecorderMimeType("video", (t) => t === "video/mp4"), "video/mp4", "falls to mp4");
assert.equal(pickRecorderMimeType("audio", () => false), null, "none supported -> null");
assert.equal(
  pickRecorderMimeType("video", (t) => {
    throw new Error("boom");
  }),
  null,
  "throwing support fn -> null",
);

// isAllowedClipMimeType (must match bucket allowlist in migration 050)
assert.equal(isAllowedClipMimeType("audio/webm;codecs=opus"), true, "audio/webm allowed");
assert.equal(isAllowedClipMimeType("video/quicktime"), true, "mov allowed");
assert.equal(isAllowedClipMimeType("audio/x-m4a"), false, "x-m4a not allowed");
assert.equal(isAllowedClipMimeType("image/png"), false, "image not allowed");

// clipKindForMimeType
assert.equal(clipKindForMimeType("audio/webm"), "audio", "audio kind");
assert.equal(clipKindForMimeType("video/mp4"), "video", "video kind");
assert.equal(clipKindForMimeType("image/png"), null, "image -> null");

assert.equal(MAX_INTRO_CLIP_SECONDS, 30, "cap is 30s");

console.log("intro-clip checks passed");
