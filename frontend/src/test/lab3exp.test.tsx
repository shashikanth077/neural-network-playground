import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nProvider, NAMESPACES, translate, type Lang } from "../i18n";
import { labSteps, SETUP_STEP_ID } from "../labs/LabSetupPanel";
import { GUIDES } from "../labs/lab3/content/guides";
import { guidesB } from "../labs/lab3/content/guidesB";
import { getLab } from "../labs/registry";
import { LabPage } from "../pages/LabPage";

beforeEach(() => localStorage.clear());

const MINE = ["baselines", "design", "results", "cost", "efficiency", "readymade", "errors", "decide", "code", "checklist", "defense"] as const;
const LANGS: Lang[] = ["en", "lt", "kn"];

const app = (path: string, lang: Lang = "en") => (
  <I18nProvider initial={lang}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/labs/:labId" element={<LabPage />} />
        <Route path="/labs/:labId/:stepId" element={<LabPage />} />
      </Routes>
    </MemoryRouter>
  </I18nProvider>
);

/** Text of the page without the (untranslated) code blocks. */
function visibleText(): string {
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("pre, script, style").forEach((e) => e.remove());
  return clone.textContent ?? "";
}

/** What to wait for before a step counts as loaded (the 872-sentence table and the TF-IDF model load lazily). */
const READY: Record<string, string> = {
  baselines: "bl-out", results: "rs-stats", errors: "er-count", design: "ds-splits", cost: "cs-bubble", efficiency: "ef-chart",
  readymade: "rm-card-nli", decide: "dec-out", code: "cd-order", checklist: "ck-count", defense: "",
};

async function open(id: string, lang: Lang = "en") {
  const view = render(app(`/labs/lab3/${id}`, lang));
  await screen.findByRole("heading", { level: 1 });
  if (READY[id]) await screen.findByTestId(READY[id], undefined, { timeout: 15000 });
  if (id === "design") await waitFor(() => expect(screen.getByTestId("ds-splits").textContent).toContain("872"));
  return view;
}

describe("the experiment steps are registered with guides and messages", () => {
  it("guidesB covers exactly my eleven steps and every guide id of the lab has a step", () => {
    expect(Object.keys(guidesB).sort()).toEqual([...MINE].sort());
    const ids = getLab("lab3")!.steps.map((s) => s.id);
    for (const id of MINE) expect(ids).toContain(id);
    for (const id of Object.keys(GUIDES)) expect(ids).toContain(id);
  });
  it("each guide has goal, fit, key words, 3-5 tasks, 2-3 questions with one correct option, 3 takeaways, 1-2 mistakes, in three languages", () => {
    for (const id of MINE) {
      const g = guidesB[id];
      expect(g.goal[0].length, id).toBeGreaterThan(30);
      expect(g.fit[0].length, id).toBeGreaterThan(30);
      expect(g.keywords.length, id).toBeGreaterThanOrEqual(3);
      expect(g.tasks.length, id).toBeGreaterThanOrEqual(3);
      expect(g.tasks.length, id).toBeLessThanOrEqual(5);
      expect(g.questions.length, id).toBeGreaterThanOrEqual(2);
      expect(g.questions.length, id).toBeLessThanOrEqual(3);
      for (const q of g.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length).toBe(true);
        expect(new Set(q.options.map((o) => o[0])).size).toBe(q.options.length);
      }
      expect(g.takeaways).toHaveLength(3);
      expect(g.mistakes.length).toBeGreaterThanOrEqual(1);
      expect(g.mistakes.length).toBeLessThanOrEqual(2);
      const all = [g.goal, g.fit, ...g.keywords.flat(), ...g.tasks, ...g.takeaways, ...g.mistakes, ...g.questions.flatMap((q) => [q.q, q.why, ...q.options])];
      for (const t of all) for (const s of t) expect(s.trim(), id).not.toBe("");
    }
  });
  it("every numeric claim with a proof really holds (verify() of each question), and at least 15 proofs exist", () => {
    let proofs = 0;
    for (const id of MINE) guidesB[id].questions.forEach((q, i) => { if (q.verify) { proofs++; expect(q.verify(), `${id} q${i}`).toBe(true); } });
    expect(proofs).toBeGreaterThanOrEqual(15);
  });
  it("answers are spread over the positions A, B and C", () => {
    expect(new Set(MINE.flatMap((id) => guidesB[id].questions.map((q) => q.correct))).size).toBe(3);
  });
  it("titles and summaries exist in all languages for each of my steps and for the Setup & run step", () => {
    for (const lang of LANGS) {
      for (const id of [...MINE, "setup"]) {
        expect(translate(lang, `step.lab3.${id}.title`, "\u0000"), `${lang} ${id} title`).not.toBe("\u0000");
        expect(translate(lang, `step.lab3.${id}.summary`, "\u0000"), `${lang} ${id} summary`).not.toBe("\u0000");
      }
      expect(translate(lang, "lab.group.Experiment", "\u0000")).not.toBe("\u0000");
    }
    expect(translate("lt", "step.lab3.results.title")).toBe("Dešimties modelių rezultatai");
    expect(NAMESPACES.lab3.kn["step.lab3.cost.title"]).toContain("ವೆಚ್ಚ");
  });
});

