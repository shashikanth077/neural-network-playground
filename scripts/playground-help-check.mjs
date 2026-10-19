// Browser check for the Playground explanations (frontend :5173 + backend :8000, Chromium via CHROMIUM_PATH).
// For Lithuanian and Kannada at a 375 px phone width it checks: translated heading, a help panel opens, opening
// EVERY panel causes no horizontal overflow, the experiments' Apply button sets the data and network, and the
// explanations switch is remembered. Saves screenshots/playground-help-lt.png and playground-help-kn.png.
// Usage: BASE_URL=http://127.0.0.1:5173 node scripts/playground-help-check.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const CASES = {
  lt: { h1: "Neuroninio tinklo žaidimų aikštelė", about: /Apie šį skyrių/, apply: /^Taikyti: Per paprasta$/, switch: /Paaiškinimai/ },
  kn: { h1: "ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್ ಪ್ಲೇಗ್ರೌಂಡ್", about: /ಈ ವಿಭಾಗದ ಬಗ್ಗೆ/, apply: /^ಅನ್ವಯಿಸಿ: ತುಂಬಾ ಸರಳ$/, switch: /ವಿವರಣೆಗಳು/ },
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errors = [];
let failed = false;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) failed = true; };

for (const [lang, c] of Object.entries(CASES)) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, isMobile: true, colorScheme: "light" });
  await ctx.addInitScript((l) => { try { if (!localStorage.getItem("ailab.lang")) localStorage.setItem("ailab.lang", l); } catch { /* ignore */ } }, lang);
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`${lang}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${lang}: ${e}`));
  await page.goto(BASE + "/playground");
  await page.waitForSelector("h1");
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^▶/.test(b.textContent) && !b.disabled), null, { timeout: 20000 });

  check((await page.locator("h1").innerText()) === c.h1, `${lang}: translated page title`);
  check((await page.evaluate(() => document.documentElement.lang)) === lang, `${lang}: <html lang>`);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check((await overflow()) <= 0, `${lang}: no horizontal overflow before opening help`);

  // guide step 4 jumps to the charts and moves focus to its heading
  await page.locator('[data-step="read"]').click();
  await page.waitForTimeout(400);
  check(await page.evaluate(() => document.activeElement?.closest("#section-charts") !== null), `${lang}: guide step scrolls to and focuses the charts section`);

  // open one panel, check its accessibility attributes
  const first = page.locator('[data-help="dataset"] button');
  await first.scrollIntoViewIfNeeded();
  await first.click();
  check((await first.getAttribute("aria-expanded")) === "true", `${lang}: help button aria-expanded=true`);
  const region = page.locator('[data-help="dataset"] [role="region"]');
  check(await region.isVisible(), `${lang}: help region visible`);
  check((await region.locator("dt").count()) >= 4, `${lang}: help region lists its parts`);
  await first.evaluate((e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.evaluate(() => window.scrollBy({ top: -72, behavior: "instant" }));
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}playground-help-${lang}.png`, fullPage: false });

  // open every <details> (designer sections) and every help panel, then measure overflow again
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
  const n = await page.locator(".section-help > button").count();
  for (let i = 0; i < n; i++) {
    const b = page.locator(".section-help > button").nth(i);
    if ((await b.getAttribute("aria-expanded")) !== "true") await b.click();
  }
  const open = await page.locator('.section-help > button[aria-expanded="true"]').count();
  check(open === n && n >= 30, `${lang}: ${open}/${n} help panels opened`);
  check((await overflow()) <= 0, `${lang}: no horizontal overflow with every help panel open (${await overflow()} px)`);

  // an experiment's Apply button sets the dataset and the network
  await page.locator("#section-experiments").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: c.apply }).click();
  await page.waitForTimeout(800);
  check((await page.locator('[role="radio"][aria-checked="true"]').first().innerText()).length > 0 && (await page.locator('input[id^="layer-"]').count()) === 1, `${lang}: Apply set a one-hidden-layer network`);

  // the explanations switch hides every panel and is remembered after a reload
  await page.getByRole("switch", { name: c.switch }).click();
  check((await page.locator(".section-help").count()) === 0, `${lang}: switch hides all panels`);
  await page.reload();
  await page.waitForSelector("h1");
  check((await page.getByRole("switch", { name: c.switch }).getAttribute("aria-checked")) === "false", `${lang}: switch state remembered after reload`);
  await ctx.close();
}

await browser.close();
console.log("console errors:", errors.length ? errors : "none");
if (errors.length || failed) process.exit(1);
