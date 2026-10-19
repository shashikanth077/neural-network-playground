// Home page v2: no console errors, no raw i18n keys, no horizontal overflow in en/lt/kn x 4 widths x light/dark,
// node click navigates, keyboard focus reaches map nodes. Saves screenshots/home-v2-{light,dark,mobile}.png.
// Usage: (cd frontend && npx vite --port 5230 --strictPort) in another shell, then
//   CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/capture-home.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5230";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errs = [];
let ok = true;
const check = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) ok = false; };

async function open(lang, theme, width, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme });
  await ctx.addInitScript(([l, t]) => { localStorage.setItem("ailab.lang", l); localStorage.setItem("nnp-theme", t); }, [lang, theme]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`pageerror: ${e}`));
  page.on("console", (m) => m.type() === "error" && !m.text().includes("Failed to load resource") && errs.push(`console: ${m.text()}`));
  await page.goto(BASE + "/");
  await page.waitForSelector("h1");
  await page.waitForSelector('[data-testid="concept-map"]');
  return { ctx, page };
}

for (const lang of ["en", "lt", "kn"]) for (const theme of ["light", "dark"]) for (const w of [320, 375, 768, 1440]) {
  const { ctx, page } = await open(lang, theme, w);
  const tag = `[${lang}/${theme}/${w}]`;
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(over <= 0, `${tag} no horizontal overflow (${over})`);
  const text = await page.evaluate(() => document.body.innerText);
  check(!/\b(homev2|home|nav|cc|area|concept|lab|tool|step|sheet)\.[a-zA-Z0-9.-]+\b/.test(text.replace(/\b[a-z0-9-]+\.(py|ts|tsx|com)\b/g, "")), `${tag} no raw i18n keys`);
  const nodes = await page.locator("[data-testid=concept-map] a[data-concept]").count();
  check(nodes > 0, `${tag} map links present (${nodes}, layout ${await page.getAttribute("[data-testid=concept-map]", "data-layout")})`);
  if (lang === "en" && theme === "light" && w === 1440) await page.screenshot({ path: OUT + "home-v2-light.png", fullPage: true });
  if (lang === "en" && theme === "dark" && w === 1440) await page.screenshot({ path: OUT + "home-v2-dark.png", fullPage: true });
  if (lang === "en" && theme === "light" && w === 375) await page.screenshot({ path: OUT + "home-v2-mobile.png", fullPage: true });
  if (lang !== "en" && theme === "light" && w === 1440) await page.screenshot({ path: OUT + `home-v2-${lang}.png`, fullPage: false });
  await ctx.close();
}

// map interaction (wide)
{
  const { ctx, page } = await open("en", "light", 1440);
  check((await page.getAttribute("[data-testid=concept-map]", "data-layout")) === "map", "wide layout is the SVG map");
  const node = page.locator('a[data-concept="backprop"]');
  await node.hover({ force: true });
  check(await page.locator('[data-testid="map-tooltip"]').isVisible(), "hover shows tooltip");
  check((await page.locator('[data-testid="map-tooltip"]').innerText()).includes("Backpropagation"), "tooltip names the concept");
  // keyboard: tab until a map node has focus
  await page.mouse.move(5, 5);
  let reached = 0;
  for (let i = 0; i < 80 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => (document.activeElement?.getAttribute("data-concept") ? 1 : 0));
  }
  check(reached === 1, "keyboard Tab reaches a map node");
  check(await page.locator('[data-testid="map-tooltip"]').isVisible(), "focus shows tooltip");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/concepts\/[a-z0-9-]+$/);
  check(/\/concepts\/[a-z0-9-]+$/.test(page.url()), "Enter on a focused node opens " + page.url());
  await page.goto(BASE + "/"); await page.waitForSelector('a[data-concept="dropout"]');
  await page.locator('a[data-concept="dropout"]').click({ force: true });
  await page.waitForURL(/\/concepts\/dropout$/);
  check(page.url().endsWith("/concepts/dropout"), "click navigates to /concepts/dropout");
  // reduced motion
  const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p2 = await rm.newPage(); await p2.goto(BASE + "/"); await p2.waitForSelector("[data-testid=concept-map]");
  check((await p2.getAttribute("[data-testid=concept-map]", "data-motion")) === "off" && (await p2.locator(".cm-halo").count()) === 0, "reduced motion: no animated halos");
  await rm.close();
  await ctx.close();
}
// mobile: list layout, tap navigates
{
  const { ctx, page } = await open("en", "light", 320);
  await page.locator('a[data-concept="neuron"]').click();
  await page.waitForURL(/\/concepts\/neuron$/);
  check(true, "mobile list link navigates");
  await ctx.close();
}
// continue card with progress
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { localStorage.setItem("ailab-progress-lab1", JSON.stringify({ done: ["big-picture", "real-world"], last: "missing-values" })); });
  const page = await ctx.newPage(); await page.goto(BASE + "/"); await page.waitForSelector("h1");
  const link = page.locator('[data-testid="continue-card"] a');
  check((await link.getAttribute("href")) === "/labs/lab1/missing-values", "continue card links to the last step");
  await ctx.close();
}

check(errs.length === 0, "no console errors " + JSON.stringify(errs.slice(0, 4)));
await browser.close();
process.exit(ok ? 0 : 1);
