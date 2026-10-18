import type { Playground } from "../hooks/usePlayground";
import { duration, fmt, pct } from "../lib/format";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-raised/70 p-3" title={hint}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function TrainingMetrics({ pg }: { pg: Playground }) {
  const s = pg.session;
  const l = s?.latest ?? null;
  const hasVal = (s?.n_val ?? 0) > 0;
  return (
    <section className="card p-4" aria-labelledby="metrics-title">
      <h2 id="metrics-title" className="card-title">Training metrics</h2>
      {!s ? (
        <p className="mt-3 text-sm text-muted">No model yet. Configure a valid dataset and network to begin.</p>
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Epoch" value={`${s.epoch} / ${s.total_epochs}`} />
            <Stat label="Elapsed" value={duration(s.elapsed_seconds)} hint="Time spent actually training (excludes pauses)" />
            <Stat label="Train loss" value={fmt(l?.train_loss)} hint="Binary cross-entropy on training data" />
            <Stat label="Val loss" value={hasVal ? fmt(l?.val_loss) : "n/a"} hint="Loss on held-out data" />
            <Stat label="Train accuracy" value={pct(l?.train_acc)} />
            <Stat label="Val accuracy" value={hasVal ? pct(l?.val_acc) : "n/a"} />
            <Stat label="Samples" value={`${s.n_train} train / ${s.n_val} val`} />
            <Stat label="Parameters" value={s.n_parameters.toLocaleString()} />
          </dl>
          {s.epoch === 0 && s.status === "ready" && (
            <p className="mt-3 text-xs text-muted">
              Metrics appear after the first epoch. Press <b>Train</b> to start.
            </p>
          )}
        </>
      )}
    </section>
  );
}
