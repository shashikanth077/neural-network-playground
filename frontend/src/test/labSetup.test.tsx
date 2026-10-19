import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider, NAMESPACES, translate, type Lang } from "../i18n";
import { copyText, labSteps, SETUP_STEP_ID } from "../labs/LabSetupPanel";
import { readProgress } from "../labs/progress";
import { getLab, LABS } from "../labs/registry";
import { LabPage } from "../pages/LabPage";

beforeEach(() => localStorage.clear());

const withSetup = LABS.filter((l) => l.status === "live" && l.setup);
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
const mockClipboard = () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  return writeText;
};

describe("setup data", () => {
  it("Labs 1 and 2 declare a setup guide", () => {
    expect(withSetup.map((l) => l.id)).toEqual(expect.arrayContaining(["lab1", "lab2"]));
  });

  it("the setup step is added first, the lab's own steps are untouched", () => {
    for (const lab of withSetup) {
      const steps = labSteps(lab);
      expect(steps[0].id).toBe(SETUP_STEP_ID);
      expect(steps).toHaveLength(lab.steps.length + 1);
      expect(steps.slice(1)).toEqual(lab.steps);
      expect(labSteps(lab)[0]).toBe(steps[0]); // stable identity between renders
    }
    expect(getLab("lab1")!.steps).toHaveLength(13);
    expect(getLab("lab2")!.steps).toHaveLength(13);
  });

  it("every setup has stages, each with commands or a check, and unique ids", () => {
    for (const lab of withSetup) {
      const s = lab.setup!;
      expect(s.stages.length).toBeGreaterThanOrEqual(3);
      expect(new Set(s.stages.map((x) => x.id)).size).toBe(s.stages.length);
      for (const st of s.stages) {
        expect(!!st.commands?.length || !!st.check, `${lab.id}/${st.id}`).toBe(true);
        for (const c of st.commands ?? []) {
          const cmds = typeof c.cmd === "string" ? [c.cmd] : Object.values(c.cmd);
          cmds.forEach((x) => expect(x.trim().length).toBeGreaterThan(0));
        }
      }
      expect(s.folders.length).toBeGreaterThan(0);
      expect(s.troubleshooting.length).toBeGreaterThan(0);
    }
  });

  it("every translation key the panel will ask for exists in all three languages", () => {
    const miss: string[] = [];
    const need = (lang: Lang, key: string) => { if (translate(lang, key, "\u0000") === "\u0000") miss.push(`${lang}:${key}`); };
    for (const lang of ["en", "kn", "lt"] as const) {
      for (const lab of withSetup) {
        const s = lab.setup!;
        const k = (x: string) => `setup.${lab.id}.${x}`;
        need(lang, `step.${lab.id}.setup.title`);
        need(lang, `step.${lab.id}.setup.summary`);
        need(lang, k("summary"));
        need(lang, k("db"));
        if (s.python) { need(lang, k("pynotes")); s.python.packages.forEach((p) => need(lang, k(`pkg.${p.name}`))); }
        if (s.node) need(lang, k("nodenote"));
        for (const st of s.stages) {
          need(lang, k(`s.${st.id}.title`));
          need(lang, k(`s.${st.id}.body`));
          if (st.check) need(lang, k(`s.${st.id}.check`));
          st.commands?.forEach((c) => need(lang, k(`s.${st.id}.c.${c.id}`)));
        }
        s.folders.forEach((f) => need(lang, k(`f.${f.id}`)));
        s.data?.forEach((d) => need(lang, k(`d.${d.id}.source`)));
        s.timeFor?.forEach((x) => need(lang, k(`t.${x.id}`)));
        s.troubleshooting.forEach((x) => { need(lang, k(`tr.${x.id}.p`)); need(lang, k(`tr.${x.id}.f`)); });
        (["python", "api", "ui", "db"] as const).forEach((n) => need(lang, k(`flow.${n}`)));
      }
    }
    expect(miss).toEqual([]);
  });

  it("the namespace is registered and keys are prefixed", () => {
    expect(NAMESPACES.labsetup).toBeDefined();
    for (const key of Object.keys(NAMESPACES.labsetup.en)) {
      expect(/^(setup\.|lab\.group\.Setup|step\.lab\d+\.setup\.)/.test(key), key).toBe(true);
    }
  });
});

