import type { Playground } from "../hooks/usePlayground";
import { PRESETS } from "../lib/presets";

export function ExperimentPresets({ pg }: { pg: Playground }) {
  const active = PRESETS.find((p) => p.id === pg.activePreset?.id) ?? null;
  return (
    <section className="card p-4" aria-labelledby="presets-title">
      <h2 id="presets-title" className="card-title">Experiment presets</h2>
      <p className="mt-1 text-xs text-muted">
        Each preset sets the dataset and model, then resets training. Outcomes depend on the seed, initialization and hyper-parameters; nothing here is guaranteed.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {PRESETS.map((p) => {
          const isActive = active?.id === p.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => pg.applyPreset(p, p.variants?.[1] ?? p.variants?.[0])}
                aria-pressed={isActive}
                className={`h-full w-full rounded-xl border p-3 text-left transition ${
                  isActive ? "border-brand bg-brand/10" : "border-line hover:bg-raised"
                }`}
              >
                <span className="block text-sm font-semibold">{p.title}</span>
                <span className="mt-0.5 block text-xs text-muted">{p.summary}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {active && (
        <div className="mt-4 rounded-xl bg-raised/70 p-3" aria-live="polite">
          <p className="text-sm font-semibold">What to look for: {active.title}</p>
          {active.variants && (
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Variants of this experiment">
              {active.variants.map((v) => (
                <button
                  key={v.label}
                  onClick={() => pg.applyVariant(active, v)}
                  aria-pressed={pg.activePreset?.variant === v.label}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                    pg.activePreset?.variant === v.label ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:text-ink"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
            {active.observe.map((o) => <li key={o}>{o}</li>)}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="btn-ghost !py-1 !text-xs" onClick={pg.pinRun} disabled={pg.history.length === 0}>
              📌 Pin this run for comparison
            </button>
            {pg.pinned && (
              <button className="btn-ghost !py-1 !text-xs" onClick={pg.clearPin}>Clear pinned run</button>
            )}
          </div>
          {pg.pinned && <p className="mt-1 text-xs text-muted">Pinned: {pg.pinned.label} (dashed grey on the charts)</p>}
        </div>
      )}
      {!active && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="btn-ghost !py-1 !text-xs" onClick={pg.pinRun} disabled={pg.history.length === 0}>
            📌 Pin this run for comparison
          </button>
          {pg.pinned && <button className="btn-ghost !py-1 !text-xs" onClick={pg.clearPin}>Clear pinned run</button>}
        </div>
      )}
    </section>
  );
}
