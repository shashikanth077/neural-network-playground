// Drives the nine Lab 3 theory steps in English, Lithuanian and Kannada at 320, 375 and 1440 px with Playwright and
// saves two screenshots. Checks: no console errors, no raw i18n key or {placeholder} on screen, no horizontal page
// overflow, and (desktop) an input or click on the step's widget that changes what is shown. Labs need no backend.
// Usage: BASE_URL=http://127.0.0.1:5260 CHROMIUM_PATH=/path/to/chrome node scripts/capture-lab3-theory.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5260";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const failures = [];
const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) failures.push(msg); };
const RAW = /\blab3\.(t|g|ui)\.[A-Za-z0-9.]+|\bstep\.lab3\./;
const STEPS = ["overview", "history", "tokens", "position", "attention", "heads", "encoder", "complexity", "training"];
const VIEWPORTS = [{ width: 320, height: 800 }, { width: 375, height: 800 }, { width: 1440, height: 950 }];

async function open(lang, viewport, id, scheme = "light") {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme });
  await ctx.addInitScript((l) => { try { localStorage.setItem("ailab.lang", l); } catch { /* storage blocked */ } }, lang);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(`${BASE}/labs/lab3/${id}`);
  await page.waitForSelector("h1");
  await page.waitForSelector("[data-testid='guide-intro']");
  // the two steps that lazy-load the recorded attention maps
  if (id === "attention") await page.waitForSelector("[data-testid='at-real']");
  if (id === "heads") await page.waitForSelector("[data-testid='hd-stat']");
  return { ctx, page, errors };
}

const tid = (page, id) => page.locator(`[data-testid='${id}']`).first().innerText();
const setRange = (page, sel, value) => page.locator(sel).evaluate((el, v) => {
  // React tracks the input's value, so set it through the native setter before the input event
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(v));
  el.dispatchEvent(new Event("input", { bubbles: true }));
}, value);

// one interaction per step: returns [before, after] of the text that should change
async function interact(page, id) {
  const pick = async (read, act) => { const before = await read(); await act(); return [before, await read()]; };
  switch (id) {
    case "overview":
      return pick(() => tid(page, "ov-models"), () => page.getByRole("radiogroup").first().getByRole("radio").nth(1).click());
    case "history":
      return pick(() => tid(page, "hi-event"), () => page.getByRole("tab").first().click());
    case "tokens":
      return pick(() => tid(page, "tk-toy"), () => page.locator("#tk-text").fill("good unwatchable zzz"));
    case "position":
      return pick(() => tid(page, "po-readout"), () => setRange(page, "#po-pos", 12));
    case "attention":
      return pick(() => tid(page, "at-real"), () => page.locator("#at-sent").selectOption({ index: 2 }));
    case "heads":
      return pick(() => tid(page, "hd-stat"), () => page.locator("button[aria-pressed]").filter({ has: page.locator("svg") }).nth(2).click());
    case "encoder":
      return pick(() => tid(page, "en-total-n"), () => page.getByRole("radio", { name: "BERT-small" }).click());
    case "complexity":
      return pick(() => tid(page, "cx-read"), () => setRange(page, "#cx-n", 200));
    case "training":
      return pick(() => tid(page, "tr-sch"), () => setRange(page, "#tr-step", 12));
    default:
      return [0, 0];
  }
}

for (const lang of ["en", "lt", "kn"]) {
  for (const id of STEPS) {
    for (const vp of VIEWPORTS) {
      const tag = `${lang} · ${id} · ${vp.width}px`;
      const d = await open(lang, vp, id);
      const text = await d.page.evaluate(() => document.body.innerText);
      check(!RAW.test(text) && !/\{[A-Za-z]+\}/.test(text), `${tag}: no raw i18n key or {placeholder} on screen`);
      const overflow = await d.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(overflow <= 0, `${tag}: no horizontal overflow (${overflow}px)`);
      if (vp.width === 1440) {
        if (lang === "en" && (id === "attention" || id === "encoder")) {
          await d.page.screenshot({ path: OUT + `lab3-${id}.png`, fullPage: true });
        }
        try {
          const [before, after] = await interact(d.page, id);
          check(before !== after, `${tag}: an input changes the step (${String(before).slice(0, 28).replace(/\n/g, " ")} → ${String(after).slice(0, 28).replace(/\n/g, " ")})`);
        } catch (e) {
          check(false, `${tag}: interaction failed: ${e.message.split("\n")[0]}`);
        }
        const quiz = d.page.locator("[role=radiogroup][aria-labelledby^='q-']").first();
        if (await quiz.count()) {
          await quiz.getByRole("radio").first().click();
          const feedback = await d.page.locator("[role=status]").filter({ hasText: /Correct|Not quite|Teisingai|Ne visai|ಸರಿ|ಸರಿಯಲ್ಲ/ }).count();
          check(feedback > 0, `${tag}: quiz answer gives feedback`);
        }
      }
      check(d.errors.length === 0, `${tag}: no console errors${d.errors.length ? ` (${d.errors[0].slice(0, 120)})` : ""}`);
      await d.ctx.close();
    }
  }
}

// dark mode must stay readable: one screenshot of the encoder and the attention step
for (const id of ["attention", "encoder"]) {
  const d = await open("en", { width: 1100, height: 900 }, id, "dark");
  await d.page.screenshot({ path: OUT + `lab3-${id}-dark.png`, fullPage: false });
  check(d.errors.length === 0, `dark · ${id}: no console errors`);
  await d.ctx.close();
}

await browser.close();
console.log(`\n${failures.length ? failures.length + " check(s) failed" : "all checks passed"}`);
process.exit(failures.length ? 1 : 0);
