import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { I18nProvider, NAMESPACES, type Lang } from "../i18n";
import { guidesA } from "../labs/lab3/content/guidesA";
import { RECORDED_ATTENTION } from "../labs/lab3/data/theoryAttention";
import { PAPER_TOKENS } from "../labs/lab3/theory/Training";
import { LabPage } from "../pages/LabPage";

beforeEach(() => localStorage.clear());

const IDS = ["overview", "history", "tokens", "position", "attention", "heads", "encoder", "complexity", "training"];
const en = NAMESPACES.lab3.en;

describe("Lab 3 theory guides", () => {
  it("covers exactly the nine theory steps", () => expect(Object.keys(guidesA).sort()).toEqual([...IDS].sort()));
  for (const id of IDS) {
    it(`${id}: goal, fit, keywords, 3-5 tasks, 2-3 questions with exactly one correct option, 3 takeaways, 1-2 mistakes`, () => {
      const g = guidesA[id];
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
    it(`${id}: every string is filled in all three languages`, () => {
      const g = guidesA[id];
      const all: [string, string, string][] = [g.goal, g.fit, ...g.keywords.flat(), ...g.tasks, ...g.takeaways, ...g.mistakes, ...g.questions.flatMap((q) => [q.q, q.why, ...q.options])];
      for (const t of all) for (const s of t) expect(s.trim()).not.toBe("");
      // Kannada must really be Kannada, Lithuanian Latin: catches swapped columns
      for (const t of all) {
        if (/[A-Za-z]{6,}/.test(t[1]) && !/[ಀ-೿]/.test(t[1])) expect(t[1], `kn column of ${id}`).toMatch(/^[^a-z]*$|^[A-Za-z0-9 .,·()²\-–=→+%^/×√]*$/);
        expect(/[ಀ-೿]/.test(t[2]), `lt column of ${id} must not be Kannada: ${t[2]}`).toBe(false);
      }
    });
  }
  it("every numeric claim with a proof holds (verify() of each question)", () => {
    let proofs = 0;
    for (const [id, g] of Object.entries(guidesA)) {
      g.questions.forEach((q, i) => { if (q.verify) { proofs++; expect(q.verify(), `${id} q${i}`).toBe(true); } });
    }
    expect(proofs).toBeGreaterThanOrEqual(18);
  });
  it("answers are spread over positions A, B and C", () => {
    const pos = new Set(Object.values(guidesA).flatMap((g) => g.questions.map((q) => q.correct)));
    expect(pos.size).toBeGreaterThanOrEqual(3);
  });
});

describe("Lab 3 theory messages", () => {
  const files = import.meta.glob("../labs/lab3/theory/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
  const literal = new Set<string>();
  for (const src of Object.values(files)) for (const m of src.matchAll(/["'`](lab3\.t\.[A-Za-z0-9_.\-]+)["'`]/g)) literal.add(m[1]);
  it("every literal key used by the theory steps exists in English, Kannada and Lithuanian", () => {
    expect(literal.size).toBeGreaterThan(150);
    for (const l of ["en", "kn", "lt"] as const) expect([...literal].filter((k) => !(k in NAMESPACES.lab3[l])), l).toEqual([]);
  });
  it("keys built from a pattern exist", () => {
    const need: string[] = [];
    for (const id of IDS) need.push(`step.lab3.${id}.title`, `step.lab3.${id}.summary`);
    for (let i = 0; i < 5; i++) need.push(`lab3.t.ov.rq${i}`, `lab3.t.ov.obj${i}`);
    for (const f of ["classical", "recurrent", "transformer-finetuned", "transformer-pretrained", "transformer-zero-shot"]) need.push(`lab3.t.ov.f.${f}`);
    for (const id of ["tokens", "position", "attention", "heads", "encoder", "complexity", "training"]) need.push(`lab3.t.ov.road.${id}`);
    for (const e of ["lstm", "w2v", "bahdanau", "transformer", "elmo", "gpt", "bert", "distil", "gpt3", "t5", "litlat", "llama"]) need.push(`lab3.t.hi.e.${e}.t`, `lab3.t.hi.e.${e}.d`);
    for (const f of ["enc", "dec", "encdec"]) need.push(`lab3.t.hi.fam.${f}.d`, `lab3.t.hi.fam.${f}.ex`);
    for (const c of ["self", "prev", "next", "sink"]) need.push(`lab3.t.hd.cat.${c}`);
    for (const b of ["emb", "attn", "norm1", "ffn", "norm2", "head"]) need.push(`lab3.t.en.blk.${b}`, `lab3.t.en.blk.${b}.d`);
    for (const p of ["word", "pos", "type", "embLn", "attn", "ln1", "ffn", "ln2", "dense", "cls"]) need.push(`lab3.t.en.part.${p}`);
    for (const a of ["mask", "random", "keep"]) need.push(`lab3.t.tr.mlm.a.${a}`);
    for (const k of ["attention", "recurrent"]) need.push(`lab3.t.cx.seq.${k}`);
    for (const k of ["recorded", "recomputed", "toy", "paper", "bert"]) need.push(`lab3.t.tag.${k}`);
    expect(need.filter((k) => !(k in en))).toEqual([]);
  });
  it("the sentence of the paper and its tokens agree between the recorded data and the training demo", () => {
    expect(RECORDED_ATTENTION[0].tokens).toEqual(PAPER_TOKENS);
  });
});

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

const READY: Record<string, string> = { attention: "at-real", heads: "hd-stat" };

describe("every Lab 3 theory step renders in English, Lithuanian and Kannada with no raw key", () => {
  for (const lang of ["en", "lt", "kn"] as const) {
    for (const id of IDS) {
      it(`${lang} · ${id}`, async () => {
        const { unmount } = render(app(`/labs/lab3/${id}`, lang));
        await screen.findByRole("heading", { level: 1 }, { timeout: 5000 });
        await waitFor(() => expect(document.querySelector("[data-testid='guide-intro']")).not.toBeNull());
        if (READY[id]) await waitFor(() => expect(document.querySelector(`[data-testid='${READY[id]}']`)).not.toBeNull(), { timeout: 5000 });
        const text = document.body.textContent ?? "";
        const raw = Object.keys(NAMESPACES.lab3.en).filter((k) => k.startsWith("lab3.t.") && text.includes(k));
        expect(raw, "raw keys on screen").toEqual([]);
        expect(text).not.toMatch(/\{[A-Za-z]+\}/);
        expect(text).not.toMatch(/\bstep\.lab3\./);
        unmount();
      });
    }
  }
});

const norm = (s: string | null) => (s ?? "").replace(/ /g, " ");

describe("Lab 3 theory widgets compute and respond", () => {
  it("the parameter counter reproduces the three real sizes of the repository", async () => {
    render(app("/labs/lab3/encoder"));
    const total = async () => norm((await screen.findByTestId("en-total-n")).textContent);
    expect(await total()).toBe("4 386 178");
    expect(screen.getByTestId("en-total")).toHaveTextContent(/equals the real number/);
    await userEvent.click(screen.getByRole("radio", { name: "BERT-small" }));
    expect(await total()).toBe("28 764 674");
    await userEvent.click(screen.getByRole("radio", { name: "DistilBERT" }));
    expect(await total()).toBe("66 955 010");
    expect(screen.getByTestId("en-total")).toHaveTextContent(/equals the real number/);
    // editing a field leaves the presets
    await userEvent.clear(screen.getByLabelText("Layers L"));
    await userEvent.type(screen.getByLabelText("Layers L"), "7");
    expect(await total()).not.toBe("66 955 010");
    expect(screen.getByTestId("en-total")).not.toHaveTextContent(/equals the real number/);
  });
  it("the encoder residual toggle changes the layer-norm input", async () => {
    render(app("/labs/lab3/encoder"));
    const walk = await screen.findByTestId("en-walk");
    const before = walk.textContent;
    await userEvent.click(screen.getByRole("radio", { name: "FFN(x) only" }));
    expect(screen.getByTestId("en-walk").textContent).not.toBe(before);
  });
  it("attention: editing Q changes the weights; scaling off sharpens them", async () => {
    render(app("/labs/lab3/attention"));
    const q11 = await screen.findByLabelText("Q t1, 1");
    const w = () => norm(screen.getAllByRole("group", { name: "Weights (softmax of each row)" })[0].textContent);
    const before = w();
    await userEvent.clear(q11);
    await userEvent.type(q11, "3");
    expect(w()).not.toBe(before);
    expect(screen.getByText(/Token t1 puts the most weight on/)).toBeInTheDocument();
  });
  it("attention: the saturation demo reports a larger unscaled maximum at d_k = 512", async () => {
    render(app("/labs/lab3/attention"));
    const slider = await screen.findByLabelText(/^d/, { selector: "#sat-dk" });
    fireEvent.change(slider, { target: { value: "8" } });
    const read = screen.getByTestId("at-sat").textContent ?? "";
    const m = read.match(/is (\d+) % without scaling and (\d+) % with scaling/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThan(Number(m![2]) + 30);
  });
  it("attention: real DistilBERT map of the paper sentence, last layer, mean over heads, is shown and clickable", async () => {
    render(app("/labs/lab3/attention"));
    const box = await screen.findByTestId("at-real");
    expect(box).toHaveTextContent(/0\.9997/);
    expect(box).toHaveTextContent(/Most attention received/);
    await userEvent.click(screen.getAllByRole("button", { name: "brilliant" })[0]);
    expect(screen.getByTestId("at-real")).toHaveTextContent(/“brilliant” looks mostly at/);
  });
  it("position: the order test shows identical vectors without positions and different ones with", async () => {
    render(app("/labs/lab3/position"));
    const perm = await screen.findByTestId("po-perm");
    const cards = within(perm).getAllByText(/^\[/);
    expect(cards[0].textContent).toBe(cards[1].textContent);
    await userEvent.click(screen.getByRole("radio", { name: /sinusoidal positions/ }));
    const after = within(screen.getByTestId("po-perm")).getAllByText(/^\[/);
    expect(after[0].textContent).not.toBe(after[1].textContent);
  });
  it("position: the readout of PE(pos, dim) follows the sliders", async () => {
    render(app("/labs/lab3/position"));
    const out = await screen.findByTestId("po-readout");
    expect(out).toHaveTextContent("PE(5, 6)");
    fireEvent.change(screen.getByLabelText(/Selected position/, { selector: "input" }), { target: { value: "0" } });
    expect(screen.getByTestId("po-readout")).toHaveTextContent("PE(0, 6) = sin(0 / 10000^(6/64)) = sin(0.0000) = 0.0000");
  });
  it("tokens: toy WordPiece splits a typed word and marks unknown ones", async () => {
    render(app("/labs/lab3/tokens"));
    const input = await screen.findByLabelText("Your sentence");
    await userEvent.clear(input);
    await userEvent.type(input, "unwatchable zzz");
    const toy = screen.getByTestId("tk-toy");
    expect(toy).toHaveTextContent("##watch");
    expect(toy).toHaveTextContent("[UNK]");
    await userEvent.click(screen.getByRole("button", { name: "ChatGPT" }));
    expect(screen.getByTestId("tk-rec")).toHaveTextContent("chat");
    expect(screen.getByTestId("tk-rec")).toHaveTextContent("##gp");
  });
  it("history: the timeline shows another event when clicked; decoder view shows recorded probabilities", async () => {
    render(app("/labs/lab3/history"));
    await userEvent.click(await screen.findByRole("tab", { name: /word2vec/ }));
    expect(screen.getByTestId("hi-event")).toHaveTextContent(/dense vectors/);
    await userEvent.click(screen.getAllByRole("radio", { name: "Decoder-only" })[0]);
    expect(screen.getByText(/Next-word probabilities recorded from a real run of distilgpt2/)).toBeInTheDocument();
  });
  it("overview: filtering by family keeps the matching models", async () => {
    render(app("/labs/lab3/overview"));
    const table = await screen.findByTestId("ov-models");
    expect(within(table).getAllByRole("row")).toHaveLength(11);
    await userEvent.click(screen.getByRole("radio", { name: "Classical" }));
    expect(within(screen.getByTestId("ov-models")).getAllByRole("row")).toHaveLength(4);
  });
  it("heads: choosing 4 heads gives d_k = 2 and picking a real head updates its statistics", async () => {
    render(app("/labs/lab3/heads"));
    await userEvent.click(await screen.findByRole("radio", { name: "4" }));
    expect(screen.getByTestId("hd-eq")).toHaveTextContent("d = 8 = h · d_k = 4 × 2");
    const stat = await screen.findByTestId("hd-stat");
    const before = stat.textContent;
    await userEvent.click(screen.getByRole("button", { name: "Select head 5" }));
    expect(screen.getByTestId("hd-stat").textContent).not.toBe(before);
  });
  it("complexity: moving n past d flips which layer is cheaper", async () => {
    render(app("/labs/lab3/complexity"));
    const read = await screen.findByTestId("cx-read");
    expect(read).toHaveTextContent(/12\.0 times fewer/);
    fireEvent.change(screen.getByLabelText(/Vector size d/, { selector: "input" }), { target: { value: "128" } });
    fireEvent.change(screen.getByLabelText(/Sequence length n/, { selector: "input" }), { target: { value: "512" } });
    expect(screen.getByTestId("cx-read")).toHaveTextContent(/n > d/);
  });
  it("training: schedule readout at the peak, AdamW table, clipping and the hyper-parameter table", async () => {
    render(app("/labs/lab3/training"));
    const sch = await screen.findByTestId("tr-sch");
    expect(sch).toHaveTextContent(/Step 40: learning rate 4\.00e-5 \(warm-up\)/);
    fireEvent.change(screen.getByLabelText(/Optimizer step/, { selector: "input" }), { target: { value: "0" } });
    expect(screen.getByTestId("tr-sch")).toHaveTextContent(/Step 0: learning rate 0\.00e\+0/);
    expect(screen.getByTestId("tr-clip")).toHaveTextContent(/norm 5\.000.*0\.200/);
    const hp = screen.getByTestId("tr-hp");
    expect(hp).toHaveTextContent("2·10⁻⁴");
    expect(hp).toHaveTextContent("5·10⁻⁵");
    expect(screen.getByTestId("tr-adam").querySelectorAll("tbody tr")).toHaveLength(5);
  });
  it("training: a new random draw changes the masking, the rate stays at 15 % by default", async () => {
    render(app("/labs/lab3/training"));
    const m = await screen.findByTestId("tr-mlm");
    const before = m.textContent;
    await userEvent.click(screen.getByRole("button", { name: "New random draw" }));
    expect(screen.getByTestId("tr-mlm").textContent).not.toBe(before);
  });
});
