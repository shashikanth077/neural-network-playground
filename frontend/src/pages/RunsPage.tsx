import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { RunCompare } from "../components/RunCompare";
import { useLang, useT, type TFn } from "../i18n";
import { duration, fmt, pct } from "../lib/format";
import { setPendingRestore } from "../lib/pendingRestore";
import type { DatasetName, RunKind, RunSummary } from "../types";

const PAGE = 50;
const MAX_COMPARE = 4;

/** Short chips for the settings that matter most when scanning a list. These are technical names, not prose. */
export function settingChips(run: RunSummary): string[] {
  const c = run.config as Record<string, unknown>;
  const chips: string[] = [];
  if (c.optimizer) chips.push(String(c.optimizer));
  if (c.activation) chips.push(String(c.activation));
  if (typeof c.learning_rate === "number") chips.push(`lr ${c.learning_rate}`);
  if (Array.isArray(c.hidden_layers)) chips.push(`[${c.hidden_layers.join("-") || "–"}]`);
  if (typeof c.batch_size === "number") chips.push(`batch ${c.batch_size}`);
  if (typeof c.dropout === "number" && c.dropout > 0) chips.push(`dropout ${c.dropout}`);
  if (typeof c.l2 === "number" && c.l2 > 0) chips.push(`L2 ${c.l2}`);
  if (typeof c.l1 === "number" && c.l1 > 0) chips.push(`L1 ${c.l1}`);
  if (c.loss && c.loss !== "bce") chips.push(String(c.loss));
  if (c.batch_norm) chips.push("batch-norm");
  if (c.early_stopping) chips.push("early-stopping");
  return chips;
}

