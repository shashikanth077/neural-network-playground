import { useState } from "react";
import type { Playground } from "../hooks/usePlayground";
import { useEvaluation } from "../hooks/useEvaluation";
import { fmt, pct } from "../lib/format";
import type { Evaluation } from "../types";

function Matrix({ e }: { e: Evaluation }) {
  const { tp, fn, fp, tn } = e.confusion;
  const max = Math.max(1, tp, fn, fp, tn);
  const cell = (label: string, v: number, good: boolean, hint: string) => (
    <td className="border border-line p-0" title={hint}>
      <div className="grid h-20 place-items-center text-center" style={{ background: `rgb(var(${good ? "--ok" : "--bad"}) / ${0.08 + 0.45 * (v / max)})` }}>
        <span className="font-mono text-xl font-semibold tabular-nums">{v}</span>
        <span className="text-[11px] text-muted">{label}</span>
      </div>
    </td>
  );
  return (
    <table className="w-full table-fixed border-collapse text-sm" aria-label="Confusion matrix">
      <caption className="sr-only">Rows are the true class, columns the predicted class</caption>
      <thead>
        <tr>
          <th className="w-20" />
          <th scope="col" className="pb-1 text-xs font-medium text-muted">Predicted 1</th>
          <th scope="col" className="pb-1 text-xs font-medium text-muted">Predicted 0</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" className="pr-2 text-right text-xs font-medium text-muted">Actual 1</th>
          {cell("TP", tp, true, "True positive: a class-1 point correctly found")}
          {cell("FN", fn, false, "False negative: a class-1 point missed")}
        </tr>
        <tr>
          <th scope="row" className="pr-2 text-right text-xs font-medium text-muted">Actual 0</th>
          {cell("FP", fp, false, "False positive: a class-0 point wrongly flagged as 1")}
          {cell("TN", tn, true, "True negative: a class-0 point correctly rejected")}
        </tr>
      </tbody>
    </table>
  );
}

function Roc({ e }: { e: Evaluation }) {
  const S = 220;
  const P = 28;
  const x = (v: number) => P + v * (S - 2 * P);
  const y = (v: number) => S - P - v * (S - 2 * P);
  if (!e.roc) return <p className="text-sm text-muted">The ROC curve needs both classes in this split.</p>;
  const pts = e.roc.fpr.map((f, i) => `${x(f)},${y(e.roc!.tpr[i])}`).join(" ");
  const area = `${x(0)},${y(0)} ${pts} ${x(1)},${y(0)}`;
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[260px]" role="img" aria-label={`ROC curve, AUC ${fmt(e.auc, 3)}`}>
      <polygon points={area} style={{ fill: "rgb(var(--brand) / .12)" }} />
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} strokeDasharray="4 3" style={{ stroke: "rgb(var(--muted))" }} />
      <rect x={x(0)} y={y(1)} width={x(1) - x(0)} height={y(0) - y(1)} fill="none" style={{ stroke: "rgb(var(--line))" }} />
      <polyline points={pts} fill="none" strokeWidth="2.2" style={{ stroke: "rgb(var(--brand))" }} />
      <circle cx={x(e.fpr)} cy={y(e.recall)} r="5" style={{ fill: "rgb(var(--bad))", stroke: "rgb(var(--surface))" }} strokeWidth="2" />
      <text x={S / 2} y={S - 6} textAnchor="middle" fontSize="10" style={{ fill: "rgb(var(--muted))" }}>False positive rate</text>
      <text x="8" y={S / 2} fontSize="10" transform={`rotate(-90 8 ${S / 2})`} textAnchor="middle" style={{ fill: "rgb(var(--muted))" }}>True positive rate</text>
      <text x={x(1) - 4} y={y(0) - 6} textAnchor="end" fontSize="11" fontWeight="600" style={{ fill: "rgb(var(--ink))" }}>AUC {fmt(e.auc, 3)}</text>
    </svg>
  );
}

