import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { fmt } from "../lib/format";
import type { EpochMetrics, IterationTrace, ModelConfig, ModelParameters, SessionStatus } from "../types";
import { Tex } from "./Tex";

export interface LearnCtx {
  config: ModelConfig;
  session: SessionStatus | null;
  history: EpochMetrics[];
  params: ModelParameters | null;
}

/* ------------------------------------------------------------- interactive widgets */
const ACT = {
  relu: { f: (x: number) => Math.max(0, x), d: (x: number) => (x > 0 ? 1 : 0), tex: String.raw`f(x)=\max(0,x)`, dtex: String.raw`f'(x)=\begin{cases}1&x>0\\0&x\le0\end{cases}` },
  sigmoid: { f: (x: number) => 1 / (1 + Math.exp(-x)), d: (x: number) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }, tex: String.raw`f(x)=\frac{1}{1+e^{-x}}`, dtex: String.raw`f'(x)=f(x)\,(1-f(x))` },
  tanh: { f: Math.tanh, d: (x: number) => 1 - Math.tanh(x) ** 2, tex: String.raw`f(x)=\tanh(x)`, dtex: String.raw`f'(x)=1-\tanh^2(x)` },
} as const;

export function ActivationExplorer({ initial }: { initial: keyof typeof ACT }) {
  const [name, setName] = useState<keyof typeof ACT>(initial);
  const [x, setX] = useState(0.8);
  useEffect(() => setName(initial), [initial]);
  const a = ACT[name];
  const pts = (fn: (v: number) => number) =>
    Array.from({ length: 121 }, (_, i) => { const v = -6 + i * 0.1; return `${(v + 6) * 20},${100 - fn(v) * 30 - 30 + 30 * 0}`; }).join(" ");
  const yMap = (v: number) => 60 - v * 28;
  const line = (fn: (v: number) => number) => Array.from({ length: 121 }, (_, i) => { const v = -6 + i * 0.1; return `${i * 2},${yMap(fn(v))}`; }).join(" ");
  void pts;
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Activation function">
        {(Object.keys(ACT) as (keyof typeof ACT)[]).map((k) => (
          <button key={k} role="radio" aria-checked={name === k} onClick={() => setName(k)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${name === k ? "border-brand bg-brand/10 text-brand" : "border-line text-muted"}`}>
            {k}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 240 120" className="mt-3 w-full max-w-md" role="img" aria-label={`Plot of ${name} and its derivative`}>
        <line x1="0" y1={yMap(0)} x2="240" y2={yMap(0)} style={{ stroke: "rgb(var(--line))" }} />
        <line x1="120" y1="0" x2="120" y2="120" style={{ stroke: "rgb(var(--line))" }} />
        <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={line(a.f)} />
        <polyline fill="none" stroke="#d97706" strokeWidth="1.6" strokeDasharray="4 3" points={line(a.d)} />
        <circle cx={(x + 6) * 20} cy={yMap(a.f(x))} r="3.5" fill="#4f46e5" />
        <circle cx={(x + 6) * 20} cy={yMap(a.d(x))} r="3.5" fill="#d97706" />
      </svg>
      <div className="flex gap-4 text-xs"><span><span className="text-[#4f46e5]">━</span> f(x)</span><span><span className="text-[#d97706]">╍</span> f′(x)</span></div>
      <label className="mt-2 block text-xs text-muted" htmlFor="act-x">Input x = <span className="font-mono text-ink">{x.toFixed(2)}</span></label>
      <input id="act-x" type="range" min={-6} max={6} step={0.05} value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full max-w-md accent-brand" />
      <p className="mt-1 font-mono text-xs">f(x) = {a.f(x).toFixed(4)} · f′(x) = {a.d(x).toFixed(4)}</p>
      <div className="mt-2 text-sm"><Tex>{a.tex}</Tex>{"  ·  "}<Tex>{a.dtex}</Tex></div>
    </div>
  );
}

/** Pure 1-D toy: minimise L(w) = (w - 3)^2. Illustrates the update rule, not the user's network. */
export function GradientDescentDemo({ initialLr }: { initialLr: number }) {
  const [lr, setLr] = useState(initialLr);
  const [steps, setSteps] = useState(8);
  const path = useMemo(() => {
    const ws = [-2];
    for (let i = 0; i < steps; i++) { const w = ws[i]; ws.push(w - lr * 2 * (w - 3)); }
    return ws;
  }, [lr, steps]);
  const X = (w: number) => 120 + Math.max(-110, Math.min(110, w * 14 - 42));
  const Y = (w: number) => 110 - Math.min(105, (w - 3) ** 2 * 1.9);
  const curve = Array.from({ length: 61 }, (_, i) => { const w = -6 + i * 0.3; return `${X(w)},${Y(w)}`; }).join(" ");
  const last = path[path.length - 1];
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-muted">Toy problem: minimise <Tex>{String.raw`L(w)=(w-3)^2`}</Tex> starting at w = −2. This 1-D illustration shows the update rule, not your network.</p>
      <svg viewBox="0 0 240 120" className="mt-2 w-full max-w-md" role="img" aria-label="Gradient descent steps on a parabola">
        <polyline fill="none" style={{ stroke: "rgb(var(--muted))" }} strokeWidth="1.5" points={curve} />
        {path.map((w, i) => <circle key={i} cx={X(w)} cy={Y(w)} r={i === path.length - 1 ? 4 : 2.5} fill={i === 0 ? "#059669" : "#4f46e5"} opacity={0.4 + 0.6 * (i / Math.max(1, path.length - 1))} />)}
      </svg>
      <div className="grid max-w-md grid-cols-2 gap-3 text-xs">
        <div><label htmlFor="gd-lr" className="text-muted">Learning rate η = <span className="font-mono text-ink">{lr}</span></label>
          <input id="gd-lr" type="range" min={0.01} max={1.1} step={0.01} value={lr} onChange={(e) => setLr(Number(e.target.value))} className="w-full accent-brand" /></div>
        <div><label htmlFor="gd-steps" className="text-muted">Steps = <span className="font-mono text-ink">{steps}</span></label>
          <input id="gd-steps" type="range" min={1} max={30} step={1} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full accent-brand" /></div>
      </div>
      <p className="mt-1 font-mono text-xs">w after {steps} steps = {fmt(last, 4)} (optimum 3) · {Math.abs(last - 3) > 20 ? "diverged" : lr > 1 ? "overshooting" : lr < 0.05 ? "crawling" : "converging"}</p>
    </div>
  );
}

export function IterationWalkthrough({ sessionId, epoch, nTrain }: { sessionId: string | null; epoch: number; nTrain: number }) {
  const [sample, setSample] = useState(0);
  const [trace, setTrace] = useState<IterationTrace | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setTrace(null); setErr(null); }, [sessionId]);
  const run = async () => {
    if (!sessionId) return;
    try { setErr(null); setTrace(await api.trace(sessionId, sample)); } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };
  const short = (a: number[]) => "[" + a.slice(0, 6).map((v) => v.toFixed(3)).join(", ") + (a.length > 6 ? ", …" : "") + "]";
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-muted">Runs a real dry-run on your current model (epoch {epoch}) with one training sample. Nothing is modified.</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="trace-sample" className="label">Training sample index (0–{Math.max(0, nTrain - 1)})</label>
          <input id="trace-sample" type="number" min={0} max={Math.max(0, nTrain - 1)} className="field w-28" value={sample} onChange={(e) => setSample(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
        </div>
        <button className="btn-primary" disabled={!sessionId} onClick={run}>Trace one iteration</button>
      </div>
      {!sessionId && <p className="mt-2 text-xs text-muted">Create a valid model first.</p>}
      {err && <p role="alert" className="mt-2 text-xs text-bad">{err}</p>}
      {trace && (
        <ol className="mt-3 space-y-3 text-sm">
          <li><b>1 · Pick data.</b> Sample #{trace.sample_index}: x = {short(trace.input)}, true label y = {trace.target}.</li>
          <li><b>2 · Forward pass.</b>
            <ul className="mt-1 space-y-0.5 pl-4 font-mono text-xs text-muted">
              {trace.layers.map((l) => <li key={l.layer}>layer {l.layer}: z = {short(l.pre_activation)} → a = {short(l.activation)}</li>)}
            </ul></li>
          <li><b>3 · Loss.</b> Output p = {trace.probability.toFixed(4)}, so <Tex>{String.raw`L=-\big[y\ln p+(1-y)\ln(1-p)\big]=`}</Tex> <b>{trace.loss.toFixed(4)}</b></li>
          <li><b>4 · Backward pass.</b> The output error is <Tex>{String.raw`\delta=p-y=`}</Tex>{(trace.probability - trace.target).toFixed(4)}; the chain rule sends it back layer by layer. Gradient sizes:
            <ul className="mt-1 space-y-0.5 pl-4 font-mono text-xs text-muted">
              {trace.layers.map((l) => <li key={l.layer}>layer {l.layer}: ‖∂L/∂W‖ = {l.weight_grad_norm.toExponential(2)}, ‖∂L/∂b‖ = {l.bias_grad_norm.toExponential(2)}</li>)}
            </ul></li>
          <li><b>5 · Update.</b> Example weight {trace.example_weight.name}: <Tex>{String.raw`w\leftarrow w-\eta\,\frac{\partial L}{\partial w}`}</Tex> = {trace.example_weight.value.toFixed(4)} − {trace.learning_rate} × {trace.example_weight.gradient.toExponential(2)} = <b>{trace.example_weight.sgd_update.toFixed(4)}</b>
            <span className="text-muted"> ({trace.optimizer === "adam" ? "your optimizer is Adam, which rescales this step per weight" : "plain SGD"})</span></li>
          <li><b>6 · Repeat</b> for every mini-batch; one pass over all batches is one epoch.</li>
        </ol>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- topics */
export interface Topic {
  id: string;
  title: string;
  plain: string;
  formulas?: { tex: string; vars: [string, string][] }[];
  experiment: (c: LearnCtx) => React.ReactNode;
  widget?: (c: LearnCtx) => React.ReactNode;
}

const nTrain = (c: LearnCtx) => c.session?.n_train ?? 0;
const last = (c: LearnCtx) => c.history[c.history.length - 1];
const noRun = <span className="text-muted">Train the model to see live numbers here.</span>;

export const TOPICS: Topic[] = [
  {
    id: "iteration", title: "One training iteration, step by step",
    plain: "Training is a loop: show the network some data, measure how wrong it is, work out which way each weight should move, and nudge them all a little. This panel runs that loop once, with your real model.",
    experiment: (c) => <>Your model has {c.session?.n_parameters ?? "–"} trainable parameters, updated every mini-batch of {c.config.batch_size} samples.</>,
    widget: (c) => <IterationWalkthrough sessionId={c.session?.session_id ?? null} epoch={c.session?.epoch ?? 0} nTrain={nTrain(c)} />,
  },
  {
    id: "neurons", title: "Neurons, weights and biases",
    plain: "A neuron multiplies each input by a weight (how much it matters), adds a bias (a baseline offset), then passes the sum through an activation function. Learning means adjusting weights and biases.",
    formulas: [{ tex: String.raw`z=\sum_i w_i x_i + b,\qquad a=f(z)`, vars: [["x_i", "inputs from the previous layer"], ["w_i", "weight on input i"], ["b", "bias"], ["f", "activation function"], ["a", "the neuron's output"]] }],
    experiment: (c) => {
      const L = c.params?.layers[0];
      if (!L) return noRun;
      const w = L.weights.map((r) => r[0]);
      return <>Hidden neuron 1 currently has weights ({w.map((v) => v.toFixed(3)).join(", ")}) on inputs (x, y) and bias {L.biases[0].toFixed(3)} (epoch {c.params?.epoch}). Hover a neuron in the network diagram to inspect it.</>;
    },
  },
  {
    id: "forward", title: "Forward propagation",
    plain: "Data flows left to right. Each layer applies its weight matrix, adds biases, and applies the activation. The last layer outputs a probability for class 1.",
    formulas: [{ tex: String.raw`a^{[l]}=f\!\big(W^{[l]}a^{[l-1]}+b^{[l]}\big),\qquad p=\sigma\!\big(z^{[L]}\big)`, vars: [["a^{[0]}", "the input (x, y)"], ["W^{[l]}", "weight matrix of layer l"], ["p", "predicted probability of class 1"]] }],
    experiment: (c) => <>Layer sizes: {c.session?.layer_sizes.join(" → ") ?? [2, ...c.config.hidden_layers, 1].join(" → ")}. Hidden activation: <b>{c.config.activation}</b>; output: sigmoid.</>,
  },
  {
    id: "activation", title: "Activation functions",
    plain: "Without a non-linear activation, stacked layers collapse into one linear map. Activations bend the space so networks can draw curved boundaries. Drag the slider to see each function and its slope.",
    experiment: (c) => <>Your hidden layers use <b>{c.config.activation}</b>.</>,
    widget: (c) => <ActivationExplorer initial={c.config.activation} />,
  },
  {
    id: "loss", title: "Loss function (binary cross-entropy)",
    plain: "Loss turns “how wrong is the model” into one number to minimise. Binary cross-entropy punishes confident wrong answers very heavily. We compute it from logits in a numerically stable form.",
    formulas: [
      { tex: String.raw`L=-\frac1m\sum_{k=1}^m\Big[y_k\ln p_k+(1-y_k)\ln(1-p_k)\Big]`, vars: [["m", "samples in the batch"], ["y_k", "true label (0 or 1)"], ["p_k", "predicted P(class 1)"]] },
      { tex: String.raw`L=\frac1m\sum_k\Big[\max(z_k,0)-z_ky_k+\ln\big(1+e^{-|z_k|}\big)\Big]`, vars: [["z_k", "output logit, so p = σ(z)"]] },
    ],
    experiment: (c) => last(c) ? <>Current training loss: <b>{last(c).train_loss.toFixed(4)}</b>{last(c).val_loss !== null && <> · validation loss: <b>{last(c).val_loss!.toFixed(4)}</b></>}. Random guessing gives ln 2 ≈ 0.693.</> : noRun,
  },
  {
    id: "backprop", title: "Backpropagation",
    plain: "Backpropagation applies the chain rule from the output back to the input to find how much each weight contributed to the loss. For a sigmoid output with cross-entropy loss, the output error is simply (p − y).",
    formulas: [{ tex: String.raw`\delta^{[L]}=\frac{p-y}{m},\quad \delta^{[l]}=\big(\delta^{[l+1]}W^{[l+1]\top}\big)\odot f'\!\big(z^{[l]}\big),\quad \frac{\partial L}{\partial W^{[l]}}=a^{[l-1]\top}\delta^{[l]}`, vars: [["δ^{[l]}", "error signal at layer l"], ["⊙", "element-wise product"], ["f′", "activation derivative"]] }],
    experiment: (c) => <>The backend verifies these gradients against finite differences in its test-suite. Use the first panel to see real gradient sizes for {c.config.hidden_layers.length + 1} weight layer(s).</>,
  },
  {
    id: "gd", title: "Gradient descent",
    plain: "The gradient points uphill on the loss surface, so we step the opposite way. Repeating small steps gradually reduces the loss.",
    formulas: [{ tex: String.raw`\theta\leftarrow\theta-\eta\,\nabla_\theta L`, vars: [["θ", "all weights and biases"], ["η", "learning rate"], ["∇L", "gradient of the loss"]] }],
    experiment: (c) => last(c) ? <>Mean gradient norm in the latest epoch: <b>{last(c).grad_norm.toExponential(2)}</b>. It should shrink as the model approaches a minimum.</> : noRun,
    widget: () => <GradientDescentDemo initialLr={0.1} />,
  },
  {
    id: "lr", title: "Learning rate",
    plain: "The learning rate η sets the step size. Too small: slow progress. Too large: you overshoot the valley and may bounce around or blow up. Try η above 1 in the toy below.",
    formulas: [{ tex: String.raw`\theta_{t+1}=\theta_t-\eta\,g_t`, vars: [["η", "learning rate, a hyper-parameter you choose"]] }],
    experiment: (c) => <>Your learning rate is <b>{c.config.learning_rate}</b> with <b>{c.config.optimizer.toUpperCase()}</b>. Try the “Learning-rate experiment” preset and pin runs to compare.</>,
    widget: () => <GradientDescentDemo initialLr={0.9} />,
  },
  {
    id: "batches", title: "Epochs and batches",
    plain: "An epoch is one full pass over the training data. Data is split into mini-batches; the weights are updated once per batch. Smaller batches give noisier but more frequent updates.",
    formulas: [{ tex: String.raw`\text{updates per epoch}=\Big\lceil \frac{N_{\text{train}}}{B}\Big\rceil`, vars: [["N_train", "training samples"], ["B", "batch size"]] }],
    experiment: (c) => { const n = nTrain(c); const B = Math.min(c.config.batch_size, n || c.config.batch_size); return n ? <>{n} training samples with batch size {B} → <b>{Math.ceil(n / B)}</b> updates per epoch, <b>{Math.ceil(n / B) * c.config.epochs}</b> in total over {c.config.epochs} epochs.</> : noRun; },
  },
  {
    id: "optim", title: "SGD versus Adam",
    plain: "SGD moves every parameter by the same rule: step = η × gradient. Adam keeps running averages of the gradient and its square, giving each parameter its own adaptive step size. It often needs less tuning.",
    formulas: [
      { tex: String.raw`\text{SGD: }\ \theta\leftarrow\theta-\eta g`, vars: [["g", "mini-batch gradient"]] },
      { tex: String.raw`m\leftarrow\beta_1m+(1-\beta_1)g,\quad v\leftarrow\beta_2v+(1-\beta_2)g^2,\quad \theta\leftarrow\theta-\eta\frac{\hat m}{\sqrt{\hat v}+\varepsilon}`, vars: [["m, v", "moving averages of g and g²"], ["β₁, β₂", "0.9 and 0.999"], ["m̂, v̂", "bias-corrected m and v"]] },
    ],
    experiment: (c) => <>You are using <b>{c.config.optimizer.toUpperCase()}</b>. The optimizer comparison preset runs both on the same data and initial weights.</>,
  },
  {
    id: "fit", title: "Overfitting and underfitting",
    plain: "Underfitting: the model is too simple, so error stays high everywhere. Overfitting: it memorises noise in the training set, so training error is low but validation error is high.",
    experiment: (c) => { const l = last(c); if (!l || l.val_loss === null) return noRun; const gap = l.val_loss - l.train_loss; return <>Train loss {l.train_loss.toFixed(3)} vs validation loss {l.val_loss.toFixed(3)} (gap {gap >= 0 ? "+" : ""}{gap.toFixed(3)}). {l.train_loss > 0.5 ? "Both are high: possible underfitting." : gap > 0.15 ? "A wide gap hints at overfitting." : "The gap is small: a reasonable fit."} With little data the validation estimate itself is noisy.</>; },
  },
  {
    id: "split", title: "Training versus validation data",
    plain: "The training set is used to update weights. The validation set is held out and only measured, which estimates how the model behaves on unseen data. Never tune weights on it.",
    experiment: (c) => c.session ? <>{c.session.n_train} samples train the model; {c.session.n_val} are held out ({Math.round(c.config.val_split * 100)}%). The split is seeded, so it is reproducible.</> : noRun,
  },
  {
    id: "boundary", title: "Decision boundaries",
    plain: "The model outputs a probability everywhere on the plane. The decision boundary is where that probability is exactly 0.5, i.e. where the final logit is zero. Colour intensity shows confidence.",
    formulas: [{ tex: String.raw`\hat y=\begin{cases}1&p\ge0.5\\0&p<0.5\end{cases}\qquad \text{boundary: } z^{[L]}(x,y)=0`, vars: [["p", "σ(z), the predicted probability"]] }],
    experiment: (c) => <>With {c.config.hidden_layers.length === 0 ? "no hidden layer the boundary is always a straight line" : `${c.config.hidden_layers.length} hidden layer(s) it can curve`}. The plot evaluates the real model on a 56×56 grid of inputs.</>,
  },
  {
    id: "vanish", title: "Vanishing and exploding gradients",
    plain: "Backprop multiplies many derivative terms. If they are mostly below 1 (sigmoid's derivative is at most 0.25) the gradient shrinks layer by layer and early layers barely learn. If they are above 1 it can explode and training diverges. Good initialization and ReLU/tanh help.",
    formulas: [{ tex: String.raw`\left\|\frac{\partial L}{\partial W^{[1]}}\right\|\ \lesssim\ \prod_{l}\big\|W^{[l]}\big\|\,\big|f'(z^{[l]})\big|\ \xrightarrow{\ f'\le 0.25\ }\ 0.25^{\,\text{depth}}\ \text{(sigmoid)}`, vars: [["depth", "number of layers the gradient passes through"]] }],
    experiment: (c) => { const d = c.config.hidden_layers.length; return <>Activation <b>{c.config.activation}</b>, {d} hidden layer(s)
      {c.config.activation === "sigmoid" && d > 0 ? <>: the sigmoid factor alone can shrink gradients by up to 0.25<sup>{d}</sup> ≈ {(0.25 ** d).toExponential(1)}.</> : "."} Compare the per-layer gradient norms in the iteration trace.</>; },
  },
];