function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <span className="block h-8 w-28" aria-hidden />;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(1)},${(26 - ((v - min) / span) * 24).toFixed(1)}`);
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-8 w-28 shrink-0 text-brand" role="img" aria-label={label}>
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] text-muted">{label}</dt>
      <dd className="font-mono text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

const pm = (m: number | null | undefined, s: number | null | undefined, f: (v: number | null | undefined) => string) =>
  m === null || m === undefined ? "–" : s ? `${f(m)} ± ${f(s)}` : f(m);

function datasetLine(run: RunSummary, t: TFn): string {
  const d = run.dataset;
  const parts = [d.name];
  if (d.n_samples) parts.push(t("runs.card.points", undefined, { n: d.n_samples }));
  if (d.noise !== null && d.noise !== undefined) parts.push(t("runs.card.noise", undefined, { v: d.noise }));
  if (d.seed !== null && d.seed !== undefined) parts.push(t("runs.card.seed", undefined, { v: d.seed }));
  return parts.join(" · ");
}

const GENERATED: DatasetName[] = ["xor", "moons", "circles", "linear"];

interface CardProps {
  run: RunSummary;
  selected: boolean;
  selectDisabled: boolean;
  highlighted: boolean;
  onToggle: (id: string) => void;
  onChanged: (run: RunSummary) => void;
  onDeleted: (id: string) => void;
}

function RunCard({ run, selected, selectDisabled, highlighted, onToggle, onChanged, onDeleted }: CardProps) {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [title, setTitle] = useState(run.title);
  const [notes, setNotes] = useState(run.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLLIElement>(null);
  const m = run.metrics;
  const cv = run.kind === "cross-validation";
  const hasVal = m.final_val_loss !== null && m.final_val_loss !== undefined;

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView?.({ block: "center" });
  }, [highlighted]);

  const when = new Date(run.created_at * 1000).toLocaleString(lang === "kn" ? "kn-IN" : lang === "lt" ? "lt-LT" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onChanged({ ...run, ...(await api.updateRun(run.id, { title: title.trim(), notes })), spark: run.spark });
      setMode("view");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.deleteRun(run.id);
      onDeleted(run.id);
    } catch (e) {
      fail(e);
      setBusy(false);
    }
  };
  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      // The list leaves out the points of custom datasets; fetch them when needed.
      const full = run.dataset.name === "custom" ? await api.getRun(run.id) : run;
      const d = full.dataset;
      const cfg = Object.fromEntries(Object.entries(full.config).filter(([k]) => !k.startsWith("cv_")));
      setPendingRestore({
        config: cfg,
        dataset: {
          name: GENERATED.includes(d.name as DatasetName) ? (d.name as DatasetName) : "custom",
          n_samples: d.n_samples ?? 200,
          noise: d.noise ?? 0.15,
          seed: d.seed ?? 0,
          points: d.points,
          labels: d.labels,
        },
      });
      navigate("/playground");
    } catch (e) {
      fail(e);
      setBusy(false);
    }
  };

  const status = m.stopped_early ? t("runs.status.early") : run.status === "failed" ? t("runs.status.failed") : t("runs.status.completed");

  return (
    <li
      ref={ref}
      data-testid="run-card"
      className={`card p-4 ${highlighted ? "ring-2 ring-brand" : ""} ${selected ? "border-brand" : ""}`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0"
          checked={selected}
          disabled={selectDisabled && !selected}
          onChange={() => onToggle(run.id)}
          aria-label={`${t("runs.select")}: ${run.title}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 break-words text-base font-semibold tracking-tight">{run.title}</h3>
            <span className="chip">{run.kind === "cross-validation" ? t("runs.kind.cv") : t("runs.kind.playground")}</span>
            <span className={`chip ${run.status === "failed" ? "!border-bad/40 !bg-bad/10 !text-bad" : m.stopped_early ? "!border-ok/40 !bg-ok/10 !text-ok" : ""}`}>{status}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            <time dateTime={new Date(run.created_at * 1000).toISOString()}>{when}</time> · {datasetLine(run, t)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="settings">
            {cv && <span className="chip">{t("runs.card.cv", undefined, { m: String(run.config.cv_method ?? m.method ?? ""), k: String(run.config.cv_k ?? m.n_folds ?? "") })}</span>}
            {settingChips(run).map((c) => <span key={c} className="chip">{c}</span>)}
          </div>
        </div>
        {!cv && <Sparkline values={run.spark} label={t("runs.spark.aria")} />}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-5">
        {cv ? (
          <>
            <Metric label={t("runs.m.meanLoss")} value={pm(m.mean_val_loss, m.std_val_loss, fmt)} />
            <Metric label={t("runs.m.meanAcc")} value={pm(m.mean_val_accuracy, m.std_val_accuracy, pct)} />
            <Metric label={t("runs.m.f1")} value={fmt(m.mean_val_f1)} />
            <Metric label={t("runs.m.folds")} value={String(m.n_folds ?? "–")} />
            <Metric label={t("runs.m.time")} value={m.elapsed !== undefined ? duration(m.elapsed) : "–"} />
          </>
        ) : (
          <>
            <Metric label={t("runs.m.trainLoss")} value={fmt(m.final_train_loss)} />
            <Metric label={t("runs.m.valLoss")} value={hasVal ? fmt(m.final_val_loss) : "–"} />
            <Metric label={hasVal ? t("runs.m.valAcc") : t("runs.m.trainAcc")} value={pct(hasVal ? m.final_val_acc : m.final_train_acc)} />
            <Metric label={t("runs.m.epochs")} value={String(m.epochs_run ?? "–")} />
            <Metric label={t("runs.m.time")} value={m.elapsed !== undefined ? duration(m.elapsed) : "–"} />
          </>
        )}
      </dl>

      {run.notes && mode !== "edit" && (
        <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-raised/70 p-2.5 text-sm" aria-label={t("runs.notes.label")}>{run.notes}</p>
      )}

      {mode === "edit" && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => { e.preventDefault(); void save(); }}
        >
          <label className="block">
            <span className="label">{t("runs.edit.title")}</span>
            <input className="field" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">{t("runs.edit.notes")}</span>
            <textarea className="field min-h-[5rem]" value={notes} maxLength={5000} placeholder={t("runs.edit.notes.ph")} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary !py-1.5" disabled={busy || !title.trim()}>{t("runs.save")}</button>
            <button type="button" className="btn-ghost !py-1.5" disabled={busy} onClick={() => { setMode("view"); setTitle(run.title); setNotes(run.notes); setError(null); }}>{t("runs.cancel")}</button>
          </div>
        </form>
      )}

      {mode === "confirm" && (
        <div role="alertdialog" aria-label={t("runs.delete.confirm")} className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-bad/40 bg-bad/10 p-2.5 text-sm">
          <span className="min-w-0 flex-1">{t("runs.delete.confirm")}</span>
          <button className="btn !bg-bad !py-1.5 text-white" disabled={busy} onClick={() => void remove()}>{t("runs.delete.yes")}</button>
          <button className="btn-ghost !py-1.5" disabled={busy} onClick={() => setMode("view")}>{t("runs.cancel")}</button>
        </div>
      )}

      {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}

      {mode === "view" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-primary !py-1.5" disabled={busy} onClick={() => void open()}>{t("runs.open")}</button>
          <button className="btn-ghost !py-1.5" onClick={() => setMode("edit")}>{t("runs.edit")}</button>
          <button className="btn-ghost !py-1.5 !text-bad" onClick={() => setMode("confirm")}>{t("runs.delete")}</button>
        </div>
      )}
    </li>
  );
}

