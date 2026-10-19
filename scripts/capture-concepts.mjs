// Concepts hub, concept pages and the coverage report: overflow at phone widths in en/lt/kn, deep links, screenshots.
// Usage: node scripts/capture-concepts.mjs (frontend dev server on :5200; no backend needed).
import { chromium } from "playwright";
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5200";
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errs = [];
let ok = true; const check = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) ok = false; };
for (const lang of ["en", "lt", "kn"]) for (const w of [320, 375, 1440]) {
  const c = await b.newContext({ viewport: { width: w, height: 800 } });
  await c.addInitScript((l) => localStorage.setItem("ailab.lang", l), lang);
  const p = await c.newPage(); p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => m.type() === "error" && !m.text().includes("Failed to load resource") && errs.push(m.text()));
  for (const path of ["/concepts", "/concepts/backprop", "/concepts/attention", "/coverage"]) {
    await p.goto(BASE + path); await p.waitForSelector("h1");
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(over <= 0, `[${lang}] ${w}px ${path} no overflow (${over})`);
  }
  await c.close();
}
const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
p.on("pageerror", (e) => errs.push(String(e))); p.on("console", (m) => m.type() === "error" && !m.text().includes("Failed to load resource") && errs.push(m.text()));
await p.goto(BASE + "/concepts"); await p.waitForSelector("h1");
await p.screenshot({ path: "screenshots/concepts-hub.png", fullPage: true });
await p.goto(BASE + "/concepts/backprop"); await p.waitForSelector("h1");
await p.screenshot({ path: "screenshots/concept-page.png", fullPage: true });
await p.goto(BASE + "/coverage"); await p.waitForSelector("h1");
await p.screenshot({ path: "screenshots/coverage.png", fullPage: true });
// deep links land on the right thing
await p.goto(BASE + "/playground?topic=dropout#learn"); await p.waitForSelector("#learn");
check((await p.locator("#learn [aria-current=true]").innerText()).toLowerCase().includes("dropout"), "learn deep link opens the Dropout topic");
await p.goto(BASE + "/labs/lab1/network"); await p.waitForSelector("h1");
check((await p.locator("h1").innerText()).length > 3, "lab step deep link renders");
check(errs.length === 0, "no console errors " + JSON.stringify(errs.slice(0, 3)));
await b.close(); process.exit(ok ? 0 : 1);
