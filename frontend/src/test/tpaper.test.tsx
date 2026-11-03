import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider, NAMESPACES, translate, type Lang } from "../i18n";
import { CURVE, DATASET, MODELS, STATS, SUBSETS } from "../labs/lab3/data/expModels";
import { TransformersPaper } from "../pages/TransformersPaper";
import { FIXED_IDS, OUTLINE, SECTION_IDS, TABLE2_AUTHORS, TABLE4 } from "../transformers/paper/data";
import { EQUATIONS } from "../transformers/paper/formulas";
import { keyResults } from "../transformers/paper/keyResults";
import { REFERENCES } from "../transformers/paper/refs";
import { paperRows } from "../transformers/paperRows";

interface Obs { cb: IntersectionObserverCallback; el: Element; live: boolean }
let observers: Obs[] = [];

class FakeIO {
  private cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) { this.cb = cb; }
  observe(el: Element) { observers.push({ cb: this.cb, el, live: true }); }
  unobserve() { /* unused */ }
  disconnect() { observers.filter((o) => o.cb === this.cb).forEach((o) => { o.live = false; }); }
  takeRecords() { return []; }
}

beforeEach(() => {
  localStorage.clear();
  observers = [];
  vi.stubGlobal("IntersectionObserver", FakeIO);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const page = (lang: Lang = "en", path = "/tools/transformers") => render(
  <I18nProvider initial={lang}><MemoryRouter initialEntries={[path]}><TransformersPaper /></MemoryRouter></I18nProvider>,
);

/** Scroll the live widget with this step id "near": fire its IntersectionObserver. */
function reveal(stepId: string) {
  const o = observers.find((x) => x.live && x.el.getAttribute("data-testid") === `live-${stepId}`);
  expect(o, `observer of ${stepId}`).toBeTruthy();
  act(() => o!.cb([{ isIntersecting: true, target: o!.el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
}

/** Text of the page without the KaTeX markup (it carries the LaTeX source and its braces). */
function visibleText(): string {
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("pre, script, style, .katex, svg title, svg desc").forEach((e) => e.remove());
  return clone.textContent ?? "";
}

/** Cell text with every kind of space turned into a plain one (the Lab 3 number format uses a no-break space). */
const cells = (table: HTMLElement) => Array.from(table.querySelectorAll("tbody tr")).map((r) => Array.from(r.children).map((c) => (c.textContent ?? "").replace(/\s/g, " ")));

const STEPS = ["history", "design", "tokens", "position", "attention", "heads", "encoder", "complexity", "training", "baselines", "results", "cost", "efficiency", "readymade", "errors", "decide"];

describe("structure", () => {
  it("has every section id of the brief, in order, once", () => {
    page();
    const ids = Array.from(document.querySelectorAll("[data-section]")).map((e) => e.getAttribute("data-section"));
    expect(ids).toEqual([...SECTION_IDS]);
    let last: Element | null = null;
    for (const id of FIXED_IDS) {
      const el = document.getElementById(id);
      expect(el, id).toBeTruthy();
      expect(document.querySelectorAll(`[id="${id}"]`).length, `unique ${id}`).toBe(1);
      if (last) expect(last.compareDocumentPosition(el!) & Node.DOCUMENT_POSITION_FOLLOWING, id).toBeTruthy();
      last = el;
    }
    expect(FIXED_IDS).toEqual(["intro", "review", "problem", "dataset", "competitors", "criteria", "program", "architecture", "math", "protocol", "results-overall", "results-cost", "results-data", "results-ready", "results-errors", "results-prev", "conclusions", "references"]);
  });

  it("outline links match the section ids, and the outline marks the current section", () => {
    page();
    const nav = screen.getByTestId("tp-outline");
    const hrefs = Array.from(nav.querySelectorAll("a[data-outline]")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(SECTION_IDS.map((s) => `#${s}`));
    expect(OUTLINE.map((o) => o.id)).toEqual([...SECTION_IDS]);
    for (const h of hrefs) expect(document.getElementById(h!.slice(1)), h!).toBeTruthy();
    expect(nav.querySelectorAll("[aria-current='location']").length).toBe(1);
  });

  it("the mobile outline bar opens a panel with the same links", () => {
    page();
    const bar = screen.getByTestId("tp-outline-bar");
    fireEvent.click(within(bar).getByRole("button"));
    const links = bar.querySelectorAll("a[data-outline]");
    expect(links.length).toBe(SECTION_IDS.length);
    fireEvent.click(links[3]);
    expect(bar.querySelectorAll("a[data-outline]").length).toBe(0);
  });

  it("every heading has an anchor link and a copy-link button; there is exactly one h1", () => {
    page();
    expect(document.querySelectorAll("h1").length).toBe(1);
    const heads = Array.from(document.querySelectorAll(".tp-heading"));
    expect(heads.length).toBeGreaterThan(35);
    for (const h of heads) {
      expect(h.querySelector("a[href^='#']"), h.textContent ?? "").toBeTruthy();
      expect(h.querySelector("button[aria-label]"), h.textContent ?? "").toBeTruthy();
    }
  });

  it("copies the link of a heading", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    page();
    const h = document.querySelector("#sec-nothing, section#results-overall .tp-heading")!;
    fireEvent.click(h.querySelector("button")!);
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/#results-overall$/));
    await waitFor(() => expect(h.textContent).toMatch(/copied/));
  });

  it("header: title, authors, study programme and the four buttons", () => {
    page();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Transformers and their application in natural language processing (NLP) tasks");
    expect(document.body.textContent).toContain("VILNIUS TECH · Faculty of Fundamental Sciences · Department of Information Technologies · Group project paper");
    expect(screen.getByTestId("tp-authors").textContent).toBe("Shashikanth Hosur Ramegowda · Shaeed Khan");
    expect(document.body.textContent).toContain("Engineering of Artificial Intelligence study program (state code 6211BX023)");
    expect(screen.getByTestId("btn-slides").getAttribute("href")).toBe("/tools/transformers/slides");
    expect(screen.getByTestId("btn-lab").getAttribute("href")).toBe("/labs/lab3");
    expect(screen.getByTestId("btn-sheet").getAttribute("href")).toBe("/cheatsheets/transformers");
    const code = screen.getByTestId("btn-code");
    expect(code.getAttribute("href")).toBe("https://github.com/shashikanth077/Transformers-NLP");
    expect(code.getAttribute("target")).toBe("_blank");
    expect(code.getAttribute("rel")).toContain("noopener");
  });
});

describe("key results strip", () => {
  it("shows numbers computed from the data modules (and equal to the paper)", () => {
    page();
    const best = (f: (m: (typeof MODELS)[number]) => boolean) => Math.max(...MODELS.filter(f).map((m) => m.accuracy)) * 100;
    const num = (id: string) => screen.getByTestId(id).textContent!;
    expect(num("key-ft")).toBe(`${best((m) => m.kind === "transformer-finetuned").toFixed(1)} %`);
    expect(num("key-classical")).toBe(`${best((m) => m.family === "classical").toFixed(1)} %`);
    expect(num("key-ready")).toBe(`${best((m) => m.kind === "transformer-pretrained").toFixed(1)} %`);
    const gain = (CURVE["bert-small"][0].accuracy - CURVE["tfidf-lr"][0].accuracy) * 100;
    expect(num("key-gain")).toBe(`+${gain.toFixed(1)}`);
    const ft = MODELS.find((m) => m.tag === "ft_distilbert_8000")!, svm = MODELS.find((m) => m.tag === "tfidf_svm")!;
    expect(num("key-slow")).toBe(`×${Math.round(ft.latencyMs / svm.latencyMs)}`);
    // the paper's own figures
    expect(num("key-ft")).toBe("88.8 %");
    expect(num("key-classical")).toBe("82.9 %");
    expect(num("key-ready")).toBe("91.1 %");
    expect(num("key-gain")).toBe("+14.1");
    expect(num("key-slow")).toBe("×710");
    expect(keyResults()).toEqual({ bestFineTuned: 88.8, bestClassical: 82.9, bestReady: 91.1, gain500: 14.1, slowdown: 710 });
    expect(screen.getByTestId("tp-recorded").textContent).toMatch(/Intel Core i5-8365U/);
  });
});

describe("live widgets", () => {
  it("each of the sixteen embedded Lab 3 steps is lazy: unmounted until scrolled near, then mounted alone", async () => {
    page();
    expect(STEPS.every((s) => screen.getByTestId(`live-${s}`).getAttribute("data-mounted") === "false")).toBe(true);
    expect(screen.getAllByTestId("tp-skeleton").length).toBe(STEPS.length);
    for (const s of STEPS) {
      const before = STEPS.filter((x) => screen.getByTestId(`live-${x}`).getAttribute("data-mounted") === "true");
      reveal(s);
      expect(screen.getByTestId(`live-${s}`).getAttribute("data-mounted")).toBe("true");
      const after = STEPS.filter((x) => screen.getByTestId(`live-${x}`).getAttribute("data-mounted") === "true");
      expect(after.length).toBe(before.length + 1);
      expect(screen.getByTestId(`step-link-${s}`).getAttribute("href")).toBe(`/labs/lab3/${s}`);
    }
  }, 60000);

  it("a mounted step renders its content inside the page, with no second h1", async () => {
    page();
    reveal("efficiency");
    await waitFor(() => expect(screen.getByTestId("ef-chart")).toBeInTheDocument(), { timeout: 15000 });
    reveal("history");
    await waitFor(() => expect(within(screen.getByTestId("live-history")).queryByTestId("tp-skeleton")).toBeNull(), { timeout: 15000 });
    expect(within(screen.getByTestId("live-history")).getAllByRole("heading").length).toBeGreaterThan(0);
    expect(document.querySelectorAll("h1").length).toBe(1);
    expect(screen.getByTestId("live-cost").getAttribute("data-mounted")).toBe("false");
  }, 60000);

  it("print keeps a note instead of the demo", () => {
    page();
    const notes = document.querySelectorAll(".tp-printonly");
    expect(notes.length).toBe(STEPS.length);
    expect(notes[0].textContent).toMatch(/left out of the printed version/);
    for (const n of Array.from(document.querySelectorAll(".tp-live"))) expect(n.className).toContain("tp-noprint");
  });
});

describe("view switch", () => {
  it("defaults to live demos, switches to plain reading and back, and remembers the choice", () => {
    page();
    const read = screen.getByRole("radio", { name: "Read" });
    const demos = screen.getByRole("radio", { name: "Read with live demos" });
    expect(demos).toHaveAttribute("aria-checked", "true");
    expect(document.querySelectorAll(".tp-live").length).toBe(STEPS.length);
    fireEvent.click(read);
    expect(read).toHaveAttribute("aria-checked", "true");
    expect(document.querySelectorAll(".tp-live").length).toBe(0);
    expect(screen.getByTestId("live-results").textContent).toMatch(/Open as a lab step/);
    expect(localStorage.getItem("ailab.tpaper.view")).toBe("read");
    fireEvent.click(demos);
    expect(document.querySelectorAll(".tp-live").length).toBe(STEPS.length);
  });

  it("starts in the plain view when that was the last choice", () => {
    localStorage.setItem("ailab.tpaper.view", "read");
    page();
    expect(screen.getByRole("radio", { name: "Read" })).toHaveAttribute("aria-checked", "true");
    expect(document.querySelectorAll(".tp-live").length).toBe(0);
    expect(observers.length).toBe(0);
  });
});

describe("tables, figures and formulas", () => {
  it("Table 1 lists the two authors of the revised paper and no third", () => {
    page();
    const t1 = document.getElementById("table-1")!;
    expect(t1.textContent).toContain("Shashikanth Hosur Ramegowda");
    expect(t1.textContent).toContain("Shaeed Khan");
    expect(t1.querySelectorAll("tbody tr").length).toBe(2);
    expect(t1.textContent).toContain("Problem formulation and experiment design; implementation of the Transformer fine-tuning program; theory of the Transformer architecture and mathematical methods (Chapter 2); evaluation of ready-made models; practical part (Chapter 3); presentation");
    expect(t1.textContent).toContain("Introduction; literature search in Google Scholar and Web of Science; literature review (Chapter 1); classical and BiLSTM baselines; error analysis; conclusions; references");
    expect(document.body.textContent).not.toMatch(/Rimsha|Tariq/);
    expect(document.body.textContent).toContain("team of two students");
  });

  it("Table 2 has all thirteen reviewed works", () => {
    page();
    const rows = document.getElementById("table-2")!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(13);
    expect(TABLE2_AUTHORS.length).toBe(13);
    TABLE2_AUTHORS.forEach((a, i) => expect(rows[i].textContent).toContain(a));
    expect(rows[0].textContent).toContain("Created SST; NB ≈ 82%, SVM ≈ 79%, RNTN 85.4% (binary)");
  });

  it("Tables 3 and 4 agree with the Lab 3 data modules", () => {
    page();
    const t3 = cells(document.getElementById("table-3")!);
    expect(t3[0].slice(2)).toEqual(["65 349", "55.8%", "9.4"]);
    expect(t3[1].slice(2)).toEqual(["2 000", "55.8%", "9.6"]);
    expect(t3[2].slice(2)).toEqual(["872", "50.9%", "19.5"]);
    expect(DATASET.train).toBe(65349); expect(DATASET.dev).toBe(2000); expect(DATASET.test).toBe(872);
    expect((DATASET.train_pos * 100).toFixed(1)).toBe("55.8"); expect((DATASET.test_pos * 100).toFixed(1)).toBe("50.9");
    expect(DATASET.train_len.toFixed(1)).toBe("9.4"); expect(DATASET.test_len.toFixed(1)).toBe("19.5");
    const rows = document.getElementById("table-4")!.querySelectorAll("tbody tr");
    expect(rows.length).toBe(10);
    TABLE4.forEach((r, i) => {
      const m = MODELS.find((x) => x.tag === r.tag)!;
      expect(rows[i].textContent).toContain(r.model);
      expect(m.pretrained).toBe(r.pre);
      if (!r.params.endsWith("*")) expect((m.params / 1e6).toFixed(1) + " M").toBe(r.params.replace("0.0", "0.0"));
    });
    // TF-IDF rows: n-gram weights, not neural parameters
    expect(MODELS.find((m) => m.tag === "tfidf_svm")!.params).toBe(73556);
    expect(document.getElementById("table-4")!.textContent).toContain("number of n-gram weights");
  });

  it("Table 5 holds the hyper-parameters", () => {
    page();
    const t = document.getElementById("table-5")!;
    for (const v of ["2 / 128 / 2", "4 / 512 / 8", "6 / 768 / 12", "2·10⁻⁴", "1·10⁻⁴", "5·10⁻⁵", "32 / 64", "10% / linear", "0.01 / 1.0"]) expect(t.textContent).toContain(v);
  });

  const T6: [string, string, string, string, string, string, string, string][] = [
    ["DistilBERT-SST2 (off-the-shelf)", "0", "91.1", "91.1", "91.0", "91.0", "–", "44.6"],
    ["DistilBERT fine-tuned (8k)", "8 000", "88.8", "88.8", "88.8", "88.8", "9530", "39.1"],
    ["Twitter-RoBERTa (off-the-shelf)", "0", "85.8", "86.1", "85.9", "85.8", "–", "84.8"],
    ["BERT-small fine-tuned (8k)", "8 000", "83.7", "83.7", "83.7", "83.7", "1581", "14.1"],
    ["TF-IDF + Linear SVM", "65 349", "82.9", "83.1", "82.8", "82.9", "2", "0.06"],
    ["BiLSTM (from scratch)", "65 349", "82.8", "83.2", "82.7", "82.7", "380", "0.45"],
    ["TF-IDF + Naive Bayes", "65 349", "82.2", "82.8", "82.1", "82.1", "2", "0.05"],
    ["TF-IDF + Logistic Regr.", "65 349", "81.9", "82.2", "81.8", "81.8", "4", "0.05"],
    ["Zero-shot NLI DistilRoBERTa", "0", "81.8", "82.6", "81.9", "81.7", "–", "107.0"],
    ["BERT-tiny fine-tuned (8k)", "8 000", "76.6", "76.8", "76.5", "76.5", "120", "1.2"],
  ];
  it("Table 6 reproduces the paper's ten rows, sorted by accuracy, and sorts on click", () => {
    page();
    const t = document.getElementById("table-6")!;
    const rows = () => cells(t);
    expect(rows()).toEqual(T6);
    fireEvent.click(t.querySelector("[data-sort=lat]")!);
    expect(rows()[0][0]).toBe("Zero-shot NLI DistilRoBERTa");
    fireEvent.click(t.querySelector("[data-sort=lat]")!);
    expect(rows()[0][0]).toBe("TF-IDF + Logistic Regr.");
  });

  const T7: [string, string, string, string, string, string][] = [
    ["DistilBERT-SST2 (off-the-shelf)", "91.1", "[89.1; 92.9]", "–", "–", "–"],
    ["DistilBERT fine-tuned (8k)", "88.8", "[86.6; 90.7]", "48", "28", "0.029"],
    ["Twitter-RoBERTa (off-the-shelf)", "85.8", "[83.4; 88.1]", "82", "36", "< 0.001"],
    ["BERT-small fine-tuned (8k)", "83.7", "[81.1; 85.9]", "90", "26", "< 0.001"],
    ["TF-IDF + Linear SVM", "82.9", "[80.4; 85.3]", "106", "35", "< 0.001"],
    ["BiLSTM (from scratch)", "82.8", "[80.3; 85.2]", "103", "31", "< 0.001"],
    ["TF-IDF + Naive Bayes", "82.2", "[79.6; 84.7]", "115", "38", "< 0.001"],
    ["TF-IDF + Logistic Regr.", "81.9", "[79.2; 84.4]", "114", "34", "< 0.001"],
    ["Zero-shot NLI DistilRoBERTa", "81.8", "[79.1; 84.2]", "116", "35", "< 0.001"],
    ["BERT-tiny fine-tuned (8k)", "76.6", "[73.7; 79.2]", "154", "28", "< 0.001"],
  ];
  it("Table 7 reproduces the paper (intervals, McNemar counts, p-values)", () => {
    page();
    const rows = cells(document.getElementById("table-7")!);
    expect(rows).toEqual(T7);
    expect(STATS.ft_distilbert_8000.p).toBeCloseTo(0.0286, 3);
  });

  it("Table 8 reproduces the paper, with recomputed differences", () => {
    page();
    const rows = cells(document.getElementById("table-8")!);
    expect(rows).toEqual([
      ["500", "75.9", "61.8", "+14.1"],
      ["1 000", "77.6", "68.1", "+9.5"],
      ["2 000", "80.7", "71.0", "+9.7"],
      ["4 000", "82.7", "75.8", "+6.9"],
      ["8 000", "83.7", "77.5", "+6.2"],
    ]);
    expect(document.getElementById("table-8")!.textContent).toMatch(/recomputed/);
  });

  it("Table 9 reproduces the paper, including the delta column", () => {
    page();
    const rows = cells(document.getElementById("table-9")!);
    expect(rows).toEqual([
      ["DistilBERT-SST2 (off-the-shelf)", "91.1", "87.0", "86.2", "-4.1"],
      ["DistilBERT fine-tuned (8k)", "88.8", "85.3", "85.4", "-3.4"],
      ["Twitter-RoBERTa (off-the-shelf)", "85.8", "83.7", "84.6", "-2.1"],
      ["BERT-small fine-tuned (8k)", "83.7", "74.5", "76.2", "-9.3"],
      ["TF-IDF + Linear SVM", "82.9", "74.5", "77.7", "-8.5"],
      ["BiLSTM (from scratch)", "82.8", "78.8", "77.7", "-4.0"],
      ["TF-IDF + Naive Bayes", "82.2", "73.9", "76.9", "-8.3"],
      ["TF-IDF + Logistic Regr.", "81.9", "73.9", "76.9", "-8.0"],
      ["Zero-shot NLI DistilRoBERTa", "81.8", "81.5", "79.2", "-0.2"],
      ["BERT-tiny fine-tuned (8k)", "76.6", "69.6", "65.4", "-7.0"],
    ]);
    expect(SUBSETS.tfidf_svm.negation).toBeCloseTo(0.7446, 3);
  });

  it("the twenty formulas appear with the paper's numbers, in order, as KaTeX", () => {
    page();
    const eqs = Array.from(document.querySelectorAll("[data-eq]"));
    expect(eqs.map((e) => e.getAttribute("data-eq"))).toEqual(Array.from({ length: 20 }, (_, i) => String(i + 1)));
    for (const e of eqs) expect(e.querySelector(".katex"), `eq ${e.getAttribute("data-eq")}`).toBeTruthy();
    expect(EQUATIONS.length).toBe(20);
    expect(EQUATIONS[2].tex).toContain("\\sqrt{d_{k}}");
    expect(document.querySelector(".katex-error")).toBeNull();
  });

  it("seven figures: native charts for 3 to 6, redrawn diagrams for 1 and 2, recorded picture for 7", () => {
    page();
    for (let n = 1; n <= 7; n++) expect(document.getElementById(`fig-${n}`), `fig ${n}`).toBeTruthy();
    expect(screen.getByTestId("f4-chart").tagName.toLowerCase()).toBe("svg");
    expect(screen.getByTestId("f5-chart").tagName.toLowerCase()).toBe("svg");
    expect(screen.getByTestId("f6-chart").tagName.toLowerCase()).toBe("ul");
    const img = document.querySelector("#fig-7 img")!;
    expect(img.getAttribute("src")).toBe("/lab3/attention-fig7.png");
    expect(img.getAttribute("alt")!.length).toBeGreaterThan(20);
    expect(document.getElementById("fig-7")!.textContent).toMatch(/Jain and Wallace/);
  });

  it("figures 1 and 2 are clickable diagrams with the original PNG behind a toggle", () => {
    page();
    for (const n of [1, 2]) {
      const fig = document.getElementById(`fig-${n}`)!;
      expect(fig.querySelectorAll("svg [role=button]").length).toBe(n === 1 ? 11 : 9);
      expect(fig.querySelector("img")).toBeNull();
      fireEvent.click(within(fig).getByRole("button", { name: "Show original figure" }));
      const img = fig.querySelector("img")!;
      expect(img.getAttribute("src")).toBe(n === 1 ? "/transformers/fig1-program.png" : "/transformers/fig2-encoder.png");
      expect(img.getAttribute("alt")!.length).toBeGreaterThan(20);
    }
    const f1 = document.getElementById("fig-1")!;
    fireEvent.click(f1.querySelector("[data-node=s04]")!);
    expect(within(f1).getByTestId("diagram-detail").textContent).toMatch(/generic fine-tuning program/);
    expect(within(f1).getByTestId("diagram-detail").querySelector("a[href='#architecture']")).toBeTruthy();
  });
});

describe("references", () => {
  it("lists all 38 references of the paper in order, and filters them", () => {
    page();
    expect(REFERENCES.length).toBe(38);
    const items = Array.from(screen.getByTestId("tp-refs").querySelectorAll("li"));
    expect(items.length).toBe(38);
    REFERENCES.forEach((r, i) => expect(items[i].textContent).toContain(r));
    expect(items[0].textContent).toContain("Bahdanau");
    expect(items[37].textContent).toContain("Zhang, W., Deng, Y.");
    fireEvent.change(screen.getByTestId("tp-ref-filter"), { target: { value: "lithuanian" } });
    const some = screen.getByTestId("tp-refs").querySelectorAll("li");
    expect(some.length).toBeGreaterThan(1);
    expect(some.length).toBeLessThan(38);
    expect(screen.getByTestId("tp-ref-count").textContent).toBe(`${some.length} of 38 references`);
    fireEvent.change(screen.getByTestId("tp-ref-filter"), { target: { value: "ulcar" } });
    expect(screen.getByTestId("tp-refs").querySelectorAll("li").length).toBe(1);
    fireEvent.change(screen.getByTestId("tp-ref-filter"), { target: { value: "zzzz" } });
    expect(screen.getByText(/No reference matches/)).toBeInTheDocument();
  });
});

describe("faithfulness to the paper text", () => {
  it("keeps the facts of the revised paper (numbers, research questions, citations)", () => {
    page();
    const text = document.body.textContent!;
    for (const needle of [
      "RQ1.", "RQ2.", "RQ3.", "RQ4.", "RQ5.",
      "11,855 sentences", "67,349", "872 validation sentences", "2,000 examples", "about 770 lines of code in nine scripts",
      "Intel Core i5-8365U processor (4 cores, 8 threads, 1.6 GHz base frequency), 16 GB of RAM", "seed (42)",
      "(Mikolov et al., 2013)", "(Hochreiter & Schmidhuber, 1997)", "(Strubell et al., 2019)", "Nakvosas et al., 2024",
      "0.735", "0.706", "175 billion parameters", "97.5%", "40% smaller and 60% faster",
      "104 sentences", "53 sentences", "p = 0.029", "p = 0.61", "14.1 p.p.", "16 times less labelled data", "5.9 p.p.",
      "5.3 p.p.", "184 test sentences", "130 sentences", "2.3 p.p.", "12% of the training data", "20–2,000 times slower",
      "Practical recommendations", "run_all.sh", "nyu-mll/glue", "99.99%", "55 sub-word tokens", "λ = 0.01", "C = 4", "C = 0.5",
    ]) expect(text, needle).toContain(needle);
  });
});

describe("languages", () => {
  const RAW = /\btp\.[a-z0-9]+\.[a-zA-Z0-9.]+/;
  for (const lang of ["en", "lt", "kn"] as const) {
    it(`${lang}: no raw keys and no unfilled placeholders anywhere on the page`, () => {
      page(lang);
      const text = visibleText();
      expect(text).not.toMatch(RAW);
      expect(text).not.toMatch(/\{[a-z]+\}/);
      expect(text).not.toMatch(/undefined|NaN/);
      expect(document.documentElement.lang).toBe(lang);
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(translate(lang, "tp.h.title"));
      if (lang !== "en") expect(screen.getByRole("heading", { level: 1 }).textContent).not.toBe(translate("en", "tp.h.title"));
      if (lang === "kn") expect(text).toMatch(/[ಀ-೿]{20}/);
    });
    it(`${lang}: the diagram nodes explain themselves without raw keys`, () => {
      page(lang);
      for (const n of [1, 2]) {
        const fig = document.getElementById(`fig-${n}`)!;
        for (const node of Array.from(fig.querySelectorAll("[data-node]"))) {
          fireEvent.click(node);
          const detail = within(fig).getByTestId("diagram-detail").textContent!;
          expect(detail, node.getAttribute("data-node")!).not.toMatch(RAW);
          expect(detail.length).toBeGreaterThan(20);
        }
      }
    });
  }

  it("the Lithuanian and Kannada pages translate the headings, not just the title", () => {
    page("lt");
    expect(screen.getByTestId("tp-outline").textContent).toContain("Literatūros apžvalga");
    cleanup();
    page("kn");
    expect(screen.getByTestId("tp-outline").textContent).toContain("ಸಾಹಿತ್ಯ ವಿಮರ್ಶೆ");
  });

  it("the live steps follow the page language too", async () => {
    page("lt");
    reveal("efficiency");
    await waitFor(() => expect(screen.getByTestId("ef-chart")).toBeInTheDocument(), { timeout: 15000 });
    expect(screen.getByTestId("live-efficiency").textContent).toContain("Duomenų efektyvumas");
  }, 30000);
});

describe("message catalogue of the page", () => {
  it("every tp.* key used by the page code exists, and every row is used somewhere", () => {
    const dir = join(__dirname, "..", "transformers", "paper");
    const files = readdirSync(dir).filter((f) => /\.(tsx?|ts)$/.test(f) && !f.startsWith("rows"));
    const src = files.map((f) => readFileSync(join(dir, f), "utf8")).join("\n") + readFileSync(join(__dirname, "..", "pages", "TransformersPaper.tsx"), "utf8");
    const used = new Set(Array.from(src.matchAll(/"(tp\.[a-zA-Z0-9.]+)"/g), (m) => m[1]));
    const have = new Set(paperRows.map((r) => r[0]));
    for (const k of used) expect(have.has(k), `missing row ${k}`).toBe(true);
    // keys built from a prefix in the code
    const dynamic = [/^tp\.sec\./, /^tp\.chapter\./, /^tp\.t2\.\d+\.(model|task|result)$/, /^tp\.f1\.(n|t|d)\./, /^tp\.f2\.(n|t|d)\./, /^tp\.f6\./, /^tp\.ui\.tag/, /^tp\.h\./, /^tp\.key\./, /^tp\.btn\./, /^tp\.ref\./];
    const unused = paperRows.map((r) => r[0]).filter((k) => !used.has(k) && !dynamic.some((d) => d.test(k)));
    expect(unused).toEqual([]);
  });

  it("the page rows are registered in the global catalogue with identical keys in the three languages", () => {
    const ns = NAMESPACES.tpaper;
    for (const r of paperRows) {
      expect(ns.en[r[0]]).toBe(r[1]);
      expect(ns.kn[r[0]]).toBe(r[2]);
      expect(ns.lt[r[0]]).toBe(r[3]);
    }
    expect(new Set(paperRows.map((r) => r[0])).size).toBe(paperRows.length);
    expect(paperRows.length).toBeGreaterThan(300);
  });
});
