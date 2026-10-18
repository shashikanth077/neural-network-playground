import type { Playground } from "../hooks/usePlayground";
import { StatusIndicator, TrainingControls } from "./TrainingControls";

export function Header({ pg }: { pg: Playground }) {
  const pct = pg.session ? Math.round((pg.session.epoch / pg.session.total_epochs) * 100) : 0;
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Neural Network Playground</h1>
            <StatusIndicator status={pg.status} />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Pick a dataset, design a network, then train it and watch real weights, loss and decision boundaries change, epoch by epoch.
          </p>
        </div>
        <TrainingControls pg={pg} />
      </div>
      <div
        className="h-1 bg-raised"
        role="progressbar"
        aria-label="Training progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="h-full bg-brand transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
