import { memo, useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EpochMetrics, PinnedRun } from "../types";
import { buildRows, COLORS, EmptyChart, Explain } from "./chartParts";

interface Props { history: EpochMetrics[]; pinned: PinnedRun | null; hasVal: boolean }

function AccuracyChartImpl({ history, pinned, hasVal }: Props) {
  const rows = useMemo(() => buildRows(history, pinned, (h) => ({ train: h.train_acc * 100, val: h.val_acc === null ? null : h.val_acc * 100 })), [history, pinned]);
  return (
    <div>
      <h3 className="card-title">Accuracy vs. epoch</h3>
      <div className="mt-2 h-56 sm:h-64" role="img" aria-label="Line chart of training and validation accuracy per epoch">
        {rows.length === 0 ? (
          <EmptyChart text="Accuracy will be plotted here once training produces its first epoch." />
        ) : (
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: COLORS.axis }} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.axis }} domain={[0, 100]} width={44} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v: number) => (typeof v === "number" ? `${v.toFixed(1)}%` : v)} labelFormatter={(l) => `Epoch ${l}`} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="train" name="Train accuracy" stroke={COLORS.train} dot={false} strokeWidth={2} isAnimationActive={false} />
              {hasVal && <Line type="monotone" dataKey="val" name="Validation accuracy" stroke={COLORS.val} dot={false} strokeWidth={2} isAnimationActive={false} connectNulls />}
              {pinned && <Line type="monotone" dataKey="pin_train" name="Pinned train" stroke={COLORS.pinTrain} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <Explain>
        <b>Accuracy</b> is the share of points classified correctly (probability ≥ 0.5 means class 1). 50% is coin-flipping on balanced data. Validation accuracy shows how well the model handles points it never trained on.
      </Explain>
    </div>
  );
}
export const AccuracyChart = memo(AccuracyChartImpl);
