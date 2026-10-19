import { describe, expect, it } from "vitest";
import { TOPICS } from "../components/learning";
import { getSheet } from "../cheatsheets/registry";
import { AREAS } from "../concepts/areas";
import { evidenceHref } from "../concepts/links";
import { CONCEPTS, coverageOf } from "../concepts/registry";
import { EXPERIMENTS } from "../lib/experiments";
import { getLab } from "../labs/registry";
import { TOOLS } from "../lib/features";

const SECTIONS = ["data", "design", "train", "boundary", "network", "eval", "charts", "cv", "experiments", "learn"];

describe("concept registry", () => {
  it("has unique ids, known areas and existing prerequisites", () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const areas = new Set(AREAS.map((a) => a.id));
    for (const c of CONCEPTS) {
      expect(areas.has(c.area), c.id).toBe(true);
      for (const n of c.needs) expect(ids, `${c.id} needs ${n}`).toContain(n);
      expect(c.needs).not.toContain(c.id);
    }
  });

  it("has no prerequisite cycles", () => {
    const byId = new Map(CONCEPTS.map((c) => [c.id, c]));
    const state = new Map<string, number>();
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === 2) return;
      expect(state.get(id) === 1, `cycle: ${[...path, id].join(" > ")}`).toBe(false);
      state.set(id, 1);
      byId.get(id)!.needs.forEach((n) => visit(n, [...path, id]));
      state.set(id, 2);
    };
    CONCEPTS.forEach((c) => visit(c.id, []));
  });

  it("every evidence link points at something that exists", () => {
    for (const c of CONCEPTS) {
      for (const e of c.evidence) {
        const where = `${c.id}: ${JSON.stringify(e)}`;
        if (e.kind === "learn") expect(TOPICS.some((t) => t.id === e.topic), where).toBe(true);
        if (e.kind === "playground") expect(SECTIONS, where).toContain(e.section);
        if (e.kind === "experiment") expect(EXPERIMENTS.some((x) => x.id === e.id), where).toBe(true);
        if (e.kind === "tool") expect(TOOLS.some((t) => t.id === e.id), where).toBe(true);
        if (e.kind === "lab") {
          const lab = getLab(e.lab);
          expect(lab?.status, where).toBe("live");
          expect(lab!.steps.some((s) => s.id === e.step), where).toBe(true);
        }
        if (e.kind === "sheet") expect(getSheet(e.sheet)?.sections.some((s) => s.id === e.section), where).toBe(true);
        expect(evidenceHref(e)).toMatch(/^\//);
      }
    }
  });

  it("planned concepts say what the live example will be; covered ones say what to try", () => {
    for (const c of CONCEPTS) {
      if (coverageOf(c) === "planned") expect(c.plan, c.id).toBeTruthy();
      else expect(c.tryIt, c.id).not.toBe("Planned.");
    }
  });

  it("covers the core neural network topics with hands-on examples", () => {
    const need = ["neuron", "activation", "forward-pass", "loss", "gradient-descent", "backprop", "learning-rate", "optimizers",
      "over-underfitting", "l1-l2", "dropout", "batch-norm", "early-stopping", "validation-methods", "metrics", "convolution", "pooling", "recurrent-cells"];
    for (const id of need) expect(coverageOf(CONCEPTS.find((c) => c.id === id)!), id).toBe("live");
  });
});
