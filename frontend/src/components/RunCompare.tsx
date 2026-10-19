import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api/client";
import { useT } from "../i18n";
import { downsample, fmt, pct } from "../lib/format";
import type { RunComparison, RunDetail } from "../types";
import { COLORS, EmptyChart, Explain } from "./chartParts";

/** One colour per compared run (up to four); solid = training, dashed = validation. */
export const RUN_COLORS = ["#4f46e5", "#d97706", "#0e9b88", "#8647d4"];

export function formatSetting(v: unknown, yes: string, no: string): string {
  if (v === null || v === undefined) return "–";
  if (typeof v === "boolean") return v ? yes : no;
  if (Array.isArray(v)) return `[${v.join(", ")}]`;
  return String(v);
}

function Chart({ title, rows, runs, metric, label, percent, ariaLabel }: {
  title: string;
  rows: Record<string, number | null>[];
  runs: RunDetail[];
  metric: "loss" | "acc";
  label: (kind: "train" | "val") => string;
  percent?: boolean;
  ariaLabel: string;
}) {
  const t = useT();
  const hasVal = (r: RunDetail) => r.history.some((h) => (metric === "loss" ? h.val_loss : h.val_acc) !== null);
  return (
    <div>
      <h4 className="card-title">{title}</h4>
      <div className="mt-2 h-56 sm:h-64" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: COLORS.axis }} />
            <YAxis
              tick={{ fontSize: 11, fill: COLORS.axis }}
              domain={percent ? [0, 1] : [0, "auto"]}
              width={44}
              tickFormatter={(v: number) => (percent ? `${Math.round(v * 100)}%` : v.toFixed(2))}
            />
            <Tooltip
              formatter={(v: number, name: string) => [typeof v === "number" ? (percent ? pct(v) : v.toFixed(4)) : v, name]}
              labelFormatter={(l) => t("runs.epochN", undefined, { n: String(l) })}
              contentStyle={{ borderRadius: 10, fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {runs.map((r, i) => (
              <Line key={`${r.id}-t`} type="monotone" dataKey={`${r.id}.train_${metric}`} name={`${r.title} · ${label("train")}`}
                stroke={RUN_COLORS[i]} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
            ))}
            {runs.map((r, i) => hasVal(r) && (
              <Line key={`${r.id}-v`} type="monotone" dataKey={`${r.id}.val_${metric}`} name={`${r.title} · ${label("val")}`}
                stroke={RUN_COLORS[i]} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RunCompare({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const t = useT();
  const [data, setData] = useState<RunComparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyDiff, setOnlyDiff] = useState(true);
  const key = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    api.compareRuns(ids).then(
      (d) => { if (!cancelled) setData(d); },
      (e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); },
    );
    return () => { cancelled = true; };
    // `ids` is represented by its joined key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const rows = useMemo(() => downsample(data?.rows ?? [], 300), [data]);
  const yes = t("runs.yes");
  const no = t("runs.no");

  const configKeys = useMemo(() => {
    if (!data) return [] as string[];
    const all: string[] = [];
    for (const r of data.runs) for (const k of Object.keys(r.config)) if (!all.includes(k)) all.push(k);
    return onlyDiff ? all.filter((k) => data.differing.includes(k)) : all;
  }, [data, onlyDiff]);

  return (
    <section className="card p-4" aria-labelledby="cmp-title" id="run-compare" data-testid="run-compare">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="cmp-title" className="card-title">{t("runs.cmp.title")}</h2>
        <button className="btn-ghost !py-1" onClick={onClose}>{t("runs.cmp.close")}</button>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-bad">{t("runs.err.generic", undefined, { detail: error })}</p>}
      {!error && !data && <p className="mt-3 text-sm text-muted" role="status">{t("runs.cmp.loading")}</p>}

      {data && (
        <>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {data.runs.map((r, i) => (
              <li key={r.id} className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: RUN_COLORS[i] }} />
                <span className="truncate font-medium">{r.title}</span>
              </li>
            ))}
          </ul>

          {data.epochs === 0 ? (
            <div className="mt-3 h-24"><EmptyChart text={t("runs.cmp.noHistory")} /></div>
          ) : (
            <>
              <div className="mt-3 grid gap-6 lg:grid-cols-2">
                <Chart title={t("runs.cmp.loss")} rows={rows} runs={data.runs} metric="loss"
                  label={(k) => t(k === "train" ? "runs.cmp.train" : "runs.cmp.val")} ariaLabel={t("runs.cmp.loss")} />
                <Chart title={t("runs.cmp.acc")} rows={rows} runs={data.runs} metric="acc" percent
                  label={(k) => t(k === "train" ? "runs.cmp.train" : "runs.cmp.val")} ariaLabel={t("runs.cmp.acc")} />
              </div>
              <Explain>{t("runs.cmp.hint")}</Explain>
            </>
          )}

          <h3 className="card-title mt-6">{t("runs.cmp.results")}</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 pr-3 font-medium" />
                  <th className="px-2 py-1 font-medium">{t("runs.m.trainLoss")}</th>
                  <th className="px-2 py-1 font-medium">{t("runs.m.valLoss")}</th>
                  <th className="px-2 py-1 font-medium">{t("runs.m.valAcc")}</th>
                  <th className="px-2 py-1 font-medium">{t("runs.m.epochs")}</th>
                </tr>
              </thead>
              <tbody>
                {data.runs.map((r, i) => {
                  const cv = r.kind === "cross-validation";
                  const m = r.metrics;
                  return (
                    <tr key={r.id} className="border-t border-line">
                      <th scope="row" className="max-w-[10rem] py-1.5 pr-3 font-medium">
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: RUN_COLORS[i] }} />
                          <span className="truncate">{r.title}</span>
                        </span>
                      </th>
                      <td className="px-2 py-1.5 font-mono tabular-nums">{cv ? "–" : fmt(m.final_train_loss)}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums">{fmt(cv ? m.mean_val_loss : m.final_val_loss)}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums">{pct(cv ? m.mean_val_accuracy : m.final_val_acc)}</td>
                      <td className="px-2 py-1.5 font-mono tabular-nums">{cv ? t("runs.card.cv", undefined, { m: String(m.method ?? ""), k: m.n_folds ?? 0 }) : (m.epochs_run ?? "–")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <h3 className="card-title">{t("runs.cmp.settings")}</h3>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
              {t("runs.cmp.onlyDiff")}
            </label>
          </div>
          {configKeys.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("runs.cmp.same")}</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm" data-testid="settings-diff">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1 pr-3 font-medium">{t("runs.cmp.setting")}</th>
                    {data.runs.map((r, i) => (
                      <th key={r.id} className="px-2 py-1 font-medium">
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: RUN_COLORS[i] }} />
                          <span className="max-w-[8rem] truncate">{r.title}</span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {configKeys.map((k) => {
                    const differs = data.differing.includes(k);
                    return (
                      <tr key={k} data-differs={differs} className={`border-t border-line ${differs ? "bg-amber-500/10" : ""}`}>
                        <th scope="row" className="py-1.5 pr-3 font-mono text-xs font-medium">
                          {k}
                          {differs && <span className="sr-only"> ({t("runs.cmp.differs")})</span>}
                        </th>
                        {data.runs.map((r) => (
                          <td key={r.id} className={`px-2 py-1.5 font-mono text-xs ${differs ? "font-semibold" : "text-muted"}`}>
                            {formatSetting(r.config[k], yes, no)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
