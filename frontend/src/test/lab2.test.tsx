import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nProvider, NAMESPACES, type Lang } from "../i18n";
import { CODE_STEPS } from "../labs/lab2/data/code";
import { HARDWARE, SUMMARY, TASK11, TASK21, TASK23 } from "../labs/lab2/data/results";
import { GUIDES } from "../labs/lab2/content/guides";
import { getLab, LABS } from "../labs/registry";
import { LabPage } from "../pages/LabPage";
import { LabsIndex } from "../pages/LabsIndex";

beforeEach(() => localStorage.clear());

const lab = getLab("lab2")!;
const ids = lab.steps.map((s) => s.id);
const en = NAMESPACES.lab2.en;

describe("Lab 2 registry", () => {
  it("is live, in the deep-learning domain, with 13 steps and unique ids", () => {
    expect(lab.status).toBe("live");
    expect(lab.number).toBe(2);
    expect(lab.domain).toBe("dl");
    expect(lab.steps).toHaveLength(13);
    expect(new Set(ids).size).toBe(ids.length);
    expect(LABS.find((l) => l.id === "lab2")).toBe(lab);
    expect(LABS.filter((l) => l.status === "live").map((l) => l.id)).toEqual(["lab1", "lab2", "lab3"]);
  });
  it("each step has a title, a summary, a group and a time", () => {
    for (const s of lab.steps) {
      expect(s.title.length).toBeGreaterThan(3);
      expect(s.summary.length).toBeGreaterThan(20);
      expect(s.group).toBeTruthy();
      expect(s.minutes).toBeGreaterThan(0);
    }
  });
  it("Lab 3 is live (Transformers in NLP) and Lab 4 stays planned", () => {
    expect(getLab("lab3")!.status).toBe("live");
    expect(getLab("lab4")!.status).toBe("planned");
  });
});

describe("every step has a real guide", () => {
  it("covers all 13 steps and nothing else", () => {
    expect(Object.keys(GUIDES).sort()).toEqual([...ids].sort());
  });
  for (const id of ids) {
    it(`${id}: goal, fit, key words, 3-5 tasks, 2-3 questions with exactly one correct option, 3 takeaways, 1-2 mistakes`, () => {
      const g = GUIDES[id];
      expect(g.goal[0].length).toBeGreaterThan(30);
      expect(g.fit[0].length).toBeGreaterThan(30);
      expect(g.keywords.length).toBeGreaterThanOrEqual(3);
      expect(g.tasks.length).toBeGreaterThanOrEqual(3);
      expect(g.tasks.length).toBeLessThanOrEqual(5);
      expect(g.questions.length).toBeGreaterThanOrEqual(2);
      expect(g.questions.length).toBeLessThanOrEqual(3);
      for (const q of g.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.options.length).toBe(true);
        expect(new Set(q.options.map((o) => o[0])).size).toBe(q.options.length);
        expect(q.why[0].length).toBeGreaterThan(20);
      }
      expect(g.takeaways).toHaveLength(3);
      expect(g.mistakes.length).toBeGreaterThanOrEqual(1);
      expect(g.mistakes.length).toBeLessThanOrEqual(2);
    });
  }
  it("every guide has all three languages filled in", () => {
    for (const g of Object.values(GUIDES)) {
      const all: [string, string, string][] = [g.goal, g.fit, ...g.keywords.flat(), ...g.tasks, ...g.takeaways, ...g.mistakes,
        ...g.questions.flatMap((q) => [q.q, q.why, ...q.options])];
      for (const t of all) for (const s of t) expect(s.trim()).not.toBe("");
    }
  });
  it("every numeric claim with a proof really holds (verify() of each question)", () => {
    let proofs = 0;
    for (const [id, g] of Object.entries(GUIDES)) {
      g.questions.forEach((q, i) => {
        if (q.verify) { proofs++; expect(q.verify(), `${id} q${i}`).toBe(true); }
      });
    }
    expect(proofs).toBeGreaterThanOrEqual(10);
  });
  it("answers are spread over positions A, B and C (not always the same letter)", () => {
    const pos = new Set(Object.values(GUIDES).flatMap((g) => g.questions.map((q) => q.correct)));
    expect(pos.size).toBeGreaterThanOrEqual(3);
  });
});