type Load =
  | { state: "loading" }
  | { state: "error"; error: unknown }
  | { state: "ready" };

function Problem({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const t = useT();
  const api_ = error instanceof ApiError ? error : null;
  let title = t("runs.err.generic", undefined, { detail: error instanceof Error ? error.message : String(error) });
  let body: string | null = null;
  if (api_?.status === 0) {
    title = t("runs.err.down.title");
    body = t("runs.err.down.body");
  } else if (api_?.code === "disabled") {
    title = t("runs.err.disabled.title");
    body = t("runs.err.disabled.body");
  } else if (api_?.code === "unavailable") {
    title = t("runs.err.unavailable.title");
    body = t("runs.err.unavailable.body", undefined, { detail: api_.message });
  }
  return (
    <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-bad/40 bg-bad/10 p-4 text-sm" data-testid="runs-problem">
      <span aria-hidden className="mt-0.5 text-bad">⚠</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-bad">{title}</p>
        {body && <p className="mt-1 break-words text-muted">{body}</p>}
      </div>
      {api_?.code !== "disabled" && <button className="btn-ghost !py-1 shrink-0" onClick={onRetry}>{t("runs.retry")}</button>}
    </div>
  );
}

export function RunsPage() {
  const t = useT();
  const [params] = useSearchParams();
  const focusId = params.get("run");
  const [items, setItems] = useState<RunSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<RunKind | "">("");
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState<string[] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const seq = useRef(0);
  const compareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setQ(text), 300);
    return () => clearTimeout(timer);
  }, [text]);

  const fetchRuns = useCallback(async () => {
    const my = ++seq.current;
    setLoad({ state: "loading" });
    try {
      const r = await api.listRuns({ limit: PAGE, kind, q });
      if (my !== seq.current) return;
      setItems(r.items);
      setTotal(r.total);
      setLoad({ state: "ready" });
    } catch (e) {
      if (my !== seq.current) return;
      setItems([]);
      setTotal(0);
      setLoad({ state: "error", error: e });
    }
  }, [kind, q]);
  useEffect(() => { void fetchRuns(); }, [fetchRuns]);

  const loadMore = async () => {
    const my = seq.current;
    setLoadingMore(true);
    try {
      const r = await api.listRuns({ limit: PAGE, offset: items.length, kind, q });
      if (my === seq.current) {
        setItems((prev) => prev.concat(r.items.filter((x) => !prev.some((p) => p.id === x.id))));
        setTotal(r.total);
      }
    } catch (e) {
      setLoad({ state: "error", error: e });
    } finally {
      setLoadingMore(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < MAX_COMPARE ? [...s, id] : s));
  const changed = (run: RunSummary) => setItems((prev) => prev.map((r) => (r.id === run.id ? run : r)));
  const deleted = (id: string) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
    setTotal((n) => Math.max(0, n - 1));
    setSelected((s) => s.filter((x) => x !== id));
    setComparing((c) => (c && c.includes(id) ? null : c));
  };
  const startCompare = () => {
    setComparing([...selected]);
    setTimeout(() => compareRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 50);
  };

  const filtered = !!(q.trim() || kind);
  const ready = load.state === "ready";

  return (
    <main className="mx-auto max-w-[1100px] space-y-4 px-4 py-6 sm:px-6 sm:py-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("runs.title")}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t("runs.intro")}</p>
      </header>

      <div className="card flex flex-wrap items-end gap-3 p-3">
        <label className="min-w-[12rem] flex-1">
          <span className="label">{t("runs.search")}</span>
          <input type="search" className="field" value={text} placeholder={t("runs.search.ph")} onChange={(e) => setText(e.target.value)} />
        </label>
        <label>
          <span className="label">{t("runs.kind.label")}</span>
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value as RunKind | "")}>
            <option value="">{t("runs.kind.all")}</option>
            <option value="playground">{t("runs.kind.playground")}</option>
            <option value="cross-validation">{t("runs.kind.cv")}</option>
          </select>
        </label>
        <button className="btn-ghost" onClick={() => void fetchRuns()}>{t("runs.refresh")}</button>
      </div>

      {ready && items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          <button className="btn-primary" disabled={selected.length < 2} onClick={startCompare}>
            {t("runs.compare", undefined, { n: selected.length })}
          </button>
          {selected.length > 0 && <button className="btn-ghost" onClick={() => setSelected([])}>{t("runs.clearSel")}</button>}
          <span className="text-xs text-muted">{selected.length >= MAX_COMPARE ? t("runs.select.max") : t("runs.select.hint")}</span>
        </div>
      )}

      {comparing && (
        <div ref={compareRef}>
          <RunCompare ids={comparing} onClose={() => setComparing(null)} />
        </div>
      )}

      {load.state === "loading" && items.length === 0 && <p className="text-sm text-muted" role="status">{t("runs.loading")}</p>}
      {load.state === "error" && <Problem error={load.error} onRetry={() => void fetchRuns()} />}

      {ready && items.length === 0 && (
        filtered ? (
          <div className="card p-6 text-center" data-testid="runs-nomatch">
            <p className="text-sm text-muted">{t("runs.noMatch")}</p>
            <button className="btn-ghost mt-3" onClick={() => { setText(""); setQ(""); setKind(""); }}>{t("runs.clearFilters")}</button>
          </div>
        ) : (
          <div className="card p-6 text-center sm:p-10" data-testid="runs-empty">
            <p aria-hidden className="text-4xl">🗂</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">{t("runs.empty.title")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t("runs.empty.body")}</p>
            <Link to="/playground" className="btn-primary mt-4">{t("runs.empty.cta")}</Link>
          </div>
        )
      )}

      {items.length > 0 && (
        <>
          <ul className="space-y-3">
            {items.map((r) => (
              <RunCard
                key={r.id}
                run={r}
                selected={selected.includes(r.id)}
                selectDisabled={selected.length >= MAX_COMPARE}
                highlighted={r.id === focusId}
                onToggle={toggle}
                onChanged={changed}
                onDeleted={deleted}
              />
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{t("runs.count", undefined, { a: items.length, b: total })}</span>
            {items.length < total && <button className="btn-ghost" disabled={loadingMore} onClick={() => void loadMore()}>{t("runs.more")}</button>}
          </div>
        </>
      )}
    </main>
  );
}
