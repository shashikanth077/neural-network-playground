import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider, NAMESPACES, translate, type Lang } from "../i18n";
import { MODELS, CURVE, SUBSETS } from "../labs/lab3/data/expModels";
import { TransformersSlides } from "../pages/TransformersSlides";
import { Viewer, parseHash } from "../transformers/slides/Viewer";
import { slideRows } from "../transformers/slideRows";
import {
  BEST_CLASSICAL, COST_ROWS, DATA_EFF, GAIN, HEADLINE, LATENCY_RATIO, PRESENTER_NAME, RANKING, SLIDES, SLIDE_COUNT, SPLITS, SUBSET_ROWS, TARGET_MAX, TARGET_MIN, TOTAL_BUDGET, byTag, p1,
} from "../transformers/slides/model";
import { clock, slideStatus, totalStatus } from "../transformers/slides/timing";

/** Titles of the eleven slides of the original deck (deck.pptx), in order; slide 7 shows the computed gain. */
const DECK_TITLES = [
  "Transformers and their application in NLP tasks",
  "From reading word by word to reading all at once",
  "Self-attention: each word looks at the whole sentence",
  "Literature: Transformers lead, but gaps remain",
  "Experiment: 10 competitors, one dataset, one laptop CPU",
  "Implementation: a reproducible Python pipeline",
  "Fine-tuned DistilBERT: +5.9 points over classical",
  "The price: slower training and inference, bigger models",
  "Pre-training is the key: fewer labels, higher accuracy",
  "Context matters: negation and contrast sentences",
  "Conclusions & recommendations",
];
/** Planned seconds per slide from the speaker notes of the deck ("≈30 s" ...). */
const DECK_BUDGETS = [30, 45, 60, 60, 45, 40, 60, 45, 50, 45, 60];
const DECK_SPEAKERS = ["shashikanth", "shashikanth", "shashikanth", "shaeed", "shaeed", "shashikanth", "shashikanth", "shashikanth", "shaeed", "shaeed", "shaeed"];
/** The fixed section ids of the paper page. */
const PAPER_IDS = ["intro", "review", "problem", "dataset", "competitors", "criteria", "program", "architecture", "math", "protocol", "results-overall", "results-cost", "results-data", "results-ready", "results-errors", "results-prev", "conclusions", "references"];
const PAPER_TARGETS = ["/tools/transformers", "architecture", "architecture", "review", "competitors", "program", "results-overall", "results-cost", "results-data", "results-errors", "conclusions"];

const LANGS: Lang[] = ["en", "lt", "kn"];

const app = (lang: Lang = "en") => (
  <I18nProvider initial={lang}>
    <MemoryRouter initialEntries={["/tools/transformers/slides"]}>
      <TransformersSlides />
    </MemoryRouter>
  </I18nProvider>
);

const key = (k: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(window, { key: k, ...init });
const current = () => screen.getByRole("region", { name: /^(Slide|Skaidrė|ಸ್ಲೈಡ್) \d+/ });
const currentN = () => Number(current().getAttribute("data-slide"));

beforeEach(() => { window.history.replaceState(null, "", "/"); localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); document.body.className = ""; });

