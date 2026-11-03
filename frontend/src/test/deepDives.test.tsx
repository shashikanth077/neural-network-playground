import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../App";
import { CONCEPTS } from "../concepts/registry";
import { deepIds, loadDeep } from "../concepts/deep";
import type { DeepDive, T3 } from "../concepts/deep/types";
import { I18nProvider } from "../i18n";

const kannada = /[ಀ-೿]/;
const foreign = /[Ѐ-ӿ֐-׿؀-ۿ぀-ヿ一-鿿]/;
const ph = (s: string) => (s.match(/\{[a-z]+\}/gi) ?? []).sort().join(",");

/** Every T3 inside a deep dive, with a path for error messages. */
function triples(d: DeepDive): [string, T3][] {
  const out: [string, T3][] = [];
  const add = (p: string, t?: T3) => { if (t) out.push([p, t]); };
  add("story.title", d.story.title); d.story.body.forEach((b, i) => add(`story.body${i}`, b)); add("analogy", d.analogy);
  if (d.worked) { add("worked.title", d.worked.title); add("worked.intro", d.worked.intro); add("worked.result", d.worked.result);
    d.worked.steps.forEach((s, i) => { add(`step${i}.title`, s.title); add(`step${i}.body`, s.body); }); }
  add("labTitle", d.labTitle); add("code.title", d.code?.title); add("sources", d.sources);
  d.uses.forEach((u, i) => { add(`use${i}.domain`, u.domain); add(`use${i}.example`, u.example); });
  d.mistakes.forEach((m, i) => add(`mistake${i}`, m));
  d.quiz.forEach((q, i) => { add(`q${i}`, q.q); add(`q${i}.why`, q.why); q.options.forEach((o, j) => add(`q${i}.o${j}`, o)); });
  return out;
}

describe("deep dives", () => {
  const ids = deepIds();
  it("exist and each belongs to a concept", () => {
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(CONCEPTS.some((c) => c.id === id), id).toBe(true);
  });
  for (const id of deepIds()) {
    describe(id, () => {
      it("is complete: story, ≥3 real-world uses, ≥2 mistakes, ≥3 questions with one correct option, verify() all true", async () => {
        const d = (await loadDeep(id))!;
        expect(d.id).toBe(id);
        expect(d.story.body.length).toBeGreaterThan(0);
        expect(d.uses.length).toBeGreaterThanOrEqual(3);
        expect(d.mistakes.length).toBeGreaterThanOrEqual(2);
        expect(d.quiz.length).toBeGreaterThanOrEqual(3);
        for (const q of d.quiz) {
          expect(q.correct).toBeGreaterThanOrEqual(0);
          expect(q.correct).toBeLessThan(q.options.length);
          if (q.verify) expect(q.verify(), JSON.stringify(q.q[0])).toBe(true);
        }
      });
      it("is translated: no empty text, Kannada in Kannada, Lithuanian distinct, matching placeholders, no foreign scripts", async () => {
        const d = (await loadDeep(id))!;
        for (const [p, [en, kn, lt]] of triples(d)) {
          for (const v of [en, kn, lt]) { expect(v.trim(), `${id}/${p}`).not.toBe(""); expect(foreign.test(v), `${id}/${p}`).toBe(false); }
          if (en.length > 30 && kn !== en) expect(kannada.test(kn), `${id}/${p} kn`).toBe(true);
          expect(kannada.test(lt), `${id}/${p} lt`).toBe(false);
          if (en.length > 30 && kn !== en) expect(lt, `${id}/${p}`).not.toBe(kn);
          expect(ph(kn), `${id}/${p} kn`).toBe(ph(en));
          expect(ph(lt), `${id}/${p} lt`).toBe(ph(en));
        }
      });
    });
  }
  it("the concept page shows the full lesson in English and Lithuanian", async () => {
    const id = deepIds()[0];
    const { unmount } = render(<I18nProvider initial="en"><MemoryRouter initialEntries={[`/concepts/${id}`]}><App /></MemoryRouter></I18nProvider>);
    expect(await screen.findByTestId("deep-dive", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Check yourself" })).toBeInTheDocument();
    unmount();
    render(<I18nProvider initial="lt"><MemoryRouter initialEntries={[`/concepts/${id}`]}><App /></MemoryRouter></I18nProvider>);
    expect(await screen.findByRole("heading", { name: "Pasitikrinkite" }, { timeout: 5000 })).toBeInTheDocument();
  });
});
