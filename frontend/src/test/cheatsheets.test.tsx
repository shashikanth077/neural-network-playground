import { fireEvent, render, screen, within } from "@testing-library/react";
import { TOOLS } from "../lib/features";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "../App";
import { SHEETS, getSheet } from "../cheatsheets/registry";

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe("cheatsheet registry", () => {
  it("has unique ids and section ids", () => {
    expect(new Set(SHEETS.map((s) => s.id)).size).toBe(SHEETS.length);
    for (const s of SHEETS) expect(new Set(s.sections.map((x) => x.id)).size).toBe(s.sections.length);
  });
  it("lists the neural network sheet as live with sections, others as planned", () => {
    const nn = getSheet("neural-network")!;
    expect(nn.status).toBe("live");
    expect(nn.sections.length).toBeGreaterThanOrEqual(10);
    expect(getSheet("machine-learning")!.status).toBe("planned");
  });
});

describe("cheatsheet pages", () => {
  it("index shows live and planned sheets", () => {
    at("/cheatsheets");
    expect(screen.getByRole("heading", { name: "Cheatsheets" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Neural Network/ })).toHaveAttribute("href", "/cheatsheets/neural-network");
    expect(screen.getAllByText("Planned").length).toBeGreaterThanOrEqual(2);
  });

  it("renders every section of the neural network sheet", async () => {
    at("/cheatsheets/neural-network");
    const nn = getSheet("neural-network")!;
    for (const s of nn.sections) {
      expect(await screen.findByRole("heading", { level: 2, name: s.title })).toBeInTheDocument();
    }
  });

  it("search filters sections by title and keywords", async () => {
    at("/cheatsheets/neural-network");
    const box = await screen.findByRole("searchbox", { name: /search this cheatsheet/i });
    const total = getSheet("neural-network")!.sections.length;
    fireEvent.change(box, { target: { value: "lstm" } });
    const nav = screen.getByRole("navigation", { name: "Sections" });
    const n = within(nav).getAllByRole("link").length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(total);
    fireEvent.change(box, { target: { value: "zzzzqqq" } });
    expect(screen.getByText(/No section matches/)).toBeInTheDocument();
  });

  it("unknown and planned sheets show a friendly message", async () => {
    at("/cheatsheets/nlp");
    expect(await screen.findByText(/planned and not written yet/)).toBeInTheDocument();
  });
});

describe("cheatsheets menu", () => {
  it("opens from the nav bar", () => {
    at("/");
    fireEvent.click(screen.getByRole("button", { name: /Cheatsheets/ }));
    const menu = document.getElementById("sheets-menu")!;
    expect(within(menu).getByText("Neural Network cheatsheet", { exact: false })).toBeInTheDocument();
    expect(within(menu).getByText(/Browse all cheatsheets/)).toBeInTheDocument();
  });
});

describe("explorer pages", () => {
  it("convolution explorer reproduces exercise A and the lecture parameter total", async () => {
    at("/tools/convolution");
    expect(await screen.findByRole("heading", { name: "Convolution Explorer" })).toBeInTheDocument();
    expect(screen.getByTestId("size-line")).toHaveTextContent("= 4×4");
    expect(screen.getByTestId("cnn-total")).toHaveTextContent("333,526");
    fireEvent.change(screen.getByLabelText("Padding"), { target: { value: "same" } });
    expect(screen.getByTestId("size-line")).toHaveTextContent("= 6×6");
    fireEvent.change(screen.getByLabelText("Stride"), { target: { value: "2" } });
    expect(screen.getByTestId("size-line")).toHaveTextContent("= 3×3");
  });

  it("recurrent explorer switches cell type and updates parameter counts", async () => {
    at("/tools/recurrent");
    expect(await screen.findByRole("heading", { name: "Recurrent Cell Explorer" })).toBeInTheDocument();
    // LSTM, 1 input, 3 units: 4*(3*(1+3)+3) = 60
    expect(screen.getByTestId("param-count")).toHaveTextContent("60");
    fireEvent.click(screen.getByRole("tab", { name: "SimpleRNN" }));
    expect(screen.getByTestId("param-count")).toHaveTextContent("15");
    fireEvent.click(screen.getByRole("tab", { name: "GRU" }));
    expect(screen.getByTestId("param-count")).toHaveTextContent("54");
    expect(screen.getAllByLabelText(/Input at step/)).toHaveLength(5);
  });

  it("new tools are in the Tools registry under Deep Learning", () => {
    const ids = ["convolution", "recurrent"];
    for (const id of ids) expect(TOOLS.find((t) => t.id === id)?.domain).toBe("dl");
  });
});
