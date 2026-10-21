// Drives the Labs platform with Playwright: checks behaviour and saves screenshots.
// Usage: node scripts/capture-labs.mjs   (frontend dev/preview server on :5173; labs need no backend)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errors = [];
const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) errors.push(msg); };

async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, colorScheme: "light", ...opts });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e));
  return { ctx, page };
}

let { ctx, page } = await open();
await page.goto(BASE);
await page.waitForSelector("text=Labs and tools");
check((await page.getByRole("heading", { level: 1 }).innerText()).match(/how AI works/i) !== null, "home headline present");
check((await page.locator('a[href^="/labs?domain="]').count()) === 3, "home has three domain tiles");
await page.screenshot({ path: OUT + "home.png", fullPage: true });

// ---- domain tile -> filtered labs
await page.locator('a[href="/labs?domain=ml"]').click();
await page.waitForSelector("h1:has-text('Guided labs')");
check(page.url().includes("domain=ml"), "ML tile opens the ML-filtered Labs page");
check((await page.getByText("From messy data").count()) === 0 && (await page.getByText("Transformers in NLP").count()) === 0, "ML filter shows only ML labs (there are none yet, so no other domain's lab appears)");
await page.screenshot({ path: OUT + "labs-domain-ml.png" });
await page.getByRole("radio", { name: /ML/ }).click();
await page.getByRole("radio", { name: "Available" }).click();
check((await page.getByText("No labs match these filters yet.").count()) === 1, "ML + Available shows the empty state (no live ML lab yet)");
await page.goto(BASE + "/labs");

// ---- labs menu (grouped by domain) + index
await page.getByRole("button", { name: /^Labs/ }).click();
check((await page.locator("#labs-menu").innerText()).toLowerCase().includes("natural language processing"), "Labs menu is grouped by domain");
await page.screenshot({ path: OUT + "labs-menu.png", clip: { x: 0, y: 0, width: 1440, height: 520 } });
await page.keyboard.press("Escape");
await page.getByRole("button", { name: /^Tools/ }).click();
await page.screenshot({ path: OUT + "tools-menu.png", clip: { x: 0, y: 0, width: 1440, height: 320 } });
await page.getByRole("link", { name: "Browse all tools →" }).click();
await page.waitForSelector("h1:has-text('Interactive tools')");
check((await page.getByRole("link", { name: /Neural Network Playground/ }).count()) > 0, "Tools page lists the Playground");
await page.screenshot({ path: OUT + "tools-index.png" });
await page.goto(BASE + "/labs");
await page.waitForSelector("h1:has-text('Guided labs')");
await page.screenshot({ path: OUT + "labs-index.png" });
check((await page.getByText("Planned").count()) >= 3, "index shows planned labs");

// ---- open Lab 1 -> first step
await page.getByRole("link", { name: /From messy data/ }).click();
await page.waitForSelector("h1:has-text('The big picture')");
check(page.url().endsWith("/labs/lab1/big-picture"), "Lab 1 opens on its first step");
await page.screenshot({ path: OUT + "lab1-step1.png" });

// ---- continue marks complete + persists across reload
await page.getByRole("button", { name: /Continue/ }).click();
await page.waitForSelector("h1:has-text('real world')");
await page.reload();
await page.waitForSelector("h1:has-text('real world')");
const doneMark = await page.locator('nav[aria-label$="steps"] a', { hasText: "The big picture" }).first().innerText();
check(doneMark.includes("✓"), "completed step stays ticked after reload");

// ---- anomalies: masking threshold
await page.goto(BASE + "/labs/lab1/anomalies");
await page.waitForSelector("text=Live lab");
const setSlider = async (id, v) => page.locator("#" + id).evaluate((el, val) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  set.call(el, String(val)); el.dispatchEvent(new Event("input", { bubbles: true }));
}, v);
const flagged = async () => (await page.locator("text=Flagged values").first().innerText()).replace(/\s+/g, " ");
check((await flagged()).includes("88"), "Z-score flags 88 by default");
await setSlider("an-v", 35);
check(!(await flagged()).includes("none"), "Z-score still flags 35 (masking starts near 21)");
await setSlider("an-v", 20);
check((await flagged()).includes("none"), "Z-score misses 20 (masked)");
await page.getByRole("radio", { name: "Quartile" }).click();
check(!(await flagged()).includes("none"), "IQR still catches 20");
await page.screenshot({ path: OUT + "lab1-anomalies.png", fullPage: true });

// ---- imputation
await page.goto(BASE + "/labs/lab1/missing-values");
await page.waitForSelector("text=Estimate the missing height");
await page.screenshot({ path: OUT + "lab1-missing.png", fullPage: true });
const group = await page.locator("[role=status]").first().innerText();
check(group.includes("165.83"), "imputation shows 165.83 for women's mean");

