// Drives the "Setup & run" step of Labs 1 and 2 in English, Lithuanian and Kannada with Playwright.
// Checks: no console errors, no raw i18n key on screen, no horizontal overflow at 320 / 375 / 1440 px,
// the copy button gives feedback and really copies, the OS switch changes the commands, the diagram stays readable.
// Screenshots: screenshots/lab-setup-lab1.png and screenshots/lab-setup-lab2.png (English, 1440 px, full page).
// Labs need no backend. Usage (Vite on port 5220):
//   BASE_URL=http://127.0.0.1:5220 CHROMIUM_PATH=/path/to/chrome node scripts/capture-lab-setup.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5220";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const failures = [];
const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) failures.push(msg); };
const RAW = /\bsetup\.[a-z0-9]+\.[a-z]|\bstep\.lab\d\.setup|lab\.group\.Setup/i;
const LANGS = ["en", "lt", "kn"];
const LABS = ["lab1", "lab2"];
const VIEWPORTS = [{ width: 320, height: 700 }, { width: 375, height: 800 }, { width: 1440, height: 900 }];

async function open(lang, viewport, lab) {
  const ctx = await browser.newContext({ viewport, colorScheme: "light", permissions: ["clipboard-read", "clipboard-write"] });
  await ctx.addInitScript((l) => { try { localStorage.setItem("ailab.lang", l); localStorage.removeItem("ailab-setup-os"); } catch { /* storage blocked */ } }, lang);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(`${BASE}/labs/${lab}/setup`);
  await page.waitForSelector("[data-testid='lab-setup']");
  return { ctx, page, errors };
}

for (const lab of LABS) {
  for (const lang of LANGS) {
    for (const vp of VIEWPORTS) {
      const tag = `${lab} ${lang} ${vp.width}px`;
      const { ctx, page, errors } = await open(lang, vp, lab);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(over <= 1, `${tag}: no horizontal overflow (${over}px)`);
      const text = await page.evaluate(() => document.body.innerText);
      check(!RAW.test(text) && !/\{(os|n|m|a|b)\}/.test(text), `${tag}: no raw i18n key or placeholder`);

      // the diagram: width on screen and the effective size of its smallest text
      const svg = await page.evaluate(() => {
        const el = document.querySelector("[data-testid='setup-flow']");
        const w = el.getBoundingClientRect().width;
        return { w, font: 11 * (w / 300), nodes: el.querySelectorAll("[data-node]").length };
      });
      check(svg.nodes === 4 && svg.font >= 9, `${tag}: diagram has 4 boxes, smallest text about ${svg.font.toFixed(1)}px`);

      if (vp.width === 320 || lang === "en") {
        // copy button: feedback + clipboard content
        const cmd = page.getByTestId("setup-command").first();
        const shown = (await cmd.locator("code").innerText()).trim();
        const btn = cmd.locator("button");
        await btn.click();
        await page.waitForFunction((el) => el.getAttribute("data-copy-state") === "copied", await btn.elementHandle(), { timeout: 3000 }).catch(() => {});
        const state = await btn.getAttribute("data-copy-state");
        const clip = (await page.evaluate(() => navigator.clipboard.readText()).catch(() => "")).trim();
        check(state === "copied" && clip === shown, `${tag}: copy button says copied and the clipboard holds "${shown.slice(0, 30)}"`);
      }

      if (vp.width === 1440 || vp.width === 320) {
        // OS switch
        const before = await page.getByTestId("setup-command").allInnerTexts();
        await page.getByRole("radio", { name: "Windows" }).click();
        const after = await page.getByTestId("setup-command").allInnerTexts();
        check(before.join("\n") !== after.join("\n"), `${tag}: switching to Windows changes the commands`);
        const over2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(over2 <= 1, `${tag}: no horizontal overflow after the OS switch (${over2}px)`);
      }

      if (lang === "en" && vp.width === 1440) await page.screenshot({ path: `${OUT}lab-setup-${lab}.png`, fullPage: true });
      check(errors.length === 0, `${tag}: no console errors${errors.length ? " -> " + errors.join(" | ") : ""}`);
      await ctx.close();
    }
  }
}

// dark theme: the diagram uses theme variables only
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/labs/lab2/setup`);
  await page.waitForSelector("[data-testid='setup-flow']");
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(over <= 1, `lab2 dark 375px: no horizontal overflow (${over}px)`);
  await page.screenshot({ path: `${OUT}lab-setup-lab2-dark-375.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} FAILED` : "\nALL PASSED");
process.exit(failures.length ? 1 : 0);
