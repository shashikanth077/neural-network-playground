import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AREAS } from "../concepts/areas";
import { CONCEPTS, coverageOf, getConcept } from "../concepts/registry";
import { I18nProvider, NAMESPACES, translate } from "../i18n";
import { getLab, LABS } from "../labs/registry";
import { PATHS } from "../home/paths";
import { Home } from "../pages/Home";
import { SHEETS } from "../cheatsheets/registry";
import { TOOLS } from "../lib/features";

const renderHome = (lang: "en" | "kn" | "lt" = "en") =>
  render(
    <I18nProvider initial={lang}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/concepts/:id" element={<p>concept page</p>} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );

function mockMedia(matchesFor: (q: string) => boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: matchesFor(q), media: q, addEventListener: () => undefined, removeEventListener: () => undefined,
    addListener: () => undefined, removeListener: () => undefined, onchange: null, dispatchEvent: () => false,
  }));
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("home paths", () => {
  it("every path id exists in the concept registry, with no repeats", () => {
    expect(PATHS.length).toBeGreaterThanOrEqual(3);
    for (const p of PATHS) {
      expect(p.concepts.length).toBeGreaterThan(2);
      expect(new Set(p.concepts).size).toBe(p.concepts.length);
      for (const id of p.concepts) expect(getConcept(id), `${p.id}:${id}`).toBeDefined();
    }
  });
  it("each path has a title and blurb in every language", () => {
    for (const p of PATHS) for (const l of ["en", "kn", "lt"] as const) for (const part of ["title", "blurb"]) {
      expect(NAMESPACES.home[l][`homev2.path.${p.id}.${part}`], `${l}:${p.id}.${part}`).toBeTruthy();
    }
  });
});

