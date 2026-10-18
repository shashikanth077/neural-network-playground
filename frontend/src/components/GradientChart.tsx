import { memo, useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EpochMetrics } from "../types";
import { buildRows, COLORS, EmptyChart, Explain } from "./chartParts";

function GradientChartImpl({ history }: { history: EpochMetrics[] }) {
  const rows = useMemo(() => buildRows(history, null, (h) => ({ grad: h.grad_norm, param: h.param_norm })), [history]);
  return (
    <div>
      <h3 className="card-title">Gradient &amp; parameter norms <span className="chip ml-1">optional</span></h3>
      <div className="mt-2 h-48 sm:h-56" role="img" aria-label="Line chart of gradient norm and parameter norm per epoch">
        {rows.length === 0 ? (
          <EmptyChart text="Norms appear after the first epoch." />
        ) : (
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: COLORS.axis }} />
              <YAxis yAxisId="g" tick={{ fontSize: 11, fill: COLORS.axis }} width={44} tickFormatter={(v: number) => v.toFixed(2)} />
              <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 11, fill: COLORS.axis }} width={44} tickFormatter={(v: number) => v.toFixed(1)} />
              <Tooltip formatter={(v: number) => (typeof v === "number" ? v.toFixed(4) : v)} labelFormatter={(l) => `Epoch ${l}`} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="g" type="monotone" dataKey="grad" name="Gradient norm (mean per epoch)" stroke="#059669" dot={false} strokeWidth={2} isAnimationActive={false} />
              <Line yAxisId="p" type="monotone" dataKey="param" name="Parameter norm" stroke="#db2777" dot={false} strokeWidth={2} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <Explain>
        The <b>gradient norm</b> measures how steep the loss surface is: it shrinks as the model settles (or if gradients vanish). The <b>parameter norm</b> is the total size of all weights; steady growth means the model is committing to sharper decisions.
      </Explain>
    </div>
  );
}
export const GradientChart = memo(GradientChartImpl);
