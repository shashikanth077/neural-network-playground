import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuidedExperiments } from "../components/GuidedExperiments";
import { GUIDE_STEPS, HELP_STORAGE_KEY } from "../components/PlaygroundGuide";
import { SectionHelp } from "../components/SectionHelp";
import type { Playground as PlaygroundState } from "../hooks/usePlayground";
import { I18nProvider, NAMESPACES, type Lang } from "../i18n";
import { EXPERIMENTS } from "../lib/experiments";
import { ACTIVATION_OPTIONS, LOSS_OPTIONS, OPTIMIZER_OPTIONS, VALIDATION_OPTIONS } from "../lib/options";
import { DEFAULT_CONFIG, PRESETS } from "../lib/presets";
import { validateConfig } from "../lib/validation";
import { VALIDATION_MESSAGES, validationKey } from "../lib/validationText";
import { Playground } from "../pages/Playground";
import { TOPICS } from "../components/learning";

// The page talks to the backend; here nothing ever answers, so it renders its initial state.
vi.mock("../api/client", () => ({
  api: new Proxy({}, { get: (_t, k) => (k === "health" ? async () => ({ status: "ok", active_sessions: 0 }) : () => new Promise(() => undefined)) }),
  ApiError: class extends Error { status = 0; },
}));

const pg = NAMESPACES.playground;
const LANGS: Lang[] = ["en", "kn", "lt"];

beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(() => vi.restoreAllMocks());

/** Renders the page and lets its first (mocked) backend probe settle, so React does not warn about state updates. */
async function renderPage(lang: Lang = "en") {
  let r!: ReturnType<typeof render>;
  await act(async () => { r = render(<I18nProvider initial={lang}><Playground /></I18nProvider>); });
  return r;
}
const helpButtons = () => screen.queryAllByRole("button", { name: /^(About this section|About this choice)/ });

