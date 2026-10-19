import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DOMAINS } from "../labs/domains";
import { TOOLS } from "../lib/features";
import { ToolsIndex } from "../pages/ToolsIndex";
import { NavBar } from "../components/NavBar";
import { getLab, LABS } from "../labs/registry";
import { readProgress } from "../labs/progress";
import { LabPage } from "../pages/LabPage";
import { LabsIndex } from "../pages/LabsIndex";

beforeEach(() => localStorage.clear());

describe("lab registry", () => {
  it("has unique lab ids and numbers", () => {
    expect(new Set(LABS.map((l) => l.id)).size).toBe(LABS.length);
    expect(new Set(LABS.map((l) => l.number)).size).toBe(LABS.length);
  });
  it("live labs have steps with unique ids; planned labs have none", () => {
    for (const lab of LABS) {
      if (lab.status === "live") {
        expect(lab.steps.length).toBeGreaterThan(0);
        expect(new Set(lab.steps.map((s) => s.id)).size).toBe(lab.steps.length);
        lab.steps.forEach((s) => expect(s.title && s.summary && s.group && s.minutes > 0).toBeTruthy());
      } else expect(lab.steps).toHaveLength(0);
    }
  });
  it("every lab and tool belongs to a known domain", () => {
    const ids = DOMAINS.map((d) => d.id);
    LABS.forEach((l) => expect(ids).toContain(l.domain));
    TOOLS.forEach((t) => expect(ids).toContain(t.domain));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("covers machine learning, deep learning and NLP", () => {
    expect(DOMAINS.map((d) => d.id)).toEqual(["ml", "dl", "nlp"]);
  });
  it("Lab 1 has the 13 guide sections", () => {
    expect(getLab("lab1")!.steps).toHaveLength(13);
  });
});

const app = (path: string) => (
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/labs" element={<LabsIndex />} />
      <Route path="/labs/:labId" element={<LabPage />} />
      <Route path="/labs/:labId/:stepId" element={<LabPage />} />
    </Routes>
  </MemoryRouter>
);

describe("LabsIndex", () => {
  it("lists Lab 1 as available and others as planned, and filters by status", async () => {
    render(app("/labs"));
    expect(screen.getByRole("link", { name: /From messy data/ })).toHaveAttribute("href", "/labs/lab1");
    expect(screen.getAllByText("Planned").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("radio", { name: "Available" }));
    expect(screen.queryByText("Convolutional networks")).not.toBeInTheDocument();
  });
  it("filters by domain from the URL and from the chips", async () => {
    render(app("/labs?domain=ml"));
    expect(screen.queryByRole("link", { name: /From messy data/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Convolutional and recurrent/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /DL/ }));
    expect(screen.getByRole("link", { name: /From messy data/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Convolutional and recurrent/ })).toBeInTheDocument();
    expect(screen.queryByText("Classical machine learning")).not.toBeInTheDocument();
  });
  it("shows an empty state with a way out when nothing matches", async () => {
    render(app("/labs?domain=nlp&status=live"));
    expect(screen.getByText(/No labs match/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByRole("link", { name: /From messy data/ })).toBeInTheDocument();
  });
});

describe("ToolsIndex", () => {
  it("groups tools by domain and shows empty domains honestly", () => {
    render(<MemoryRouter><ToolsIndex /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /Neural Network Playground/ })).toHaveAttribute("href", "/playground");
    expect(screen.getAllByText(/No tools in this domain yet/).length).toBe(2);
  });
});

describe("LabPage", () => {
  it("redirects /labs/lab1 to the first step", async () => {
    render(app("/labs/lab1"));
    expect(await screen.findByRole("heading", { level: 1, name: "The big picture" })).toBeInTheDocument();
  });
  it("redirects an unknown lab to the index", async () => {
    render(app("/labs/nope"));
    expect(await screen.findByRole("heading", { name: "Guided labs" })).toBeInTheDocument();
  });
  it("Continue marks the step complete, saves progress and moves on", async () => {
    render(app("/labs/lab1/big-picture"));
    await screen.findByRole("heading", { level: 1, name: "The big picture" });
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(await screen.findByRole("heading", { level: 1, name: /How it works in the real world/ })).toBeInTheDocument();
    expect(readProgress("lab1", getLab("lab1")!.steps.map((s) => s.id)).done).toBe(1);
  });
  it("the stepper shows completed steps and the current step", async () => {
    localStorage.setItem("ailab-progress-lab1", JSON.stringify({ done: ["big-picture"] }));
    render(app("/labs/lab1/real-world"));
    await screen.findByRole("heading", { level: 1, name: /real world/ });
    const nav = screen.getAllByRole("navigation", { name: /steps/ })[0];
    expect(within(nav).getByRole("link", { name: /The big picture/ })).toHaveTextContent("✓");
    expect(within(nav).getByRole("link", { name: /How it works/ })).toHaveAttribute("aria-current", "step");
  });
  it("renders a calculation-heavy step with its real numbers (anomalies)", async () => {
    render(app("/labs/lab1/anomalies"));
    expect(await screen.findByText(/z of the suspicious value/, {}, { timeout: 5000 })).toHaveTextContent("5.22");
    await userEvent.click(screen.getByRole("radio", { name: "Quartile" }));
    expect(await screen.findByText(/allowed range/, {}, { timeout: 5000 })).toHaveTextContent("4.625");
  });
  it("trains the small network in the browser and reports Name 5", async () => {
    render(app("/labs/lab1/train"));
    await screen.findByRole("button", { name: "Train" }, { timeout: 5000 });
    await userEvent.click(screen.getByRole("button", { name: "Train" }));
    await waitFor(() => expect(screen.getByText(/final loss/)).toBeInTheDocument());
    expect(screen.getByText(/Name 5 output/)).toHaveTextContent(/female \(0\)/);
  });
});

describe("NavBar menus", () => {
  it("Labs menu is grouped by domain, opens and closes on Escape", async () => {
    render(<MemoryRouter><NavBar /></MemoryRouter>);
    const btn = screen.getByRole("button", { name: /Labs/ });
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    const menu = document.getElementById("labs-menu")!;
    // the Machine Learning domain has no labs or tools yet, and the menu hides empty domains
    expect(within(menu).queryByText(/Machine Learning/)).not.toBeInTheDocument();
    expect(within(menu).getByText(/Deep Learning/)).toBeInTheDocument();
    expect(within(menu).getByText(/Natural Language Processing/)).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: /From messy data/ })).toHaveAttribute("href", "/labs/lab1");
    await userEvent.keyboard("{Escape}");
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });
  it("Tools menu lists the Playground", async () => {
    render(<MemoryRouter><NavBar /></MemoryRouter>);
    await userEvent.click(screen.getByRole("button", { name: /Tools/ }));
    const menu = document.getElementById("tools-menu")!;
    expect(within(menu).getByRole("link", { name: /Neural Network Playground/ })).toHaveAttribute("href", "/playground");
    expect(within(menu).getByRole("link", { name: /Browse all tools/ })).toHaveAttribute("href", "/tools");
  });
});
