import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nProvider, LanguageSwitcher, NAMESPACES, type Lang } from "../i18n";
import { GUIDES } from "../labs/lab1/content/guides";
import { QA, ROADMAP } from "../labs/lab1/data";
import { PipelineMap, STAGES, stageOf } from "../labs/lab1/PipelineMap";
import { GuideIntro, GuideOutro, readGuideState } from "../labs/lab1/StepGuide";
import { getLab } from "../labs/registry";
import { LabPage } from "../pages/LabPage";

beforeEach(() => localStorage.clear());

const lab = getLab("lab1")!;
const ids = lab.steps.map((s) => s.id);

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
        // no two options say the same thing, so "exactly one correct" is meaningful
        expect(new Set(q.options.map((o) => o[0])).size).toBe(q.options.length);
        expect(q.why[0].length).toBeGreaterThan(20);
      }
      expect(g.takeaways).toHaveLength(3);
      expect(g.mistakes.length).toBeGreaterThanOrEqual(1);
      expect(g.mistakes.length).toBeLessThanOrEqual(2);
    });
  }
  it("every numeric claim that has a proof really holds (verify() of each question)", () => {
    let proofs = 0;
    for (const [id, g] of Object.entries(GUIDES)) {
      g.questions.forEach((q, i) => {
        if (q.verify) { proofs++; expect(q.verify(), `${id} q${i}`).toBe(true); }
      });
    }
    expect(proofs).toBeGreaterThanOrEqual(20);
  });
  it("answers are spread over positions A, B and C (not always the same letter)", () => {
    const pos = new Set(Object.values(GUIDES).flatMap((g) => g.questions.map((q) => q.correct)));
    expect(pos.size).toBeGreaterThanOrEqual(3);
  });
});

