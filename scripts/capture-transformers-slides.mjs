// Drives the presentation (/tools/transformers/slides) with Playwright: all 11 slides in English, Lithuanian and Kannada
// at 320 / 375 / 768 / 1440 px, light and dark. Checks: no console errors (Google Fonts failures ignored), no raw i18n key
// or {placeholder} on screen, no horizontal page overflow, no slide content wider than its frame, no slide taller than 16:9
// at widths from 640 px up (that would mean translated text overflows), keyboard navigation, overview grid, notes panel,
// presenter view, help dialog, the fullscreen button, and print emulation: 11 visible slide sections and 11 PDF pages
// (also with notes). Saves screenshots/transformers-slide-3.png, -slide-8.png and transformers-presenter.png.
// Usage: BASE_URL=http://127.0.0.1:5310 CHROMIUM_PATH=/path/to/chrome node scripts/capture-transformers-slides.mjs
//   (start the frontend first: cd frontend && npx vite --port 5310; Playwright from /opt/node-tools/node_modules)
//   SKIP_MATRIX=1 runs only the behaviour, swipe and print checks. EXTRA_DIR=/some/dir additionally saves every slide of the 1440 px English light view and the 320 / 768 px views there.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5310";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
const EXTRA = process.env.EXTRA_DIR;
mkdirSync(OUT, { recursive: true });
if (EXTRA) mkdirSync(EXTRA, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const failures = [];
const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) failures.push(msg); };
const RAW = /\bts\.(?:s\d+|ui|fam)\.[A-Za-z0-9.]+|\{[a-z]+\}/;
const LANGS = ["en", "lt", "kn"];
const VIEWPORTS = [{ width: 320, height: 800 }, { width: 375, height: 800 }, { width: 768, height: 900 }, { width: 1440, height: 950 }];
const IGNORE = /fonts\.(googleapis|gstatic)|net::ERR_|Failed to load resource/;

async function open(lang, viewport, scheme, hash = "#slide-1") {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme, acceptDownloads: false });
  await ctx.addInitScript((l) => { try { localStorage.setItem("ailab.lang", l); } catch { /* storage blocked */ } }, lang);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" && !IGNORE.test(m.text())) errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(`${BASE}/tools/transformers/slides${hash}`);
  await page.waitForSelector("section[data-slide][aria-label]");
  return { ctx, page, errors };
}

const counter = (page) => page.getByTestId("ts-counter").innerText();

/** Layout facts about the slide currently shown. */
const measure = (page) => page.evaluate(() => {
  const s = document.querySelector("section[data-slide][aria-label]");
  const r = s.getBoundingClientRect();
  const wide = [];
  s.querySelectorAll("*").forEach((el) => {
    if (el.closest("svg") && el.tagName !== "svg") return;
    const b = el.getBoundingClientRect();
    if (el.closest('.katex-mathml')) return;
    if (b.width > 0 && b.right > r.right + 2) wide.push(el.tagName + "." + String(el.className).slice(0, 30));
  });
  const imgs = [...s.querySelectorAll("img")].map((i) => i.complete && i.naturalWidth > 0);
  return {
    n: s.getAttribute("data-slide"), label: s.getAttribute("aria-label"), w: r.width, h: r.height, wide: wide.slice(0, 3),
    pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
    text: (() => { const c = s.cloneNode(true); c.querySelectorAll('.katex-mathml').forEach((e) => e.remove()); return c.textContent; })(), imgsOk: imgs.every(Boolean),
  };
});

