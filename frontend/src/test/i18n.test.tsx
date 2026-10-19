import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../App";
import { I18nProvider, LANGS, NAMESPACES, translate } from "../i18n";

beforeEach(() => localStorage.clear());

describe("message catalogues", () => {
  for (const [name, ns] of Object.entries(NAMESPACES)) {
    it(`${name}: kn and lt have exactly the keys of en, none empty`, () => {
      const en = Object.keys(ns.en).sort();
      expect(Object.keys(ns.kn).sort(), "kn keys").toEqual(en);
      expect(Object.keys(ns.lt).sort(), "lt keys").toEqual(en);
      for (const l of ["en", "kn", "lt"] as const) for (const [k, v] of Object.entries(ns[l])) expect(v.trim(), `${l}:${k}`).not.toBe("");
    });
    it(`${name}: placeholders match across languages`, () => {
      const ph = (s: string) => (s.match(/\{[a-z]+\}/gi) ?? []).sort().join(",");
      for (const k of Object.keys(ns.en)) {
        expect(ph(ns.kn[k]), `kn:${k}`).toBe(ph(ns.en[k]));
        expect(ph(ns.lt[k]), `lt:${k}`).toBe(ph(ns.en[k]));
      }
    });
  }
  it("keys are unique across namespaces", () => {
    const all = Object.values(NAMESPACES).flatMap((n) => Object.keys(n.en));
    expect(new Set(all).size).toBe(all.length);
  });
  it("lists English, Kannada and Lithuanian", () => {
    expect(LANGS.map((l) => l.id)).toEqual(["en", "kn", "lt"]);
  });
  it("translate falls back to the fallback text, then the key, and fills placeholders", () => {
    expect(translate("kn", "no.such.key", "Fallback")).toBe("Fallback");
    expect(translate("lt", "no.such.key")).toBe("no.such.key");
    expect(translate("lt", "nav.steps", undefined, { n: 3 })).toBe("Žingsnių: 3");
  });
});

describe("language switcher", () => {
  it("changes the page language, remembers it, and sets <html lang>", () => {
    render(<I18nProvider><MemoryRouter><App /></MemoryRouter></I18nProvider>);
    expect(screen.getByRole("button", { name: /Labs/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "lt" } });
    expect(screen.getByRole("button", { name: /Laboratorijos/ })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("lt");
    expect(localStorage.getItem("ailab.lang")).toBe("lt");
    fireEvent.change(screen.getByLabelText("Kalba"), { target: { value: "kn" } });
    expect(screen.getByRole("button", { name: /ಲ್ಯಾಬ್‌ಗಳು/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("ಚಲಾಯಿಸುವ");
  });
});
