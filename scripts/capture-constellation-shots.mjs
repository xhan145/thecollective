// Screenshot harness for the Progress Constellation (deliverable #17).
// Drives installed Chrome headless via puppeteer-core: seeds demo state,
// captures every required state × viewport, exercises selection/list/apply,
// reduced-motion and dark mode.
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const BASE = "http://localhost:3160";
const OUT = "C:/Users/xhan1/collective-constellation-wt/docs/superpowers/specs/constellation-shots";
fs.mkdirSync(OUT, { recursive: true });

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

// Demo snapshots for each product state (merged over seedSnapshot by readSnapshot).
const EMPTY_USER = {
  currentUserId: "user-alex",
  proofs: [],
  feedback: [],
  trustEvents: [],
  completedPracticeIds: [],
  notifications: [],
  usefulMarks: []
};
const PARTIAL_USER = { currentUserId: "user-alex" }; // seed data as-is (mid-loop)

// Deterministic apply-ready state: practice+proof done, one feedback received
// (read), helpful feedback authored — everything complete except Apply.
const APPLY_USER = {
  currentUserId: "user-alex",
  completedPracticeIds: ["conf-s1", "conf-s2"],
  notifications: [],
  usefulMarks: [],
  trustEvents: [],
  proofs: [
    {
      id: "proof-alex-1", userId: "user-alex", promptId: "conf-s1", directionId: "direction-confidence",
      title: "Said the clear thing in standup", body: "One direct point, no hedging.",
      mediaType: "text", attachments: [], status: "submitted", visibility: "cohort",
      feedbackIds: ["fb-1"], createdAt: "2026-07-08T15:00:00.000Z"
    },
    {
      id: "proof-sam-1", userId: "user-sam", promptId: "conf-s2", directionId: "direction-confidence",
      title: "Named a preference without apologizing", body: "Practice attempt.",
      mediaType: "text", attachments: [], status: "submitted", visibility: "cohort",
      feedbackIds: ["fb-2"], createdAt: "2026-07-09T15:00:00.000Z"
    }
  ],
  feedback: [
    {
      id: "fb-1", proofId: "proof-alex-1", authorId: "user-sam", recipientId: "user-alex",
      body: "Your point landed because you led with it. Next time, try pausing one beat before the ask.",
      tone: "kind", helpful: false, createdAt: "2026-07-09T18:00:00.000Z"
    },
    {
      id: "fb-2", proofId: "proof-sam-1", authorId: "user-alex", recipientId: "user-sam",
      body: "Clear and honest — the second sentence could be your first.",
      tone: "specific", helpful: true, createdAt: "2026-07-10T09:00:00.000Z"
    }
  ]
};

async function shot(page, name) {
  await new Promise((r) => setTimeout(r, 900)); // let entrance motion settle
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("✓", name);
}

async function withPage(browser, { width, height, dark = false, reduced = false, stopAtHome = false }, seedObj, fn) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" },
    { name: "prefers-color-scheme", value: dark ? "dark" : "light" }
  ]);
  // Seed localStorage before the app boots.
  await page.evaluateOnNewDocument(
    (snapshot, isDark) => {
      window.localStorage.setItem("collective.beta.snapshot.v1", JSON.stringify(snapshot));
      window.localStorage.setItem("collective.theme", isDark ? "dark" : "light");
      window.localStorage.setItem("collective.constellation.mode", "map");
    },
    seedObj,
    dark
  );
  // Enter via the app's own demo flow (a hard load of a protected route races
  // demo hydration and bounces to /auth — pre-existing behavior), then
  // client-navigate to /progress through the home preview card.
  await page.goto(`${BASE}/auth`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => /Explore the demo/.test(b.textContent ?? ""))?.click();
  });
  await page.waitForFunction(() => location.pathname === "/home", { timeout: 20000 });
  await page.waitForSelector('a[href="/progress"]', { timeout: 20000 });
  if (!stopAtHome) {
    await page.evaluate(() => document.querySelector('a[href="/progress"]').click());
    await page.waitForFunction(() => location.pathname === "/progress", { timeout: 20000 });
    await page.waitForSelector(".constellation-stage, [role='status'], ol[aria-label]", { timeout: 20000 });
  }
  await fn(page);
  await page.close();
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"]
});