const METRICS: { key: keyof Evaluation; label: string; formula: string; help: string }[] = [
  { key: "accuracy", label: "Accuracy", formula: "(TP+TN) / all", help: "Share of correct answers. Misleading when one class is rare." },
  { key: "precision", label: "Precision", formula: "TP / (TP+FP)", help: "Of the points flagged class 1, how many really are?" },
  { key: "recall", label: "Recall (TPR)", formula: "TP / (TP+FN)", help: "Of all real class-1 points, how many were found?" },
  { key: "specificity", label: "Specificity", formula: "TN / (TN+FP) = 1 − FPR", help: "Of all real class-0 points, how many were correctly rejected?" },
  { key: "f1", label: "F1 score", formula: "2·P·R / (P+R)", help: "Harmonic mean of precision and recall; low if either is low." },
];

export function EvaluationPanel({ pg }: { pg: Playground }) {
  const [split, setSplit] = useState<"train" | "val">("val");
  const [threshold, setThreshold] = useState(0.5);
  const hasVal = (pg.session?.n_val ?? 0) > 0;
  const active = hasVal ? split : "train";
  const { data: e, error } = useEvaluation(pg.session?.session_id ?? null, pg.session?.epoch ?? 0, pg.status, active, threshold);
  const trained = (pg.session?.epoch ?? 0) > 0;

  return (
    <section className="card p-4" aria-labelledby="eval-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="eval-title" className="card-title">Classification metrics</h2>
        <div role="radiogroup" aria-label="Data split" className="inline-flex gap-1 rounded-lg border border-line bg-raised/60 p-0.5">
          {(["val", "train"] as const).map((s) => (
            <button key={s} role="radio" aria-checked={active === s} disabled={s === "val" && !hasVal} onClick={() => setSplit(s)}
              title={s === "val" && !hasVal ? "Set a validation split above 0 to enable" : undefined}
              className={`rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${active === s ? "bg-surface text-brand shadow-sm" : "text-muted"}`}>
              {s === "val" ? "Validation" : "Training"}
            </button>
          ))}
        </div>
      </div>
      {!pg.session ? (
        <p className="mt-3 text-sm text-muted">Create a valid model to evaluate it.</p>
      ) : !e ? (
        <p className="mt-3 text-sm text-muted" role="status">{error ?? "Loading…"}</p>
      ) : (
        <div className="mt-3 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Matrix e={e} />
            <p className="mt-2 text-xs text-muted">
              {e.n} {active === "val" ? "validation" : "training"} points at epoch {e.epoch}{trained ? "" : " (untrained: expect chance-level results)"}. Green cells are correct answers, red are mistakes.
            </p>
            <div className="mt-3">
              <label htmlFor="thr" className="flex items-baseline justify-between text-xs font-medium text-muted">
                <span>Decision threshold</span>
                <output htmlFor="thr" className="font-mono text-sm text-ink">{threshold.toFixed(2)}</output>
              </label>
              <input id="thr" type="range" min={0.05} max={0.95} step={0.01} value={threshold} onChange={(e2) => setThreshold(Number(e2.target.value))} className="w-full accent-brand" />
              <p className="text-xs text-muted">A point is called class 1 when P(class 1) ≥ threshold. Raise it for fewer false alarms (higher precision, lower recall); lower it to miss less.</p>
            </div>
          </div>
          <div>
            <dl className="grid grid-cols-2 gap-2">
              {METRICS.map((m) => (
                <div key={m.key} className="rounded-xl bg-raised/70 p-2.5" title={`${m.formula}. ${m.help}`}>
                  <dt className="text-xs text-muted">{m.label}</dt>
                  <dd className="font-mono text-lg font-semibold tabular-nums">{pct(e[m.key] as number)}</dd>
                  <dd className="text-[11px] text-muted">{m.formula}</dd>
                </div>
              ))}
              <div className="rounded-xl bg-raised/70 p-2.5" title="Area under the ROC curve: the chance a random class-1 point scores higher than a random class-0 point. 0.5 = guessing, 1 = perfect.">
                <dt className="text-xs text-muted">AUC</dt>
                <dd className="font-mono text-lg font-semibold tabular-nums">{fmt(e.auc, 3)}</dd>
                <dd className="text-[11px] text-muted">area under ROC</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-start gap-3">
              <Roc e={e} />
              <p className="text-xs text-muted">
                The <b>ROC curve</b> shows the trade-off at every threshold. The red dot is your current threshold. The dashed diagonal is random guessing.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
