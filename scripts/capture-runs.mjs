// Drives the running app with Playwright to check the experiment database end to end:
// train in the Playground -> run is saved -> /runs lists it -> compare two runs -> open one in the Playground,
// plus layout checks (no horizontal overflow at 375 px, header fits at 320 px) in English, Lithuanian and Kannada.
//
// Usage (backend on :8010, Vite on :5210 proxying to it):
//   cd backend && DB_PATH=/tmp/runs-e2e.db uvicorn app.main:app --port 8010
//   cd frontend && VITE_API_PROXY=http://127.0.0.1:8010 npx vite --port 5210 --strictPort
//   CHROMIUM_PATH=/path/to/chrome node scripts/capture-runs.mjs
// WARNING: it deletes every saved run in the database it talks to, so point it at a throw-away DB_PATH.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5210";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errors = [];
const log = (m) => console.log(m);
const check = (ok, msg) => {
  if (!ok) throw new Error("FAILED: " + msg);
  log("ok   " + msg);
};

async function newPage(opts = {}) {
  const { lang = "en", ...ctxOpts } = opts;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: "light", ...ctxOpts });
  await ctx.addInitScript((l) => { try { localStorage.setItem("ailab.lang", l); } catch { /* ignore */ } }, lang);
  const page = await ctx.newPage();
  // Web fonts come from Google Fonts, which is not reachable from the sandbox: that is not an app error.
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (/fonts\.(googleapis|gstatic)\.com/.test(m.location().url ?? "")) return;
    errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));
  return page;
}

const api = async (page, path, init) => page.evaluate(async ([p, i]) => {
  const r = await fetch("/api" + p, i);
  return { status: r.status, body: r.status === 204 ? null : await r.json() };
}, [path, init]);

// ---- start from an empty database
let page = await newPage();
await page.goto(BASE + "/runs");
for (const r of (await api(page, "/runs?limit=200")).body.items) await api(page, "/runs/" + r.id, { method: "DELETE" });
await page.reload();
await page.waitForSelector('[data-testid="runs-empty"]');
check(await page.getByText("No saved runs yet").isVisible(), "empty state explains that nothing is saved yet");
await page.screenshot({ path: OUT + "runs-empty.png" });

// ---- train three runs in the Playground
await page.goto(BASE + "/playground");
const trainButton = page.getByRole("button", { name: /^▶ Train/ });
async function trainAndWaitSaved() {
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^▶ Train/.test(b.textContent) && !b.disabled), null, { timeout: 20000 });
  await trainButton.click();
  await page.waitForSelector('[data-testid="run-saved"]', { timeout: 60000 });
}
async function setField(sel, value) {
  await page.locator(sel).fill(String(value));
}
await setField("#epochs", 40);
await setField("#delay", 0);
await trainAndWaitSaved();
check(await page.getByTestId("run-saved").getByText("Saved to My runs").isVisible(), "Playground shows 'Saved to My runs' when training finishes");
const link = await page.getByTestId("run-saved").getByRole("link", { name: "View run" }).getAttribute("href");
check(/^\/runs\?run=[0-9a-f]+$/.test(link), "the confirmation links to the run (" + link + ")");
const firstId = link.split("=")[1];
await page.screenshot({ path: OUT + "runs-playground-saved.png" });

await page.locator("#opt").selectOption("sgd");
await setField("#lr", 0.3);
await page.waitForFunction(() => !document.querySelector('[data-testid="run-saved"]'), null, { timeout: 10000 });
await trainAndWaitSaved();

await page.locator("#opt").selectOption("adam");
await setField("#lr", 0.1);
await setField("#mseed", 3);
await page.waitForFunction(() => !document.querySelector('[data-testid="run-saved"]'), null, { timeout: 10000 });
await trainAndWaitSaved();
log("trained 3 runs");

// ---- My runs page
await page.getByRole("link", { name: "My runs" }).click();
await page.waitForSelector('[data-testid="run-card"]');
await page.waitForFunction(() => document.querySelectorAll('[data-testid="run-card"]').length === 3);
check(true, "My runs lists the 3 runs just trained");
const cards = page.getByTestId("run-card");
check((await cards.first().innerText()).includes("sgd") === false, "newest first: the last run (adam, lr 0.1) is on top");
check((await cards.nth(1).innerText()).includes("sgd"), "second card is the SGD run");
check((await cards.first().innerText()).includes("lr 0.1"), "settings chips show lr 0.1");
check(await cards.first().getByRole("img", { name: "Training loss curve" }).isVisible(), "sparkline is drawn");
// the sticky header would land in the middle of a full-page capture
await page.addStyleTag({ content: "header { position: static !important; }" });
await page.screenshot({ path: OUT + "runs-list.png", fullPage: true });

// rename + notes
await cards.first().getByRole("button", { name: "Rename and notes" }).click();
await cards.first().getByLabel("Title").fill("Adam, lr 0.1, seed 3");
await cards.first().getByLabel("Notes").fill("Faster at first, noisier later.");
await cards.first().getByRole("button", { name: "Save" }).click();
await page.getByRole("heading", { name: "Adam, lr 0.1, seed 3" }).waitFor();
check(await page.getByText("Faster at first, noisier later.").isVisible(), "rename and notes saved");

