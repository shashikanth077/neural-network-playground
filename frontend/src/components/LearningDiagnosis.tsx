import { useMemo } from "react";
import { useT, type TFn } from "../i18n";
import { diagnose, type Diagnosis } from "../lib/diagnose";
import { Rich, SectionHelp } from "./SectionHelp";
import type { EpochMetrics, Loss } from "../types";

const TONE = {
  overfitting: "border-bad/50 bg-bad/10",
  underfitting: "border-c-amber/50 bg-c-amber/10",
  "good-fit": "border-ok/50 bg-ok/10",
  "too-early": "border-line bg-raised/60",
  "no-validation": "border-line bg-raised/60",
} as const;

/** Translated title and reason for a diagnosis (the English strings in `diagnose.ts` are the fallback). */
export function diagnosisText(t: TFn, d: Diagnosis) {
  return { title: t(`pg.diag.${d.verdict}.title`, d.title), reason: t(`pg.diag.${d.verdict}.reason`, d.reason, d.vars) };
}

export function LearningDiagnosis({ history, loss, stoppedEarly, restored, stopEpoch }: { history: EpochMetrics[]; loss: Loss; stoppedEarly: boolean; restored: boolean; stopEpoch: number }) {
  const t = useT();
  const d = useMemo(() => diagnose(history, loss), [history, loss]);
  const text = diagnosisText(t, d);
  return (
    <div className={`mt-4 rounded-xl border p-3 text-sm ${TONE[d.verdict]}`} role="status" aria-live="polite">
      <p className="font-semibold">{t("pg.diag.reading", undefined, { title: text.title })}</p>
      <p className="mt-1 text-muted">{text.reason}</p>
      {stoppedEarly && (
        <p className="mt-1.5 text-muted">
          <Rich text={t("pg.diag.stopped", undefined, { epoch: stopEpoch })} />
          {restored ? `; ${t("pg.diag.restored")}` : "."}
        </p>
      )}
      <p className="mt-1.5 text-xs text-muted">{t("pg.diag.rule")}</p>
      <SectionHelp id="diagnosis" className="mt-2" />
    </div>
  );
}
