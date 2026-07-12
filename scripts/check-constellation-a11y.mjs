// Interactive accessibility checks for the Progress Constellation
// (run: node scripts/check-constellation-a11y.mjs — needs the dev server on
// :3160 and `npm i --no-save puppeteer-core` + installed Chrome).
//
// Asserts the keyboard contract from the design doc: roving tabindex in
// journey order, Enter opens the node dialog with focus inside, Escape closes
// and RETURNS focus to the opening node, aria labels carry full state, and
// the list view exposes the same journey as an ordered list.

import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3160";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

let failures = 0;
function check(cond, msg) {
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failures++;
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
  args: ["--no-sandbox", "--disable-gpu"]
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluateOnNewDocument(() => {
    window.localStorage.setItem("collective.beta.snapshot.v1", JSON.stringify({ currentUserId: "user-alex" }));
    window.localStorage.setItem("collective.constellation.mode", "map");
  });
  await page.goto(`${BASE}/auth`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => /Explore the demo/.test(b.textContent ?? ""))?.click();
  });
  await page.waitForSelector('a[href="/progress"]', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('a[href="/progress"]').click());
  await page.waitForSelector(".constellation-stage", { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 800));

  // Structure + labels
  const structure = await page.evaluate(() => {
    const stage = document.querySelector(".constellation-stage");
    const nodes = [...document.querySelectorAll("[data-node]")];
    return {
      groupLabel: stage?.getAttribute("aria-label") ?? "",
      nodeCount: nodes.length,
      allLabeled: nodes.every((n) => (n.getAttribute("aria-label") ?? "").length > 20),
      tabbable: nodes.filter((n) => n.getAttribute("tabindex") === "0").length,
      liveRegion: !!stage?.querySelector("[aria-live]")
    };
  });
  check(structure.groupLabel.includes("progress constellation"), `stage has group label ("${structure.groupLabel.slice(0, 48)}…")`);
  check(structure.nodeCount === 5, "five node buttons");
  check(structure.allLabeled, "every node has a full-sentence aria-label");
  check(structure.tabbable === 1, "exactly one node in the tab order (roving tabindex)");
  check(structure.liveRegion, "stage owns an aria-live region");

  // Roving focus with arrows
  await page.evaluate(() => document.querySelector('[data-node][tabindex="0"]')?.focus());
  const first = await page.evaluate(() => document.activeElement?.getAttribute("data-node"));
  await page.keyboard.press("ArrowRight");
  const second = await page.evaluate(() => document.activeElement?.getAttribute("data-node"));
  check(!!first && !!second && first !== second, `ArrowRight moves focus (${first} → ${second})`);

  // Enter opens dialog, focus lands inside
  await page.keyboard.press("Enter");
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  const inDialog = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  check(inDialog, "Enter opens the node dialog and focus moves into it");

  // Escape closes and returns focus to the node
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 500));
  const afterEscape = await page.evaluate(() => ({
    dialogGone: !document.querySelector('[role="dialog"]'),
    focusNode: document.activeElement?.getAttribute("data-node") ?? null
  }));
  check(afterEscape.dialogGone, "Escape closes the dialog");
  check(afterEscape.focusNode === second, `focus returns to the opening node (${afterEscape.focusNode})`);

  // List view parity
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "List")?.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const list = await page.evaluate(() => {
    const ol = document.querySelector("ol[aria-label]");
    return { exists: !!ol, items: ol ? ol.querySelectorAll(":scope > li").length : 0 };
  });
  check(list.exists && list.items === 5, "list view is an ordered list of the five steps");

  console.log(failures === 0 ? "\ncheck-constellation-a11y: all checks passed ✓" : `\n${failures} check(s) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  await browser.close();
}