describe("the setup step in the lab shell", () => {
  it.each(["lab1", "lab2"])("%s: /labs/%s/setup renders the guide as the first step in the stepper", async (id) => {
    render(app(`/labs/${id}/setup`));
    expect(await screen.findByRole("heading", { level: 1, name: "Setup & run" })).toBeInTheDocument();
    expect(screen.getByTestId("lab-setup")).toBeInTheDocument();
    const nav = screen.getAllByRole("navigation", { name: /steps/ })[0];
    const links = within(nav).getAllByRole("link");
    expect(links[0]).toHaveTextContent("Setup & run");
    expect(links[0]).toHaveAttribute("href", `/labs/${id}/setup`);
    expect(links[0]).toHaveAttribute("aria-current", "step");
    expect(links).toHaveLength(getLab(id)!.steps.length + 1);
    expect(nav.querySelector("p")).toHaveTextContent("Setup & run"); // the group heading comes first
    expect(screen.getByText(new RegExp(`Step 1 / ${getLab(id)!.steps.length + 1}`))).toBeInTheDocument();
  });

  it("the bare lab route still opens the first lesson", async () => {
    render(app("/labs/lab2"));
    expect(await screen.findByRole("heading", { level: 1, name: /The whole pipeline/ })).toBeInTheDocument();
  });

  it("Continue on the setup step goes to the first lesson and counts as progress", async () => {
    render(app("/labs/lab1/setup"));
    await screen.findByRole("heading", { level: 1, name: "Setup & run" });
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "The big picture" })).toBeInTheDocument();
    expect(readProgress("lab1", labSteps(getLab("lab1")!).map((s) => s.id)).done).toBe(1);
  });

  it("Lab 1 pipeline map and guide are not shown above the setup guide", async () => {
    render(app("/labs/lab1/setup"));
    await screen.findByRole("heading", { level: 1, name: "Setup & run" });
    expect(screen.queryByTestId("guide-intro")).toBeNull();
    expect(screen.queryByRole("navigation", { name: /pipeline/i })).toBeNull();
  });
});

describe("the setup panel", () => {
  it("shows the need chips with the right states", async () => {
    render(app("/labs/lab2/setup"));
    await screen.findByTestId("lab-setup");
    const chips = screen.getAllByRole("listitem").filter((li) => li.hasAttribute("data-state"));
    const by = (label: RegExp) => chips.find((c) => label.test(c.textContent ?? ""))!;
    expect(by(/Browser only/)).toHaveAttribute("data-state", "yes");
    expect(by(/Python/)).toHaveAttribute("data-state", "yes");
    expect(by(/Backend/)).toHaveAttribute("data-state", "no");
    expect(by(/Database/)).toHaveAttribute("data-state", "no");
  });

  it("Lab 1 marks Python and the backend as optional", async () => {
    render(app("/labs/lab1/setup"));
    await screen.findByTestId("lab-setup");
    const chips = screen.getAllByRole("listitem").filter((li) => li.hasAttribute("data-state"));
    expect(chips.find((c) => /Backend/.test(c.textContent ?? ""))).toHaveAttribute("data-state", "optional");
    expect(chips.find((c) => /Python/.test(c.textContent ?? ""))).toHaveAttribute("data-state", "optional");
  });

  it("the OS switch changes the commands and the tested note", async () => {
    render(app("/labs/lab2/setup"));
    await screen.findByTestId("lab-setup");
    const cmds = () => screen.getAllByTestId("setup-command").map((c) => c.textContent ?? "").join("\n");
    expect(screen.getByRole("radio", { name: "Linux" })).toHaveAttribute("aria-checked", "true");
    expect(cmds()).toContain("python3.12 -m venv .venv-lab2");
    expect(cmds()).toContain("source .venv-lab2/bin/activate");
    expect(cmds()).toContain("Run by the authors on Linux"); // pip install and python lab2.py were run
    await userEvent.click(screen.getByRole("radio", { name: "Windows" }));
    expect(screen.getByRole("radio", { name: "Windows" })).toHaveAttribute("aria-checked", "true");
    expect(cmds()).toContain("py -3.12 -m venv .venv-lab2");
    expect(cmds()).toContain(".venv-lab2\\Scripts\\activate");
    expect(cmds()).not.toContain("source .venv-lab2/bin/activate");
    expect(cmds()).toContain("Not run on Windows");
    expect(cmds()).not.toContain("Run by the authors on Windows");
    await userEvent.click(screen.getByRole("radio", { name: "macOS" }));
    expect(cmds()).toContain("source .venv-lab2/bin/activate");
    expect(localStorage.getItem("ailab-setup-os")).toBe("mac");
  });

  it("a command that is the same everywhere stays when the OS changes", async () => {
    render(app("/labs/lab2/setup"));
    await screen.findByTestId("lab-setup");
    await userEvent.click(screen.getByRole("radio", { name: "Windows" }));
    expect(screen.getAllByText("pip install tensorflow-cpu pandas matplotlib pillow")).toHaveLength(1);
  });

  it("the copy button puts exactly the shown command on the clipboard and says so", async () => {
    const user = userEvent.setup();
    const writeText = mockClipboard();
    render(app("/labs/lab2/setup"));
    await screen.findByTestId("lab-setup");
    const first = screen.getAllByTestId("setup-command")[0];
    const btn = within(first).getByRole("button", { name: /Copy/ });
    await user.click(btn);
    expect(writeText).toHaveBeenCalledWith("python3.12 --version");
    await waitFor(() => expect(btn).toHaveAttribute("data-copy-state", "copied"));
    expect(btn).toHaveTextContent("Copied");
    // the multi-line command is copied whole, for the chosen OS
    await user.click(screen.getByRole("radio", { name: "Windows" }));
    const photos = screen.getAllByTestId("setup-command").find((c) => /digit7/.test(c.textContent ?? ""))!;
    await user.click(within(photos).getByRole("button", { name: /Copy/ }));
    expect(writeText).toHaveBeenLastCalledWith("cd scripts\\lab2\nmkdir handwritten\ncopy C:\\path\\to\\your\\photos\\digit7.png handwritten\\");
  });

  it("copy reports failure when the clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) }, configurable: true });
    document.execCommand = vi.fn(() => false);
    expect(await copyText("x")).toBe(false);
  });

  it("every stage with a check shows it; stages are numbered in order", async () => {
    render(app("/labs/lab1/setup"));
    await screen.findByTestId("lab-setup");
    const stages = screen.getAllByTestId("setup-stage");
    expect(stages.map((s) => s.getAttribute("data-stage"))).toEqual(getLab("lab1")!.setup!.stages.map((s) => s.id));
    const withCheck = getLab("lab1")!.setup!.stages.filter((s) => s.check).length;
    expect(screen.getAllByTestId("setup-check")).toHaveLength(withCheck);
    stages.forEach((s, i) => expect(s.querySelector("span[aria-hidden]")).toHaveTextContent(String(i + 1)));
  });

  it("the diagram shows Python, API, React and Database with their states", async () => {
    render(app("/labs/lab2/setup"));
    const svg = await screen.findByTestId("setup-flow");
    const nodes = [...svg.querySelectorAll("[data-node]")].map((n) => [n.getAttribute("data-node"), n.getAttribute("data-state")]);
    expect(nodes).toEqual([["python", "used"], ["api", "unused"], ["ui", "used"], ["db", "unused"]]);
    expect(svg).toHaveAttribute("role", "img");
    expect(svg.querySelector("title")).toHaveTextContent("From Python to the browser");
    expect(svg.outerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i); // theme colours only
  });

  it("lists the dataset downloads with their sizes, and the folder map", async () => {
    render(app("/labs/lab2/setup"));
    await screen.findByTestId("lab-setup");
    expect(screen.getAllByTestId("setup-size").map((x) => x.textContent)).toEqual(["11.5 MB", "17.5 MB", "1.6 MB"]);
    expect(screen.getAllByText("scripts/lab2/lab2.py").length).toBeGreaterThan(0);
    expect(screen.getByText("mnist.npz")).toBeInTheDocument();
  });

  it("troubleshooting entries open to their fix", async () => {
    render(app("/labs/lab2/setup"));
    await screen.findByTestId("lab-setup");
    expect(screen.getAllByText(/Python 3\.13/).length).toBeGreaterThan(0);
    const d = document.querySelectorAll("details")[0];
    expect(d.querySelector("p")).toHaveTextContent(/Python 3\.12/);
  });
});

