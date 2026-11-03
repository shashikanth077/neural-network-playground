// Drives the paper page /tools/transformers in English, Lithuanian and Kannada at 320, 375, 768 and 1440 px, light and dark.
// Checks: no console errors (Google Fonts failures ignored), no raw i18n key, no horizontal overflow (also with live demos open),
// the outline's scroll-spy follows scrolling, deep links land on their section, print media keeps every section and drops the demos.
// Saves screenshots/transformers-paper-top.png, transformers-paper-method.png and transformers-paper-results.png (viewport shots).
// Usage: BASE_URL=http://127.0.0.1:5300 CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/capture-transformers-paper.mjs
//   QUICK=1 runs a reduced matrix (English light and Lithuanian dark only).
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5300";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const failures = [];
const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) failures.push(msg); };

const RAW = /\btp\.[a-z0-9]+\.[a-zA-Z0-9.]+|\blab3\.[a-z]\.[a-z0-9]+\.|\bstep\.lab3\./i;
const SECTIONS = ["intro", "review", "problem", "dataset", "competitors", "criteria", "program", "architecture", "math", "protocol", "implementation",
  "results-overall", "results-cost", "results-data", "results-ready", "results-errors", "results-prev", "conclusions", "references"];
const STEPS = ["history", "design", "tokens", "position", "attention", "heads", "encoder", "complexity", "training", "baselines", "results", "cost", "efficiency", "readymade", "errors", "decide"];
const SOME = ["attention", "encoder", "results", "errors"];
const WIDTHS = [[320, 760], [375, 800], [768, 1000], [1440, 900]];
const LANGS = ["en", "lt", "kn"];
const QUICK = !!process.env.QUICK;