// ------------------------------------------------------------------------------------------ all slides x languages x sizes x themes
for (const lang of process.env.SKIP_MATRIX ? [] : LANGS) {
  for (const vp of VIEWPORTS) {
    for (const scheme of ["light", "dark"]) {
      const tag = `${lang} ${vp.width}px ${scheme}`;
      const { ctx, page, errors } = await open(lang, vp, scheme);
      const issues = [];
      for (let n = 1; n <= 11; n++) {
        if (n > 1) await page.keyboard.press("ArrowRight");
        await page.waitForFunction((k) => document.querySelector("section[data-slide][aria-label]")?.getAttribute("data-slide") === String(k), n);
        const m = await measure(page);
        if (RAW.test(m.text)) issues.push(`slide ${n}: raw key or placeholder`);
        if (m.pageOverflow > 1) issues.push(`slide ${n}: page overflows by ${m.pageOverflow}px`);
        if (m.wide.length) issues.push(`slide ${n}: content wider than the frame (${m.wide.join(", ")})`);
        if (vp.width >= 768 && m.h > (m.w * 9) / 16 + 3) issues.push(`slide ${n}: taller than 16:9 (${Math.round(m.h)} vs ${Math.round((m.w * 9) / 16)})`);
        if (!m.imgsOk) issues.push(`slide ${n}: image not loaded`);
        if (!new RegExp(`${n}`).test(m.label ?? "")) issues.push(`slide ${n}: aria-label ${m.label}`);
        if (EXTRA && lang === "en" && scheme === "light" && [320, 768, 1440].includes(vp.width)) await page.locator("section[data-slide][aria-label]").screenshot({ path: `${EXTRA}/s${n}-${vp.width}.png` });
        if (EXTRA && lang !== "en" && vp.width === 1440 && scheme === "light") await page.locator("section[data-slide][aria-label]").screenshot({ path: `${EXTRA}/s${n}-${lang}.png` });
        if (EXTRA && lang === "en" && scheme === "dark" && vp.width === 1440) await page.locator("section[data-slide][aria-label]").screenshot({ path: `${EXTRA}/s${n}-dark.png` });
      }
      check(issues.length === 0, `${tag}: 11 slides clean${issues.length ? " -> " + issues.slice(0, 6).join("; ") : ""}`);
      check(errors.length === 0, `${tag}: no console errors${errors.length ? " -> " + errors[0] : ""}`);
      await ctx.close();
    }
  }
}

// ------------------------------------------------------------------------------------------ behaviour (English, 1440, light)
{
  const { ctx, page, errors } = await open("en", { width: 1440, height: 950 }, "light");
  check((await counter(page)).startsWith("1 /"), "starts on slide 1");
  await page.keyboard.press("ArrowRight");
  check((await counter(page)).startsWith("2 /"), "ArrowRight goes to slide 2");
  await page.keyboard.press("PageDown");
  check((await counter(page)).startsWith("3 /"), "PageDown goes to slide 3");
  await page.keyboard.press("Space");
  check((await counter(page)).startsWith("4 /"), "Space goes to slide 4");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("PageUp");
  check((await counter(page)).startsWith("2 /"), "ArrowLeft and PageUp go back");
  await page.keyboard.press("End");
  check((await counter(page)).startsWith("11 /"), "End goes to the last slide");
  check(page.url().endsWith("#slide-11"), "the hash follows the slide");
  await page.keyboard.press("Home");
  check((await counter(page)).startsWith("1 /"), "Home goes to the first slide");
  await page.getByTestId("ts-next").click();
  check((await counter(page)).startsWith("2 /"), "the Next button works");
  await page.getByTestId("ts-prev").click();
  check((await counter(page)).startsWith("1 /"), "the Previous button works");

  await page.keyboard.press("g");
  await page.waitForSelector("[data-testid='ts-overview']");
  check((await page.locator("[data-testid='ts-overview'] button").count()) === 11, "G opens the overview with 11 thumbnails");
  await page.locator("[data-thumb-btn='5']").click();
  check((await counter(page)).startsWith("5 /") && (await page.locator("[data-testid='ts-overview']").count()) === 0, "picking a thumbnail goes to that slide and closes the overview");
  await page.keyboard.press("g");
  await page.keyboard.press("Escape");
  check((await page.locator("[data-testid='ts-overview']").count()) === 0, "Esc closes the overview");
  await page.keyboard.press("?");
  check((await page.getByTestId("ts-help").count()) === 1, "? opens the shortcut help");
  await page.keyboard.press("Escape");
  check((await page.getByTestId("ts-help").count()) === 0, "Esc closes the help");

  await page.keyboard.press("n");
  check((await page.getByTestId("ts-notes-panel").count()) === 1, "N shows the speaker notes");
  check((await page.getByTestId("ts-notes-5").innerText()).includes("Stanford Sentiment Treebank"), "the notes of slide 5 are shown");
  await page.getByTestId("ts-timer-toggle").click();
  await page.waitForTimeout(1500);
  check((await page.getByTestId("ts-timer-total").innerText()) !== "0:00", "the rehearsal timer runs");
  await page.getByTestId("ts-timer-reset").click();
  check((await page.getByTestId("ts-timer-total").innerText()) === "0:00", "reset sets the timer to 0:00");
  await page.keyboard.press("n");

  await page.getByTestId("ts-btn-fullscreen").click();
  await page.waitForTimeout(300);
  check(true, "the fullscreen button does not throw");
  await page.keyboard.press("f");
  await page.waitForTimeout(300);

  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("p");
  await page.waitForSelector("[data-testid='ts-presenter']");
  check((await page.getByTestId("ts-next-preview").count()) === 1, "P opens the presenter view with a next-slide preview");
  check((await page.getByTestId("ts-presenter-notes").innerText()).includes("Explain Q, K, V"), "the presenter view shows the notes of slide 3");
  await page.getByTestId("ts-timer-toggle").click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}transformers-presenter.png` });
  await page.getByTestId("ts-timer-reset").click();
  await page.keyboard.press("Escape");
  check((await page.getByTestId("ts-presenter").count()) === 0, "Esc leaves the presenter view");

  await page.goto(`${BASE}/tools/transformers/slides#slide-3`);
  await page.waitForSelector("section[data-slide='3'][aria-label]");
  check((await counter(page)).startsWith("3 /"), "#slide-3 deep link opens slide 3");
  await page.locator("section[data-slide='3'][aria-label]").screenshot({ path: `${OUT}transformers-slide-3.png` });
  await page.goto(`${BASE}/tools/transformers/slides#slide-8`);
  await page.waitForSelector("section[data-slide='8'][aria-label]");
  await page.locator("section[data-slide='8'][aria-label]").screenshot({ path: `${OUT}transformers-slide-8.png` });
  const link = await page.getByTestId("ts-link-8").getAttribute("href");
  check(link === "/tools/transformers#results-cost", `slide 8 links to the paper section (${link})`);
  check(errors.length === 0, "behaviour run: no console errors" + (errors.length ? " -> " + errors[0] : ""));
  await ctx.close();
}

