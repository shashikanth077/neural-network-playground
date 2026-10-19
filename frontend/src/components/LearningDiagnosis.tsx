import { useMemo } from "react";
import { diagnose } from "../lib/diagnose";
import type { EpochMetrics, Loss } from "../types";

const TONE = {
  overfitting: "border-bad/50 bg-bad/10",
  underfitting: "border-c-amber/50 bg-c-amber/10",
  "good-fit": "border-ok/50 bg-ok/10",
  "too-early": "border-line bg-raised/60",
  "no-validation": "border-line bg-raised/60",
} as const;

export function LearningDiagnosis({ history, loss, stoppedEarly, restored, stopEpoch }: { history: EpochMetrics[]; loss: Loss; stoppedEarly: boolean; restored: boolean; stopEpoch: number }) {
  const d = useMemo(() => diagnose(history, loss), [history, loss]);
  return (
    <div className={`mt-4 rounded-xl border p-3 text-sm ${TONE[d.verdict]}`} role="status" aria-live="polite">
      <p className="font-semibold">Learning-curve reading: {d.title}</p>
      <p className="mt-1 text-muted">{d.reason}</p>
      {stoppedEarly && (
        <p className="mt-1.5 text-muted">
          <b className="text-ink">Early stopping</b> ended training at epoch {stopEpoch}
          {restored ? "; the weights from the best validation epoch were restored." : "."}
        </p>
      )}
      <p className="mt-1.5 text-xs text-muted">A rule of thumb on the curves above (lecture 5), not a guarantee: small validation sets are noisy.</p>
    </div>
  );
}