describe("home page", () => {
  it("has one h1 and ordered headings, with real landmarks", () => {
    renderHome();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    const levels = screen.getAllByRole("heading").map((h) => Number(h.tagName[1]));
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  });

  it("the hero map renders every concept as a link to its page", () => {
    renderHome();
    const map = screen.getByTestId("concept-map");
    expect(map).toHaveAttribute("data-layout", "map");
    for (const c of CONCEPTS) {
      const a = map.querySelector(`a[data-concept="${c.id}"]`);
      expect(a, c.id).not.toBeNull();
      expect(a).toHaveAttribute("href", `/concepts/${c.id}`);
      expect(a!.getAttribute("aria-label")).toContain(c.title);
      expect(a).toHaveAttribute("data-coverage", coverageOf(c));
    }
    expect(map.querySelectorAll("a[data-concept]")).toHaveLength(CONCEPTS.length);
    expect(map.querySelectorAll("[data-edge]")).toHaveLength(CONCEPTS.reduce((n, c) => n + c.needs.length, 0));
  });

  it("shows the title and coverage on hover and on keyboard focus", () => {
    renderHome();
    const a = screen.getByTestId("concept-map").querySelector('a[data-concept="backprop"]')!;
    expect(screen.queryByTestId("map-tooltip")).toBeNull();
    fireEvent.mouseEnter(a);
    expect(within(screen.getByTestId("map-tooltip")).getByText("Backpropagation")).toBeInTheDocument();
    expect(screen.getByTestId("map-tooltip")).toHaveTextContent(/Live example/);
    fireEvent.mouseLeave(a);
    expect(screen.queryByTestId("map-tooltip")).toBeNull();
    fireEvent.focus(a);
    expect(screen.getByTestId("map-tooltip")).toHaveTextContent("Backpropagation");
    fireEvent.blur(a);
    expect(screen.queryByTestId("map-tooltip")).toBeNull();
  });

  it("planned concepts are marked planned", () => {
    renderHome();
    const planned = CONCEPTS.filter((c) => coverageOf(c) === "planned");
    expect(planned.length).toBeGreaterThan(0);
    for (const c of planned) expect(screen.getByTestId("concept-map").querySelector(`a[data-concept="${c.id}"]`)).toHaveAttribute("data-coverage", "planned");
  });

  it("clicking a node navigates to the concept page", () => {
    renderHome();
    fireEvent.click(screen.getByTestId("concept-map").querySelector('a[data-concept="dropout"]')!);
    expect(screen.getByText("concept page")).toBeInTheDocument();
  });

  it("area legend buttons toggle a highlight", () => {
    renderHome();
    const btn = screen.getByRole("button", { name: AREAS[0].title });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("animates by default and not when the user prefers reduced motion", () => {
    const { unmount } = renderHome();
    expect(screen.getByTestId("concept-map")).toHaveAttribute("data-motion", "on");
    expect(document.querySelectorAll(".cm-halo").length).toBeGreaterThan(0);
    unmount();
    // reduced motion on, and wide enough for the map
    mockMedia((q) => q.includes("prefers-reduced-motion") || q.includes("min-width"));
    renderHome();
    expect(screen.getByTestId("concept-map")).toHaveAttribute("data-motion", "off");
    expect(document.querySelectorAll(".cm-halo")).toHaveLength(0);
  });

  it("uses a grouped list instead of the map on narrow screens, with the same links", () => {
    mockMedia(() => false);
    renderHome();
    const map = screen.getByTestId("concept-map");
    expect(map).toHaveAttribute("data-layout", "list");
    expect(map.querySelectorAll("a[data-concept]")).toHaveLength(CONCEPTS.length);
    expect(map.querySelector('a[data-concept="neuron"]')).toHaveAttribute("href", "/concepts/neuron");
    expect(map.querySelector("svg[role=group]")).toBeNull();
  });

  it("five layer cards show counts from the registries and link to their pages", () => {
    renderHome();
    expect(screen.getByTestId("layer-count-learn")).toHaveTextContent(String(CONCEPTS.length));
    expect(screen.getByTestId("layer-count-practise")).toHaveTextContent(String(LABS.filter((l) => l.status === "live").length));
    expect(screen.getByTestId("layer-count-build")).toHaveTextContent(String(TOOLS.length));
    expect(screen.getByTestId("layer-count-reference")).toHaveTextContent(String(SHEETS.filter((s) => s.status === "live").length));
    const section = screen.getByRole("region", { name: /five ways in/i });
    const hrefs = within(section).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/concepts", "/labs", "/tools", "/cheatsheets", "/runs"]);
    expect(within(section).getByText(/saved automatically/i)).toBeInTheDocument();
  });

  it("shows the curated learning paths as ordered chips", () => {
    renderHome();
    const paths = screen.getAllByTestId("learning-path");
    expect(paths).toHaveLength(PATHS.length);
    PATHS.forEach((p, i) => {
      const hrefs = within(paths[i]).getAllByRole("listitem").map((li) => li.querySelector("a")!.getAttribute("href"));
      expect(hrefs).toEqual(p.concepts.map((id) => `/concepts/${id}`));
    });
  });

  it("suggests where to start when there is no progress", () => {
    renderHome();
    expect(screen.getByTestId("start-here")).toBeInTheDocument();
    expect(screen.queryByTestId("continue-card")).toBeNull();
  });

  it("offers Continue with the last step once a lab has progress", () => {
    const lab = getLab("lab1")!;
    localStorage.setItem("ailab-progress-lab1", JSON.stringify({ done: [lab.steps[0].id, lab.steps[1].id], last: lab.steps[3].id }));
    renderHome();
    const card = screen.getByTestId("continue-card");
    expect(within(card).getByRole("link", { name: /Continue/ })).toHaveAttribute("href", `/labs/lab1/${lab.steps[3].id}`);
    expect(card).toHaveTextContent(lab.steps[3].title);
    expect(card).toHaveTextContent(`2 of ${lab.steps.length} steps done`);
    expect(screen.queryByTestId("start-here")).toBeNull();
  });

  it("ignores corrupt progress and unknown steps", () => {
    localStorage.setItem("ailab-progress-lab1", "{not json");
    localStorage.setItem("ailab-progress-lab2", JSON.stringify({ done: ["nope"], last: "nope" }));
    renderHome();
    expect(screen.getByTestId("start-here")).toBeInTheDocument();
  });

  it("survives storage that throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    renderHome();
    expect(screen.getByTestId("start-here")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("coverage numbers equal the registry and link to /coverage", () => {
    renderHome();
    for (const k of ["live", "reference", "planned"] as const) {
      expect(screen.getByTestId(`coverage-${k}`)).toHaveTextContent(String(CONCEPTS.filter((c) => coverageOf(c) === k).length));
    }
    const numbers = screen.getByTestId("coverage-numbers");
    for (const a of within(numbers).getAllByRole("link")) expect(a).toHaveAttribute("href", "/coverage");
    const section = screen.getByRole("region", { name: /covers today/i });
    for (const c of CONCEPTS.filter((x) => coverageOf(x) === "planned")) {
      expect(within(section).getByRole("link", { name: c.title })).toHaveAttribute("href", `/concepts/${c.id}`);
    }
  });

  it("still lists available labs, tools and planned labs", () => {
    renderHome();
    expect(screen.getByRole("link", { name: /From messy data/ })).toHaveAttribute("href", "/labs/lab1");
    expect(screen.getByRole("link", { name: /Neural Network Playground/ })).toHaveAttribute("href", "/playground");
    for (const l of LABS.filter((x) => x.status === "planned")) {
      expect(screen.getByRole("heading", { name: l.title })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: new RegExp(l.title) })).toBeNull();
    }
    for (const d of ["ml", "dl", "nlp"]) expect(document.querySelector(`a[href="/labs?domain=${d}"]`)).not.toBeNull();
  });
});

describe("home page translations", () => {
  for (const lang of ["lt", "kn"] as const) {
    it(`renders in ${lang} without raw keys or English-only new text`, () => {
      renderHome(lang);
      const text = document.body.textContent ?? "";
      expect(text).not.toMatch(/homev2\./);
      expect(text).not.toMatch(/\{[a-z]+\}/);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(translate(lang, "homev2.hero.title.a"));
      expect(screen.getByRole("heading", { level: 2, name: translate(lang, "homev2.paths.title") })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: translate(lang, "homev2.map.title") })).toBeInTheDocument();
      expect(screen.getByTestId("concept-map").querySelector('a[data-concept="neuron"]')).toHaveAttribute("href", "/concepts/neuron");
    });
  }
  it("every homev2 key is used with the homev2 prefix and differs from English in kn and lt", () => {
    const ns = NAMESPACES.home;
    for (const k of Object.keys(ns.en)) {
      expect(k.startsWith("homev2.")).toBe(true);
    }
    for (const l of ["kn", "lt"] as const) {
      const same = Object.keys(ns.en).filter((k) => ns[l][k] === ns.en[k]);
      expect(same, `${l} untranslated`).toEqual([]);
    }
  });
});
