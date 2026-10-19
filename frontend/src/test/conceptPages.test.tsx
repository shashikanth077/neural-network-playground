import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../App";
import { CONCEPTS, coverageOf } from "../concepts/registry";
import { I18nProvider } from "../i18n";

const at = (path: string, lang?: "en" | "kn" | "lt") => render(<I18nProvider initial={lang}><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></I18nProvider>);

describe("concept pages", () => {
  it("hub lists every concept, filters by coverage and searches", async () => {
    at("/concepts");
    expect(await screen.findByRole("heading", { level: 1, name: /AI concepts/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(`${CONCEPTS.length} of ${CONCEPTS.length}`);
    fireEvent.click(screen.getByRole("radio", { name: "Planned" }));
    const planned = CONCEPTS.filter((c) => coverageOf(c) === "planned").length;
    expect(screen.getByRole("status")).toHaveTextContent(`${planned} of ${CONCEPTS.length}`);
    fireEvent.click(screen.getAllByRole("radio", { name: "All" })[2]);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "dropout" } });
    expect(screen.getByRole("link", { name: /Dropout/ })).toHaveAttribute("href", "/concepts/dropout");
  });

  it("a concept page shows what/why/try and links to hands-on examples that exist", async () => {
    at("/concepts/dropout");
    expect(await screen.findByRole("heading", { level: 1, name: "Dropout" })).toBeInTheDocument();
    expect(screen.getByText("What it is")).toBeInTheDocument();
    const where = screen.getByRole("heading", { name: "Where to practise it" }).closest("section")!;
    const links = within(where).getAllByRole("link");
    expect(links.some((a) => a.getAttribute("href") === "/playground#section-experiments")).toBe(true);
    expect(links.some((a) => (a.getAttribute("href") ?? "").startsWith("/playground?topic=dropout"))).toBe(true);
  });

  it("a planned concept shows the planned live example instead of practice links", async () => {
    at("/concepts/attention");
    expect(await screen.findByRole("heading", { level: 1, name: /Attention/ })).toBeInTheDocument();
    expect(screen.getByText("Planned live example")).toBeInTheDocument();
    expect(screen.queryByText("Where to practise it")).toBeNull();
  });

  it("prerequisites and 'leads to' link across concepts", async () => {
    at("/concepts/backprop");
    const needs = (await screen.findByRole("heading", { name: "Understand these first" })).closest("section")!;
    expect(within(needs).getByRole("link", { name: "Gradient descent" })).toBeInTheDocument();
  });

  it("coverage page summarises the registry and lists the planned concepts", async () => {
    at("/coverage");
    const total = CONCEPTS.length;
    const live = CONCEPTS.filter((c) => coverageOf(c) === "live").length;
    expect(await screen.findByTestId("coverage-summary")).toHaveTextContent(`${live} with a live example`);
    expect(screen.getByTestId("coverage-summary")).toHaveTextContent(`out of ${total}`);
    expect(screen.getByRole("heading", { name: /Planned concepts/ })).toBeInTheDocument();
  });

  it("works in Lithuanian and Kannada and falls back to English for concept text", async () => {
    at("/concepts", "lt");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("DI sąvokos");
    expect(screen.getByRole("link", { name: /Dropout/ })).toBeInTheDocument();
  });

  it("the Concepts link is in the navigation", async () => {
    at("/");
    expect(await screen.findByRole("link", { name: "Concepts" })).toHaveAttribute("href", "/concepts");
  });
});