describe("recorded numbers shown by the lab", () => {
  it("the best CNN is run 4 with 99.09 % test accuracy and 241 546 parameters", () => {
    expect(SUMMARY.task11.best_run).toBe(4);
    expect(SUMMARY.task11.test_acc).toBe(0.9909);
    expect(SUMMARY.task11.cnn_params).toBe(241546);
  });
  it("the Lab 1 network reaches 98.16 % with 575 050 parameters", () => {
    expect(SUMMARY.task11.fc_test_acc).toBe(0.9816);
    expect(SUMMARY.task11.fc_params).toBe(575050);
  });
  it("the one-hot Dense model is 88.3 % and the GRU of Task 2.3 is 85.87 %", () => {
    expect(SUMMARY.task21.test_acc).toBe(0.883);
    expect(TASK23.find((r) => r.Run === 7)!.test_acc).toBe(0.8587);
    expect(TASK21.find((r) => r.Run === 1)!.test_acc).toBe(0.883);
  });
  it("the run was on CPU, and the code walkthrough has 17 cells", () => {
    expect(HARDWARE).toMatch(/CPU/);
    expect(CODE_STEPS).toHaveLength(17);
    expect(CODE_STEPS[0].title).toMatch(/^Step 0/);
  });
});

describe("Lab 2 messages", () => {
  // keys written literally in the Lab 2 sources (r("…"), tx("…"), t: "…")
  const files = import.meta.glob("../labs/lab2/**/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
  const literal = new Set<string>();
  for (const src of Object.values(files)) {
    for (const m of src.matchAll(/["'`](lab2\.[A-Za-z0-9_.\-]+)["'`]/g)) literal.add(m[1]);
  }
  it("every literal Lab 2 key in the sources exists in English", () => {
    expect(literal.size).toBeGreaterThan(150);
    const missing = [...literal].filter((k) => !(k in en));
    expect(missing).toEqual([]);
  });
  it("keys built from a pattern exist for every value of the pattern", () => {
    const need: string[] = [];
    for (let i = 0; i < 10; i++) need.push(`lab2.pipe.f${i}.t`, `lab2.pipe.f${i}.d`);
    for (let i = 0; i < 17; i++) need.push(`lab2.code.s${i}`);
    for (let i = 0; i < 8; i++) need.push(`lab2.def.q${i}`, `lab2.def.a${i}`);
    for (const k of ["f", "i", "o", "g", "z", "r", "n"]) need.push(`lab2.rnn.gate.${k}`);
    for (const k of ["diverges", "closeToLimit", "small", "reasonable"]) need.push(`lab2.lr.band.${k}`);
    for (let g = 0; g < 4; g++) {
      need.push(`lab2.chk.g${g}.t`);
      for (let i = 0; i < 3; i++) need.push(`lab2.chk.g${g}.i${i}.a`, `lab2.chk.g${g}.i${i}.b`);
    }
    need.push("lab2.dig.st1", "lab2.dig.st2", "lab2.dig.st3", "lab2.dig.st4");
    for (const id of ids) {
      need.push(`step.lab2.${id}.title`, `step.lab2.${id}.summary`);
      for (const p of ["goal", "fit"]) need.push(`lab2.g.${id}.${p}`);
      for (let i = 0; i < GUIDES[id].tasks.length; i++) need.push(`lab2.g.${id}.do${i}`);
    }
    need.push("lab.lab2.title", "lab.lab2.subtitle");
    expect(need.filter((k) => !(k in en))).toEqual([]);
  });
  it("the lab's own title and subtitle replace the old placeholder in the common namespace", () => {
    expect(NAMESPACES.common.en["lab.lab2.title"]).toBeUndefined();
    expect(en["lab.lab2.title"]).toBe(lab.title);
    expect(en["lab.lab2.subtitle"]).toBe(lab.subtitle);
  });
});

const app = (path: string, lang: Lang = "en") => (
  <I18nProvider initial={lang}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/labs" element={<LabsIndex />} />
        <Route path="/labs/:labId" element={<LabPage />} />
        <Route path="/labs/:labId/:stepId" element={<LabPage />} />
      </Routes>
    </MemoryRouter>
  </I18nProvider>
);

describe("every Lab 2 step renders in English and Lithuanian with no raw key", () => {
  for (const lang of ["en", "lt"] as const) {
    for (const id of ids) {
      it(`${lang} · ${id}`, async () => {
        const { unmount } = render(app(`/labs/lab2/${id}`, lang));
        await screen.findByRole("heading", { level: 1 }, { timeout: 4000 });
        await waitFor(() => expect(document.querySelector("[data-testid='guide-intro']")).not.toBeNull());
        const text = document.body.textContent ?? "";
        const raw = Object.keys(NAMESPACES.lab2.en).filter((k) => text.includes(k));
        expect(raw, "raw keys on screen").toEqual([]);
        expect(text).not.toMatch(/\{(n|a|b|v|r|c|x|y|cy|cx|dy|dx|max|avg|test|params|lab1|cnn|run|hw|ones|zeros|loss|s0|s1|p|total|w)\}/);
        unmount();
      });
    }
  }
});

describe("Lab 2 widgets compute and respond", () => {
  it("the parameter calculator shows the recorded total for its default setting (2 blocks, 32 filters)", async () => {
    render(app("/labs/lab2/params"));
    expect(await screen.findByText(/TOTAL CNN = 421,642/)).toBeInTheDocument();
    expect(screen.getByText(/recorded run 2/)).toBeInTheDocument();
  });
  it("moving the pooling choice to average changes the output and the explanation", async () => {
    render(app("/labs/lab2/pool"));
    await screen.findByRole("heading", { level: 1, name: /Pooling/ });
    await userEvent.click(screen.getByRole("radio", { name: "Average" }));
    expect(screen.getByRole("table", { name: "Output 2 × 2" })).toHaveTextContent("3.75");
    expect(screen.getByText(/Average: each 2 × 2 block is replaced by its mean/)).toBeInTheDocument();
  });
  it("clicking an input cell of the pooling grid changes the block maximum", async () => {
    render(app("/labs/lab2/pool"));
    await screen.findByRole("heading", { level: 1, name: /Pooling/ });
    const cell = screen.getByRole("button", { name: /row 1, column 4, value 8/ });
    await userEvent.click(cell);
    expect(cell).toHaveTextContent("9");
    expect(screen.getByRole("table", { name: "Output 2 × 2" })).toHaveTextContent("9");
  });
  it("the learning-rate widget reports the NumPy value after 10 epochs at lr 0.3", async () => {
    render(app("/labs/lab2/learning"));
    expect(await screen.findByText(/after 10 epochs: w = 0\.0004, loss = 0\.0000/)).toBeInTheDocument();
  });
  it("the text step counts the one-hot ones of the default sentence (8) and their complement", async () => {
    render(app("/labs/lab2/text"));
    expect(await screen.findByText(/8 of them are 1 and the other 9,992 are 0/)).toBeInTheDocument();
    expect(screen.getByTestId("word-numbers")).toHaveTextContent("great → 2646");
  });
  it("the Conv1D table highlights the best window and states the global max 0.6", async () => {
    render(app("/labs/lab2/conv1d"));
    expect(await screen.findByText(/keeps 0\.6/)).toBeInTheDocument();
  });
  it("the LSTM toy cell reaches the NumPy hidden state 0.531 after six words", async () => {
    render(app("/labs/lab2/rnn"));
    const next = await screen.findByRole("button", { name: /Next word/ });
    for (let i = 0; i < 6; i++) await userEvent.click(next);
    expect(screen.getByText("0.531")).toBeInTheDocument();
  });
  it("switching the toy cell to GRU shows its own equations", async () => {
    render(app("/labs/lab2/rnn"));
    await userEvent.click(await screen.findByRole("radio", { name: "GRU" }));
    expect(screen.getByRole("radio", { name: "GRU" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/z = sigmoid/)).toBeInTheDocument();
  });
  it("the results step shows the recorded best CNN and the GRU run", async () => {
    render(app("/labs/lab2/results"));
    expect(await screen.findByText(/Best CNN: test accuracy 99\.09 %, 241,546 parameters\./)).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /Task 2\.3/ })).toHaveTextContent("0.8587");
    expect(screen.getByText(/Recorded, not re-run/)).toBeInTheDocument();
  });
  it("the results tables highlight the run chosen by validation accuracy", async () => {
    render(app("/labs/lab2/results"));
    const t = await screen.findByRole("table", { name: /Task 1\.1/ });
    const best = within(t).getAllByRole("row").find((r) => r.classList.contains("bg-ok/10"));
    expect(best).toHaveTextContent("0.9909");
    expect(TASK11[3].val_acc).toBe(0.9917);
  });
  it("the code walkthrough shows the real pick_best cell and its code", async () => {
    render(app("/labs/lab2/code"));
    expect(await screen.findByText("Step 0 - imports, folders, helpers")).toBeInTheDocument();
    expect(document.body.textContent).toContain("def pick_best");
  });
  it("the checklist counts the concepts the learner ticks", async () => {
    render(app("/labs/lab2/checklist"));
    await screen.findByRole("heading", { level: 1 });
    await userEvent.click(screen.getByRole("checkbox", { name: /Convolution/ }));
    expect(screen.getByText("1 of 12 concepts")).toBeInTheDocument();
  });
  it("the step quiz tells a right answer from a wrong one", async () => {
    render(app("/labs/lab2/pipeline"));
    await screen.findByRole("heading", { level: 1 });
    const group = screen.getAllByRole("radiogroup")[0];
    await userEvent.click(within(group).getByRole("radio", { name: /Load MNIST/ }));
    expect(await screen.findByText("Not quite.")).toBeInTheDocument();
  });
  it("the Lab index lists Lab 2 as a deep-learning lab", async () => {
    render(app("/labs?domain=dl"));
    expect(await screen.findByRole("link", { name: /Convolutional and recurrent/ })).toHaveAttribute("href", "/labs/lab2");
  });
});
