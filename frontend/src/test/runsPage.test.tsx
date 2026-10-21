import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NavBar } from "../components/NavBar";
import { TrainingMetrics } from "../components/TrainingMetrics";
import type { Playground as PlaygroundState } from "../hooks/usePlayground";
import { I18nProvider, type Lang } from "../i18n";
import { takePendingRestore } from "../lib/pendingRestore";
import { Playground } from "../pages/Playground";
import { RunsPage, settingChips } from "../pages/RunsPage";
import type { RunDetail, RunSummary } from "../types";

const baseConfig = {
  hidden_layers: [6], activation: "tanh", init: "xavier", optimizer: "adam", learning_rate: 0.03, batch_size: 32,
  loss: "bce", l1: 0, l2: 0, dropout: 0, batch_norm: false, early_stopping: false, patience: 10, restore_best: true,
  epochs: 200, val_split: 0.2, seed: 0, epoch_delay_ms: 15,
} as RunSummary["config"];

function makeRun(id: string, over: Partial<RunSummary> = {}): RunSummary {
  return {
    id, created_at: 1_760_000_000, finished_at: 1_760_000_020, kind: "playground", status: "completed",
    title: `Run ${id}`, notes: "", config: { ...baseConfig },
    dataset: { name: "moons", n_samples: 180, noise: 0.3, seed: 5, class_counts: [90, 90] },
    metrics: { final_train_loss: 0.1234, final_train_acc: 0.95, final_val_loss: 0.2345, final_val_acc: 0.9, epochs_run: 50, elapsed: 3.2, n_parameters: 25, best_epoch: 40, stopped_early: false },
    spark: [0.9, 0.6, 0.4, 0.2, 0.12],
    ...over,
  };
}
const A = makeRun("aaa", { title: "Adam baseline", notes: "first try" });
const B = makeRun("bbb", { title: "SGD with dropout", config: { ...baseConfig, optimizer: "sgd", dropout: 0.3, learning_rate: 0.5 } });
const CV = makeRun("ccc", {
  title: "CV kfold moons", kind: "cross-validation", spark: [], config: { ...baseConfig, cv_method: "kfold", cv_k: 5 },
  metrics: { method: "kfold", mean_val_loss: 0.31, std_val_loss: 0.02, mean_val_accuracy: 0.88, std_val_accuracy: 0.03, mean_val_f1: 0.87, n_folds: 5, elapsed: 4.1 },
});

const json = (body: unknown, status = 200) => Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

type Handler = (url: string, init?: RequestInit) => Promise<Response> | undefined;
let calls: { url: string; method: string; body?: string }[] = [];

/** Install a fetch mock: the handler answers what it knows, everything else never resolves (like a slow backend). */
function mockFetch(handler: Handler) {
  calls = [];
  vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace(/^\/api/, "");
    calls.push({ url, method: init?.method ?? "GET", body: typeof init?.body === "string" ? init.body : undefined });
    return handler(url, init) ?? new Promise<Response>(() => undefined);
  }));
}

function listHandler(items: RunSummary[]): Handler {
  return (url, init) => {
    if (url.startsWith("/runs?")) return json({ total: items.length, items });
    if (url === "/health") return json({ status: "ok", active_sessions: 0 });
    if ((init?.method ?? "GET") === "DELETE" && url.startsWith("/runs/")) return json(null, 204);
    return undefined;
  };
}

