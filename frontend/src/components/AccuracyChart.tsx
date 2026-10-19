import { memo, useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EpochMetrics, PinnedRun } from "../types";
import { useT } from "../i18n";
import { buildRows, COLORS, EmptyChart, Explain } from "./chartParts";
import { Rich, SectionHelp } from "./SectionHelp";

interface Props { history: EpochMetrics[]; pinned: PinnedRun | null; hasVal: boolean }

function AccuracyChartImpl({ history, pinned, hasVal }: Props) {
  const t = useT();
  const rows = useMemo(() => buildRows(history, pinned, (h) => ({ train: h.train_acc * 100, val: h.val_acc === null ? null : h.val_acc * 100 })), [history, pinned]);
  return (
    <div>
      <h3 className="card-title">{t("pg.ch.acc.title")}</h3>
      <div className="mt-2 h-56 sm:h-64" role="img" aria-label={t("pg.ch.acc.aria")}>
        {rows.length === 0 ? (
          <EmptyChart text={t("pg.ch.acc.empty")} />
        ) : (
          <ResponsiveContainer>
            <LineChart data={rows} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: COLORS.axis }} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.axis }} domain={[0, 100]} width={44} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v: number) => (typeof v === "number" ? `${v.toFixed(1)}%` : v)} labelFormatter={(l) => t("pg.ch.epochN", undefined, { n: String(l) })} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="train" name={t("pg.ch.acc.train")} stroke={COLORS.train} dot={false} strokeWidth={2} isAnimationActive={false} />
              {hasVal && <Line type="monotone" dataKey="val" name={t("pg.ch.acc.val")} stroke={COLORS.val} dot={false} strokeWidth={2} isAnimationActive={false} connectNulls />}
              {pinned && <Line type="monotone" dataKey="pin_train" name={t("pg.ch.pinTrain")} stroke={COLORS.pinTrain} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <Explain><Rich text={t("pg.ch.acc.explain")} /></Explain>
      <SectionHelp id="chart.acc" className="mt-2" />
    </div>
  );
}
export const AccuracyChart = memo(AccuracyChartImpl);