async function open(lang, vp, scheme, hash = "") {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, colorScheme: scheme });
  await ctx.addInitScript(([l, s]) => { try { localStorage.setItem("ailab.lang", l); localStorage.setItem("nnp-theme", s); } catch { /* storage blocked */ } }, [lang, scheme]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  const fonts = (u) => /fonts\.(googleapis|gstatic)\.com/.test(u);
  page.on("console", (m) => { if (m.type() === "error" && !fonts(m.location().url ?? "") && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("requestfailed", (r) => { if (!fonts(r.url()) && !/ERR_ABORTED/.test(r.failure()?.errorText ?? "")) errors.push("request failed: " + r.url() + " " + (r.failure()?.errorText ?? "")); });
  await page.goto(`${BASE}/tools/transformers${hash}`);
  await page.waitForSelector("[data-section=references]");
  return { ctx, page, errors };
}

const overflow = (page) => page.evaluate(() => {
  const w = document.documentElement.clientWidth;
  const d = document.documentElement.scrollWidth - w;
  if (d <= 0) return { d: 0, who: [] };
  const who = [...document.body.querySelectorAll("*")]
    .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > w + 1 && !e.closest(".overflow-x-auto"); })
    .slice(0, 4).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 50)} right=${Math.round(e.getBoundingClientRect().right)}`);
  return { d, who };
});

async function reveal(page, step) {
  const loc = page.locator(`[data-testid=live-${step}]`);
  await loc.scrollIntoViewIfNeeded();
  await page.waitForFunction((s) => {
    const el = document.querySelector(`[data-testid=live-${s}]`);
    return el && el.getAttribute("data-mounted") === "true" && !el.querySelector("[data-testid=tp-skeleton]");
  }, step, { timeout: 30000 });
  await page.waitForTimeout(500);
}

const bodyText = (page) => page.evaluate(() => {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("pre, script, style, .katex, svg title, svg desc").forEach((e) => e.remove());
  return clone.innerText ?? clone.textContent;
});

const matrix = [];
for (const lang of LANGS) for (const vp of WIDTHS) for (const scheme of ["light", "dark"]) {
  if (QUICK && !((lang === "en" && scheme === "light") || (lang === "lt" && scheme === "dark"))) continue;
  matrix.push([lang, vp, scheme]);
}

for (const [lang, vp, scheme] of matrix) {
  const tag = `${lang} · ${vp[0]}px · ${scheme}`;
  let d;
  try { d = await open(lang, vp, scheme); } catch (e) { check(false, `${tag}: failed to load (${e.message.split("\n")[0]})`); continue; }
  const { page } = d;

  // content
  const text = await bodyText(page);
  check(!RAW.test(text), `${tag}: no raw i18n key on screen`);
  check(!/\{[A-Za-z]+\}/.test(text), `${tag}: no unfilled {placeholder}`);
  check((await page.locator("h1").count()) === 1, `${tag}: exactly one h1`);
  check((await page.locator("[data-section]").count()) === SECTIONS.length, `${tag}: ${SECTIONS.length} sections`);
  const o0 = await overflow(page);
  check(o0.d <= 0, `${tag}: no horizontal overflow on load${o0.d ? ` (${o0.d}px: ${o0.who.join(" | ")})` : ""}`);

  // live demos: open some (all of them for English light) and re-check the overflow with each demo open
  const steps = lang === "en" && scheme === "light" ? STEPS : SOME;
  for (const s of steps) {
    try {
      await reveal(page, s);
      const o = await overflow(page);
      check(o.d <= 0, `${tag}: no horizontal overflow with demo "${s}" open${o.d ? ` (${o.d}px: ${o.who.join(" | ")})` : ""}`);
    } catch (e) { check(false, `${tag}: demo "${s}" failed (${e.message.split("\n")[0]})`); }
  }
  check((await page.locator("h1").count()) === 1, `${tag}: still one h1 with demos open`);
  if (steps === STEPS) {
    const dup = await page.evaluate(() => { const seen = new Map(); document.querySelectorAll("[id]").forEach((e) => seen.set(e.id, (seen.get(e.id) ?? 0) + 1)); return [...seen].filter(([, n]) => n > 1).map(([id]) => id); });
    check(dup.length === 0, `${tag}: no duplicate id attributes with all demos mounted${dup.length ? ` (${dup.slice(0, 5).join(", ")})` : ""}`);
  }
  const text2 = await bodyText(page);
  check(!RAW.test(text2), `${tag}: no raw i18n key with demos open`);
  check(!/\{[A-Za-z]+\}/.test(text2), `${tag}: no unfilled {placeholder} with demos open`);

  // diagrams respond, original figure toggle
  await page.locator("#fig-1 [data-node=s04]").scrollIntoViewIfNeeded();
  await page.locator("#fig-1 [data-node=s04]").click();
  const detail = await page.locator("#fig-1 [data-testid=diagram-detail]").innerText();
  await page.locator("#fig-1 [data-node=s07]").click();
  const detail2 = await page.locator("#fig-1 [data-testid=diagram-detail]").innerText();
  check(detail !== detail2 && detail.length > 20, `${tag}: Fig. 1 nodes respond`);
  await page.locator("#fig-2 button[aria-expanded=false]").first().click();
  check((await page.locator("#fig-2 img").count()) === 1, `${tag}: original Fig. 2 PNG opens`);
  const o3 = await overflow(page);
  check(o3.d <= 0, `${tag}: no horizontal overflow with the original figure open${o3.d ? ` (${o3.d}px)` : ""}`);

  // scroll-spy
  const desktop = vp[0] >= 1024;
  const activeOf = () => page.evaluate((desk) => {
    const el = document.querySelector(desk ? "[data-testid=tp-outline]" : "[data-testid=tp-outline-bar]");
    return el ? el.getAttribute("data-active") : null;
  }, desktop);
  let spyOk = true;
  const spyBad = [];
  for (let i = 0; i < SECTIONS.length; i++) {
    const id = SECTIONS[i];
    await page.evaluate((x) => document.getElementById(x).scrollIntoView({ behavior: "instant", block: "start" }), id);
    await page.waitForTimeout(160);
    const a = await activeOf();
    const idx = SECTIONS.indexOf(a);
    const near = i >= SECTIONS.length - 3 ? idx >= i - 0 || idx === SECTIONS.length - 1 : idx === i;
    if (!near) { spyOk = false; spyBad.push(`${id}->${a}`); }
  }
  check(spyOk, `${tag}: scroll-spy follows scrolling${spyBad.length ? ` (${spyBad.join(", ")})` : ""}`);
  const prog = await page.evaluate(() => document.querySelector("[data-testid=tp-progress]").getAttribute("aria-valuenow"));
  check(Number(prog) > 80, `${tag}: reading-progress bar reaches the end (${prog}%)`);

  // view switch hides the demos
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("radio", { name: /^(Read|Skaityti|ಓದಿ)$/ }).click();
  check((await page.locator(".tp-live").count()) === 0, `${tag}: the plain view has no live demo`);
  const o4 = await overflow(page);
  check(o4.d <= 0, `${tag}: no horizontal overflow in the plain view${o4.d ? ` (${o4.d}px)` : ""}`);

  check(d.errors.length === 0, `${tag}: no console errors${d.errors.length ? ` (${d.errors[0].slice(0, 160)})` : ""}`);
  await d.ctx.close();
}

// deep links and print: English light, plus a phone in Lithuanian dark
for (const [lang, vp, scheme] of [["en", [1440, 900], "light"], ["en", [375, 800], "light"], ["lt", [375, 800], "dark"]]) {
  const tag = `${lang} · ${vp[0]}px · ${scheme}`;
  for (const id of ["results-overall", "math", "references", "arch-attention", "eq-3", "conclusions"]) {
    const d = await open(lang, vp, scheme, `#${id}`);
    await d.page.waitForTimeout(2000);
    const top = await d.page.evaluate((x) => document.getElementById(x).getBoundingClientRect().top, id);
    const atEnd = await d.page.evaluate(() => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3);
    check((top > -8 && top < 280) || (atEnd && top > 0 && top < vp[1]), `${tag}: deep link #${id} lands on its section (top ${Math.round(top)}px${atEnd ? ", page end" : ""})`);
    await d.ctx.close();
  }
}

