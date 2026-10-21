import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../App";
import { I18nProvider, translate } from "../i18n";
import { SHEETS, getSheet } from "../cheatsheets/registry";

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

const NLP_IDS = ["tasks", "preprocessing", "representations", "embeddings", "language-models", "sequence-models", "attention-intro", "pretrained", "metrics", "hf-code", "data", "choose", "lithuanian", "pitfalls"];
const TR_IDS = ["big-picture", "tokens", "positions", "attention", "multihead", "block", "params", "complexity", "objectives", "families", "finetune", "optimizer", "cost", "evaluation", "hf-code", "pitfalls", "glossary"];

describe("NLP and Transformers cheatsheets: registry", () => {
  it("both are live with the fixed section ids", () => {
    expect(getSheet("nlp")!.status).toBe("live");
    expect(getSheet("transformers")!.status).toBe("live");
    expect(getSheet("nlp")!.sections.map((s) => s.id)).toEqual(NLP_IDS);
    expect(getSheet("transformers")!.sections.map((s) => s.id)).toEqual(TR_IDS);
    expect(SHEETS.filter((s) => s.status === "live").map((s) => s.id)).toEqual(expect.arrayContaining(["neural-network", "nlp", "transformers"]));
  });
  it("every section has a title and rich keywords for the search", () => {
    for (const id of ["nlp", "transformers"]) {
      for (const s of getSheet(id)!.sections) {
        expect(s.title.length).toBeGreaterThan(5);
        expect(s.keywords.split(/\s+/).length, `${id}.${s.id}`).toBeGreaterThanOrEqual(8);
      }
    }
  });
});