describe("catalogue coverage", () => {
  it("has every key that the source code asks for with a literal t(\"pg.…\") call or <SectionHelp id>", () => {
    const files = import.meta.glob(["../components/*.tsx", "../pages/Playground.tsx", "../lib/*.ts"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const missing: string[] = [];
    for (const [file, src] of Object.entries(files)) {
      for (const m of src.matchAll(/\bt\(\s*"(pg\.[\w.\-]+)"/g)) if (!(m[1] in pg.en)) missing.push(`${file}: ${m[1]}`);
      for (const m of src.matchAll(/<SectionHelp\s+id="([\w.]+)"/g)) for (const part of ["name", "what"]) if (!(`pg.help.${m[1]}.${part}` in pg.en)) missing.push(`${file}: pg.help.${m[1]}.${part}`);
    }
    expect(missing).toEqual([]);
  });

  it("has labels, notes and help panels for every dropdown option", () => {
    const need: string[] = [];
    for (const a of ACTIVATION_OPTIONS) need.push(`pg.opt.act.${a.value}.note`, `pg.help.act.${a.value}.what`, `pg.help.act.${a.value}.why`, `pg.help.act.${a.value}.mistake`);
    for (const o of OPTIMIZER_OPTIONS) need.push(`pg.opt.optim.${o.value}.note`, `pg.help.optim.${o.value}.what`, `pg.help.optim.${o.value}.why`);
    for (const l of LOSS_OPTIONS) need.push(`pg.opt.loss.${l.value}.label`, `pg.opt.loss.${l.value}.note`, `pg.help.loss.${l.value}.what`);
    for (const v of VALIDATION_OPTIONS) need.push(`pg.opt.val.${v.value}.label`, `pg.opt.val.${v.value}.note`, `pg.help.cv.${v.value}.what`, `pg.help.cv.${v.value}.why`);
    for (const i of ["xavier", "he", "small_normal", "zeros"]) need.push(`pg.opt.init.${i}.label`);
    expect(need.filter((k) => !(k in pg.en))).toEqual([]);
  });

  it("covers presets, Learning Center topics, validation errors, datasets and the diagnosis verdicts", () => {
    const need: string[] = [];
    for (const p of PRESETS) {
      need.push(`pg.preset.${p.id}.title`, `pg.preset.${p.id}.summary`);
      p.observe.forEach((_, i) => need.push(`pg.preset.${p.id}.obs.${i}`));
    }
    for (const t of TOPICS) {
      need.push(`pg.lc.${t.id}.title`, `pg.lc.${t.id}.plain`, `pg.lc.group.${t.group}`);
      t.formulas?.forEach((f, i) => f.vars.forEach((_, j) => need.push(`pg.lc.${t.id}.f${i}.v${j}`)));
    }
    for (const m of VALIDATION_MESSAGES) need.push(validationKey(m));
    for (const d of ["xor", "moons", "circles", "linear", "custom"]) need.push(`pg.ds.${d}.label`, `pg.ds.${d}.blurb`);
    for (const v of ["too-early", "no-validation", "overfitting", "underfitting", "good-fit"]) need.push(`pg.diag.${v}.title`, `pg.diag.${v}.reason`);
    for (const s of ["none", "ready", "running", "paused", "completed", "failed"]) need.push(`pg.status.${s}`);
    expect(need.filter((k) => !(k in pg.en))).toEqual([]);
  });

  it("keeps the English text of the existing Playground strings", () => {
    expect(pg.en["pg.title"]).toBe("Neural Network Playground");
    expect(pg.en["pg.err.retry"]).toBe("Retry");
    expect(pg.en["pg.status.paused"]).toBe("Paused");
    expect(pg.en["pg.ed.title"]).toBe("Network designer");
    expect(pg.en["pg.ev.title"]).toBe("Classification metrics");
  });
});

describe("SectionHelp", () => {
  const renderHelp = (lang: Lang = "en") => render(<I18nProvider initial={lang}><SectionHelp id="lr" formula={String.raw`\theta_{t+1}=\theta_t-\eta\,g_t`} /></I18nProvider>);

  it("is a closed disclosure button until clicked, then a labelled region with every part", () => {
    const { container } = renderHelp();
    const btn = screen.getByRole("button", { name: /About this section/ });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();

    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
    const region = screen.getByRole("region");
    expect(btn).toHaveAttribute("aria-controls", region.id);
    expect(region).toHaveAttribute("aria-labelledby", btn.id);
    for (const part of ["What it is", "Why it matters", "How to use it here", "Try this", "Common mistake", "Formula"]) expect(within(region).getByText(part)).toBeInTheDocument();
    expect(container.querySelector(".katex")).not.toBeNull();
    expect(within(region).getByText(/Lecture 4 · Learning rate/)).toBeInTheDocument();

    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("renders nothing when the page switches explanations off", async () => {
    localStorage.setItem(HELP_STORAGE_KEY, "off");
    await renderPage();
    expect(helpButtons()).toHaveLength(0);
  });
});

describe("Playground page", () => {
  it("shows explanations by default and the switch hides and shows every panel (and remembers it)", async () => {
    await renderPage();
    const sw = screen.getByRole("switch", { name: /Explanations/ });
    expect(sw).toHaveAttribute("aria-checked", "true");
    const before = helpButtons().length;
    expect(before).toBeGreaterThan(20);

    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(helpButtons()).toHaveLength(0);
    expect(localStorage.getItem(HELP_STORAGE_KEY)).toBe("off");
    expect(screen.queryByRole("list", { name: "How to use the Playground" })).not.toBeInTheDocument();

    fireEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(helpButtons().length).toBe(before);
    expect(localStorage.getItem(HELP_STORAGE_KEY)).toBe("on");
  });

  it("starts with explanations off when the visitor turned them off earlier", async () => {
    localStorage.setItem(HELP_STORAGE_KEY, "off");
    await renderPage();
    expect(screen.getByRole("switch", { name: /Explanations/ })).toHaveAttribute("aria-checked", "false");
  });

  it("has a six-step guide whose steps scroll to existing sections", async () => {
    await renderPage();
    const list = screen.getByRole("list", { name: "How to use the Playground" });
    const steps = within(list).getAllByRole("button");
    expect(steps).toHaveLength(6);
    expect(GUIDE_STEPS.map((s) => s.id)).toEqual(["data", "design", "train", "read", "eval", "validate"]);
    for (const [i, s] of GUIDE_STEPS.entries()) {
      expect(document.getElementById(s.target), s.target).not.toBeNull();
      fireEvent.click(steps[i]);
      expect(document.getElementById(s.target)!.scrollIntoView).toHaveBeenCalled();
    }
  });

  it("switches heading and help text with the language (Lithuanian, Kannada)", async () => {
    const lt = await renderPage("lt");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Neuroninio tinklo žaidimų aikštelė");
    expect(screen.getByRole("heading", { name: "Sprendimo riba" })).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Apie šį skyrių.*Duomenų rinkinys/ });
    fireEvent.click(btn);
    expect(within(screen.getByRole("region", { name: /Apie šį skyrių/ })).getByText(/Kiekvienas rinkinys – plokštumos taškų debesis/)).toBeInTheDocument();
    lt.unmount();

    await renderPage("kn");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್ ಪ್ಲೇಗ್ರೌಂಡ್");
    expect(screen.getByRole("heading", { name: "ನಿರ್ಧಾರ ಗಡಿ" })).toBeInTheDocument();
    expect(screen.queryByText("Decision boundary")).not.toBeInTheDocument();
  });
});

describe("guided experiments", () => {
  it("has all i18n keys in every language for each experiment and variant", () => {
    expect(EXPERIMENTS.length).toBeGreaterThanOrEqual(8);
    for (const e of EXPERIMENTS) {
      const keys = ["title", "lecture", "goal", "setup", "watch", "expect"].map((p) => `pg.exp.${e.id}.${p}`);
      for (const v of e.variants) keys.push(`pg.exp.${e.id}.v.${v.id}`);
      for (const l of LANGS) for (const k of keys) expect(pg[l][k]?.trim(), `${l}:${k}`).toBeTruthy();
    }
  });

  it("every set-up is a valid configuration that the backend accepts", () => {
    for (const e of EXPERIMENTS) {
      for (const v of e.variants) {
        const ds = v.dataset ?? e.dataset;
        const cfg = { ...DEFAULT_CONFIG, ...e.config, ...v.config };
        expect(validateConfig(cfg, ds.n_samples), `${e.id}/${v.id}`).toEqual({});
      }
    }
  });

  it("Apply hands the dataset and configuration of the chosen variant to the playground", () => {
    const applyPreset = vi.fn(async () => undefined);
    render(<I18nProvider initial="en"><GuidedExperiments pg={{ applyPreset } as unknown as PlaygroundState} /></I18nProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Apply: Too simple" }));
    expect(applyPreset).toHaveBeenCalledTimes(1);
    const preset = (applyPreset.mock.calls[0] as unknown[])[0] as { dataset: { name: string }; config: { hidden_layers: number[] } };
    expect(preset.dataset.name).toBe("circles");
    expect(preset.config.hidden_layers).toEqual([1]);
    expect(screen.getByRole("status")).toHaveTextContent("Setup applied");

    fireEvent.click(screen.getByRole("button", { name: /Learning rate: too small/ }));
    fireEvent.click(screen.getByRole("button", { name: "Apply: Too big (10)" }));
    const lr = (applyPreset.mock.calls[1] as unknown[])[0] as { config: { learning_rate: number; optimizer: string } };
    expect(lr.config.learning_rate).toBe(10);
    expect(lr.config.optimizer).toBe("adam");
  });
});