describe("every experiment step renders in English, Lithuanian and Kannada without raw keys", () => {
  for (const lang of LANGS) {
    for (const id of MINE) {
      it(`${id} · ${lang}`, async () => {
        await open(id, lang);
        expect(screen.getByTestId("guide-intro")).toBeInTheDocument();
        const text = visibleText();
        expect(text).not.toMatch(/\blab3\.[a-z]\.[a-z0-9]+\./i);
        expect(text).not.toMatch(/\blab3\.g\./);
        expect(text).not.toMatch(/\{[A-Za-z]+\}/);
        expect(text).not.toMatch(/undefined|NaN/);
        // the heading is translated
        const h1 = screen.getByRole("heading", { level: 1 }).textContent;
        expect(h1).toBe(translate(lang, `step.lab3.${id}.title`));
      }, 30000);
    }
  }
});

describe("the Setup & run panel", () => {
  it("is the first step in the stepper and renders for Lab 3", async () => {
    render(app("/labs/lab3/setup"));
    expect(await screen.findByRole("heading", { level: 1, name: "Setup & run" })).toBeInTheDocument();
    expect(screen.getByTestId("lab-setup")).toBeInTheDocument();
    const nav = screen.getAllByRole("navigation", { name: /steps/ })[0];
    const links = within(nav).getAllByRole("link");
    expect(links[0]).toHaveTextContent("Setup & run");
    expect(links[0]).toHaveAttribute("href", "/labs/lab3/setup");
    expect(links).toHaveLength(getLab("lab3")!.steps.length + 1);
    expect(labSteps(getLab("lab3")!)[0].id).toBe(SETUP_STEP_ID);
  });
  it("says that the lab runs in the browser and that reproducing needs Python, with CPU PyTorch, run_all.sh and the facts", async () => {
    render(app("/labs/lab3/setup"));
    await screen.findByTestId("lab-setup");
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/run entirely in your browser/);
    expect(text).toMatch(/needs Python/);
    expect(text).toContain("Python 3.11");
    expect(text).toContain("bash run_all.sh");
    expect(text).toContain("pip install torch --index-url https://download.pytorch.org/whl/cpu");
    expect(text).toContain("pip install -r requirements.txt");
    expect(text).toContain("https://github.com/shashikanth077/Transformers-NLP");
    expect(text).toMatch(/2\.5 to 3 hours/);
    expect(text).toMatch(/1\.5 GB/);
    expect(text).toContain("code/results/");
    // no command was run by the authors of this lab: every one says so
    expect(screen.queryByText(/Run by the authors on/)).toBeNull();
    expect(screen.getAllByText(/Not run on Linux/).length).toBeGreaterThan(5);
    const chips = screen.getAllByRole("listitem").filter((li) => li.hasAttribute("data-state"));
    expect(chips.find((c) => /Python/.test(c.textContent ?? ""))).toHaveAttribute("data-state", "optional");
    expect(chips.find((c) => /Browser only/.test(c.textContent ?? ""))).toHaveAttribute("data-state", "yes");
  });
  it("the OS switch changes the activation command", async () => {
    render(app("/labs/lab3/setup"));
    await screen.findByTestId("lab-setup");
    const cmds = () => screen.getAllByTestId("setup-command").map((c) => c.textContent ?? "").join("\n");
    expect(cmds()).toContain("source .venv/bin/activate");
    await userEvent.click(screen.getByRole("radio", { name: "Windows" }));
    expect(cmds()).toContain(".venv\\Scripts\\activate");
    expect(cmds()).toContain("py -3.11 -m venv .venv");
  });
  for (const lang of ["lt", "kn"] as const) {
    it(`renders in ${lang} without raw keys`, async () => {
      render(app("/labs/lab3/setup", lang));
      await screen.findByTestId("lab-setup");
      const text = document.body.textContent ?? "";
      expect(text).not.toMatch(/\bsetup\.[a-z0-9]+\.[a-z]/i);
      expect(text).not.toMatch(/\{(os|n|m|a|b)\}/);
      expect(text).toContain(lang === "lt" ? "Paruošimas ir paleidimas" : "ಸೆಟಪ್ ಮತ್ತು ಚಾಲನೆ");
    });
  }
});