describe("NLP and Transformers cheatsheets: pages", () => {
  for (const id of ["nlp", "transformers"]) {
    it(`renders every section of /cheatsheets/${id} with content`, async () => {
      at(`/cheatsheets/${id}`);
      for (const s of getSheet(id)!.sections) {
        expect(await screen.findByRole("heading", { level: 2, name: s.title }, { timeout: 5000 })).toBeInTheDocument();
        const section = document.getElementById(s.id)!;
        expect(section.textContent!.length, s.id).toBeGreaterThan(300);
        expect(section.textContent).not.toMatch(/being written/);
      }
      // translated summaries exist for every section (English)
      expect(document.querySelectorAll("main section > p.text-muted").length).toBeGreaterThanOrEqual(getSheet(id)!.sections.length);
    });
  }

  it("search finds mcnemar and wordpiece in both sheets and narrows the list", async () => {
    at("/cheatsheets/nlp");
    const box = await screen.findByRole("searchbox", { name: /search this cheatsheet/i });
    const nav = screen.getByRole("navigation", { name: "Sections" });
    fireEvent.change(box, { target: { value: "mcnemar" } });
    expect(within(nav).getAllByRole("link").length).toBeGreaterThan(0);
    expect(within(nav).getAllByRole("link").length).toBeLessThan(NLP_IDS.length);
    fireEvent.change(box, { target: { value: "wordpiece" } });
    expect(within(nav).getByRole("link", { name: /Text preprocessing/ })).toBeInTheDocument();
    fireEvent.change(box, { target: { value: "zzzzqqq" } });
    expect(screen.getByText(/No section matches/)).toBeInTheDocument();
  });

  it("transformers search: qkv, layer norm, mcnemar, wordpiece", async () => {
    at("/cheatsheets/transformers");
    const box = await screen.findByRole("searchbox", { name: /search this cheatsheet/i });
    const nav = screen.getByRole("navigation", { name: "Sections" });
    const hits = (q: string) => { fireEvent.change(box, { target: { value: q } }); return within(nav).queryAllByRole("link").map((a) => a.textContent); };
    expect(hits("qkv").join()).toMatch(/Scaled dot-product attention/);
    expect(hits("layer norm").join()).toMatch(/encoder block/);
    expect(hits("mcnemar").join()).toMatch(/Evaluating honestly/);
    expect(hits("wordpiece").join()).toMatch(/Tokens and embeddings/);
    expect(hits("adamw").join()).toMatch(/AdamW/);
  });

  it("draws the architecture diagram as an accessible inline SVG", async () => {
    at("/cheatsheets/transformers");
    const svg = await screen.findByRole("img", { name: /Transformer encoder for classification/ }, { timeout: 5000 });
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.textContent).toMatch(/Multi-head self-attention/);
    expect(svg.textContent).toMatch(/Feed-forward/);
    expect(svg.textContent).toMatch(/\[CLS\]/);
    expect(svg.getAttribute("viewBox")).toBeTruthy();
  });

  it("the parameter calculator reproduces the project's three models", async () => {
    at("/cheatsheets/transformers");
    const total = async () => (await screen.findByTestId("param-total")).textContent;
    expect(await total()).toContain("4,386,178");
    const sel = screen.getByLabelText("Preset");
    fireEvent.change(sel, { target: { value: "small" } });
    expect(await total()).toContain("28,764,674");
    fireEvent.change(sel, { target: { value: "distil" } });
    expect(await total()).toContain("66,955,010");
    fireEvent.change(screen.getByLabelText("Layers L"), { target: { value: "12" } });
    expect((screen.getByLabelText("Preset") as HTMLSelectElement).value).toBe("custom");
  });

  it("latency, attention-cost and McNemar calculators compute", async () => {
    at("/cheatsheets/transformers");
    expect((await screen.findByTestId("lat-out")).textContent).toMatch(/39\.132 ms × 872 = 34\.1 s/);
    fireEvent.change(screen.getByLabelText("Sentences"), { target: { value: "1000" } });
    expect(screen.getByTestId("lat-out").textContent).toMatch(/39\.1 s/);
    expect(screen.getByTestId("attn-entries").textContent).toBe((12 * 64 * 64).toLocaleString("en"));
    fireEvent.change(screen.getByLabelText("Sequence length n"), { target: { value: "128" } });
    expect(screen.getByTestId("attn-entries").textContent).toBe((12 * 128 * 128).toLocaleString("en"));
    expect(screen.getByTestId("mcnemar-p").textContent).toContain("0.029");
    fireEvent.change(screen.getByLabelText("b: only A correct"), { target: { value: "104" } });
    fireEvent.change(screen.getByLabelText("c: only B correct"), { target: { value: "53" } });
    expect(screen.getByTestId("mcnemar-p").textContent).toMatch(/e-0?[4-9]|0\.000/);
  });

  it("the worked attention example shows the verified numbers", async () => {
    at("/cheatsheets/transformers");
    await screen.findByRole("heading", { level: 2, name: /Scaled dot-product attention/ });
    const text = document.getElementById("attention")!.textContent!;
    expect(text).toContain("0.752  1.000");
    expect(text).toContain("0.401  0.198  0.401");
  });

  it("NLP metrics section has the F1 calculator", async () => {
    at("/cheatsheets/nlp");
    expect((await screen.findByTestId("prf-out")).textContent).toMatch(/precision 80 %.*recall 66\.7 %.*F1 72\.7 %/);
  });

  it("the NLP decision table quotes the measured numbers", async () => {
    at("/cheatsheets/nlp");
    await screen.findByRole("heading", { level: 2, name: /Which approach to choose/ });
    const t = document.getElementById("choose")!.textContent!;
    for (const x of ["91.1", "88.8", "81.8", "82.9", "75.9", "61.8"]) expect(t).toContain(x);
  });
});

describe("NLP and Transformers cheatsheets: translations", () => {
  for (const lang of ["lt", "kn"]) {
    it(`[${lang}] shows translated section titles`, async () => {
      render(<I18nProvider initial={lang as "lt" | "kn"}><MemoryRouter initialEntries={["/cheatsheets/transformers"]}><App /></MemoryRouter></I18nProvider>);
      const h = await screen.findByRole("heading", { level: 1 }, { timeout: 5000 });
      expect(h.textContent).not.toBe("Transformers cheatsheet");
      const titles = Array.from(document.querySelectorAll("main h2")).map((e) => e.textContent);
      expect(titles).toHaveLength(TR_IDS.length);
      for (const s of getSheet("transformers")!.sections) {
        expect(titles).toContain(translate(lang as "lt" | "kn", `cs.transformers.${s.id}.title`));
        expect(translate(lang as "lt" | "kn", `cs.transformers.${s.id}.title`)).not.toBe(s.title);
      }
    });
  }
});
