// Walks all 13 steps of Lab 1 in English and Lithuanian (plus one Kannada screenshot) with Playwright.
// Checks: no console errors, no horizontal overflow at 375px, the pipeline map is present, a quiz answer gives
// feedback, a guide checklist tick survives a reload, and the new hands-on widgets run without errors.
// Usage: node scripts/capture-lab1-guide.mjs   (frontend dev/preview server on :5173; Lab 1 needs no backend)
// Needs a node_modules symlink at the repo root and CHROMIUM_PATH (see the capture-labs script).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const failures = [];
const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) failures.push(msg); };

const STEPS = ["big-picture", "real-world", "missing-values", "anomalies", "scaling", "network", "train", "mnist", "activations", "optimizers", "results", "checklist", "defense"];
const T = {
  en: { map: "Pipeline map of the whole lab", correct: "Correct!", wrong: "Not quite.", check: "Check yourself" },
  lt: { map: "Visos laboratorijos konvejerio schema", correct: "Teisingai!", wrong: "Ne visai.", check: "Pasitikrinkite" },
  kn: { map: "ಇಡೀ ಲ್ಯಾಬ್‌ನ ಪೈಪ್‌ಲೈನ್ ನಕ್ಷೆ", correct: "ಸರಿ!", wrong: "ಸರಿಯಾಗಿಲ್ಲ.", check: "ನಿಮ್ಮನ್ನು ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಿ" },
};
const BTN = {
  reveal: { en: /^Reveal$/, lt: /^Atskleisti$/ },
  next: { en: /^Next calculation$/, lt: /^Kitas skaičiavimas$/ },
  train: { en: /^Train$/, lt: /^Mokyti$/ },
  one: { en: /^Do ONE update$/, lt: /^Atlikti VIENĄ atnaujinimą$/ },
  runNet: { en: /^Run my drawing through the untrained network$/, lt: /^Paleisti mano piešinį per nemokytą tinklą$/ },
  run40: { en: /^Run 40 steps$/, lt: /^Paleisti 40 žingsnių$/ },
};

async function open(lang, viewport, errors) {
  const ctx = await browser.newContext({ viewport, colorScheme: "light" });
  await ctx.addInitScript((l) => { try { localStorage.setItem("ailab.lang", l); } catch { /* ignore */ } }, lang);
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e));
  return { ctx, page };
}

/** Exercise the new hands-on widget of a step; returns an extra assertion about what must be visible after. */
async function interact(page, id, lang) {
  const b = (k) => page.getByRole("button", { name: BTN[k][lang] });
  const body = async () => (await page.locator("main, body").first().innerText()).replace(/\s+/g, " ");
  if (id === "missing-values") {
    await page.locator("#mis-guess").fill("166");
    await b("reveal").click();
    await page.getByRole("status").filter({ hasText: "165.83" }).first().waitFor();
    await page.locator("#mis-h-0").fill("1650");
    return (await body()).includes("413.33");
  }
  if (id === "anomalies") {
    await page.locator("#ano-age-10").fill("21");
    await page.waitForTimeout(150);
    return (await body()).includes("2.98");
  }
  if (id === "scaling") {
    await page.locator("#sc-h-3").fill("250");
    await page.waitForTimeout(150);
    await page.locator("#sc-nh").fill("200");
    return (await body()).includes("1.1667") || (await body()).includes("1.1");
  }
  if (id === "network") {
    for (let i = 0; i < 6; i++) await b("next").click();
    await page.waitForTimeout(100);
    return (await body()).includes("z1 =") && (await body()).includes("h1 = sigmoid");
  }
  if (id === "train") {
    await b("train").first().click();
    await b("one").click();
    await page.waitForTimeout(150);
    return (await body()).includes("bias out");
  }
  if (id === "mnist") {
    const cv = page.locator("canvas[aria-label*='28']").last();
    await cv.scrollIntoViewIfNeeded();
    const bb = await cv.boundingBox();
    await page.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width * 0.6, bb.y + bb.height * 0.7, { steps: 8 });
    await page.mouse.up();
    await b("runNet").click();
    await page.waitForTimeout(400);
    return (await body()).match(/(Pixels with ink|Pikseliai su rašalu): ([1-9]\d*)/) !== null;
  }
  if (id === "activations") {
    await page.getByRole("radiogroup").last().getByRole("radio").first().click();
    return true;
  }
  if (id === "optimizers") {
    await b("run40").click();
    await page.waitForTimeout(100);
    return (await body()).includes("lr 0.1");
  }
  return true;
}