{
  const d = await open("en", [1440, 900], "light");
  const { page } = d;
  for (const s of ["efficiency", "history"]) await reveal(page, s);
  await page.emulateMedia({ media: "print" });
  const pr = await page.evaluate(() => {
    const vis = (e) => getComputedStyle(e).display !== "none" && e.offsetHeight > 0;
    return {
      sections: [...document.querySelectorAll("[data-section]")].map((e) => ({ id: e.dataset.section, ok: vis(e) })),
      live: [...document.querySelectorAll(".tp-live")].filter(vis).length,
      noprint: [...document.querySelectorAll(".tp-noprint")].filter(vis).length,
      nav: [...document.querySelectorAll("header.sticky")].filter(vis).length,
      notes: [...document.querySelectorAll(".tp-printonly")].filter(vis).length,
      bg: getComputedStyle(document.body).backgroundColor,
      figs: [...document.querySelectorAll(".tp-figure")].every(vis),
      tables: [...document.querySelectorAll(".tp-table")].every(vis),
    };
  });
  check(pr.sections.length === SECTIONS.length && pr.sections.every((s) => s.ok), `print: all ${SECTIONS.length} sections stay (${pr.sections.filter((s) => !s.ok).map((s) => s.id).join(",") || "none hidden"})`);
  check(pr.live === 0, "print: no live demo is printed");
  check(pr.noprint === 0 && pr.nav === 0, "print: app bar, outline, buttons and progress bar are hidden");
  check(pr.notes === STEPS.length, `print: each demo is replaced by a one-line note (${pr.notes})`);
  check(pr.figs && pr.tables, "print: figures and tables are printed");
  check(/255, 255, 255/.test(pr.bg), `print: white background (${pr.bg})`);
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  check(pdf.length > 100000 && pages > 8, `print: PDF has ${pages} pages (${Math.round(pdf.length / 1024)} KB)`);
  await d.ctx.close();
}

// screenshots (English, light, desktop; viewport shots). The deep link scrolls the page and keeps the target in place while the demos around it mount.
{
  const top = await open("en", [1440, 900], "light");
  await top.page.evaluate(() => window.scrollTo(0, 0));
  await top.page.waitForTimeout(400);
  await top.page.screenshot({ path: OUT + "transformers-paper-top.png" });
  await top.ctx.close();

  const method = await open("en", [1440, 900], "light", "#arch-attention");
  await method.page.waitForTimeout(3500);
  await method.page.screenshot({ path: OUT + "transformers-paper-method.png" });
  await method.ctx.close();

  const results = await open("en", [1440, 900], "light", "#results-overall");
  await results.page.waitForTimeout(3500);
  await results.page.screenshot({ path: OUT + "transformers-paper-results.png" });
  await results.ctx.close();
}

await browser.close();
console.log(`\n${failures.length ? failures.length + " check(s) failed" : "all checks passed"}`);
process.exit(failures.length ? 1 : 0);