describe("the setup guide in Lithuanian and Kannada", () => {
  const cases: [Lang, string, string][] = [
    ["lt", "Paruošimas ir paleidimas", "Tik naršyklė"],
    ["kn", "ಸೆಟಪ್ ಮತ್ತು ಚಾಲನೆ", "ಬ್ರೌಸರ್ ಮಾತ್ರ"],
  ];
  for (const [lang, title, chip] of cases) {
    for (const lab of ["lab1", "lab2"]) {
      it(`${lab} · ${lang}`, async () => {
        render(app(`/labs/${lab}/setup`, lang));
        expect(await screen.findByRole("heading", { level: 1, name: title })).toBeInTheDocument();
        expect(screen.getByText(chip)).toBeInTheDocument();
        const text = document.body.textContent ?? "";
        expect(text).not.toMatch(/\bsetup\.[a-z0-9]+\.[a-z]/i);
        expect(text).not.toMatch(/\{(os|n|m|a|b)\}/);
        // commands are not translated
        expect(screen.getAllByTestId("setup-command")[0].textContent).toMatch(/node --version|python3\.12 --version/);
        // the group heading and the stepper entry are translated too
        const nav = screen.getAllByRole("navigation", { name: /./ }).find((n) => n.querySelector("ol"))!;
        expect(within(nav).getAllByRole("link")[0]).toHaveTextContent(title);
      });
    }
  }
  it("the OS note and copy label change language", async () => {
    render(app("/labs/lab2/setup", "lt"));
    await screen.findByTestId("lab-setup");
    expect(screen.getAllByTestId("setup-command").map((c) => c.textContent).join("\n")).toContain("Autorių išbandyta");
    expect(screen.getAllByRole("button", { name: /Kopijuoti/ }).length).toBeGreaterThan(0);
  });
});