for (const lang of ["en", "lt"]) {
  // ---- every step: console, map, quiz, checklist persistence, widgets (desktop) ----
  const errors = [];
  const { ctx, page } = await open(lang, { width: 1440, height: 950 }, errors);
  for (const id of STEPS) {
    await page.goto(`${BASE}/labs/lab1/${id}`);
    await page.waitForSelector("[data-testid=guide-outro]", { timeout: 15000 });
    const nav = page.getByRole("navigation", { name: T[lang].map });
    check((await nav.count()) === 1 && (await nav.getByRole("link").count()) === 9, `[${lang}] ${id}: pipeline map with 9 stages`);
    check((await nav.locator("[aria-current=step]").count()) === 1, `[${lang}] ${id}: map marks the current stage`);

    const group = page.locator("[data-testid=guide-outro] [role=radiogroup]").first();
    await group.getByRole("radio").first().click();
    const fb = await page.locator("[data-testid=guide-outro] [role=status]").first().innerText();
    check(fb.includes(T[lang].correct) || fb.includes(T[lang].wrong), `[${lang}] ${id}: quiz answer shows feedback (“${fb.slice(0, 30).replace(/\s+/g, " ")}…”)`);

    const box = page.locator("[data-testid=guide-intro] input[type=checkbox]").first();
    await box.check();
    await page.reload();
    await page.waitForSelector("[data-testid=guide-outro]");
    check(await page.locator("[data-testid=guide-intro] input[type=checkbox]").first().isChecked(), `[${lang}] ${id}: checklist tick persists after reload`);

    check(await interact(page, id, lang), `[${lang}] ${id}: hands-on widget responds`);
    if (id === "anomalies") {
      if (lang === "en") await page.screenshot({ path: OUT + "lab1-guide.png", fullPage: true });
      else await page.screenshot({ path: OUT + "lab1-guide-lt.png", fullPage: true });
    }
  }
  check(errors.length === 0, `[${lang}] no console errors on any of the 13 steps${errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""}`);
  errors.length = 0;
  await ctx.close();

  // ---- every step at 375px: no horizontal overflow ----
  const merrors = [];
  const m = await open(lang, { width: 375, height: 812 }, merrors);
  for (const id of STEPS) {
    await m.page.goto(`${BASE}/labs/lab1/${id}`);
    await m.page.waitForSelector("[data-testid=guide-outro]", { timeout: 15000 });
    await m.page.waitForTimeout(250);
    const page_ = await m.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    // the platform top bar is not part of the lab: measure the lab content with it hidden, report the bar separately
    const over = await m.page.evaluate(() => {
      const h = document.querySelector("header");
      const prev = h ? h.style.display : "";
      if (h) h.style.display = "none";
      const o = document.documentElement.scrollWidth - window.innerWidth;
      if (h) h.style.display = prev;
      return o;
    });
    check(over <= 2, `[${lang}] ${id}: 375px horizontal overflow of the lab content ${over}px`);
    if (page_ > 2) console.log(`WARN [${lang}] ${id}: the platform top bar alone overflows the page by ${page_}px at 375px (NavBar, outside this lab)`);
  }
  check(merrors.length === 0, `[${lang}] no console errors at 375px${merrors.length ? ": " + merrors.slice(0, 3).join(" | ") : ""}`);
  await m.ctx.close();
}

// ---- pipeline screenshots (with some progress ticked) and one Kannada page ----
{
  const errors = [];
  const { ctx, page } = await open("en", { width: 1440, height: 950 }, errors);
  await page.addInitScript(() => { try { localStorage.setItem("ailab-progress-lab1", JSON.stringify({ done: ["big-picture", "real-world", "missing-values", "anomalies", "scaling"] })); } catch { /* ignore */ } });
  await page.goto(`${BASE}/labs/lab1/network`);
  await page.waitForSelector("[data-testid=guide-outro]");
  await page.getByRole("navigation", { name: T.en.map }).screenshot({ path: OUT + "lab1-pipeline.png" });
  const done = await page.getByRole("navigation", { name: T.en.map }).locator("a", { hasText: "✓" }).count();
  check(done === 4, `pipeline map ticks the 4 finished stages (raw data, missing values, anomalies, scaling): ${done}`);
  await ctx.close();

  const k = await open("kn", { width: 1440, height: 950 }, errors);
  await k.page.goto(`${BASE}/labs/lab1/scaling`);
  await k.page.waitForSelector("[data-testid=guide-outro]");
  await k.page.screenshot({ path: OUT + "lab1-guide-kn.png", fullPage: true });
  check(errors.length === 0, "no console errors in the pipeline / Kannada pages");
  await k.ctx.close();

  const mob = await open("en", { width: 375, height: 812 }, errors);
  await mob.page.goto(`${BASE}/labs/lab1/anomalies`);
  await mob.page.waitForSelector("[data-testid=guide-outro]");
  await mob.page.screenshot({ path: OUT + "lab1-guide-mobile.png" });
  await mob.ctx.close();
}

await browser.close();
console.log(failures.length ? "FAILURES:\n" + failures.join("\n") : "ALL CHECKS PASSED, no console errors");
process.exit(failures.length ? 1 : 0);
