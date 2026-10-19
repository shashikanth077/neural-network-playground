import type { ReactNode } from "react";
import type { Playground } from "../hooks/usePlayground";
import { ACTIVATION_OPTIONS, LOSS_OPTIONS, OPTIMIZER_OPTIONS } from "../lib/options";
import { countParameters } from "../lib/validation";
import type { Activation, Initializer, Loss, Optimizer } from "../types";
import { Field } from "./Field";

const INITS: { v: Initializer; label: string }[] = [
  { v: "xavier", label: "Xavier / Glorot (uniform)" },
  { v: "he", label: "He (normal)" },
  { v: "small_normal", label: "Small normal (σ = 0.1)" },
  { v: "zeros", label: "Zeros (demo: symmetry problem)" },
];

function Section({ title, children, open = true, id }: { title: string; children: ReactNode; open?: boolean; id: string }) {
  return (
    <details open={open} className="group rounded-xl border border-line" id={id}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-semibold marker:hidden">
        {title}
        <span aria-hidden className="text-muted transition group-open:rotate-180">▾</span>
      </summary>
      <div className="space-y-3 border-t border-line p-3">{children}</div>
    </details>
  );
}

export function NetworkArchitectureEditor({ pg }: { pg: Playground }) {
  const { config: c, setConfig, configErrors: err, locked } = pg;
  const layers = c.hidden_layers;
  const setLayers = (next: number[]) => setConfig({ hidden_layers: next });
  const num = (v: string, d: number) => (v === "" ? d : Number(v));
  const n = pg.data?.labels.length ?? 0;
  const nTrain = pg.session?.n_train ?? Math.round(n * (1 - c.val_split));
  const effBatch = Math.max(1, Math.min(c.batch_size, nTrain || c.batch_size));
  const updates = nTrain ? Math.ceil(nTrain / effBatch) : null;
  const mode = c.batch_size === 1 ? "Stochastic GD (1 sample per update)" : nTrain && c.batch_size >= nTrain ? "Batch gradient descent (whole training set per update)" : "Mini-batch gradient descent";
  const opt = OPTIMIZER_OPTIONS.find((o) => o.value === c.optimizer)!;
  const act = ACTIVATION_OPTIONS.find((o) => o.value === c.activation)!;
  const loss = LOSS_OPTIONS.find((o) => o.value === c.loss)!;
  const params = countParameters(layers, c.batch_norm);

  return (
    <section className="card p-4" aria-labelledby="arch-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="arch-title" className="card-title">Network designer</h2>
        <span className="chip" title="Weights, biases and (with batch norm) scale/shift that training can change">
          {params.toLocaleString()} trainable parameters
        </span>
      </div>
      {locked && (
        <p className="mt-2 rounded-lg bg-raised p-2 text-xs text-muted">
          Settings are locked while a run is active. Press <b>Reset</b> to edit them.
        </p>
      )}
      <fieldset disabled={locked} className="mt-3 space-y-3">
        <legend className="sr-only">Network and training settings</legend>

        <Section id="sec-arch" title="1 · Architecture">
          <div>
            <div className="label">Hidden layers ({layers.length} / 5)</div>
            <div className="space-y-2">
              {layers.map((u, i) => (
                <div key={i} className="flex items-center gap-2">
                  <label htmlFor={`layer-${i}`} className="w-16 shrink-0 text-xs text-muted">Layer {i + 1}</label>
                  <input id={`layer-${i}`} type="range" min={1} max={32} value={u}
                    onChange={(e) => setLayers(layers.map((v, j) => (j === i ? Number(e.target.value) : v)))}
                    className="min-w-0 flex-1 accent-brand" aria-valuetext={`${u} neurons`} />
                  <span className="w-14 text-right font-mono text-xs">{u} <span className="text-muted">n</span></span>
                  <button className="btn-ghost !px-2 !py-0.5 !text-xs" aria-label={`Remove hidden layer ${i + 1}`} onClick={() => setLayers(layers.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              {layers.length === 0 && <p className="text-xs text-muted">No hidden layers: the model is a single neuron (logistic regression).</p>}
            </div>
            <button className="btn-ghost mt-2 w-full !py-1.5 !text-xs" disabled={layers.length >= 5} onClick={() => setLayers([...layers, layers[layers.length - 1] ?? 4])}>
              + Add hidden layer
            </button>
            <p className="mt-1 text-xs text-muted">Each hidden layer builds more complex features from the previous one. Input: 2 features (x, y). Output: 1 neuron, the probability of class 1. Too few neurons underfit; too many can memorise noise.</p>
            {err.hidden_layers && <p role="alert" className="mt-1 text-xs text-bad">{err.hidden_layers}</p>}
          </div>
          <Field id="act" label="Hidden activation" help={act.note}>
            <select id="act" className="field" value={c.activation} onChange={(e) => setConfig({ activation: e.target.value as Activation })}>
              {ACTIVATION_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>
          <Field id="init" label="Weight initialization" help="Starting weights. Good scaling keeps signals and gradients healthy; zeros leaves every neuron identical (the symmetry problem).">
            <select id="init" className="field" value={c.init} onChange={(e) => setConfig({ init: e.target.value as Initializer })}>
              {INITS.map((i) => <option key={i.v} value={i.v}>{i.label}</option>)}
            </select>
          </Field>
        </Section>

        <Section id="sec-opt" title="2 · Optimization">
          <Field id="opt" label="Optimizer" help={opt.note}>
            <select id="opt" className="field" value={c.optimizer} onChange={(e) => setConfig({ optimizer: e.target.value as Optimizer })}>
              {OPTIMIZER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field id="lr" label="Learning rate" help="Step size. Too small is slow; too large can diverge." error={err.learning_rate}>
            <input id="lr" type="number" step="any" min={0} max={10} className="field" value={c.learning_rate}
              aria-invalid={!!err.learning_rate} aria-describedby={err.learning_rate ? "lr-err" : "lr-help"}
              onChange={(e) => setConfig({ learning_rate: num(e.target.value, 0) })} />
          </Field>
          {c.learning_rate !== opt.lr && (
            <button type="button" className="btn-ghost w-full !py-1 !text-xs" onClick={() => setConfig({ learning_rate: opt.lr })}>
              Use a typical rate for this optimizer ({opt.lr})
            </button>
          )}
          <Field id="loss" label="Loss function" help={loss.note}>
            <select id="loss" className="field" value={c.loss} onChange={(e) => setConfig({ loss: e.target.value as Loss })}>
              {LOSS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="epochs" label="Epochs" help="Full passes over the training data (1–2000)." error={err.epochs}>
              <input id="epochs" type="number" min={1} max={2000} className="field" value={c.epochs} aria-invalid={!!err.epochs}
                onChange={(e) => setConfig({ epochs: num(e.target.value, 1) })} />
            </Field>
            <Field id="mseed" label="Model seed" help="Reproducible init and shuffling." error={err.seed}>
              <input id="mseed" type="number" min={0} className="field" value={c.seed}
                onChange={(e) => setConfig({ seed: Math.max(0, Math.floor(num(e.target.value, 0))) })} />
            </Field>
          </div>
          <Field id="delay" label="Epoch delay (ms)" help="Pacing only: slows training so you can watch it. Does not change results.">
            <input id="delay" type="number" min={0} max={1000} className="field" value={c.epoch_delay_ms}
              onChange={(e) => setConfig({ epoch_delay_ms: Math.min(1000, Math.max(0, Math.floor(num(e.target.value, 0)))) })} />
          </Field>
        </Section>

        <Section id="sec-batch" title="3 · Batching">
          <div role="group" aria-label="Gradient descent variant" className="flex flex-wrap gap-1.5">
            {[
              { label: "Batch GD", value: Math.max(1, nTrain || 160), hint: "Whole training set per update" },
              { label: "Mini-batch", value: 32, hint: "A few samples per update" },
              { label: "SGD", value: 1, hint: "One sample per update" },
            ].map((b) => (
              <button key={b.label} type="button" title={b.hint} onClick={() => setConfig({ batch_size: b.value })}
                aria-pressed={c.batch_size === b.value}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${c.batch_size === b.value ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:text-ink"}`}>
                {b.label}
              </button>
            ))}
          </div>
          <Field id="batch" label="Batch size" help={`${mode}${updates ? `: ${updates} weight update${updates === 1 ? "" : "s"} per epoch (⌈${nTrain}/${effBatch}⌉).` : "."}`} error={err.batch_size}>
            <input id="batch" type="number" min={1} max={2000} className="field" value={c.batch_size} aria-invalid={!!err.batch_size}
              onChange={(e) => setConfig({ batch_size: num(e.target.value, 1) })} />
          </Field>
          <p className="text-xs text-muted">Smaller batches update more often but with noisier gradients; the whole set gives smooth but slow, memory-hungry steps.</p>
        </Section>

        <Section id="sec-reg" title="4 · Regularization" open={false}>
          <p className="text-xs text-muted">Ways to fight overfitting. They act only during training; predictions use the full network.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field id="l1" label="L1 (lasso) λ" help="Adds λ·Σ|w|. Pushes many weights to exactly zero." error={err.l1}>
              <input id="l1" type="number" step={0.001} min={0} max={1} className="field" value={c.l1} aria-invalid={!!err.l1}
                onChange={(e) => setConfig({ l1: num(e.target.value, 0) })} />
            </Field>
            <Field id="l2" label="L2 (ridge) λ" help="Adds λ·Σw². Shrinks all weights smoothly (weight decay)." error={err.l2}>
              <input id="l2" type="number" step={0.001} min={0} max={1} className="field" value={c.l2} aria-invalid={!!err.l2}
                onChange={(e) => setConfig({ l2: num(e.target.value, 0) })} />
            </Field>
          </div>
          <p className="text-xs text-muted">Both above 0 = elastic net (L1 and L2 together). Typical values: 0.001–0.1.</p>
          <div className="min-w-[180px]">
            <label htmlFor="dropout" className="flex items-baseline justify-between text-xs font-medium text-muted">
              <span title="Probability that a hidden neuron is switched off on each training step">Dropout rate</span>
              <output htmlFor="dropout" className="font-mono text-sm text-ink">{c.dropout.toFixed(2)}</output>
            </label>
            <input id="dropout" type="range" min={0} max={0.9} step={0.05} value={c.dropout} className="mt-1 w-full accent-brand"
              onChange={(e) => setConfig({ dropout: Number(e.target.value) })} />
            <p className="mt-1 text-xs text-muted">Randomly drops hidden neurons so none becomes too specialised. Kept ones are scaled by 1/(1−rate).</p>
            {err.dropout && <p role="alert" className="text-xs text-bad">{err.dropout}</p>}
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={c.batch_norm} onChange={(e) => setConfig({ batch_norm: e.target.checked })} />
            <span>Batch normalization<small className="block text-xs text-muted">Normalises each hidden layer over the mini-batch, then rescales with learned γ and β. Needs batch size ≥ 2.</small></span>
          </label>
        </Section>

        <Section id="sec-val" title="5 · Validation & early stopping" open={false}>
          <Field id="val" label="Validation split" help="Held-out share used only for measuring (0–0.5)." error={err.val_split}>
            <input id="val" type="number" step={0.05} min={0} max={0.5} className="field" value={c.val_split} aria-invalid={!!err.val_split}
              onChange={(e) => setConfig({ val_split: num(e.target.value, 0) })} />
          </Field>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={c.early_stopping} onChange={(e) => setConfig({ early_stopping: e.target.checked })} />
            <span>Early stopping<small className="block text-xs text-muted">Stop when the validation loss has not improved for <i>patience</i> epochs.</small></span>
          </label>
          {err.early_stopping && <p role="alert" className="text-xs text-bad">{err.early_stopping}</p>}
          {c.early_stopping && (
            <div className="grid grid-cols-2 gap-3">
              <Field id="patience" label="Patience (epochs)" help="Epochs to wait for an improvement." error={err.patience}>
                <input id="patience" type="number" min={1} max={500} className="field" value={c.patience} aria-invalid={!!err.patience}
                  onChange={(e) => setConfig({ patience: Math.max(1, Math.floor(num(e.target.value, 1))) })} />
              </Field>
              <label className="flex cursor-pointer items-start gap-2 pt-5 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={c.restore_best} onChange={(e) => setConfig({ restore_best: e.target.checked })} />
                <span>Restore best weights</span>
              </label>
            </div>
          )}
        </Section>
      </fieldset>
    </section>
  );
}