describe("the steps respond to input", () => {
  it("baselines: the real TF-IDF model scores your sentence (not good against good)", async () => {
    await open("baselines");
    const out = () => screen.getByTestId("bl-out").textContent ?? "";
    const pNotGood = out();
    expect(screen.getByTestId("bl-table").textContent).toContain("not good");
    await userEvent.clear(screen.getByTestId("bl-input"));
    await userEvent.type(screen.getByTestId("bl-input"), "good");
    expect(out()).not.toBe(pNotGood);
    expect(out()).toMatch(/positive/);
    fireEvent.change(screen.getByTestId("bl-input"), { target: { value: "qqqq zzzz" } });
    expect(screen.getByTestId("bl-table").textContent).toContain("None of your words");
  });
  it("baselines: a test sentence shows the recorded answers of the Python models", async () => {
    await open("baselines");
    fireEvent.change(screen.getByTestId("bl-input"), { target: { value: "in its best moments , resembles a bad high school production of grease , without benefit of song ." } });
    const rec = await screen.findByTestId("bl-recorded");
    expect(rec.textContent).toContain("TF-IDF SVM");
    expect(rec.textContent).toContain("✗");
  });
  it("results: every column header sorts the table and the statistics match the recorded CSV", async () => {
    await open("results");
    const table = screen.getByRole("table", { name: /Results on the SST-2 test set/ });
    const first = () => within(table).getAllByRole("row")[1].textContent ?? "";
    expect(first()).toContain("DistilBERT-SST2"); // accuracy, descending
    await userEvent.click(within(table).getByRole("button", { name: /Latency/ }));
    expect(first()).toContain("Zero-shot NLI"); // a number column sorts descending on the first click
    await userEvent.click(within(table).getByRole("button", { name: /Latency/ }));
    expect(first()).toContain("TF-IDF + Logistic Regr."); // then ascending: the smallest latency, 0.0486 ms
    await userEvent.click(within(table).getByRole("button", { name: /Parameters/ }));
    expect(first()).toContain("Twitter-RoBERTa");
    const stats = screen.getByTestId("rs-stats");
    expect(within(stats).getAllByText("✓")).toHaveLength(10);
    await waitFor(() => expect(screen.getAllByTestId("rs-ci").every((c) => /\d/.test(c.textContent ?? ""))).toBe(true));
    expect(stats.textContent).toContain("48");
    expect(stats.textContent).toContain("28");
  });
  it("results: the pair explorer gives 104 against 53, p < 0.001, for fine-tuned DistilBERT against the SVM", async () => {
    await open("results");
    const out = screen.getByTestId("rs-pair-out");
    expect(out.textContent).toContain("104");
    expect(out.textContent).toContain("53");
    expect(out.textContent).toMatch(/p < 0\.001/);
    await userEvent.click(screen.getByRole("button", { name: /BERT-small · TF-IDF SVM/ }));
    expect(screen.getByTestId("rs-pair-out").textContent).toContain("71");
    expect(screen.getByTestId("rs-pair-out").textContent).toMatch(/no significant difference/);
  });
  it("results: the confusion matrix of the fine-tuned DistilBERT is 388 / 40 / 58 / 386 and matches the saved result", async () => {
    await open("results");
    const cm = screen.getByTestId("rs-cm");
    for (const n of ["388", "40", "58", "386"]) expect(cm.textContent).toContain(n);
    expect(screen.getByText(/equal the saved results/)).toBeInTheDocument();
  });
  it("design: 65,349 / 2,000 / 872, the ten competitors and the five threats", async () => {
    await open("design");
    const t = screen.getByTestId("ds-splits").textContent ?? "";
    expect(t).toContain("65 349");
    expect(t).toContain("2 000");
    expect(t).toContain("872");
    expect(t).toContain("50.9");
    expect(t).toContain("19.5");
    expect(within(screen.getByTestId("ds-models")).getAllByRole("row")).toHaveLength(11);
    await userEvent.click(screen.getByRole("radio", { name: "Recurrent (BiLSTM)" }));
    expect(within(screen.getByTestId("ds-models")).getAllByRole("row")).toHaveLength(2);
    expect(screen.getByText("Five threats to validity")).toBeInTheDocument();
  });
  it("cost: the calculators compute time, throughput and memory", async () => {
    await open("cost");
    fireEvent.change(screen.getByTestId("cs-n"), { target: { value: "1000000" } });
    fireEvent.change(screen.getByTestId("cs-ms"), { target: { value: "40" } });
    expect(screen.getByTestId("cs-time").textContent).toBe("11 h 7 min");
    expect(screen.getByTestId("cs-rate").textContent).toBe("25");
    expect(screen.getByTestId("cs-mem").textContent).toBe("267.8 MB"); // DistilBERT: 66,955,010 x 4 bytes
    await userEvent.click(screen.getByRole("radio", { name: /16-bit/ }));
    expect(screen.getByTestId("cs-mem").textContent).toBe("133.9 MB");
    await userEvent.click(within(screen.getByTestId("cs-bubble")).getByRole("button", { name: /Twitter-RoBERTa/ }));
    expect(screen.getByTestId("cs-bubble-out").textContent).toContain("124 647 939");
  });
  it("efficiency: the slider moves along the learning curve and says when a value is interpolated", async () => {
    await open("efficiency");
    expect(screen.getByTestId("ef-basis").textContent).toMatch(/measured in the experiment/);
    expect(screen.getByTestId("ef-bert").textContent).toBe("80.7 %"); // 2,000 labelled sentences
    expect(screen.getByTestId("ef-diff").textContent).toContain("+9.7");
    fireEvent.change(document.getElementById("ef-n")!, { target: { value: "0" } });
    expect(screen.getByTestId("ef-bert").textContent).toBe("75.9 %");
    expect(screen.getByTestId("ef-lr").textContent).toBe("61.8 %");
    expect(screen.getByTestId("ef-diff").textContent).toContain("+14.1");
    fireEvent.change(document.getElementById("ef-n")!, { target: { value: "30" } });
    expect(screen.getByTestId("ef-basis").textContent).toMatch(/Interpolated/);
  });
  it("readymade: the toy is labelled and softmax of equal scores is 50 / 50", async () => {
    await open("readymade");
    expect(screen.getByTestId("rm-toy-badge").textContent).toMatch(/Toy numbers/);
    fireEvent.change(document.getElementById("rm-pos")!, { target: { value: "1" } });
    fireEvent.change(document.getElementById("rm-neg")!, { target: { value: "1" } });
    expect(screen.getByTestId("rm-toy-out").textContent).toContain("50.0 %, 50.0 %");
    expect(document.body.textContent).toContain("The sentiment of this movie review is positive.");
    expect(screen.getByTestId("rm-card-nli").textContent).toContain("81.77");
  });
  it("errors: 184 and 130 sentences are recomputed, the sentence lab filters all 872 sentences", async () => {
    await open("errors");
    expect(screen.getByTestId("er-neg-n").textContent).toBe("184");
    expect(screen.getByTestId("er-con-n").textContent).toBe("130");
    expect(screen.getByTestId("er-count").textContent).toBe("872 of 872 sentences");
    const mode = screen.getByTestId("er-mode");
    fireEvent.change(mode, { target: { value: "svmRightDistilWrong" } });
    expect(screen.getByTestId("er-count").textContent).toBe("53 of 872 sentences");
    fireEvent.change(mode, { target: { value: "distilRightSvmWrong" } });
    expect(screen.getByTestId("er-count").textContent).toBe("104 of 872 sentences");
    fireEvent.change(mode, { target: { value: "negation" } });
    expect(screen.getByTestId("er-count").textContent).toBe("184 of 872 sentences");
    fireEvent.change(screen.getByTestId("er-search"), { target: { value: "never" } });
    const n = Number((screen.getByTestId("er-count").textContent ?? "").split(" ")[0]);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(184);
    const row = within(screen.getByTestId("er-list")).getAllByRole("listitem")[0];
    expect(within(row).getAllByRole("img")).toHaveLength(10);
    fireEvent.change(screen.getByTestId("er-search"), { target: { value: "zzzzqqqq" } });
    expect(screen.getByText("No sentence matches.")).toBeInTheDocument();
    const img = screen.getByAltText(/Heat map of the last-layer self-attention/);
    expect(img).toHaveAttribute("src", "/lab3/attention-fig7.png");
  });
  it("decide: scenarios and inputs give the paper's four recommendations", async () => {
    await open("decide");
    const out = () => screen.getByTestId("dec-out");
    expect(out()).toHaveAttribute("data-step", "2");
    expect(out()).toHaveAttribute("data-model", "ft_distilbert_8000");
    await userEvent.click(screen.getByTestId("dec-in"));
    expect(out()).toHaveAttribute("data-step", "1");
    expect(out()).toHaveAttribute("data-model", "pt_distilbert_sst2");
    await userEvent.click(screen.getByRole("button", { name: /A new topic with no labels/ }));
    expect(out()).toHaveAttribute("data-step", "3");
    expect(out().textContent).toContain("Zero-shot NLI");
    await userEvent.click(screen.getByRole("button", { name: /Millions of items per hour/ }));
    expect(out()).toHaveAttribute("data-step", "4");
    await userEvent.click(screen.getByRole("button", { name: /Lithuanian texts/ }));
    expect(screen.getByText("Your texts are not English")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("dec-labels"), { target: { value: "0" } });
    fireEvent.change(screen.getByTestId("dec-lat"), { target: { value: "0.1" } });
    expect(out()).toHaveAttribute("data-step", "0");
    expect(screen.getByText(/No measured model satisfies all your limits/)).toBeInTheDocument();
  });
  it("code: the real files are listed, the search finds lines and the run order comes from run_all.sh", async () => {
    await open("code");
    expect(document.querySelectorAll("details[data-file]")).toHaveLength(12);
    const order = screen.getByTestId("cd-order").textContent ?? "";
    expect(order).toContain("02_classical_baselines.py");
    expect(order).toContain("08_report.py");
    expect(order).not.toContain("09_diagrams");
    fireEvent.change(screen.getByTestId("cd-find"), { target: { value: "AdamW" } });
    expect(screen.getByTestId("cd-hits").textContent).toMatch(/04_finetune_transformer\.py:\d+/);
    expect(document.body.textContent).toContain("2.5 to 3 hours");
  });
  it("checklist: ticks are counted and saved", async () => {
    await open("checklist");
    expect(screen.getByTestId("ck-count").textContent).toBe("0 of 12 ticked");
    const boxes = screen.getAllByRole("checkbox").filter((b) => !b.closest("[data-testid=guide-intro]"));
    await userEvent.click(boxes[0]);
    await userEvent.click(boxes[1]);
    expect(screen.getByTestId("ck-count").textContent).toBe("2 of 12 ticked");
    expect(localStorage.getItem("ailab-lab3-checklist")).toContain("true");
  });
  it("defense: twelve questions open to answers with the recorded numbers filled in", async () => {
    await open("defense");
    const items = document.querySelectorAll("details");
    expect(items).toHaveLength(12);
    const text = document.body.textContent ?? "";
    expect(text).toContain("88.8 %");
    expect(text).toContain("91.1 %");
    expect(text).toContain("82.9 %");
    expect(text).toContain("104 sentences");
  });
});

describe("the quiz of an experiment step works", () => {
  it("answering the first question of the results step gives feedback", async () => {
    await open("results");
    const group = document.querySelector("[role=radiogroup][aria-labelledby^='q-results']") as HTMLElement;
    await userEvent.click(within(group).getAllByRole("radio")[1]);
    expect(await screen.findByText(/Correct\./)).toBeInTheDocument();
  });
});
