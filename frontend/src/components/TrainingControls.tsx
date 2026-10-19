import type { Playground } from "../hooks/usePlayground";
import { useT } from "../i18n";
import { DEFAULT_CONFIG, PRESETS } from "../lib/presets";
import type { TrainStatus } from "../types";

export const STATUS_LABEL: Record<TrainStatus | "none", { text: string; dot: string }> = {
  none: { text: "No model", dot: "bg-muted" },
  ready: { text: "Ready", dot: "bg-brand" },
  running: { text: "Training", dot: "bg-ok animate-pulse" },
  paused: { text: "Paused", dot: "bg-neg" },
  completed: { text: "Completed", dot: "bg-ok" },
  failed: { text: "Failed", dot: "bg-bad" },
};

export function StatusIndicator({ status }: { status: TrainStatus | null }) {
  const t = useT();
  const key = status ?? "none";
  const s = STATUS_LABEL[key];
  return (
    <span role="status" aria-live="polite" className="chip gap-2 !text-ink">
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
      {t(`pg.status.${key}`, s.text)}
    </span>
  );
}

export function TrainingControls({ pg }: { pg: Playground }) {
  const t = useT();
  const { status, session, creating } = pg;
  const hasSession = !!session;
  const canTrain = hasSession && !creating && (status === "ready" || status === "completed" || status === "failed");
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("pg.training.controls")}>
      <button className="btn-primary" onClick={pg.train} disabled={!canTrain}>
        ▶ {status === "completed" || status === "failed" ? t("pg.btn.trainAgain") : t("pg.btn.train")}
      </button>
      <button className="btn-ghost" onClick={pg.pause} disabled={status !== "running"}>⏸ {t("pg.btn.pause")}</button>
      <button className="btn-ghost" onClick={pg.resume} disabled={status !== "paused"}>⏵ {t("pg.btn.resume")}</button>
      <button className="btn-ghost" onClick={pg.reset} disabled={!hasSession || status === "ready"}>↺ {t("pg.btn.reset")}</button>
      <button
        className="btn-ghost"
        onClick={() => pg.applyPreset(PRESETS[0])}
        title={t("pg.btn.loadExample.title")}
      >
        ✦ {t("pg.btn.loadExample")}
      </button>
    </div>
  );
}

export { DEFAULT_CONFIG };
