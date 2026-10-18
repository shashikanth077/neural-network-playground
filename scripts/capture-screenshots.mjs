// Drives the running app (frontend :5173 + backend :8000) with Playwright and saves screenshots.
// Usage: node scripts/capture-screenshots.mjs   (needs `playwright` and Chromium installed)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errors = [];
const log = (m) => console.log(m);

async function newPage(opts = {}) {
  const { expectErrors, ...ctxOpts } = opts;
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, colorScheme: "light", ...ctxOpts });
  const page = await ctx.newPage();
  if (!expectErrors) {
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
  }
  return page;
}
const text = (page, sel) => page.locator(sel).first().innerText();
const epoch = async (page) => Number((await page.locator("dl >> text=Epoch").first().locator("xpath=following-sibling::dd").innerText()).split("/")[0]);

// ---- home
let page = await newPage();
await page.goto(BASE);
await page.waitForSelector("text=Understand AI by");
await page.screenshot({ path: OUT + "home.png" });
log("home ok");

// ---- playground: initial state
await page.getByRole("link", { name: "Open the Playground" }).click();
await page.waitForSelector("text=Network designer");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^▶ Train/.test(b.textContent) && !b.disabled), null, { timeout: 15000 });
await page.screenshot({ path: OUT + "playground-initial.png", fullPage: false });
const initialParams = await page.evaluate(async () => {
  const sessions = performance.getEntriesByType("resource").map((r) => r.name).filter((n) => n.includes("/training/"));
  const id = sessions[0].match(/training\/([a-z0-9]+)\//)[1];
  const r = await fetch(`/api/training/${id}/parameters`);
  return { id, p: await r.json() };
});
log("session " + initialParams.id);

// ---- train, pause, resume
await page.getByRole("button", { name: /^▶ Train$/ }).click();
await page.waitForFunction(() => /Training/.test(document.querySelector('[role="status"]')?.textContent ?? ""));
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /Pause/ }).click();
await page.waitForFunction(() => /Paused/.test(document.querySelector('[role="status"]')?.textContent ?? ""));
const e1 = await epoch(page);
await page.waitForTimeout(800);
const e2 = await epoch(page);
log(`paused at epoch ${e1} -> ${e2} (must match)`);
if (e1 !== e2 || e1 < 1) throw new Error("pause did not freeze training");
await page.getByRole("button", { name: /Resume/ }).click();
await page.waitForFunction(() => /Completed/.test(document.querySelector('[role="status"]')?.textContent ?? ""), null, { timeout: 60000 });
log("completed; epoch " + (await epoch(page)));
await page.mouse.move(1000, 400);
// hover over the boundary plot to get tooltip + activations
const canvas = page.locator("canvas").first();
const box = await canvas.boundingBox();
await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.3);
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "playground-trained.png" });
await page.screenshot({ path: OUT + "playground-full.png", fullPage: true });

const after = await page.evaluate(async (id) => (await fetch(`/api/training/${id}/parameters`)).json(), initialParams.id);
const changed = JSON.stringify(after.layers[0].weights) !== JSON.stringify(initialParams.p.layers[0].weights);
log("weights changed after training: " + changed);
if (!changed) throw new Error("weights did not change");

// ---- reset
await page.getByRole("button", { name: /Reset/ }).click();
await page.waitForFunction(() => /Ready/.test(document.querySelector('[role="status"]')?.textContent ?? ""));
log("reset ok, epoch " + (await epoch(page)));

// ---- preset + learning center
await page.getByRole("button", { name: /Overfitting/ }).first().click();
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /^▶ Train$/ }).click();
await page.waitForFunction(() => /Completed/.test(document.querySelector('[role="status"]')?.textContent ?? ""), null, { timeout: 90000 });
await page.screenshot({ path: OUT + "playground-overfitting.png", fullPage: true });
await page.getByRole("button", { name: /One training iteration/ }).click();
await page.getByRole("button", { name: "Trace one iteration" }).click();
await page.waitForSelector("text=Forward pass");
await page.locator("#learn").scrollIntoViewIfNeeded();
await page.locator("#learn").screenshot({ path: OUT + "learning-center.png" });
log("learning center trace ok");

// ---- custom dataset
await page.locator('[role="radio"]', { hasText: "Custom" }).first().click();
await page.waitForTimeout(300);
const svg = page.locator('svg[aria-label^="Dataset scatter"]');
const sb = await svg.boundingBox();
for (let i = 0; i < 6; i++) {
  await page.locator('[role="radio"]', { hasText: "Place class " + (i % 2) }).click();
  await svg.click({ position: { x: sb.width * (0.2 + 0.1 * i), y: sb.height * (i % 2 ? 0.3 : 0.7) } });
}
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^▶ Train/.test(b.textContent) && !b.disabled), null, { timeout: 10000 });
log("custom dataset trainable");

// ---- dark + mobile
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.goto(BASE + "/playground");
await page.waitForSelector("text=Network designer");
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + "playground-dark.png" });

const m = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await m.goto(BASE + "/playground");
await m.waitForSelector("text=Network designer");
await m.waitForTimeout(1500);
await m.screenshot({ path: OUT + "playground-mobile.png", fullPage: false });
const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
log("mobile horizontal overflow px: " + overflow);

// ---- backend failure handling
const p2 = await newPage({ expectErrors: true });
await p2.route(/\/api\/(health|datasets|models|training)/, (r) => r.abort());
await p2.goto(BASE + "/playground");
await p2.waitForSelector("text=Backend unreachable", { timeout: 10000 });
await p2.screenshot({ path: OUT + "error-backend-down.png" });
log("backend-down banner ok");

await browser.close();
console.log("console errors:", errors.length ? errors : "none");
if (errors.length || overflow > 2) process.exit(1);
