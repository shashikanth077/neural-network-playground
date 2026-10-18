import type { EpochMetrics, PinnedRun } from "../types";
import { downsample } from "../lib/format";

export const COLORS = {
  train: "#4f46e5",
  val: "#d97706",
  pinTrain: "#94a3b8",
  pinVal: "#cbd5e1",
  grid: "rgba(120,130,150,.25)",
  axis: "rgb(120,130,150)",
};

export interface Row {
  epoch: number;
  [k: string]: number | null | undefined;
}

/** Merge the live history with an optional pinned run on the epoch axis (drawing-only thinning). */
export function buildRows(history: EpochMetrics[], pinned: PinnedRun | null, pick: (h: EpochMetrics) => Record<string, number | null>): Row[] {
  const byEpoch = new Map<number, Row>();
  for (const h of downsample(history)) byEpoch.set(h.epoch, { epoch: h.epoch, ...pick(h) });
  if (pinned) {
    for (const h of downsample(pinned.history)) {
      const r = byEpoch.get(h.epoch) ?? { epoch: h.epoch };
      const p = pick(h);
      for (const k of Object.keys(p)) r[`pin_${k}`] = p[k];
      byEpoch.set(h.epoch, r);
    }
  }
  return [...byEpoch.values()].sort((a, b) => a.epoch - b.epoch);
}

export function Explain({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs leading-relaxed text-muted">{children}</p>;
}

export function EmptyChart({ text }: { text: string }) {
  return (
    <div className="grid h-full place-items-center rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
      {text}
    </div>
  );
}
