import { useState } from "react";
import { api } from "../api/client";
import type { Playground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { fmt, pct } from "../lib/format";
import { VALIDATION_OPTIONS } from "../lib/options";
import { useOptionText } from "../lib/optionText";
import type { CrossValidation, ValidationMethod } from "../types";
import { ErrorMessage } from "./ErrorMessage";
import { SectionHelp } from "./SectionHelp";

/** Coloured strip: which points were trained on (blue) and which validated (orange) in one fold. */
function Strip({ n, val }: { n: number; val: number[] }) {
  const t = useT();
  const set = new Set(val);
  const cells = Math.min(n, 100);
  const per = n / cells;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded" role="img" aria-label={t("pg.cv.strip", undefined, { a: val.length, n })}>
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
  const t = useT();
  const ot = useOptionText();
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
    <section className="card p-4" aria-labelledby="cv-title" id="section-cv">
      <h2 id="cv-title" className="card-title">{t("pg.cv.title")}</h2>
      <SectionHelp id="cv" className="mt-2" />
      <p className="mt-1 text-xs text-muted">{t("pg.cv.intro")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="cv-method" className="label">{t("pg.cv.method")}</label>
          <select id="cv-method" className="field" value={method} onChange={(e) => { setMethod(e.target.value as ValidationMethod); setResult(null); }}>
            {VALIDATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{ot.label("val", o)}</option>)}
          </select>
        </div>
        {opt.usesK && (
          <div>
            <label htmlFor="cv-k" className="label">{method === "shuffle_split" || method === "time_series" ? t("pg.cv.splits") : t("pg.cv.folds")}</label>
            <input id="cv-k" type="number" min={2} max={10} className="field w-20" value={k} onChange={(e) => setK(Math.min(10, Math.max(2, Math.floor(Number(e.target.value) || 2))))} />
          </div>
        )}
        {opt.usesFraction && (
          <div>
            <label htmlFor="cv-frac" className="label">{t("pg.cv.share")}</label>
            <input id="cv-frac" type="number" min={0.1} max={0.5} step={0.05} className="field w-24" value={frac} onChange={(e) => setFrac(Math.min(0.5, Math.max(0.1, Number(e.target.value) || 0.2)))} />
          </div>
        )}
        <button className="btn-primary" onClick={run} disabled={!ready || busy}>{busy ? t("pg.cv.busy") : t("pg.cv.run")}</button>
      </div>
      <p className="mt-2 text-xs text-muted">{ot.note("val", opt)}</p>
      <SectionHelp id={`cv.${method}`} kind="option" className="mt-2" />
      {!ready && <p className="mt-2 text-xs text-muted">{t("pg.cv.needs")}</p>}
      <div className="mt-3"><ErrorMessage message={error} onDismiss={() => setError(null)} title={t("pg.cv.failed")} /></div>
      {result && (
        <div className="mt-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-raised/70 p-3"><p className="text-xs text-muted">{t("pg.cv.meanAcc")}</p><p className="font-mono text-lg font-semibold">{pct(result.mean_val_accuracy)} <span className="text-sm font-normal text-muted">± {(result.std_val_accuracy * 100).toFixed(1)}</span></p></div>
            <div className="rounded-xl bg-raised/70 p-3"><p className="text-xs text-muted">{t("pg.cv.meanLoss")}</p><p className="font-mono text-lg font-semibold">{fmt(result.mean_val_loss)} <span className="text-sm font-normal text-muted">± {fmt(result.std_val_loss)}</span></p></div>
            <div className="rounded-xl bg-raised/70 p-3"><p className="text-xs text-muted">{t("pg.cv.meanF1")}</p><p className="font-mono text-lg font-semibold">{pct(result.mean_val_f1)}</p></div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr>{(["fold", "held", "train", "val", "valAcc", "valLoss"] as const).map((h) => <th key={h} scope="col" className="border-b border-line px-2 py-1 text-left text-xs font-semibold uppercase tracking-wide text-muted">{t(`pg.cv.col.${h}`)}</th>)}</tr></thead>
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
            {result.folds.length > 12 && <p className="mt-1 text-xs text-muted">{t("pg.cv.showing", undefined, { n: result.folds.length })}</p>}
          </div>
          <p className="mt-2 text-xs text-muted">{result.note}</p>
        </div>
      )}
    </section>
  );
}