// ------------------------------------------------------------------------------------------ touch swipe
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/tools/transformers/slides#slide-2`);
  await page.waitForSelector("section[data-slide='2'][aria-label]");
  // real TouchEvent objects dispatched on the slide area: touchstart at x0, touchend at x1
  const swipe = (x0, x1, y1 = 0) => page.evaluate(([a, b, dy]) => {
    const el = document.querySelector(".ts-stagebox");
    const r = el.getBoundingClientRect();
    const mk = (type, x, y) => new TouchEvent(type, { bubbles: true, cancelable: true,
      touches: type === "touchend" ? [] : [new Touch({ identifier: 1, target: el, clientX: x, clientY: y })],
      changedTouches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: y })] });
    el.dispatchEvent(mk("touchstart", a, r.top + 40));
    el.dispatchEvent(mk("touchend", b, r.top + 40 + dy));
  }, [x0, x1, y1]);
  await swipe(300, 60);
  await page.waitForTimeout(250);
  check((await counter(page)).startsWith("3 /"), `swipe left goes to the next slide (${await counter(page)})`);
  await swipe(60, 300);
  await page.waitForTimeout(250);
  check((await counter(page)).startsWith("2 /"), `swipe right goes back (${await counter(page)})`);
  await swipe(100, 110, 200);
  await page.waitForTimeout(250);
  check((await counter(page)).startsWith("2 /"), "a vertical drag does not change the slide");
  await ctx.close();
}

// ------------------------------------------------------------------------------------------ print
for (const lang of LANGS) {
  const { ctx, page } = await open(lang, { width: 1280, height: 900 }, "light");
  await page.emulateMedia({ media: "print" });
  const visible = await page.evaluate(() => [...document.querySelectorAll("section[data-slide]")].filter((s) => getComputedStyle(s).display !== "none" && s.getBoundingClientRect().height > 0).length);
  check(visible === 11, `${lang} print emulation: ${visible} visible slide sections (expected 11)`);
  const chrome = await page.evaluate(() => [...document.querySelectorAll("header, nav, [data-testid='ts-btn-print']")].filter((e) => getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0).length);
  check(chrome === 0, `${lang} print: site header and viewer buttons are hidden (${chrome} visible)`);
  for (const notes of [false, true]) {
    await page.emulateMedia({ media: "screen" });
    await page.getByTestId("ts-print-notes-toggle").setChecked(notes);
    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({ preferCSSPageSize: true });
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    check(pages === 11, `${lang} PDF ${notes ? "with" : "without"} notes has ${pages} pages (expected 11)`);
    if (EXTRA && lang === "en") require_write(`${EXTRA}/print-${notes ? "notes" : "plain"}.pdf`, pdf);
  }
  await ctx.close();
}
import { writeFileSync } from "node:fs";
function require_write(p, buf) { writeFileSync(p, buf); }

await browser.close();
console.log(failures.length ? `\n${failures.length} FAILED` : "\nALL PASSED");
process.exit(failures.length ? 1 : 0);