describe("Lab 1 messages", () => {
  const en = NAMESPACES.lab1.en;
  it("every key written literally in the Lab 1 sources exists", () => {
    const files = import.meta.glob("../labs/lab1/**/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const missing: string[] = [];
    let seen = 0;
    for (const [file, src] of Object.entries(files)) {
      for (const m of src.matchAll(/\b(?:t|r)\(\s*"((?:lab1|step\.lab1)\.[A-Za-z0-9_.\-]+)"/g)) {
        seen++;
        if (!(m[1] in en) && !(m[1] in NAMESPACES.common.en)) missing.push(`${file.split("/").pop()}: ${m[1]}`);
      }
    }
    expect(seen).toBeGreaterThan(300);
    expect(missing).toEqual([]);
  });
  it("keys built from a pattern exist for every value of the pattern", () => {
    const need: string[] = [];
    STAGES.forEach((s) => ["title", "in", "out"].forEach((p) => need.push(`lab1.pm.${s.id}.${p}`)));
    ["z", "h", "zo", "out", "loss", "dOut", "dH", "gw2", "gb2", "gw1", "gb1", "uw", "ub"].forEach((f) => need.push(`lab1.net.s.${f}`, `lab1.net.e.${f}`));
    ["forward", "backward", "update"].forEach((p) => need.push(`lab1.net.tr.ph.${p}`));
    for (let i = 0; i < 6; i++) ["tag", "title", "text"].forEach((p) => need.push(`lab1.big.f${i}.${p}`));
    for (let i = 0; i < 6; i++) need.push(`lab1.rw.d${i}`, `lab1.rw.p${i}.t`, `lab1.rw.p${i}.s`);
    for (let i = 0; i < 5; i++) need.push(`lab1.ac.ch.s${i}.q`, `lab1.ac.ch.s${i}.e`);
    ids.forEach((id) => need.push(`step.lab1.${id}.title`, `step.lab1.${id}.summary`));
    expect(need.filter((k) => !(k in en))).toEqual([]);
  });
  it("English texts for the checklist and the defense Q&A match the data they were copied from", () => {
    ROADMAP.forEach(([title, items], gi) => {
      expect(en[`lab1.road.g${gi}.t`]).toBe(title);
      items.forEach(([a, b], ii) => {
        expect(en[`lab1.road.g${gi}.i${ii}.a`]).toBe(a);
        expect(en[`lab1.road.g${gi}.i${ii}.b`]).toBe(b);
      });
    });
    QA.forEach(([q, a], i) => {
      expect(en[`lab1.def.q${i}.q`]).toBe(q);
      expect(en[`lab1.def.q${i}.a`]).toBe(a);
    });
  });
  it("Kannada and Lithuanian really differ from English for the guides (not copied)", () => {
    let same = 0;
    let total = 0;
    for (const k of Object.keys(en).filter((x) => x.startsWith("lab1.g."))) {
      total++;
      if (NAMESPACES.lab1.kn[k] === en[k] || NAMESPACES.lab1.lt[k] === en[k]) same++;
    }
    // numbers-only options (e.g. "0.04") legitimately stay identical
    expect(same / total).toBeLessThan(0.12);
  });
});

const slot = (id: string, done: string[] = []) => ({ stepId: id, done });

describe("pipeline map", () => {
  it("every step belongs to exactly one of the nine stages", () => {
    expect(STAGES).toHaveLength(9);
    for (const id of ids) expect(STAGES.filter((s) => s.steps.includes(id))).toHaveLength(1);
    expect(stageOf("anomalies")).toBe(2);
  });
  it("highlights the current stage, ticks finished ones and links every stage", () => {
    render(<MemoryRouter><I18nProvider initial="en"><PipelineMap {...slot("anomalies", ["big-picture", "real-world", "missing-values"])} /></I18nProvider></MemoryRouter>);
    const nav = screen.getByRole("navigation", { name: "Pipeline map of the whole lab" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(9);
    const current = links.filter((l) => l.getAttribute("aria-current") === "step");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/labs/lab1/anomalies");
    expect(current[0]).toHaveTextContent("Anomalies");
    expect(links[0]).toHaveTextContent("✓"); // raw data: both orientation steps done
    expect(links[1]).toHaveTextContent("✓"); // missing values
    expect(links[3]).not.toHaveTextContent("✓");
    expect(links[3]).toHaveAttribute("href", "/labs/lab1/scaling");
    expect(links[7]).toHaveAttribute("href", "/labs/lab1/activations");
    // input and output of a stage in one line
    expect(links[1]).toHaveTextContent("heights with a gap");
    expect(links[1]).toHaveTextContent("a complete column");
  });
  it("a stage with two steps is ticked only when both are done", () => {
    const { rerender } = render(<MemoryRouter><I18nProvider initial="en"><PipelineMap {...slot("train", ["activations"])} /></I18nProvider></MemoryRouter>);
    expect(screen.getAllByRole("link")[7]).not.toHaveTextContent("✓");
    rerender(<MemoryRouter><I18nProvider initial="en"><PipelineMap {...slot("train", ["activations", "optimizers"])} /></I18nProvider></MemoryRouter>);
    expect(screen.getAllByRole("link")[7]).toHaveTextContent("✓");
  });
  it("the details toggle hides the in/out lines of the other stages and remembers the choice", async () => {
    render(<MemoryRouter><I18nProvider initial="en"><PipelineMap {...slot("scaling")} /></I18nProvider></MemoryRouter>);
    const btn = screen.getByRole("button", { name: "Hide details" });
    await userEvent.click(btn);
    expect(screen.getByRole("button", { name: "Show details" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/heights with a gap/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/both on a 0-1 ruler/).length).toBe(1); // the current stage keeps its line
    expect(localStorage.getItem("ailab-lab1-map-compact")).toBe("1");
  });
});

describe("guide checklist", () => {
  it("ticks are saved per step and survive a reload (remount)", async () => {
    const { unmount } = render(<I18nProvider initial="en"><GuideIntro {...slot("missing-values")} /></I18nProvider>);
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes.length).toBe(GUIDES["missing-values"].tasks.length);
    await userEvent.click(boxes[0]);
    await userEvent.click(boxes[2]);
    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(readGuideState().tasks["missing-values"]).toEqual([0, 2]);
    unmount();
    render(<I18nProvider initial="en"><GuideIntro {...slot("missing-values")} /></I18nProvider>);
    const again = screen.getAllByRole("checkbox");
    expect(again[0]).toBeChecked();
    expect(again[1]).not.toBeChecked();
    expect(again[2]).toBeChecked();
    await userEvent.click(again[0]);
    expect(readGuideState().tasks["missing-values"]).toEqual([2]);
  });
  it("another step keeps its own ticks", async () => {
    render(<I18nProvider initial="en"><GuideIntro {...slot("anomalies")} /></I18nProvider>);
    expect(screen.getAllByRole("checkbox").every((b) => !(b as HTMLInputElement).checked)).toBe(true);
  });
  it("shows goal, why, key words and the tasks with the lab's real numbers", () => {
    render(<I18nProvider initial="en"><GuideIntro {...slot("anomalies")} /></I18nProvider>);
    expect(screen.getByRole("heading", { name: "Goal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Why this step exists and where it fits" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Key words" })).toBeInTheDocument();
    expect(screen.getByText("Masking")).toBeInTheDocument();
    expect(screen.getByText(/z = 5\.22/)).toBeInTheDocument();
    expect(screen.getByText(/4\.625 … 19\.625/)).toBeInTheDocument();
  });
});

describe("guide quiz", () => {

  it("gives instant feedback with the explanation, for a right and for a wrong answer", async () => {
    render(<I18nProvider initial="en"><GuideOutro {...slot("missing-values")} /></I18nProvider>);
    const g = GUIDES["missing-values"];
    const q0 = g.questions[0];
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await userEvent.click(within(screen.getAllByRole("radiogroup")[0]).getByRole("radio", { name: q0.options[0][0] }));
    const fb = screen.getAllByRole("status")[0];
    expect(fb).toHaveTextContent("Correct!");
    expect(fb).toHaveTextContent("995 / 6 = 165.83");
    // second question: pick a wrong one
    const q1 = g.questions[1];
    const wrong = q1.options.findIndex((_, i) => i !== q1.correct);
    await userEvent.click(within(screen.getAllByRole("radiogroup")[1]).getAllByRole("radio")[wrong]);
    const fbs = screen.getAllByRole("status");
    expect(fbs[1]).toHaveTextContent("Not quite.");
    expect(fbs[1]).toHaveTextContent("10.1 cm");
    // the answers are locked after answering
    const radios = within(screen.getAllByRole("radiogroup")[1]).getAllByRole("radio");
    expect(radios.every((r) => r.getAttribute("aria-disabled") === "true")).toBe(true);
  });

  it("remembers the best score per step and keeps it when a later round is worse", async () => {
    render(<I18nProvider initial="en"><GuideOutro {...slot("scaling")} /></I18nProvider>);
    const g = GUIDES.scaling;
    expect(screen.getByTestId("quiz-best")).toHaveTextContent("No score yet");
    const pick = async (qi: number, right: boolean) => {
      const q = g.questions[qi];
      const oi = right ? q.correct : q.options.findIndex((_, i) => i !== q.correct);
      const group = screen.getAllByRole("radiogroup")[qi];
      await userEvent.click(within(group).getAllByRole("radio")[oi]);
    };
    for (let i = 0; i < 3; i++) await pick(i, true);
    expect(screen.getByText("Your score: 3 / 3")).toBeInTheDocument();
    expect(screen.getByTestId("quiz-best")).toHaveTextContent("Best score: 3 / 3");
    expect(readGuideState().quiz.scaling).toEqual({ best: 3, total: 3 });
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await pick(0, false); await pick(1, false); await pick(2, true);
    expect(screen.getByText("Your score: 1 / 3")).toBeInTheDocument();
    expect(readGuideState().quiz.scaling).toEqual({ best: 3, total: 3 });
  });

  it("a stored best score is shown after a reload", () => {
    localStorage.setItem("ailab-lab1-guide-quiz", JSON.stringify({ network: { best: 2, total: 3 } }));
    render(<I18nProvider initial="en"><GuideOutro {...slot("network")} /></I18nProvider>);
    expect(screen.getByTestId("quiz-best")).toHaveTextContent("Best score: 2 / 3");
  });

  it("shows takeaways and common mistakes", () => {
    render(<I18nProvider initial="en"><GuideOutro {...slot("anomalies")} /></I18nProvider>);
    expect(screen.getByRole("heading", { name: "Key takeaways" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Common mistakes" })).toBeInTheDocument();
    expect(screen.getByText(/almost six times larger/)).toBeInTheDocument();
  });

  it("works with a corrupt localStorage value", () => {
    localStorage.setItem("ailab-lab1-guide-quiz", "{not json");
    localStorage.setItem("ailab-lab1-guide-tasks", "[[");
    render(<I18nProvider initial="en"><GuideIntro {...slot("network")} /><GuideOutro {...slot("network")} /></I18nProvider>);
    expect(screen.getByTestId("quiz-best")).toHaveTextContent("No score yet");
  });
});

describe("language switch", () => {
  it("changes a guide heading and the quiz text between English, Lithuanian and Kannada", () => {
    render(<I18nProvider initial="en"><LanguageSwitcher /><GuideOutro {...slot("scaling")} /></I18nProvider>);
    expect(screen.getByRole("heading", { name: "Check yourself" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "lt" } });
    expect(screen.getByRole("heading", { name: "Pasitikrinkite" })).toBeInTheDocument();
    expect(screen.getByText(/Su min 52 ir max 102 svoris 54 kg/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Kalba"), { target: { value: "kn" } });
    expect(screen.getByRole("heading", { name: "ನಿಮ್ಮನ್ನು ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಿ" })).toBeInTheDocument();
  });
  it("renders a Lithuanian guide from the start with initial=lt", () => {
    render(<I18nProvider initial="lt"><GuideIntro {...slot("anomalies")} /></I18nProvider>);
    expect(screen.getByRole("heading", { name: "Tikslas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Atlikite/ })).toBeInTheDocument();
    expect(screen.getByText("Maskavimas")).toBeInTheDocument();
  });
  it("the pipeline map is translated too", () => {
    render(<MemoryRouter><I18nProvider initial="lt"><PipelineMap {...slot("anomalies")} /></I18nProvider></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Visos laboratorijos konvejerio schema" })).toBeInTheDocument();
    expect(screen.getByText("Trūkstamos reikšmės")).toBeInTheDocument();
  });
});

const app = (path: string, lang: Lang) => (
  <I18nProvider initial={lang}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/labs/:labId/:stepId" element={<LabPage />} />
      </Routes>
    </MemoryRouter>
  </I18nProvider>
);

describe("all 13 steps in the lab page", () => {
  for (const lang of ["en", "lt", "kn"] as Lang[]) {
    it(`[${lang}] each step shows the map, the guide, the demos, and no untranslated key or {placeholder}`, async () => {
      for (const id of ids) {
        const { unmount, container } = render(app(`/labs/lab1/${id}`, lang));
        await screen.findByTestId("guide-outro", undefined, { timeout: 4000 });
        expect(screen.getByRole("navigation", { name: lang === "en" ? "Pipeline map of the whole lab" : lang === "lt" ? "Visos laboratorijos konvejerio schema" : "ಇಡೀ ಲ್ಯಾಬ್‌ನ ಪೈಪ್‌ಲೈನ್ ನಕ್ಷೆ" })).toBeInTheDocument();
        expect(screen.getByTestId("guide-intro")).toBeInTheDocument();
        const text = container.textContent ?? "";
        expect(text, `${lang}/${id}: raw key`).not.toMatch(/\b(?:lab1|step\.lab1|lab)\.[a-z0-9]+\.[A-Za-z0-9_.]+/);
        expect(text, `${lang}/${id}: placeholder`).not.toMatch(/\{[a-z0-9]+\}/);
        unmount();
      }
    }, 60000);
  }
  it("the pipeline map in the page marks the step you are on", async () => {
    render(app("/labs/lab1/mnist", "en"));
    await screen.findByTestId("guide-outro");
    const nav = screen.getByRole("navigation", { name: "Pipeline map of the whole lab" });
    expect(within(nav).getByRole("link", { current: "step" })).toHaveTextContent("MNIST and softmax");
  });
  it("the guide sits between the heading and the demos, the quiz after them", async () => {
    render(app("/labs/lab1/scaling", "en"));
    const intro = await screen.findByTestId("guide-intro");
    const demo = await screen.findByText("Before and after scaling");
    const outro = await screen.findByTestId("guide-outro");
    expect(intro.compareDocumentPosition(demo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(demo.compareDocumentPosition(outro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Normalization"));
  });
});
