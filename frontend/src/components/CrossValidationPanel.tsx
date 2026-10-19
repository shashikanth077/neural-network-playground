import { useState } from "react";
import { api } from "../api/client";
import type { Playground } from "../hooks/usePlayground";
import { fmt, pct } from "../lib/format";
import { VALIDATION_OPTIONS } from "../lib/options";
import type { CrossValidation, ValidationMethod } from "../types";
import { ErrorMessage } from "./ErrorMessage";

/** Coloured strip: which points were trained on (blue) and which validated (orange) in one fold. */
function Strip({ n, val }: { n: number; val: number[] }) {
  const set = new Set(val);
  const cells = Math.min(n, 100);
  const per = n / cells;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded" role="img" aria-label={`${val.length} of ${n} points held out`}>
      {Array.from({ length: cells }, (_, i) => {
        let held = 0;
        const from = Math.floor(i * per);
        const to = Math.max(from + 1, Math.floor((i + 1) * per));
        for (let j = from; j < to; j++) if (set.has(j)) held++;
        const frac = held / (to - from);
        return <span key={i} className="flex-1" style={{ background: frac > 0.5 ? "rgb(var(--c-amber))" : "rgb(var(--pos) / .55)" }} />;
      })}
    </div>
  );
}

export function CrossValidationPanel({ pg }: { pg: Playground }) {
  const [method, setMethod] = useState<ValidationMethod>("kfold");
  const [k, setK] = useState(5);
  const [frac, setFrac] = useState(0.3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CrossValidation | null>(null);
  const opt = VALIDATION_OPTIONS.find((o) => o.value === method)!;
  const n = pg.data?.labels.length ?? 0;
  const ready = !!pg.data && n >= 6 && Object.keys(pg.configErrors).filter((x) => x !== "val_split" && x !== "early_stopping").length === 0;

  const run = async () => {
    if (!pg.data) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api.crossValidate(pg.data, { ...pg.config, early_stopping: false, val_split: 0 }, method, k, frac));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card p-4" aria-labelledby="cv-title">
      <h2 id="cv-title" className="card-title">Validation methods (cross-validation)</h2>
      <p className="mt-1 text-xs text-muted">
        Trains a fresh network with your current settings on each split and scores it on the held-out part. The mean ± spread is a fairer estimate than one lucky split.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="cv-method" className="label">Method</label>
          <select id="cv-method" className="field" value={method} onChange={(e) => { setMethod(e.target.value as ValidationMethod); setResult(null); }}>
            {VALIDATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {opt.usesK && (
          <div>
            <label htmlFor="cv-k" className="label">{method === "shuffle_split" || method === "time_series" ? "Splits" : "Folds (K)"}</label>
            <input id="cv-k" type="number" min={2} max={10} className="field w-20" value={k} onChange={(e) => setK(Math.min(10, Math.max(2, Math.floor(Number(e.target.value) || 2))))} />
          </div>
        )}
        {opt.usesFraction && (
          <div>
            <label htmlFor="cv-frac" className="label">Validation share</label>
            <input id="cv-frac" type="number" min={0.1} max={0.5} step={0.05} className="field w-24" value={frac} onChange={(e) => setFrac(Math.min(0.5, Math.max(0.1, Number(e.target.value) || 0.2)))} />
          </div>
        )}
        <button className="btn-primary" onClick={run} disabled={!ready || busy}>{busy ? "Training folds…" : "Run validation"}</button>
      </div>
      <p className="mt-2 text-xs text-muted">{opt.note}</p>
      {!ready && <p className="mt-2 text-xs text-muted">Needs a dataset of at least 6 points and valid settings.</p>}
      <div className="mt-3"><ErrorMessage message={error} onDismiss={() => setError(null)} title="Validation failed" /></div>
      {result && (
        <div className="mt-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-raised/70 p-3"><p className="text-xs text-muted">Mean validation accuracy</p><p className="font-mono text-lg font-semibold">{pct(result.mean_val_accuracy)} <span className="text-sm font-normal text-muted">± {(result.std_val_accuracy * 100).toFixed(1)}</span></p></div>
            <div className="rounded-xl bg-raised/70 p-3"><p className="text-xs text-muted">Mean validation loss</p><p className="font-mono text-lg font-semibold">{fmt(result.mean_val_loss)} <span className="text-sm font-normal text-muted">± {fmt(result.std_val_loss)}</span></p></div>
            <div className="rounded-xl bg-raised/70 p-3"><p className="text-xs text-muted">Mean F1</p><p className="font-mono text-lg font-semibold">{pct(result.mean_val_f1)}</p></div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr>{["Fold", "Held-out points (orange)", "Train", "Val", "Val acc", "Val loss"].map((h) => <th key={h} scope="col" className="border-b border-line px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-muted">{h}</th>)}</tr></thead>
              <tbody>
                {result.folds.slice(0, 12).map((f) => (
                  <tr key={f.fold}>
                    <td className="border-b border-line px-2 py-1.5">{f.fold}</td>
                    <td className="border-b border-line px-2 py-1.5"><Strip n={result.n_samples} val={f.val_indices} /></td>
                    <td className="border-b border-line px-2 py-1.5">{f.n_train}</td>
                    <td className="border-b border-line px-2 py-1.5">{f.n_val}</td>
                    <td className="border-b border-line px-2 py-1.5 font-mono">{pct(f.val_accuracy)}</td>
                    <td className="border-b border-line px-2 py-1.5 font-mono">{fmt(f.val_loss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.folds.length > 12 && <p className="mt-1 text-xs text-muted">Showing 12 of {result.folds.length} folds; the means use all of them.</p>}
          </div>
          <p className="mt-2 text-xs text-muted">{result.note}</p>
        </div>
      )}
    </section>
  );
}