async function renderRuns(lang: Lang = "en", path = "/runs") {
  let r!: ReturnType<typeof render>;
  await act(async () => {
    r = render(
      <I18nProvider initial={lang}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/runs" element={<RunsPage />} />
            <Route path="/playground" element={<Playground />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );
  });
  return r;
}

beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  takePendingRestore();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("My runs: list", () => {
  it("shows each saved run with date, dataset, settings chips, metrics and a sparkline", async () => {
    mockFetch(listHandler([A, B, CV]));
    await renderRuns();
    const cards = await screen.findAllByTestId("run-card");
    expect(cards).toHaveLength(3);
    const first = within(cards[0]);
    expect(first.getByRole("heading", { name: "Adam baseline" })).toBeInTheDocument();
    expect(first.getByText(/moons · 180 points · noise 0.3 · seed 5/)).toBeInTheDocument();
    for (const chip of ["adam", "tanh", "lr 0.03", "[6]"]) expect(first.getByText(chip)).toBeInTheDocument();
    expect(first.getByText("0.1234")).toBeInTheDocument();
    expect(first.getByText("90.0%")).toBeInTheDocument();
    expect(first.getByRole("img", { name: "Training loss curve" })).toBeInTheDocument();
    expect(first.getByText("first try")).toBeInTheDocument();
    expect(within(cards[1]).getByText("dropout 0.3")).toBeInTheDocument();
    // cross-validation card shows fold results instead
    expect(within(cards[2]).getByText(/kfold, 5 folds/)).toBeInTheDocument();
    expect(within(cards[2]).getByText(/0.3100 ± 0.0200/)).toBeInTheDocument();
    expect(screen.getByText("Showing 3 of 3 runs")).toBeInTheDocument();
  });

  it("sends the search text and the type filter to the API", async () => {
    mockFetch(listHandler([A]));
    await renderRuns();
    await screen.findByText("Adam baseline");
    fireEvent.change(screen.getByLabelText("Search runs"), { target: { value: "adam" } });
    await waitFor(() => expect(calls.some((c) => c.url.includes("q=adam"))).toBe(true));
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "cross-validation" } });
    await waitFor(() => expect(calls.some((c) => c.url.includes("kind=cross-validation") && c.url.includes("q=adam"))).toBe(true));
  });

  it("chips only mention settings that are switched on", () => {
    const chips = settingChips(makeRun("x", { config: { ...baseConfig, dropout: 0.2, l2: 0.01, batch_norm: true, early_stopping: true, loss: "mse" } }));
    expect(chips).toEqual(expect.arrayContaining(["dropout 0.2", "L2 0.01", "batch-norm", "early-stopping", "mse"]));
    expect(settingChips(makeRun("y"))).not.toContain("L1 0");
  });

  it("renders in Kannada and Lithuanian", async () => {
    mockFetch(listHandler([A]));
    const { unmount } = await renderRuns("lt");
    expect(await screen.findByRole("heading", { level: 1, name: "Mano bandymai" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atidaryti Žaidimų aikštelėje" })).toBeInTheDocument();
    unmount();
    mockFetch(listHandler([A]));
    await renderRuns("kn");
    expect(await screen.findByRole("heading", { level: 1, name: "ನನ್ನ ಪ್ರಯೋಗಗಳು" })).toBeInTheDocument();
  });
});

describe("My runs: empty and failure states", () => {
  it("explains how runs get saved when there are none", async () => {
    mockFetch(listHandler([]));
    await renderRuns();
    const empty = await screen.findByTestId("runs-empty");
    expect(within(empty).getByText("No saved runs yet")).toBeInTheDocument();
    expect(within(empty).getByText(/saved here when it finishes/)).toBeInTheDocument();
    expect(within(empty).getByRole("link", { name: "Open the Playground" })).toHaveAttribute("href", "/playground");
  });

  it("says so when no run matches the search", async () => {
    mockFetch(listHandler([]));
    await renderRuns();
    await screen.findByTestId("runs-empty");
    fireEvent.change(screen.getByLabelText("Search runs"), { target: { value: "zzz" } });
    expect(await screen.findByTestId("runs-nomatch")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search and filter" }));
    expect(await screen.findByTestId("runs-empty")).toBeInTheDocument();
  });

  it("shows a clear message when the backend is down, and retries", async () => {
    let up = false;
    mockFetch((url) => {
      if (!url.startsWith("/runs?")) return undefined;
      return up ? json({ total: 1, items: [A] }) : Promise.reject(new TypeError("Failed to fetch"));
    });
    await renderRuns();
    const alert = await screen.findByTestId("runs-problem");
    expect(within(alert).getByText("Cannot reach the backend")).toBeInTheDocument();
    up = true;
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Adam baseline")).toBeInTheDocument();
    expect(screen.queryByTestId("runs-problem")).not.toBeInTheDocument();
  });

  it("shows a clear message when the database is switched off", async () => {
    mockFetch((url) => (url.startsWith("/runs?") ? json({ detail: "The experiment database is switched off (DB_ENABLED=false).", code: "disabled" }, 503) : undefined));
    await renderRuns();
    const alert = await screen.findByTestId("runs-problem");
    expect(within(alert).getByText("The run database is switched off")).toBeInTheDocument();
    expect(within(alert).getByText(/DB_ENABLED=false/)).toBeInTheDocument();
    expect(within(alert).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("shows the server's reason when the database file cannot be opened", async () => {
    mockFetch((url) => (url.startsWith("/runs?") ? json({ detail: "unable to open database file", code: "unavailable" }, 503) : undefined));
    await renderRuns();
    expect(await screen.findByText("The run database is not available")).toBeInTheDocument();
    expect(screen.getByText(/unable to open database file/)).toBeInTheDocument();
  });
});

describe("My runs: compare", () => {
  const detail = (r: RunSummary): RunDetail => ({
    ...r,
    history: [1, 2, 3].map((e) => ({ epoch: e, train_loss: 1 / e, train_acc: 0.5, val_loss: 1.1 / e, val_acc: 0.6, penalty: 0, grad_norm: 1, param_norm: 1, elapsed: e })),
  });

  it("needs two to four selected runs, then overlays the curves and highlights differing settings", async () => {
    const d1 = detail(A);
    const d2 = detail(B);
    mockFetch((url, init) => {
      if (url.startsWith("/runs/compare")) {
        return json({
          runs: [d1, d2], epochs: 3, differing: ["optimizer", "learning_rate", "dropout"],
          rows: [1, 2, 3].map((e, i) => ({ epoch: e, [`${A.id}.train_loss`]: d1.history[i].train_loss, [`${B.id}.train_loss`]: d2.history[i].train_loss })),
        });
      }
      return listHandler([A, B, CV, makeRun("ddd"), makeRun("eee")])(url, init);
    });
    await renderRuns();
    await screen.findByText("Adam baseline");
    const compare = screen.getByRole("button", { name: /^Compare \d+ runs$/ });
    expect(compare).toBeDisabled();
    const boxes = screen.getAllByRole("checkbox", { name: /Select this run for comparison/ });
    fireEvent.click(boxes[0]);
    expect(compare).toBeDisabled();
    fireEvent.click(boxes[1]);
    expect(compare).toBeEnabled();
    expect(compare).toHaveTextContent("Compare 2 runs");
    fireEvent.click(compare);

    const panel = await screen.findByTestId("run-compare");
    expect(calls.some((c) => c.url === "/runs/compare?ids=aaa,bbb")).toBe(true);
    await within(panel).findByTestId("settings-diff");
    const table = within(panel).getByTestId("settings-diff");
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.map((r) => r.querySelector("th")?.textContent?.replace(/\(differs\)/, "").trim())).toEqual(["optimizer", "learning_rate", "dropout"]);
    for (const r of rows) expect(r).toHaveAttribute("data-differs", "true");
    expect(within(table).getByText("sgd")).toBeInTheDocument();
    expect(within(panel).getByText("Loss per epoch")).toBeInTheDocument();
    expect(within(panel).getByText("Accuracy per epoch")).toBeInTheDocument();

    // "show only differences" off lists every setting
    fireEvent.click(within(panel).getByLabelText("Show only differences"));
    expect(within(within(panel).getByTestId("settings-diff")).getAllByRole("row").length).toBeGreaterThan(10);

    fireEvent.click(within(panel).getByRole("button", { name: "Close comparison" }));
    expect(screen.queryByTestId("run-compare")).not.toBeInTheDocument();
  });

  it("stops at four selected runs", async () => {
    mockFetch(listHandler([A, B, CV, makeRun("ddd"), makeRun("eee")]));
    await renderRuns();
    await screen.findByText("Adam baseline");
    const boxes = screen.getAllByRole("checkbox", { name: /Select this run/ });
    boxes.slice(0, 4).forEach((b) => fireEvent.click(b));
    expect(boxes[4]).toBeDisabled();
    expect(screen.getByText("You can compare at most 4 runs.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(boxes[4]).toBeEnabled();
  });
});

describe("My runs: rename, notes and delete", () => {
  it("renames a run and saves notes through PATCH", async () => {
    mockFetch((url, init) => {
      if (init?.method === "PATCH") return json({ ...A, title: "Better name", notes: "n", history: [] });
      return listHandler([A])(url, init);
    });
    await renderRuns();
    await screen.findByText("Adam baseline");
    fireEvent.click(screen.getByRole("button", { name: "Rename and notes" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: " Better name " } });
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "n" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("heading", { name: "Better name" })).toBeInTheDocument();
    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.url).toBe("/runs/aaa");
    expect(JSON.parse(patch.body!)).toEqual({ title: "Better name", notes: "n" });
  });

  it("asks for confirmation before deleting; cancel keeps the run", async () => {
    mockFetch(listHandler([A, B]));
    await renderRuns();
    await screen.findByText("Adam baseline");
    const card = screen.getAllByTestId("run-card")[0];
    fireEvent.click(within(card).getByRole("button", { name: "Delete" }));
    expect(within(card).getByText("Delete this run? This cannot be undone.")).toBeInTheDocument();
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
    fireEvent.click(within(card).getByRole("button", { name: "Cancel" }));
    expect(within(card).queryByText(/cannot be undone/)).not.toBeInTheDocument();
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
    expect(screen.getAllByTestId("run-card")).toHaveLength(2);
  });

  it("deletes after confirmation and removes the card", async () => {
    mockFetch(listHandler([A, B]));
    await renderRuns();
    await screen.findByText("Adam baseline");
    const card = screen.getAllByTestId("run-card")[0];
    fireEvent.click(within(card).getByRole("button", { name: "Delete" }));
    fireEvent.click(within(card).getByRole("button", { name: "Yes, delete" }));
    await waitFor(() => expect(screen.getAllByTestId("run-card")).toHaveLength(1));
    expect(calls.find((c) => c.method === "DELETE")?.url).toBe("/runs/aaa");
    expect(screen.queryByText("Adam baseline")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 1 runs")).toBeInTheDocument();
  });

  it("shows the server's error when a delete fails", async () => {
    mockFetch((url, init) => (init?.method === "DELETE" ? json({ detail: "Run 'aaa' was not found." }, 404) : listHandler([A])(url, init)));
    await renderRuns();
    await screen.findByText("Adam baseline");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));
    expect(await screen.findByText("Run 'aaa' was not found.")).toBeInTheDocument();
    expect(screen.getAllByTestId("run-card")).toHaveLength(1);
  });
});

describe("My runs: open in Playground", () => {
  it("restores the saved dataset and settings in the Playground", async () => {
    mockFetch((url, init) => {
      if (url === "/datasets/generate") return json({ name: "moons", points: Array.from({ length: 12 }, (_, i) => [i / 6 - 1, (i % 3) / 3]), labels: Array.from({ length: 12 }, (_, i) => i % 2) });
      return listHandler([B])(url, init);
    });
    await renderRuns();
    await screen.findByText("SGD with dropout");
    fireEvent.click(screen.getByRole("button", { name: "Open in Playground" }));

    // the Playground asks the server for the run's dataset, then builds a model with the run's settings
    await waitFor(() => expect(calls.some((c) => c.url === "/datasets/generate" && c.body?.includes('"seed":5'))).toBe(true), { timeout: 3000 });
    const gen = JSON.parse(calls.find((c) => c.url === "/datasets/generate" && c.body?.includes('"seed":5'))!.body!);
    expect(gen).toEqual({ name: "moons", n_samples: 180, noise: 0.3, seed: 5 });
    await waitFor(() => expect(calls.some((c) => c.url === "/models")).toBe(true), { timeout: 3000 });
    const model = JSON.parse(calls.find((c) => c.url === "/models")!.body!);
    expect(model.config).toMatchObject({ optimizer: "sgd", learning_rate: 0.5, dropout: 0.3, hidden_layers: [6], activation: "tanh" });
    expect(model.dataset.source).toMatchObject({ name: "moons", seed: 5, noise: 0.3 });
    expect(takePendingRestore()).toBeNull(); // handed over exactly once
  });

  it("fetches the points of a custom dataset before opening", async () => {
    const custom = makeRun("cus", { title: "Hand drawn", dataset: { name: "custom", n_samples: 24 } });
    const points = Array.from({ length: 24 }, (_, i) => [(i % 2 ? 1 : -1) * (0.3 + i / 40), (i % 2 ? 1 : -1) * (0.2 + (i % 5) / 10)]);
    const labels = Array.from({ length: 24 }, (_, i) => i % 2);
    mockFetch((url, init) => {
      if (url === "/runs/cus") return json({ ...custom, dataset: { name: "custom", n_samples: 24, points, labels }, history: [] });
      return listHandler([custom])(url, init);
    });
    await renderRuns();
    await screen.findByText("Hand drawn");
    fireEvent.click(screen.getByRole("button", { name: "Open in Playground" }));
    await waitFor(() => expect(calls.some((c) => c.url === "/models")).toBe(true), { timeout: 3000 });
    const model = JSON.parse(calls.find((c) => c.url === "/models")!.body!);
    expect(model.dataset.points).toEqual(points);
    expect(model.dataset.labels).toEqual(labels);
    expect(model.dataset.source).toMatchObject({ name: "custom" });
    expect(calls.some((c) => c.url === "/datasets/generate" && c.body?.includes("custom"))).toBe(false);
  });
});

describe("Playground confirmation and navigation", () => {
  const stub = (status: string, runId: string | null) => ({
    session: { session_id: "s", status, epoch: 10, total_epochs: 10, elapsed_seconds: 1, error: null, n_parameters: 5, n_train: 8, n_val: 2, latest: null, run_id: runId },
  }) as unknown as PlaygroundState;

  const show = (pg: PlaygroundState) =>
    render(<I18nProvider initial="en"><MemoryRouter><TrainingMetrics pg={pg} /></MemoryRouter></I18nProvider>);

  it("tells the user a finished run was saved and links to it", () => {
    show(stub("completed", "abc123"));
    const note = screen.getByTestId("run-saved");
    expect(note).toHaveTextContent("Saved to My runs");
    expect(within(note).getByRole("link", { name: "View run" })).toHaveAttribute("href", "/runs?run=abc123");
  });

  it("shows nothing while training or when nothing was saved", () => {
    show(stub("running", null));
    expect(screen.queryByTestId("run-saved")).not.toBeInTheDocument();
  });

  it("adds a My runs link after Cheatsheets in the header", () => {
    render(<I18nProvider initial="en"><MemoryRouter><NavBar /></MemoryRouter></I18nProvider>);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const labels = [...nav.querySelectorAll("a, button")].map((e) => e.textContent?.replace(/\s*▾/, "").trim());
    expect(labels.at(-1)).toBe("My runs");
    expect(labels.indexOf("My runs")).toBeGreaterThan(labels.indexOf("Cheatsheets"));
    expect(within(nav).getByRole("link", { name: "My runs" })).toHaveAttribute("href", "/runs");
  });
});
