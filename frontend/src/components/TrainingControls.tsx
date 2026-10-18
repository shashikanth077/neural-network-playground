import type { Playground } from "../hooks/usePlayground";
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
  const s = STATUS_LABEL[status ?? "none"];
  return (
    <span role="status" aria-live="polite" className="chip gap-2 !text-ink">
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
      {s.text}
    </span>
  );
}

export function TrainingControls({ pg }: { pg: Playground }) {
  const { status, session, creating } = pg;
  const hasSession = !!session;
  const canTrain = hasSession && !creating && (status === "ready" || status === "completed" || status === "failed");
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Training controls">
      <button className="btn-primary" onClick={pg.train} disabled={!canTrain}>
        ▶ {status === "completed" || status === "failed" ? "Train again" : "Train"}
      </button>
      <button className="btn-ghost" onClick={pg.pause} disabled={status !== "running"}>⏸ Pause</button>
      <button className="btn-ghost" onClick={pg.resume} disabled={status !== "paused"}>⏵ Resume</button>
      <button className="btn-ghost" onClick={pg.reset} disabled={!hasSession || status === "ready"}>↺ Reset</button>
      <button
        className="btn-ghost"
        onClick={() => pg.applyPreset(PRESETS[0])}
        title="Load the XOR example: a problem a single line cannot solve"
      >
        ✦ Load example
      </button>
    </div>
  );
}

export { DEFAULT_CONFIG };
