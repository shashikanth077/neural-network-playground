import { memo, useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EpochMetrics, PinnedRun } from "../types";
import { buildRows, COLORS, EmptyChart, Explain } from "./chartParts";

interface Props { history: EpochMetrics[]; pinned: PinnedRun | null; hasVal: boolean; bestEpoch?: number | null }

function LossChartImpl({ history, pinned, hasVal, bestEpoch }: Props) {
  const rows = useMemo(() => buildRows(history, pinned, (h) => ({ train: h.train_loss, val: h.val_loss })), [history, pinned]);
  return (
    <div>
      <h3 className="card-title">Loss vs. epoch</h3>
      <div className="mt-2 h-56 sm:h-64" role="img" aria-label="Line chart of training and validation loss per epoch">
        {rows.length === 0 ? (
          <EmptyChart text="Loss will be plotted here once training produces its first epoch." />
        ) : (
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: COLORS.axis }} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.axis }} domain={[0, "auto"]} width={44} tickFormatter={(v: number) => v.toFixed(2)} />
              <Tooltip formatter={(v: number) => (typeof v === "number" ? v.toFixed(4) : v)} labelFormatter={(l) => `Epoch ${l}`} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {hasVal && bestEpoch ? <ReferenceLine x={bestEpoch} stroke="#059669" strokeDasharray="4 3" label={{ value: `best val · ${bestEpoch}`, fill: "#059669", fontSize: 11, position: "insideTopRight" }} /> : null}
              <Line type="monotone" dataKey="train" name="Train loss" stroke={COLORS.train} dot={false} strokeWidth={2} isAnimationActive={false} />
              {hasVal && <Line type="monotone" dataKey="val" name="Validation loss" stroke={COLORS.val} dot={false} strokeWidth={2} isAnimationActive={false} connectNulls />}
              {pinned && <Line type="monotone" dataKey="pin_train" name="Pinned train" stroke={COLORS.pinTrain} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
              {pinned && hasVal && <Line type="monotone" dataKey="pin_val" name="Pinned val" stroke={COLORS.pinVal} strokeDasharray="2 3" dot={false} isAnimationActive={false} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <Explain>
        <b>Loss</b> is the model's error score (binary cross-entropy): lower is better. A healthy run falls and flattens. If the validation line turns upward while training keeps falling, the model is starting to memorize (overfit).
      </Explain>
    </div>
  );
}
export const LossChart = memo(LossChartImpl);
