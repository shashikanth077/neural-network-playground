// Drives every Lab 2 step in English and Lithuanian with Playwright and saves two screenshots.
// Checks: no console errors, no raw i18n key on screen, no horizontal overflow at 375 px, and a widget or quiz
// answer that responds to a click (desktop). Labs need no backend.
// Usage: BASE_URL=http://127.0.0.1:5195 CHROMIUM_PATH=/path/to/chrome PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
//        node scripts/capture-lab2.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const failures = [];
const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) failures.push(msg); };
// a raw key such as lab2.pipe.lead; "lab2.py" (the script's file name) is allowed
const RAW = /\blab2\.(?!py\b)[A-Za-z0-9]+\.[A-Za-z0-9.]+/;
const STEPS = ["pipeline", "digit", "conv", "pool", "params", "learning", "text", "conv1d", "rnn", "results", "code", "checklist", "defense"];

async function open(lang, viewport, id) {
  const ctx = await browser.newContext({ viewport, colorScheme: "light" });
  await ctx.addInitScript((l) => { try { localStorage.setItem("ailab.lang", l); } catch { /* storage blocked */ } }, lang);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(`${BASE}/labs/lab2/${id}`);
  await page.waitForSelector("h1");
  await page.waitForSelector("[data-testid='guide-intro']");
  return { ctx, page, errors };
}

const status = (page) => page.locator("[role=status]").first().innerText().catch(() => "");

// one interaction per step: returns [before, after] text of the thing that should change
async function interact(page, id) {
  const pick = async (fn) => { const before = await fn.read(); await fn.act(); return [before, await fn.read()]; };
  switch (id) {
    case "pipeline":
      return pick({ read: () => status(page), act: () => page.locator("[aria-pressed]").nth(2).click() });
    case "digit":
      // the sample is drawn on load, so clear the paper first: the picture (and its centre line) must change
      return pick({ read: () => status(page), act: () => page.locator("button").filter({ hasText: /^(Clear|Valyti)$/ }).first().click() });
    case "conv":
      return pick({
        read: () => page.locator("pre").first().innerText(),
        act: () => page.locator("canvas[aria-label*='hover' i], canvas[aria-label*='Feature map' i], canvas[aria-label*='Požymių' i]").first().hover({ position: { x: 60, y: 60 } }),
      });
    case "pool":
      return pick({ read: () => page.locator("table").nth(1).innerText(), act: () => page.getByRole("radio").nth(1).click() });
    case "params":
      return pick({ read: () => page.locator("pre").first().innerText(), act: () => page.getByRole("radio").nth(1).click() });
    case "learning":
      return pick({
        read: () => status(page),
        // React tracks the input's value, so set it through the native setter before the input event
        act: () => page.locator("#lr-rate").evaluate((el) => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, "1.1");
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }),
      });
    case "text":
      return pick({ read: () => page.locator("[data-testid=word-numbers]").innerText(), act: () => page.locator("#txt-input").fill("good not bad") });
    case "conv1d":
      // the review dropdown is the one that lists the sentences (the language switcher is also a select)
      return pick({ read: () => page.locator("table").first().innerText(), act: () => page.locator("select").filter({ hasText: "not bad but not great" }).first().selectOption({ index: 2 }) });
    case "rnn":
      return pick({ read: () => page.locator("b.font-mono").first().innerText(), act: () => page.locator("button").filter({ hasText: /Next word|Kitas žodis/ }).first().click() });
    case "results":
      // no click widget here: the recorded tables are static, so check that the recorded best numbers are shown
      return [await page.locator("body").innerText().then((t) => t.includes("99.09") && t.includes("0.8587")), true];
    case "code":
      return pick({ read: () => page.locator("details[open]").count().then(String), act: () => page.locator("details summary").first().click() });
    case "checklist":
      // the lists on this page are: the guide's four task boxes, then the checklist items (the page's own
      // "Mark step complete" box comes last, outside both lists)
      return pick({ read: () => page.locator("[aria-live=polite]").first().innerText(), act: () => page.locator("ul input[type=checkbox]").nth(4).check() });
    case "defense":
      return pick({ read: () => page.locator("details[open]").count().then(String), act: () => page.locator("details summary").first().click() });
    default:
      return [0, 0];
  }
}

for (const lang of ["en", "lt"]) {
  for (const id of STEPS) {
    // 1) desktop: console errors, raw keys, a click that changes something, and a quiz answer
    const d = await open(lang, { width: 1440, height: 950 }, id);
    const tag = `${lang} · ${id}`;
    if (lang === "en" && id === "pipeline") {
      await d.page.screenshot({ path: OUT + "lab2-overview.png", fullPage: true });
    }
    if (lang === "en" && id === "results") {
      await d.page.screenshot({ path: OUT + "lab2-results.png", fullPage: true });
    }
    const text = await d.page.evaluate(() => document.body.innerText);
    check(!RAW.test(text), `${tag}: no raw i18n key on screen`);
    try {
      const [before, after] = await interact(d.page, id);
      if (id === "results") {
        check(before === true, `${tag}: the recorded best numbers (99.09 %, 0.8587) are shown`);
      } else {
        check(JSON.stringify(before) !== JSON.stringify(after), `${tag}: a click changes the step (${String(before).slice(0, 30).replace(/\n/g, " ")} → ${String(after).slice(0, 30).replace(/\n/g, " ")})`);
      }
    } catch (e) {
      check(false, `${tag}: interaction failed: ${e.message.split("\n")[0]}`);
    }
    const quiz = d.page.locator("[role=radiogroup][aria-labelledby^='q-']").first();
    if (await quiz.count()) {
      await quiz.getByRole("radio").first().click();
      const feedback = await d.page.locator("[role=status]").filter({ hasText: /Correct|Not quite|Teisingai|Ne visai|ಸರಿ|ಸರಿಯಲ್ಲ/ }).count();
      check(feedback > 0, `${tag}: quiz answer gives feedback`);
    }
    check(d.errors.length === 0, `${tag}: no console errors${d.errors.length ? ` (${d.errors[0].slice(0, 120)})` : ""}`);
    await d.ctx.close();

    // 2) phone width: no horizontal page scroll
    const m = await open(lang, { width: 375, height: 800 }, id);
    const overflow = await m.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 0, `${tag}: no horizontal overflow at 375 px (${overflow}px)`);
    await m.ctx.close();
  }
}

await browser.close();
console.log(`\n${failures.length ? failures.length + " check(s) failed" : "all checks passed"}`);
process.exit(failures.length ? 1 : 0);