try {
  // 1. Partial state — mobile 390 (primary composition shot)
  await withPage(browser, { width: 390, height: 844 }, PARTIAL_USER, async (p) => {
    await shot(p, "01-partial-mobile-390");
    // selected node → bottom sheet
    await p.click('[data-node="practice"]');
    await shot(p, "02-selected-sheet-mobile-390");
    await p.keyboard.press("Escape");
    // list view
    await p.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      btns.find((b) => b.textContent?.trim() === "List")?.click();
    });
    await shot(p, "03-list-view-mobile-390");
  });

  // 2. Partial — desktop 1280 (inspector panel)
  await withPage(browser, { width: 1280, height: 900 }, PARTIAL_USER, async (p) => {
    await shot(p, "04-partial-desktop-1280");
    await p.click('[data-node="feedback"]');
    await shot(p, "05-selected-inspector-desktop-1280");
  });

  // 3. Empty state — mobile + desktop
  await withPage(browser, { width: 390, height: 844 }, EMPTY_USER, async (p) => {
    await shot(p, "06-empty-mobile-390");
  });
  await withPage(browser, { width: 1280, height: 900 }, EMPTY_USER, async (p) => {
    await shot(p, "07-empty-desktop-1280");
  });

  // 4. Reduced motion (mobile)
  await withPage(browser, { width: 390, height: 844, reduced: true }, PARTIAL_USER, async (p) => {
    await shot(p, "08-reduced-motion-mobile-390");
  });

  // 5. Dark mode (mobile + desktop)
  await withPage(browser, { width: 390, height: 844, dark: true }, PARTIAL_USER, async (p) => {
    await shot(p, "09-dark-mobile-390");
  });
  await withPage(browser, { width: 1280, height: 900, dark: true }, PARTIAL_USER, async (p) => {
    await shot(p, "10-dark-desktop-1280");
  });

  // 6. Narrow viewports
  for (const w of [320, 375, 430]) {
    await withPage(browser, { width: w, height: 780 }, PARTIAL_USER, async (p) => {
      const overflow = await p.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      console.log(`  width ${w}: horizontal overflow = ${overflow}px`);
      await shot(p, `11-partial-${w}`);
    });
  }

  // 7. Tablet
  await withPage(browser, { width: 768, height: 1024 }, PARTIAL_USER, async (p) => {
    await shot(p, "12-partial-tablet-768");
  });

  // 8. Home preview card (mobile)
  await withPage(browser, { width: 390, height: 844, stopAtHome: true }, PARTIAL_USER, async (p) => {
    await p.evaluate(() => {
      document.querySelector('a[href="/progress"]')?.scrollIntoView({ block: "center" });
    });
    await shot(p, "13-home-preview-mobile-390");
  });

  // 9. Apply flow end-to-end (mobile): recommended=apply → sheet → plan →
  //    mark practiced → full loop completed. Exercises the real interaction.
  await withPage(browser, { width: 390, height: 844 }, APPLY_USER, async (p) => {
    await shot(p, "14-apply-recommended-mobile-390");
    // Open via the recommended next-step card CTA.
    await p.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => /Choose a suggestion to apply/.test(b.textContent ?? ""))?.click();
    });
    await p.waitForSelector('[aria-label="Apply feedback"]', { timeout: 10000 });
    await shot(p, "15-apply-sheet-mobile-390");
    // Select the received feedback and plan it.
    await p.evaluate(() => {
      document.querySelector('[role="radio"]')?.click();
    });
    await p.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => /Plan to apply this/.test(b.textContent ?? ""))?.click();
    });
    await p.waitForFunction(() => /Planned\./.test(document.body.innerText), { timeout: 10000 });
    await shot(p, "16-apply-planned-confirmation");
    await p.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Done")?.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    // Re-open and mark practiced → Apply completes → loop completes.
    await p.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => /Mark it practiced|Choose a suggestion to apply/.test(b.textContent ?? ""))?.click();
    });
    await p.waitForSelector('[aria-label="Apply feedback"]', { timeout: 10000 });
    await p.evaluate(() => {
      document.querySelector('[role="radio"]')?.click();
    });
    await p.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => /Mark practiced/.test(b.textContent ?? ""))?.click();
    });
    await p.waitForFunction(() => /Marked practiced/.test(document.body.innerText), { timeout: 10000 });
    await p.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Done")?.click();
    });
    await new Promise((r) => setTimeout(r, 1200)); // completion draw-in settles
    await shot(p, "17-full-loop-mobile-390");
    const loop = await p.evaluate(() => document.body.innerText.includes("5 of 5 connected"));
    console.log("  full loop reached:", loop);
  });
} finally {
  await browser.close();
}
console.log("DONE");
