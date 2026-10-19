import { useState } from "react";
import type { Playground } from "../hooks/usePlayground";
import { useEvaluation } from "../hooks/useEvaluation";
import { useT } from "../i18n";
import { fmt, pct } from "../lib/format";
import type { Evaluation } from "../types";
import { Rich, SectionHelp } from "./SectionHelp";

function Matrix({ e }: { e: Evaluation }) {
  const t = useT();
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
    <table className="w-full table-fixed border-collapse text-sm" aria-label={t("pg.ev.cm")}>
      <caption className="sr-only">{t("pg.ev.cm.caption")}</caption>
      <thead>
        <tr>
          <th className="w-20" />
          <th scope="col" className="pb-1 text-xs font-medium text-muted">{t("pg.ev.pred1")}</th>
          <th scope="col" className="pb-1 text-xs font-medium text-muted">{t("pg.ev.pred0")}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" className="pr-2 text-right text-xs font-medium text-muted">{t("pg.ev.act1")}</th>
          {cell("TP", tp, true, t("pg.ev.tp.hint"))}
          {cell("FN", fn, false, t("pg.ev.fn.hint"))}
        </tr>
        <tr>
          <th scope="row" className="pr-2 text-right text-xs font-medium text-muted">{t("pg.ev.act0")}</th>
          {cell("FP", fp, false, t("pg.ev.fp.hint"))}
          {cell("TN", tn, true, t("pg.ev.tn.hint"))}
        </tr>
      </tbody>
    </table>
  );
}

function Roc({ e }: { e: Evaluation }) {
  const t = useT();
  const S = 220;
  const P = 28;
  const x = (v: number) => P + v * (S - 2 * P);
  const y = (v: number) => S - P - v * (S - 2 * P);
  if (!e.roc) return <p className="text-sm text-muted">{t("pg.ev.roc.need")}</p>;
  const pts = e.roc.fpr.map((f, i) => `${x(f)},${y(e.roc!.tpr[i])}`).join(" ");
  const area = `${x(0)},${y(0)} ${pts} ${x(1)},${y(0)}`;
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[260px]" role="img" aria-label={t("pg.ev.roc.aria", undefined, { auc: fmt(e.auc, 3) })}>
      <polygon points={area} style={{ fill: "rgb(var(--brand) / .12)" }} />
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} strokeDasharray="4 3" style={{ stroke: "rgb(var(--muted))" }} />
      <rect x={x(0)} y={y(1)} width={x(1) - x(0)} height={y(0) - y(1)} fill="none" style={{ stroke: "rgb(var(--line))" }} />
      <polyline points={pts} fill="none" strokeWidth="2.2" style={{ stroke: "rgb(var(--brand))" }} />
      <circle cx={x(e.fpr)} cy={y(e.recall)} r="5" style={{ fill: "rgb(var(--bad))", stroke: "rgb(var(--surface))" }} strokeWidth="2" />
      <text x={S / 2} y={S - 6} textAnchor="middle" fontSize="10" style={{ fill: "rgb(var(--muted))" }}>{t("pg.ev.fpr")}</text>
      <text x="8" y={S / 2} fontSize="10" transform={`rotate(-90 8 ${S / 2})`} textAnchor="middle" style={{ fill: "rgb(var(--muted))" }}>{t("pg.ev.tpr")}</text>
      <text x={x(1) - 4} y={y(0) - 6} textAnchor="end" fontSize="11" fontWeight="600" style={{ fill: "rgb(var(--ink))" }}>AUC {fmt(e.auc, 3)}</text>
    </svg>
  );
}

/** English source text; labels and help are translated through `pg.ev.m.<key>.*`. */
const METRICS: { key: keyof Evaluation; label: string; formula: string; help: string }[] = [
  { key: "accuracy", label: "Accuracy", formula: "(TP+TN) / all", help: "Share of correct answers. Misleading when one class is rare." },
  { key: "precision", label: "Precision", formula: "TP / (TP+FP)", help: "Of the points flagged class 1, how many really are?" },
  { key: "recall", label: "Recall (TPR)", formula: "TP / (TP+FN)", help: "Of all real class-1 points, how many were found?" },
  { key: "specificity", label: "Specificity", formula: "TN / (TN+FP) = 1 − FPR", help: "Of all real class-0 points, how many were correctly rejected?" },
  { key: "f1", label: "F1 score", formula: "2·P·R / (P+R)", help: "Harmonic mean of precision and recall; low if either is low." },
];

