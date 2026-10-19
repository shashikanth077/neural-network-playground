import { memo, useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EpochMetrics, PinnedRun } from "../types";
import { useT } from "../i18n";
import { buildRows, COLORS, EmptyChart, Explain } from "./chartParts";
import { Rich, SectionHelp } from "./SectionHelp";

interface Props { history: EpochMetrics[]; pinned: PinnedRun | null; hasVal: boolean; bestEpoch?: number | null }

function LossChartImpl({ history, pinned, hasVal, bestEpoch }: Props) {
  const t = useT();
  const rows = useMemo(() => buildRows(history, pinned, (h) => ({ train: h.train_loss, val: h.val_loss })), [history, pinned]);
  return (
    <div>
      <h3 className="card-title">{t("pg.ch.loss.title")}</h3>
      <div className="mt-2 h-56 sm:h-64" role="img" aria-label={t("pg.ch.loss.aria")}>
        {rows.length === 0 ? (
          <EmptyChart text={t("pg.ch.loss.empty")} />
        ) : (
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: COLORS.axis }} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.axis }} domain={[0, "auto"]} width={44} tickFormatter={(v: number) => v.toFixed(2)} />
              <Tooltip formatter={(v: number) => (typeof v === "number" ? v.toFixed(4) : v)} labelFormatter={(l) => t("pg.ch.epochN", undefined, { n: String(l) })} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {hasVal && bestEpoch ? <ReferenceLine x={bestEpoch} stroke="#059669" strokeDasharray="4 3" label={{ value: t("pg.ch.bestVal", undefined, { n: bestEpoch }), fill: "#059669", fontSize: 11, position: "insideTopRight" }} /> : null}
              <Line type="monotone" dataKey="train" name={t("pg.ch.loss.train")} stroke={COLORS.train} dot={false} strokeWidth={2} isAnimationActive={false} />
              {hasVal && <Line type="monotone" dataKey="val" name={t("pg.ch.loss.val")} stroke={COLORS.val} dot={false} strokeWidth={2} isAnimationActive={false} connectNulls />}
              {pinned && <Line type="monotone" dataKey="pin_train" name={t("pg.ch.pinTrain")} stroke={COLORS.pinTrain} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
              {pinned && hasVal && <Line type="monotone" dataKey="pin_val" name={t("pg.ch.pinVal")} stroke={COLORS.pinVal} strokeDasharray="2 3" dot={false} isAnimationActive={false} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <Explain><Rich text={t("pg.ch.loss.explain")} /></Explain>
      <SectionHelp id="chart.loss" className="mt-2" formula={String.raw`L_{\text{BCE}}=-\big[y\ln p+(1-y)\ln(1-p)\big]`} />
    </div>
  );
}
export const LossChart = memo(LossChartImpl);