// ---- trainer
await page.goto(BASE + "/labs/lab1/train");
await page.getByRole("button", { name: "Train", exact: true }).click();
await page.waitForSelector("text=final loss");
const out = await page.locator("[role=status]:has-text('Name 5 output')").innerText();
check(/female \(0\)/.test(out) && /100%/.test(out), "trainer: 100% accuracy and Name 5 female -> " + out.replace(/\s+/g, " ").slice(0, 120));
await page.screenshot({ path: OUT + "lab1-train.png", fullPage: true });

// ---- mnist pixel viewer hover
await page.goto(BASE + "/labs/lab1/mnist");
await page.waitForSelector("canvas[aria-label^='A handwritten']");
// the step guide sits above the demos now, so bring the canvas into view before using page coordinates
await page.locator("canvas[aria-label^='A handwritten']").scrollIntoViewIfNeeded();
const cv = await page.locator("canvas[aria-label^='A handwritten']").boundingBox();
await page.mouse.move(cv.x + cv.width * 0.5, cv.y + cv.height * 0.5);
await page.waitForTimeout(200);
const hov = await page.locator("[role=status]").first().innerText();
check(/pixel value \d+/.test(hov), "pixel viewer reports a pixel value on hover");
await page.screenshot({ path: OUT + "lab1-mnist.png", fullPage: true });

// ---- optimizers + activations + results + defense
await page.goto(BASE + "/labs/lab1/optimizers");
await page.waitForSelector("canvas[aria-label^='Optimizer']");
await page.getByRole("button", { name: /Animate/ }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + "lab1-optimizers.png", fullPage: true });
await page.goto(BASE + "/labs/lab1/results");
await page.waitForSelector("text=Task 5: gender of Name 5");
await page.screenshot({ path: OUT + "lab1-results.png", fullPage: true });
await page.goto(BASE + "/labs/lab1/defense");
await page.locator("summary").first().click();
await page.screenshot({ path: OUT + "lab1-defense.png" });

// ---- dark theme
await page.goto(BASE + "/labs/lab1/network");
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + "lab1-dark.png", fullPage: true });

// ---- keyboard: skip link target and menu escape
await page.goto(BASE + "/labs");
await page.getByRole("button", { name: /^Labs/ }).click();
await page.keyboard.press("Escape");
check((await page.getByRole("button", { name: /^Labs/ }).getAttribute("aria-expanded")) === "false", "Escape closes the Labs menu");
await ctx.close();

// ---- mobile
({ ctx, page } = await open({ viewport: { width: 390, height: 844 }, isMobile: true }));
for (const path of ["/", "/labs", "/labs/lab1/anomalies", "/labs/lab1/mnist", "/labs/lab1/results"]) {
  await page.goto(BASE + path);
  await page.waitForTimeout(500);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(over <= 2, `mobile ${path} horizontal overflow ${over}px`);
}
await page.goto(BASE + "/labs/lab1/anomalies");
await page.waitForSelector("text=Live lab");
await page.getByRole("button", { name: /step 4 of 13/i }).click();
await page.screenshot({ path: OUT + "lab1-mobile-drawer.png" });
await page.keyboard.press("Escape");
await page.goto(BASE + "/labs/lab1/train");
await page.waitForSelector("text=Train the 2-2-1");
await page.screenshot({ path: OUT + "lab1-mobile.png" });
await ctx.close();

// ---- nav dropdowns must stay inside the viewport at every width
for (const w of [320, 390, 768, 1024, 1440]) {
  const { ctx: c2, page: p2 } = await open({ viewport: { width: w, height: 760 } });
  await p2.goto(BASE);
  await p2.waitForSelector("text=Labs and tools");
  for (const [btn, id] of [["Labs", "labs-menu"], ["Tools", "tools-menu"]]) {
    await p2.getByRole("button", { name: new RegExp("^" + btn) }).click();
    const box = await p2.locator("#" + id).boundingBox();
    check(box.x >= 0 && box.x + box.width <= w, `${btn} menu inside viewport at ${w}px (x=${Math.round(box.x)}..${Math.round(box.x + box.width)})`);
    if (btn === "Labs" && w === 390) await p2.screenshot({ path: OUT + "labs-menu-mobile.png", clip: { x: 0, y: 0, width: w, height: 700 } });
    await p2.keyboard.press("Escape");
  }
  await c2.close();
}

await browser.close();
console.log(errors.length ? "FAILURES:\n" + errors.join("\n") : "ALL CHECKS PASSED, no console errors");
process.exit(errors.length ? 1 : 0);
