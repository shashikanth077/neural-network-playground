// Cheatsheets + explorers: behaviour checks, layout checks at phone widths, screenshots.
// Usage: node scripts/capture-cheatsheets.mjs   (frontend server on :5173; no backend needed)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5173";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const errors = [];
const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) errors.push(msg); };
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
page.on("pageerror", (e) => errors.push("pageerror: " + e));

// menu
await page.goto(BASE);
await page.getByRole("button", { name: /^Cheatsheets/ }).click();
const menu = await page.locator("#sheets-menu").innerText();
check(/Neural Network/.test(menu) && /Machine Learning/.test(menu) && /Planned/.test(menu), "Cheatsheets menu lists NN (live) and planned sheets by domain");
await page.screenshot({ path: OUT + "cheatsheets-menu.png", clip: { x: 0, y: 0, width: 1440, height: 420 } });
await page.getByRole("link", { name: /Neural Network cheatsheet/ }).click();
await page.waitForSelector("h1:has-text('Neural Network')");
const total = await page.locator("main section[id]").count();
check(total >= 10, `sheet renders ${total} sections`);

// search
await page.getByRole("searchbox").fill("lstm");
const shown = await page.locator("main section[id]").count();
check(shown > 0 && shown < total, `search 'lstm' narrows ${total} → ${shown}`);
await page.getByRole("searchbox").fill("");
await page.screenshot({ path: OUT + "cheatsheet-nn.png", fullPage: true });

// calculators work in the page
const inputs = await page.locator("main input[type=number]").count();
check(inputs > 0, `calculators present (${inputs} numeric inputs)`);

// print: chrome hidden, content kept
await page.emulateMedia({ media: "print" });
check(!(await page.getByRole("searchbox").isVisible()), "print hides the search box");
check((await page.locator("main section[id]").count()) === total, "print keeps all sections");
await page.emulateMedia({ media: "screen" });

// explorers
await page.goto(BASE + "/tools/convolution");
await page.waitForSelector("h1:has-text('Convolution Explorer')");
check((await page.getByTestId("cnn-total").innerText()) === "333,526", "CNN total 333,526");
await page.getByLabel("Padding").selectOption("same");
check((await page.getByTestId("size-line").innerText()).includes("6×6"), "same padding → 6×6");
await page.getByLabel("Padding").selectOption("valid");
await page.getByRole("group", { name: "Feature map" }).locator("td").nth(5).hover();
check((await page.getByRole("group", { name: "Input" }).locator("td[style*='outline']").count()) === 9, "hover highlights a 9-cell receptive field");
await page.screenshot({ path: OUT + "tool-convolution.png", fullPage: true });

await page.goto(BASE + "/tools/recurrent");
await page.waitForSelector("h1:has-text('Recurrent Cell Explorer')");
await page.getByRole("tab", { name: "GRU" }).click();
check((await page.getByTestId("param-count").innerText()).includes("54"), "GRU parameter count shown");
await page.getByRole("tab", { name: "LSTM" }).click();
await page.screenshot({ path: OUT + "tool-recurrent.png", fullPage: true });

// layout at phone widths: no horizontal page scroll, open menus inside the viewport
for (const w of [320, 375, 768, 1440]) {
  const c = await browser.newContext({ viewport: { width: w, height: 800 } });
  const p = await c.newPage();
  for (const path of ["/", "/cheatsheets", "/cheatsheets/neural-network", "/tools", "/tools/convolution", "/tools/recurrent"]) {
    await p.goto(BASE + path);
    await p.waitForSelector("h1");
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(over <= 0, `${w}px ${path} no horizontal page scroll (overflow ${over})`);
  }
  await p.goto(BASE);
  for (const name of ["Labs", "Tools", "Cheatsheets"]) {
    await p.getByRole("button", { name: new RegExp("^" + name) }).click();
    const box = await p.locator("[id$='-menu']").boundingBox();
    check(box && box.x >= 0 && box.x + box.width <= w, `${w}px ${name} menu fits viewport`);
    await p.keyboard.press("Escape");
  }
  await c.close();
}

await browser.close();
if (errors.length) { console.log("\nFAILURES:\n" + errors.join("\n")); process.exit(1); }
console.log("\nAll checks passed.");