// search
await page.getByLabel("Search runs").fill("sgd");
await page.waitForFunction(() => document.querySelectorAll('[data-testid="run-card"]').length === 1);
check(true, "search for 'sgd' leaves one run");
await page.getByLabel("Search runs").fill("");
await page.waitForFunction(() => document.querySelectorAll('[data-testid="run-card"]').length === 3);

// compare two runs
const boxes = page.getByRole("checkbox", { name: /Select this run/ });
await boxes.nth(0).check();
check(await page.getByRole("button", { name: /^Compare/ }).isDisabled(), "compare is disabled with one run selected");
await boxes.nth(1).check();
await page.getByRole("button", { name: "Compare 2 runs" }).click();
await page.waitForSelector('[data-testid="settings-diff"]');
const diffKeys = await page.locator('[data-testid="settings-diff"] tbody th').allInnerTexts();
check(["optimizer", "learning_rate"].every((k) => diffKeys.some((d) => d.startsWith(k))), "settings diff lists optimizer and learning_rate: " + diffKeys.join(", ").replace(/\s+/g, " "));
await page.waitForSelector('[data-testid="run-compare"] svg.recharts-surface');
const curves = await page.locator('[data-testid="run-compare"] .recharts-line-curve').count();
check(curves >= 4, `overlaid curves drawn (${curves} lines for 2 runs: loss and accuracy)`);
await page.locator("#run-compare").scrollIntoViewIfNeeded();
await page.screenshot({ path: OUT + "runs-compare.png", fullPage: true });
await page.getByRole("button", { name: "Close comparison" }).click();

// open in Playground restores the settings
await page.getByTestId("run-card").nth(1).getByRole("button", { name: "Open in Playground" }).click();
await page.waitForURL(/\/playground$/);
await page.waitForFunction(() => document.querySelector("#opt")?.value === "sgd", null, { timeout: 10000 });
check((await page.locator("#opt").inputValue()) === "sgd", "Open in Playground restores the optimizer (sgd)");
check((await page.locator("#lr").inputValue()) === "0.3", "...the learning rate (0.3)");
check((await page.locator("#epochs").inputValue()) === "40", "...and the epochs (40)");
await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /^▶ Train/.test(b.textContent) && !b.disabled), null, { timeout: 20000 });
check(true, "the Playground builds a model from the restored settings");

// the confirmation link scrolls to and highlights the run
await page.goto(BASE + "/runs?run=" + firstId);
await page.waitForSelector('[data-testid="run-card"].ring-2');
check(true, "/runs?run=<id> highlights that run");

// delete with confirmation
await page.getByTestId("run-card").first().getByRole("button", { name: "Delete" }).click();
check(await page.getByText("Delete this run? This cannot be undone.").isVisible(), "delete asks for confirmation");
await page.getByRole("button", { name: "Yes, delete" }).click();
await page.waitForFunction(() => document.querySelectorAll('[data-testid="run-card"]').length === 2);
check((await api(page, "/runs")).body.total === 2, "deleted run is gone from the database");

// ---- layout in all three languages: no horizontal overflow at 375 px, header fits at 320 px
await page.context().close();
for (const lang of ["en", "lt", "kn"]) {
  for (const width of [375, 320]) {
    const p = await newPage({ lang, viewport: { width, height: 900 } });
    await p.goto(BASE + "/runs");
    await p.waitForSelector('[data-testid="run-card"]');
    if (width === 375) {
      const boxes2 = p.locator('[data-testid="run-card"] input[type=checkbox]');
      await boxes2.nth(0).check();
      await boxes2.nth(1).check();
      await p.locator("button.btn-primary").first().click();
      await p.waitForSelector('[data-testid="settings-diff"]');
    }
    const m = await p.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Primary"]').getBoundingClientRect();
      const header = document.querySelector("header").getBoundingClientRect();
      return { scrollWidth: document.documentElement.scrollWidth, inner: window.innerWidth, navRight: nav.right, navLeft: nav.left, headerRight: header.right, navLinks: [...document.querySelectorAll('nav[aria-label="Primary"] > *')].map((e) => Math.round(e.getBoundingClientRect().right)) };
    });
    check(m.scrollWidth <= m.inner, `${lang} @${width}px: no horizontal overflow (scrollWidth ${m.scrollWidth} <= ${m.inner})`);
    check(Math.max(...m.navLinks) <= m.inner && m.navLeft >= 0, `${lang} @${width}px: header navigation fits (right edge ${Math.max(...m.navLinks)})`);
    if (width === 375 && lang === "en") await p.evaluate(() => window.scrollTo(0, 0));
    if (width === 375 && lang === "en") await p.screenshot({ path: OUT + "runs-mobile.png", fullPage: false });
    await p.context().close();
  }
}

await browser.close();
const real = errors.filter(Boolean);
if (real.length) {
  console.error("Console errors:\n" + real.join("\n"));
  process.exit(1);
}
log("no console errors; all browser checks passed");
