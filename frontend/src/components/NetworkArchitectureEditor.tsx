import type { Playground } from "../hooks/usePlayground";
import { countParameters } from "../lib/validation";
import type { Activation, Initializer, Optimizer } from "../types";
import { Field } from "./Field";

const ACTS: Activation[] = ["relu", "sigmoid", "tanh"];
const INITS: { v: Initializer; label: string }[] = [
  { v: "xavier", label: "Xavier / Glorot (uniform)" },
  { v: "he", label: "He (normal)" },
  { v: "small_normal", label: "Small normal (σ = 0.1)" },
  { v: "zeros", label: "Zeros (demo: symmetry problem)" },
];

export function NetworkArchitectureEditor({ pg }: { pg: Playground }) {
  const { config: c, setConfig, configErrors: err, locked } = pg;
  const layers = c.hidden_layers;
  const setLayers = (next: number[]) => setConfig({ hidden_layers: next });
  const num = (v: string, d: number) => (v === "" ? d : Number(v));

  return (
    <section className="card p-4" aria-labelledby="arch-title">
      <div className="flex items-center justify-between">
        <h2 id="arch-title" className="card-title">Network designer</h2>
        <span className="chip" title="Weights + biases that training can change">
          {countParameters(layers).toLocaleString()} trainable parameters
        </span>
      </div>
      {locked && (
        <p className="mt-2 rounded-lg bg-raised p-2 text-xs text-muted">
          Settings are locked while a run is active. Press <b>Reset</b> to edit them.
        </p>
      )}
      <fieldset disabled={locked} className="mt-3 space-y-4">
        <legend className="sr-only">Network and training settings</legend>

        <div>
          <div className="label">Hidden layers ({layers.length} / 5)</div>
          <div className="space-y-2">
            {layers.map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <label htmlFor={`layer-${i}`} className="w-16 shrink-0 text-xs text-muted">Layer {i + 1}</label>
                <input
                  id={`layer-${i}`}
                  type="range"
                  min={1}
                  max={32}
                  value={n}
                  onChange={(e) => setLayers(layers.map((v, j) => (j === i ? Number(e.target.value) : v)))}
                  className="min-w-0 flex-1 accent-brand"
                  aria-valuetext={`${n} neurons`}
                />
                <span className="w-14 text-right font-mono text-xs">{n} <span className="text-muted">n</span></span>
                <button
                  className="btn-ghost !px-2 !py-0.5 !text-xs"
                  aria-label={`Remove hidden layer ${i + 1}`}
                  onClick={() => setLayers(layers.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
            {layers.length === 0 && (
              <p className="text-xs text-muted">No hidden layers: the model is a single neuron (logistic regression).</p>
            )}
          </div>
          <button
            className="btn-ghost mt-2 w-full !py-1.5 !text-xs"
            disabled={layers.length >= 5}
            onClick={() => setLayers([...layers, layers[layers.length - 1] ?? 4])}
          >
            + Add hidden layer
          </button>
          <p className="mt-1 text-xs text-muted">
            Each hidden layer lets the network build more complex features from the previous one. Input: 2 features (x, y). Output: 1 neuron, the probability of class 1.
          </p>
          {err.hidden_layers && <p role="alert" className="mt-1 text-xs text-bad">{err.hidden_layers}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field id="act" label="Activation" help="The non-linearity applied in hidden layers. Without it, depth adds no power.">
            <select id="act" className="field" value={c.activation} onChange={(e) => setConfig({ activation: e.target.value as Activation })}>
              {ACTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field id="opt" label="Optimizer" help="SGD: plain steps. Adam: adaptive per-weight steps.">
            <select id="opt" className="field" value={c.optimizer} onChange={(e) => setConfig({ optimizer: e.target.value as Optimizer })}>
              <option value="sgd">SGD</option>
              <option value="adam">Adam</option>
            </select>
          </Field>
        </div>

        <Field id="init" label="Weight initialization" help="Starting weights. Good scaling keeps signals and gradients healthy; zeros leaves every neuron identical.">
          <select id="init" className="field" value={c.init} onChange={(e) => setConfig({ init: e.target.value as Initializer })}>
            {INITS.map((i) => <option key={i.v} value={i.v}>{i.label}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field id="lr" label="Learning rate" help="Step size. Too small is slow; too large can diverge." error={err.learning_rate}>
            <input id="lr" type="number" step="any" min={0} max={10} className="field" value={c.learning_rate}
              aria-invalid={!!err.learning_rate} aria-describedby={err.learning_rate ? "lr-err" : "lr-help"}
              onChange={(e) => setConfig({ learning_rate: num(e.target.value, 0) })} />
          </Field>
          <Field id="batch" label="Batch size" help="Samples per weight update (1–512)." error={err.batch_size}>
            <input id="batch" type="number" min={1} max={512} className="field" value={c.batch_size}
              aria-invalid={!!err.batch_size}
              onChange={(e) => setConfig({ batch_size: num(e.target.value, 1) })} />
          </Field>
          <Field id="epochs" label="Epochs" help="Full passes over the training data (1–2000)." error={err.epochs}>
            <input id="epochs" type="number" min={1} max={2000} className="field" value={c.epochs}
              aria-invalid={!!err.epochs}
              onChange={(e) => setConfig({ epochs: num(e.target.value, 1) })} />
          </Field>
          <Field id="val" label="Validation split" help="Held-out share used only for measuring (0–0.5)." error={err.val_split}>
            <input id="val" type="number" step={0.05} min={0} max={0.5} className="field" value={c.val_split}
              aria-invalid={!!err.val_split}
              onChange={(e) => setConfig({ val_split: num(e.target.value, 0) })} />
          </Field>
          <Field id="mseed" label="Model seed" help="Reproducible init and shuffling." error={err.seed}>
            <input id="mseed" type="number" min={0} className="field" value={c.seed}
              onChange={(e) => setConfig({ seed: Math.max(0, Math.floor(num(e.target.value, 0))) })} />
          </Field>
          <Field id="delay" label="Epoch delay (ms)" help="Pacing only: slows training so you can watch it. Does not change results.">
            <input id="delay" type="number" min={0} max={1000} className="field" value={c.epoch_delay_ms}
              onChange={(e) => setConfig({ epoch_delay_ms: Math.min(1000, Math.max(0, Math.floor(num(e.target.value, 0)))) })} />
          </Field>
        </div>
      </fieldset>
    </section>
  );
}
