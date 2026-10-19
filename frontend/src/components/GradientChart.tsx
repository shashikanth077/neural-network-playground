import { memo, useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EpochMetrics } from "../types";
import { useT } from "../i18n";
import { buildRows, COLORS, EmptyChart, Explain } from "./chartParts";
import { Rich, SectionHelp } from "./SectionHelp";

function GradientChartImpl({ history }: { history: EpochMetrics[] }) {
  const t = useT();
  const rows = useMemo(() => buildRows(history, null, (h) => ({ grad: h.grad_norm, param: h.param_norm })), [history]);
  return (
    <div>
      <h3 className="card-title">{t("pg.ch.grad.title")} <span className="chip ml-1">{t("pg.ch.optional")}</span></h3>
      <div className="mt-2 h-48 sm:h-56" role="img" aria-label={t("pg.ch.grad.aria")}>
        {rows.length === 0 ? (
          <EmptyChart text={t("pg.ch.grad.empty")} />
        ) : (
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: COLORS.axis }} />
              <YAxis yAxisId="g" tick={{ fontSize: 11, fill: COLORS.axis }} width={44} tickFormatter={(v: number) => v.toFixed(2)} />
              <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 11, fill: COLORS.axis }} width={44} tickFormatter={(v: number) => v.toFixed(1)} />
              <Tooltip formatter={(v: number) => (typeof v === "number" ? v.toFixed(4) : v)} labelFormatter={(l) => t("pg.ch.epochN", undefined, { n: String(l) })} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="g" type="monotone" dataKey="grad" name={t("pg.ch.grad.g")} stroke="#059669" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line yAxisId="p" type="monotone" dataKey="param" name={t("pg.ch.grad.p")} stroke="#db2777" dot={false} strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <Explain><Rich text={t("pg.ch.grad.explain")} /></Explain>
      <SectionHelp id="chart.grad" className="mt-2" />
    </div>
  );
}
export const GradientChart = memo(GradientChartImpl);
