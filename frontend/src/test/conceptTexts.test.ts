import { describe, expect, it } from "vitest";
import { AREAS } from "../concepts/areas";
import { CONCEPTS } from "../concepts/registry";
import { NAMESPACES, type Lang } from "../i18n";

const m = NAMESPACES.concepts;
const LANGS: Lang[] = ["en", "kn", "lt"];
const TRANSLATED: Lang[] = ["kn", "lt"];

describe("concept catalogue texts", () => {
  it("every concept has title, summary, why and try (and plan when planned) in en/kn/lt", () => {
    for (const c of CONCEPTS) {
      const keys = ["title", "summary", "why", "try", ...(c.plan ? ["plan"] : [])].map((k) => `concept.${c.id}.${k}`);
      for (const l of LANGS) for (const k of keys) expect(m[l][k], `${l} ${k}`).toBeTruthy();
      if (!c.plan) for (const l of LANGS) expect(m[l][`concept.${c.id}.plan`]).toBeUndefined();
    }
  });

  it("every area has a title and blurb in en/kn/lt", () => {
    for (const a of AREAS) for (const l of LANGS) for (const k of ["title", "blurb"]) expect(m[l][`area.${a.id}.${k}`], `${l} ${a.id} ${k}`).toBeTruthy();
  });

  it("the English dictionary equals the registry, so the two cannot drift", () => {
    for (const c of CONCEPTS) {
      expect(m.en[`concept.${c.id}.title`]).toBe(c.title);
      expect(m.en[`concept.${c.id}.summary`]).toBe(c.summary);
      expect(m.en[`concept.${c.id}.why`]).toBe(c.why);
      expect(m.en[`concept.${c.id}.try`]).toBe(c.tryIt);
      if (c.plan) expect(m.en[`concept.${c.id}.plan`]).toBe(c.plan);
    }
    for (const a of AREAS) {
      expect(m.en[`area.${a.id}.title`]).toBe(a.title);
      expect(m.en[`area.${a.id}.blurb`]).toBe(a.blurb);
    }
  });

  it("Kannada and Lithuanian titles, summaries and area names differ from English", () => {
    const same: string[] = [];
    for (const c of CONCEPTS) for (const l of TRANSLATED) for (const k of ["title", "summary"]) {
      const key = `concept.${c.id}.${k}`;
      if (m[l][key] === m.en[key]) same.push(`${l} ${key}`);
    }
    for (const a of AREAS) for (const l of TRANSLATED) if (m[l][`area.${a.id}.title`] === m.en[`area.${a.id}.title`]) same.push(`${l} area.${a.id}`);
    // "Dropout" is a product term kept as is in Lithuanian.
    expect(same.filter((x) => x !== "lt concept.dropout.title")).toEqual([]);
  });

  it("placeholders and formulas survive translation", () => {
    const ph = (s: string) => (s.match(/\{[a-z0-9]+\}/gi) ?? []).sort().join();
    for (const k of Object.keys(m.en)) for (const l of TRANSLATED) expect(ph(m[l][k]), `${l} ${k}`).toBe(ph(m.en[k]));
    for (const l of TRANSLATED) expect(m[l]["concept.padding-stride.why"]).toContain("floor((W − F + 2P) / S) + 1");
  });

  it("the English-fallback notice is gone", () => {
    for (const l of LANGS) expect(m[l]["cc.partial"]).toBeUndefined();
  });
});