describe("the deck structure", () => {
  it("has 11 slides whose titles and order match the original deck", () => {
    expect(SLIDE_COUNT).toBe(11);
    expect(SLIDES.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const vars = { gain: HEADLINE.gain };
    DECK_TITLES.forEach((t, i) => expect(translate("en", `ts.s${i + 1}.title`, undefined, vars), `slide ${i + 1}`).toBe(t));
  });
  it("has speaker notes in all three languages for every slide, with the presenter of each slide as in the deck", () => {
    for (let n = 1; n <= 11; n++) for (const l of LANGS) expect(translate(l, `ts.s${n}.notes`).length, `${l} ${n}`).toBeGreaterThan(80);
    SLIDES.forEach((s, i) => expect(s.presenter).toBe(DECK_SPEAKERS[i]));
    expect(PRESENTER_NAME).toEqual({ shashikanth: "Shashikanth", shaeed: "Shaeed" });
  });
  it("plans 9:00 in total: the budgets of the notes sum to 540 s, inside the 7 to 10 minute target", () => {
    expect(SLIDES.map((s) => s.budget)).toEqual(DECK_BUDGETS);
    expect(TOTAL_BUDGET).toBe(540);
    expect(clock(TOTAL_BUDGET)).toBe("9:00");
    expect(TOTAL_BUDGET).toBeGreaterThanOrEqual(TARGET_MIN);
    expect(TOTAL_BUDGET).toBeLessThanOrEqual(TARGET_MAX);
  });
  it("only credits the two authors of the revised paper", () => {
    render(app());
    const all = slideRows.map((r) => r[1]).join(" ");
    expect(all).not.toMatch(/Kommuri|Arjun/i);
    key("Home");
    expect(current().textContent).toContain("Shashikanth Hosur Ramegowda");
    expect(current().textContent).toContain("Shaeed Khan");
  });
});

describe("numbers come from the recorded results", () => {
  it("+5.9 points = 88.8 - 82.9 (printed values) and matches the data modules", () => {
    const ft = byTag("ft_distilbert_8000");
    expect(p1(ft.accuracy)).toBe("88.8");
    expect(p1(BEST_CLASSICAL.accuracy)).toBe("82.9");
    expect(BEST_CLASSICAL.tag).toBe("tfidf_svm");
    expect(GAIN).toBe(5.9);
    expect(HEADLINE.gain).toBe("5.9");
    // the exact difference is 5.85 points
    expect((ft.accuracy - BEST_CLASSICAL.accuracy) * 100).toBeCloseTo(5.85, 2);
    expect(HEADLINE.zs).toBe("81.8");
    expect(HEADLINE.lstm).toBe("82.8");
    expect(HEADLINE.sst2).toBe("91.1");
  });
  it("x710 is the latency ratio of fine-tuned DistilBERT to TF-IDF + linear SVM", () => {
    const r = byTag("ft_distilbert_8000").latencyMs / byTag("tfidf_svm").latencyMs;
    expect(r).toBeGreaterThan(709.5);
    expect(r).toBeLessThan(711);
    expect(LATENCY_RATIO).toBe(710);
    expect(HEADLINE.ftLatency).toBe("39");
  });
  it("the cost table has the deck's seven rows and values", () => {
    expect(COST_ROWS.map((r) => [r.acc, r.train, r.latency, r.params])).toEqual([
      ["82.9", "2 s", "0.06", "74 k"],
      ["82.8", "6 min", "0.45", "2.0 M"],
      ["76.6", "2 min", "1.2", "4.4 M"],
      ["83.7", "26 min", "14.1", "28.8 M"],
      ["88.8", "2.6 h", "39.1", "67.0 M"],
      ["91.1", "–", "44.6", "67.0 M"],
      ["81.8", "–", "107.0", "82.1 M"],
    ]);
  });
  it("data efficiency: 4,000 labels give 82.7 % (vs 82.9 %) and the gap at 500 labels is 14 points", () => {
    expect(DATA_EFF.small4000).toBe("82.7");
    expect(DATA_EFF.gap500).toBe(14);
    expect(CURVE["bert-small"].find((r) => r.n === 4000)!.accuracy).toBeLessThan(BEST_CLASSICAL.accuracy);
    expect(SPLITS).toBe("65k / 2k / 872");
  });
  it("the notes of slide 7 quote the recorded accuracies", () => {
    const classical = MODELS.filter((m) => m.family === "classical").map((m) => Number(p1(m.accuracy)));
    const n = translate("en", "ts.s7.notes");
    expect(n).toContain(`${Math.min(...classical)}–${Math.max(...classical)}%`);
    expect(n).toContain(`BiLSTM ${HEADLINE.lstm}%`);
    expect(n).toContain(`up to ${HEADLINE.ft}%`);
    expect(n).toContain(`reaches ${HEADLINE.sst2}%`);
    expect(n).toContain(`gets ${HEADLINE.zs}%`);
  });
  it("the ranking is sorted and the subset chart uses the recorded subset accuracies", () => {
    const acc = RANKING.map((m) => m.accuracy);
    expect(acc).toEqual(acc.slice().sort((a, b) => b - a));
    expect(RANKING).toHaveLength(10);
    expect(SUBSET_ROWS.map((r) => r.negation)).toEqual(["tfidf_svm", "bilstm", "ft_distilbert_8000", "pt_distilbert_sst2"].map((t) => SUBSETS[t].negation));
  });
});

describe("the slides render", () => {
  it("shows slide 1 first, as a labelled section, and the numbers of slides 7 and 8", () => {
    render(app());
    expect(currentN()).toBe(1);
    expect(current().getAttribute("aria-label")).toBe(`Slide 1 of 11: ${DECK_TITLES[0]}`);
    key("End"); key("ArrowLeft"); key("ArrowLeft"); key("ArrowLeft");
    expect(currentN()).toBe(8);
    expect(within(current()).getByTestId("ts-ratio").textContent).toBe("×710");
    expect(within(current()).getByRole("table")).toBeInTheDocument();
    key("ArrowLeft");
    expect(currentN()).toBe(7);
    const bars = within(current()).getByRole("list", { name: /Test accuracy of the ten models/ });
    expect(within(bars).getAllByRole("listitem")).toHaveLength(10);
    expect(current().textContent).toContain("88.8%");
    expect(current().textContent).toContain("82.9%");
    expect(current().textContent).toContain("81.8%");
  });
  it("renders every slide with its heading, an accessible label, and no raw keys, in all three languages", () => {
    for (const lang of LANGS) {
      const { unmount } = render(app(lang));
      for (let n = 1; n <= 11; n++) {
        key(n === 1 ? "Home" : "ArrowRight");
        expect(currentN()).toBe(n);
        const heading = within(current()).getByRole("heading", { level: 2 });
        expect(heading.textContent!.length).toBeGreaterThan(5);
        const clone = current().cloneNode(true) as HTMLElement;
        clone.querySelectorAll(".katex-mathml").forEach((e) => e.remove()); // the TeX source inside the MathML annotation has braces
        const txt = clone.textContent ?? "";
        expect(txt, `${lang} ${n}`).not.toMatch(/\bts\.(?:s\d+|ui|fam)\.|\{[a-z]+\}/);
        expect(current().getAttribute("aria-label"), `${lang} ${n}`).toBe(translate(lang, "ts.ui.slideLabel", undefined, { n, total: 11, title: translate(lang, `ts.s${n}.title`, undefined, { gain: HEADLINE.gain }) }));
        if (lang !== "en") expect(heading.textContent, `${lang} ${n}`).not.toBe(translate("en", `ts.s${n}.title`, undefined, { gain: HEADLINE.gain }));
      }
      unmount();
    }
  });
  it("uses the KaTeX formula on slide 3", () => {
    render(app());
    window.location.hash = "";
    key("ArrowRight"); key("ArrowRight");
    expect(currentN()).toBe(3);
    expect(current().querySelector(".katex")).not.toBeNull();
    expect(current().querySelector("img")?.getAttribute("alt")).toMatch(/encoder/);
  });
  it("has a print deck of all 11 slides (hidden on screen)", () => {
    render(app());
    const deck = screen.getByTestId("ts-printdeck");
    expect(deck.getAttribute("aria-hidden")).toBe("true");
    expect(deck.querySelectorAll("section[data-slide]")).toHaveLength(11);
    for (let n = 1; n <= 11; n++) expect(screen.getByTestId(`ts-print-notes-${n}`).textContent!.length).toBeGreaterThan(60);
  });
});

describe("navigation", () => {
  it("moves with the arrow keys, PageUp/PageDown, Space, Home and End and stops at the ends", () => {
    render(app());
    key("ArrowRight"); expect(currentN()).toBe(2);
    key("PageDown"); expect(currentN()).toBe(3);
    key(" "); expect(currentN()).toBe(4);
    key("ArrowDown"); expect(currentN()).toBe(5);
    key("ArrowLeft"); expect(currentN()).toBe(4);
    key("PageUp"); expect(currentN()).toBe(3);
    key("End"); expect(currentN()).toBe(11);
    key("ArrowRight"); expect(currentN()).toBe(11);
    key("Home"); expect(currentN()).toBe(1);
    key("ArrowLeft"); expect(currentN()).toBe(1);
  });
  it("ignores keys with modifiers and keys typed in fields", () => {
    render(app());
    key("ArrowRight", { ctrlKey: true });
    expect(currentN()).toBe(1);
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(currentN()).toBe(1);
    input.remove();
  });
  it("the buttons, the counter, the progress bar and the live region follow the slide", () => {
    render(app());
    expect(screen.getByTestId("ts-prev")).toBeDisabled();
    fireEvent.click(screen.getByTestId("ts-next"));
    expect(screen.getByTestId("ts-counter").textContent).toBe("2 / 11");
    expect(screen.getByTestId("ts-counter").getAttribute("aria-label")).toBe("Slide 2 of 11");
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("2");
    expect(bar.getAttribute("aria-valuemax")).toBe("11");
    expect(screen.getByTestId("ts-live").textContent).toBe(`Slide 2 of 11: ${DECK_TITLES[1]}`);
    key("End");
    expect(screen.getByTestId("ts-next")).toBeDisabled();
    fireEvent.click(screen.getByTestId("ts-prev"));
    expect(currentN()).toBe(10);
  });
  it("writes #slide-N into the address and opens a #slide-N deep link", () => {
    window.location.hash = "#slide-6";
    const { unmount } = render(app());
    expect(currentN()).toBe(6);
    key("ArrowRight");
    expect(window.location.hash).toBe("#slide-7");
    unmount();
    window.location.hash = "#slide-99";
    render(app());
    expect(currentN()).toBe(1);
  });
  it("follows a hashchange", () => {
    render(app());
    act(() => { window.location.hash = "#slide-9"; window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(currentN()).toBe(9);
    expect(parseHash("#slide-0")).toBeNull();
    expect(parseHash("#slide-12")).toBeNull();
    expect(parseHash("#slide-11")).toBe(10);
    expect(parseHash("#x")).toBeNull();
  });
  it("swipes: left goes forward, right goes back, a vertical drag does nothing", () => {
    const { container } = render(app());
    const box = container.querySelector(".ts-stagebox")!;
    const swipe = (x0: number, y0: number, x1: number, y1: number) => {
      fireEvent.touchStart(box, { touches: [{ clientX: x0, clientY: y0 }] });
      fireEvent.touchEnd(box, { changedTouches: [{ clientX: x1, clientY: y1 }] });
    };
    swipe(300, 100, 100, 110); expect(currentN()).toBe(2);
    swipe(100, 100, 300, 100); expect(currentN()).toBe(1);
    swipe(100, 100, 110, 300); expect(currentN()).toBe(1);
    swipe(100, 100, 140, 100); expect(currentN()).toBe(1);
  });
  it("links every slide to its section of the paper, and only to sections that exist", () => {
    render(app());
    for (let n = 1; n <= 11; n++) {
      key(n === 1 ? "Home" : "ArrowRight");
      const href = screen.getByTestId(`ts-link-${n}`).getAttribute("href")!;
      const target = PAPER_TARGETS[n - 1];
      if (n === 1) expect(href).toBe("/tools/transformers");
      else {
        expect(href).toBe(`/tools/transformers#${target}`);
        expect(PAPER_IDS).toContain(target);
      }
      expect(screen.getByTestId(`ts-link-${n}`).textContent).toBe("Read the full explanation →");
    }
    for (const s of SLIDES) if (s.paper) expect(PAPER_IDS).toContain(s.paper);
  });
});

describe("overview, help, notes, presenter, fullscreen", () => {
  it("G opens the overview grid of 11 thumbnails; picking one goes there; Esc closes", () => {
    render(app());
    key("g");
    const grid = screen.getByTestId("ts-overview");
    expect(screen.getByRole("dialog", { name: "All slides" })).toBeInTheDocument();
    expect(within(grid).getAllByRole("button")).toHaveLength(11);
    key("ArrowRight"); // inert while the overview is open
    expect(currentN()).toBe(1);
    fireEvent.click(within(grid).getByRole("button", { name: /^Slide 7 of 11/ }));
    expect(screen.queryByTestId("ts-overview")).toBeNull();
    expect(currentN()).toBe(7);
    key("g"); expect(screen.getByTestId("ts-overview")).toBeInTheDocument();
    key("Escape"); expect(screen.queryByTestId("ts-overview")).toBeNull();
    fireEvent.click(screen.getByTestId("ts-btn-overview"));
    expect(screen.getByTestId("ts-overview")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("ts-overview")).toBeNull();
  });
  it("? opens the shortcut help and Esc closes it", () => {
    render(app());
    key("?");
    expect(screen.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeInTheDocument();
    const help = screen.getByTestId("ts-help");
    for (const k of ["Space", "PageDown", "Home", "End", "G", "F", "N", "P", "?", "Esc"]) expect(within(help).getAllByText(k).length).toBeGreaterThan(0);
    key("Escape");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("N toggles the speaker notes panel with the presenter chip of the current slide", () => {
    render(app());
    expect(screen.queryByTestId("ts-notes-panel")).toBeNull();
    key("n");
    const panel = screen.getByTestId("ts-notes-panel");
    expect(within(panel).getByTestId("ts-notes-1").textContent).toContain("Introduce the team and the topic");
    expect(panel.querySelector("[data-presenter='shashikanth']")).not.toBeNull();
    key("ArrowRight"); key("ArrowRight"); key("ArrowRight");
    expect(within(panel).getByTestId("ts-notes-4").textContent).toContain("We searched Google Scholar");
    expect(panel.querySelector("[data-presenter='shaeed']")).not.toBeNull();
    expect(within(panel).getByText("Notes of all slides")).toBeInTheDocument();
    expect(panel.querySelectorAll("li [data-presenter]")).toHaveLength(11);
    key("n");
    expect(screen.queryByTestId("ts-notes-panel")).toBeNull();
  });
  it("P toggles the presenter view: current slide, next-slide preview, notes and timer", () => {
    render(app());
    key("p");
    const pv = screen.getByTestId("ts-presenter");
    expect(within(pv).getByTestId("ts-next-preview").querySelector("[data-thumb='2']")).not.toBeNull();
    expect(within(pv).getByTestId("ts-presenter-notes").textContent).toContain("Introduce the team");
    expect(within(pv).getByTestId("ts-timer")).toBeInTheDocument();
    key("End");
    expect(within(pv).getByTestId("ts-next-preview").textContent).toBe("End of the presentation");
    key("Escape");
    expect(screen.queryByTestId("ts-presenter")).toBeNull();
  });
  it("the fullscreen button and key do not throw when the Fullscreen API is missing or refuses", async () => {
    render(app());
    const btn = screen.getByTestId("ts-btn-fullscreen");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    await act(async () => { fireEvent.click(btn); });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    await act(async () => { key("f"); });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    const el = screen.getByTestId("ts-root");
    el.requestFullscreen = () => Promise.reject(new Error("denied"));
    await act(async () => { fireEvent.click(btn); });
    expect(btn.getAttribute("aria-pressed")).toBe("true"); // fell back to the page-filling layout
    key("Escape");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });
  it("the print button calls window.print and the notes checkbox switches the print layout", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(app());
    fireEvent.click(screen.getByTestId("ts-btn-print"));
    expect(print).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("ts-root").className).not.toContain("ts-with-notes");
    fireEvent.click(screen.getByTestId("ts-print-notes-toggle"));
    expect(screen.getByTestId("ts-root").className).toContain("ts-with-notes");
    print.mockImplementation(() => { throw new Error("blocked"); });
    expect(() => fireEvent.click(screen.getByTestId("ts-btn-print"))).not.toThrow();
    print.mockRestore();
  });
  it("controls have accessible names and the language switch changes them", () => {
    render(app("lt"));
    expect(screen.getByRole("button", { name: "Kita skaidrė" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spartieji klavišai" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skaityti visą darbą →" })).toHaveAttribute("href", "/tools/transformers");
  });
});

describe("rehearsal timer", () => {
  it("pure helpers: clock, slide status and total status", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(65.9)).toBe("1:05");
    expect(clock(600)).toBe("10:00");
    expect(slideStatus(0, 30)).toBe("ok");
    expect(slideStatus(15, 30)).toBe("ok");
    expect(slideStatus(21, 30)).toBe("near");
    expect(slideStatus(30, 30)).toBe("near");
    expect(slideStatus(30.5, 30)).toBe("over");
    expect(totalStatus(300)).toBe("below");
    expect(totalStatus(420)).toBe("within");
    expect(totalStatus(540)).toBe("within");
    expect(totalStatus(600)).toBe("within");
    expect(totalStatus(601)).toBe("beyond");
  });
  it("counts time per slide, pauses, resets, warns on over-time and compares with the 7-10 minute target", () => {
    vi.useFakeTimers();
    render(app());
    key("n");
    const total = () => screen.getByTestId("ts-timer-total").textContent;
    const slide = () => screen.getByTestId("ts-timer-slide").textContent;
    const status = () => screen.getByTestId("ts-timer-status").getAttribute("data-status");
    expect(total()).toBe("0:00");
    fireEvent.click(screen.getByTestId("ts-timer-toggle"));
    expect(screen.getByTestId("ts-timer-toggle").textContent).toBe("Pause");
    act(() => { vi.advanceTimersByTime(5000); });
    expect(total()).toBe("0:05");
    expect(slide()).toContain("0:05");
    expect(slide()).toContain("of 0:30");
    expect(status()).toBe("ok");
    act(() => { vi.advanceTimersByTime(20000); });
    expect(status()).toBe("near");
    act(() => { vi.advanceTimersByTime(6000); });
    expect(total()).toBe("0:31");
    expect(status()).toBe("over");
    expect(screen.getByTestId("ts-timer-status").textContent).toContain("Over time by 0:01");
    expect(screen.getAllByRole("status").some((e) => e.textContent === "You are over the time planned for this slide.")).toBe(true);
    // the next slide has its own budget (45 s) and the time already spent stays on slide 1
    key("ArrowRight");
    expect(slide()).toContain("0:00");
    expect(slide()).toContain("of 0:45");
    expect(status()).toBe("ok");
    act(() => { vi.advanceTimersByTime(2000); });
    expect(slide()).toContain("0:02");
    expect(total()).toBe("0:33");
    // pause: time stands still
    fireEvent.click(screen.getByTestId("ts-timer-toggle"));
    expect(screen.getByTestId("ts-timer-toggle").textContent).toBe("Start");
    act(() => { vi.advanceTimersByTime(10000); });
    expect(total()).toBe("0:33");
    // T starts it again
    key("t");
    act(() => { vi.advanceTimersByTime(1000); });
    expect(total()).toBe("0:34");
    key("t");
    // total against the target: 7 min is the lower end
    expect(screen.getByTestId("ts-timer-target").getAttribute("data-status")).toBe("below");
    fireEvent.click(screen.getByTestId("ts-timer-reset"));
    expect(total()).toBe("0:00");
    expect(status()).toBe("ok");
    fireEvent.click(screen.getByTestId("ts-timer-toggle"));
    act(() => { vi.advanceTimersByTime(420 * 1000); });
    expect(screen.getByTestId("ts-timer-target").getAttribute("data-status")).toBe("within");
    act(() => { vi.advanceTimersByTime(181 * 1000); });
    expect(screen.getByTestId("ts-timer-target").getAttribute("data-status")).toBe("beyond");
    expect(screen.getByTestId("ts-timer-target").textContent).toContain("Over the 10 minute target");
  });
});

describe("messages", () => {
  it("ts.* keys exist in all three languages with matching placeholders", () => {
    const ns = NAMESPACES.tpaper;
    const ts = Object.keys(ns.en).filter((k) => k.startsWith("ts."));
    expect(ts.length).toBe(slideRows.length);
    expect(ts.length).toBeGreaterThan(150);
    const ph = (s: string) => (s.match(/\{[a-z]+\}/gi) ?? []).sort().join(",");
    for (const k of ts) {
      expect(ns.kn[k], k).toBeTruthy();
      expect(ns.lt[k], k).toBeTruthy();
      expect(ph(ns.kn[k]), k).toBe(ph(ns.en[k]));
      expect(ph(ns.lt[k]), k).toBe(ph(ns.en[k]));
    }
  });
  it("renders the page body as a Viewer too (smoke test of the exported component)", () => {
    render(<I18nProvider initial="en"><MemoryRouter><Viewer /></MemoryRouter></I18nProvider>);
    expect(screen.getByRole("heading", { level: 1, name: "Presentation" })).toBeInTheDocument();
  });
  it("cost-table names are the model names of the data modules", () => {
    expect(COST_ROWS.map((r) => r.name)).toEqual(COST_ROWS.map((r) => byTag(r.tag).name));
  });
});