export function EvaluationPanel({ pg }: { pg: Playground }) {
  const t = useT();
  const [split, setSplit] = useState<"train" | "val">("val");
  const [threshold, setThreshold] = useState(0.5);
  const hasVal = (pg.session?.n_val ?? 0) > 0;
  const active = hasVal ? split : "train";
  const { data: e, error } = useEvaluation(pg.session?.session_id ?? null, pg.session?.epoch ?? 0, pg.status, active, threshold);
  const trained = (pg.session?.epoch ?? 0) > 0;

  return (
    <section className="card p-4" aria-labelledby="eval-title" id="section-eval">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="eval-title" className="card-title">{t("pg.ev.title")}</h2>
        <div role="radiogroup" aria-label={t("pg.ev.split")} className="inline-flex gap-1 rounded-lg border border-line bg-raised/60 p-0.5">
          {(["val", "train"] as const).map((s) => (
            <button key={s} role="radio" aria-checked={active === s} disabled={s === "val" && !hasVal} onClick={() => setSplit(s)}
              title={s === "val" && !hasVal ? t("pg.ev.needVal") : undefined}
              className={`rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${active === s ? "bg-surface text-brand shadow-sm" : "text-muted"}`}>
              {s === "val" ? t("pg.ev.val") : t("pg.ev.train")}
            </button>
          ))}
        </div>
      </div>
      <SectionHelp id="eval.metrics" className="mt-3" formula={[String.raw`\text{Acc}=\frac{TP+TN}{TP+TN+FP+FN}`, String.raw`P=\frac{TP}{TP+FP},\quad R=\frac{TP}{TP+FN},\quad F_1=\frac{2PR}{P+R}`]} />
      {!pg.session ? (
        <p className="mt-3 text-sm text-muted">{t("pg.ev.noModel")}</p>
      ) : !e ? (
        <p className="mt-3 text-sm text-muted" role="status">{error ?? t("pg.loading")}</p>
      ) : (
        <div className="mt-3 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Matrix e={e} />
            <p className="mt-2 text-xs text-muted">
              {t("pg.ev.note", undefined, { n: e.n, split: active === "val" ? t("pg.ev.splitVal") : t("pg.ev.splitTrain"), epoch: e.epoch })}{trained ? "" : ` (${t("pg.ev.untrained")})`}. {t("pg.ev.colors")}
            </p>
            <SectionHelp id="eval.cm" className="mt-2" />
            <div className="mt-3">
              <label htmlFor="thr" className="flex items-baseline justify-between text-xs font-medium text-muted">
                <span>{t("pg.ev.threshold")}</span>
                <output htmlFor="thr" className="font-mono text-sm text-ink">{threshold.toFixed(2)}</output>
              </label>
              <input id="thr" type="range" min={0.05} max={0.95} step={0.01} value={threshold} onChange={(e2) => setThreshold(Number(e2.target.value))} className="w-full accent-brand" />
              <p className="text-xs text-muted">{t("pg.ev.threshold.help")}</p>
              <SectionHelp id="eval.threshold" className="mt-2" formula={String.raw`\hat y=1\iff p\ge\text{threshold}`} />
            </div>
          </div>
          <div>
            <dl className="grid grid-cols-2 gap-2">
              {METRICS.map((m) => (
                <div key={m.key} className="rounded-xl bg-raised/70 p-2.5" title={`${t(`pg.ev.m.${m.key}.formula`, m.formula)}. ${t(`pg.ev.m.${m.key}.help`, m.help)}`}>
                  <dt className="text-xs text-muted">{t(`pg.ev.m.${m.key}.label`, m.label)}</dt>
                  <dd className="font-mono text-lg font-semibold tabular-nums">{pct(e[m.key] as number)}</dd>
                  <dd className="text-[11px] text-muted">{t(`pg.ev.m.${m.key}.formula`, m.formula)}</dd>
                </div>
              ))}
              <div className="rounded-xl bg-raised/70 p-2.5" title={t("pg.ev.auc.hint")}>
                <dt className="text-xs text-muted">AUC</dt>
                <dd className="font-mono text-lg font-semibold tabular-nums">{fmt(e.auc, 3)}</dd>
                <dd className="text-[11px] text-muted">{t("pg.ev.auc.sub")}</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-start gap-3">
              <Roc e={e} />
              <p className="text-xs text-muted"><Rich text={t("pg.ev.roc.help")} /></p>
            </div>
            <SectionHelp id="eval.roc" className="mt-3" formula={String.raw`\text{TPR}=\frac{TP}{TP+FN},\quad \text{FPR}=\frac{FP}{FP+TN}`} />
          </div>
        </div>
      )}
    </section>
  );
}
