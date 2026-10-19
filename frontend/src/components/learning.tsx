import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { ACT, ACTIVATION_NAMES } from "../lib/activations";
import { fmt } from "../lib/format";
import { diagnose } from "../lib/diagnose";
import { ACTIVATION_OPTIONS, labelOf, LOSS_OPTIONS, OPTIMIZER_OPTIONS } from "../lib/options";
import type { Activation, EpochMetrics, Evaluation, IterationTrace, ModelConfig, ModelParameters, SessionStatus } from "../types";
import { BatchNormDemo, DropoutDemo, LossComparison, OptimizerRace, WeightHistogram } from "./learningWidgets";
import { Tex } from "./Tex";

export interface LearnCtx {
  config: ModelConfig;
  session: SessionStatus | null;
  history: EpochMetrics[];
  params: ModelParameters | null;
  evaluation: Evaluation | null;
}

/* ------------------------------------------------------------- interactive widgets */
export function ActivationExplorer({ initial }: { initial: Activation }) {
  const [name, setName] = useState<Activation>(initial);
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
        {ACTIVATION_NAMES.map((k) => (
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
  group: string;
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
    id: "iteration", group: "Basics", title: "One training iteration, step by step",
    plain: "Training is a loop: show the network some data, measure how wrong it is, work out which way each weight should move, and nudge them all a little. This panel runs that loop once, with your real model.",
    experiment: (c) => <>Your model has {c.session?.n_parameters ?? "–"} trainable parameters, updated every mini-batch of {c.config.batch_size} samples.</>,
    widget: (c) => <IterationWalkthrough sessionId={c.session?.session_id ?? null} epoch={c.session?.epoch ?? 0} nTrain={nTrain(c)} />,
  },
  {
    id: "neurons", group: "Basics", title: "Neurons, weights and biases",
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
    id: "forward", group: "Basics", title: "Forward propagation",
    plain: "Data flows left to right. Each layer applies its weight matrix, adds biases, and applies the activation. The last layer outputs a probability for class 1.",
    formulas: [{ tex: String.raw`a^{[l]}=f\!\big(W^{[l]}a^{[l-1]}+b^{[l]}\big),\qquad p=\sigma\!\big(z^{[L]}\big)`, vars: [["a^{[0]}", "the input (x, y)"], ["W^{[l]}", "weight matrix of layer l"], ["p", "predicted probability of class 1"]] }],
    experiment: (c) => <>Layer sizes: {c.session?.layer_sizes.join(" → ") ?? [2, ...c.config.hidden_layers, 1].join(" → ")}. Hidden activation: <b>{c.config.activation}</b>; output: sigmoid. Parameters in layer l = (inputs + 1) × neurons (the +1 is the bias).</>,
  },
  {
    id: "activation", group: "Activations & loss", title: "Activation functions",
    plain: "Without a non-linear activation, stacked layers collapse into one linear map. Activations bend the space so networks can draw curved boundaries. Sigmoid and tanh saturate (gradient ≈ 0 at the ends); ReLU keeps a gradient of 1 for positive inputs but neurons can die; Leaky ReLU, ELU and SELU fix that; softplus and SiLU are smooth relatives. Output layers: sigmoid for yes/no, softmax for several classes, linear for numbers.",
    experiment: (c) => <>Your hidden layers use <b>{labelOf(ACTIVATION_OPTIONS, c.config.activation)}</b>. Drag the slider below to see each function and its slope.</>,
    widget: (c) => <ActivationExplorer initial={c.config.activation} />,
  },
  {
    id: "loss", group: "Activations & loss", title: "Loss functions",
    plain: "Loss turns “how wrong is the model” into one number to minimise. For classification, binary cross-entropy punishes confident wrong answers very heavily and is computed from logits in a numerically stable form. Squared error and hinge loss are alternatives; compare them below. For regression the lecture lists MAE, MSE, RMSE, MSLE, MAPE, Huber and Log-Cosh.",
    formulas: [
      { tex: String.raw`L_{\text{BCE}}=-\frac1m\sum_{k}\Big[y_k\ln p_k+(1-y_k)\ln(1-p_k)\Big]`, vars: [["m", "samples in the batch"], ["y_k", "true label (0 or 1)"], ["p_k", "predicted P(class 1)"]] },
      { tex: String.raw`L_{\text{BCE}}=\frac1m\sum_k\Big[\max(z_k,0)-z_ky_k+\ln\big(1+e^{-|z_k|}\big)\Big]`, vars: [["z_k", "output logit, so p = σ(z)"]] },
      { tex: String.raw`L_{\text{MSE}}=\frac1m\sum_k(p_k-y_k)^2,\qquad L_{\text{hinge}}=\frac1m\sum_k\max\!\big(0,\,1-s_kz_k\big),\ s_k=2y_k-1`, vars: [["s_k", "label mapped to −1 / +1"]] },
      { tex: String.raw`\text{MAE}=\frac1n\sum|y-\hat y|,\quad \text{MSE}=\frac1n\sum(y-\hat y)^2,\quad \text{RMSE}=\sqrt{\text{MSE}},\quad \text{MAPE}=\frac{100}{n}\sum\frac{|y-\hat y|}{|y|}`, vars: [["ŷ", "predicted number (regression)"]] },
    ],
    experiment: (c) => last(c) ? <>Loss in use: <b>{labelOf(LOSS_OPTIONS, c.config.loss)}</b>. Current training loss: <b>{last(c).train_loss.toFixed(4)}</b>{last(c).val_loss !== null && <> · validation loss: <b>{last(c).val_loss!.toFixed(4)}</b></>}. For cross-entropy, random guessing gives ln 2 ≈ 0.693.</> : noRun,
    widget: () => <LossComparison />,
  },
  {
    id: "backprop", group: "Activations & loss", title: "Backpropagation",
    plain: "Backpropagation applies the chain rule from the output back to the input to find how much each weight contributed to the loss. For a sigmoid output with cross-entropy loss, the output error is simply (p − y).",
    formulas: [{ tex: String.raw`\delta^{[L]}=\frac{p-y}{m},\quad \delta^{[l]}=\big(\delta^{[l+1]}W^{[l+1]\top}\big)\odot f'\!\big(z^{[l]}\big),\quad \frac{\partial L}{\partial W^{[l]}}=a^{[l-1]\top}\delta^{[l]}`, vars: [["δ^{[l]}", "error signal at layer l"], ["⊙", "element-wise product"], ["f′", "activation derivative"]] }],
    experiment: (c) => <>The backend verifies these gradients against finite differences for every activation, loss, regulariser, dropout and batch-norm combination, and against PyTorch autograd. Your network has {c.config.hidden_layers.length + 1} weight layer(s); use the first topic to see real gradient sizes.</>,
  },
  {
    id: "gd", group: "Optimization", title: "Gradient descent: batch, SGD, mini-batch",
    plain: "The gradient points uphill on the loss surface, so we step the opposite way. Batch gradient descent uses the whole training set for every step (stable, slow, memory-hungry); stochastic gradient descent uses one sample (fast, noisy, can escape shallow minima); mini-batches are the compromise. The result depends on the starting weights, and on the learning rate: too small is slow, too large overshoots.",
    formulas: [
      { tex: String.raw`\theta\leftarrow\theta-\eta\,\nabla_\theta L`, vars: [["θ", "all weights and biases"], ["η", "learning rate"], ["∇L", "gradient of the loss"]] },
      { tex: String.raw`\text{updates per epoch}=\Big\lceil \frac{N_{\text{train}}}{B}\Big\rceil`, vars: [["N_train", "training samples"], ["B", "batch size"]] },
    ],
    experiment: (c) => { const n = nTrain(c); if (!n) return noRun; const B = Math.min(c.config.batch_size, n); return <>{n} training samples with batch size {B} → <b>{Math.ceil(n / B)}</b> updates per epoch, <b>{Math.ceil(n / B) * c.config.epochs}</b> in total over {c.config.epochs} epochs. Mode: <b>{B === 1 ? "stochastic (SGD)" : B >= n ? "batch gradient descent" : "mini-batch"}</b>.{last(c) && <> Mean gradient norm in the latest epoch: <b>{last(c).grad_norm.toExponential(2)}</b>.</>}</>; },
    widget: () => <GradientDescentDemo initialLr={0.1} />,
  },
  {
    id: "optim", group: "Optimization", title: "Optimizers: SGD to Adam and Nadam",
    plain: "Optimizers decide how to turn a gradient into a step. Momentum remembers past gradients; Nesterov looks ahead; Adagrad, RMSprop and Adadelta give every parameter its own adaptive step; Adam combines momentum with RMSprop scaling and corrects the early bias; Nadam adds Nesterov's look-ahead to Adam. Different optimizers need different learning rates.",
    formulas: [
      { tex: String.raw`\text{Momentum: } v\leftarrow\gamma v+\eta g,\ \ \theta\leftarrow\theta-v\qquad\text{Nesterov: } \theta\leftarrow\theta-(\gamma v+\eta g)`, vars: [["γ", "momentum, 0.9"], ["v", "velocity (running memory of gradients)"]] },
      { tex: String.raw`\text{Adagrad: } G\leftarrow G+g^2,\ \ \theta\leftarrow\theta-\frac{\eta\,g}{\sqrt G+\varepsilon}\qquad\text{RMSprop: } v\leftarrow\rho v+(1-\rho)g^2,\ \ \theta\leftarrow\theta-\frac{\eta\,g}{\sqrt v+\varepsilon}`, vars: [["G", "sum of all past squared gradients"], ["ρ", "decay, 0.9"], ["ε", "tiny constant (1e-7)"]] },
      { tex: String.raw`\text{Adadelta: } \Delta\theta=-\frac{\sqrt{E[\Delta\theta^2]+\varepsilon}}{\sqrt{E[g^2]+\varepsilon}}\,g,\ \ \theta\leftarrow\theta+\eta\,\Delta\theta`, vars: [["E[·]", "decaying averages (ρ = 0.95)"]] },
      { tex: String.raw`\text{Adam: } m\leftarrow\beta_1m+(1-\beta_1)g,\ v\leftarrow\beta_2v+(1-\beta_2)g^2,\ \theta\leftarrow\theta-\frac{\eta\,\hat m}{\sqrt{\hat v}+\varepsilon},\ \hat m=\tfrac{m}{1-\beta_1^t},\ \hat v=\tfrac{v}{1-\beta_2^t}`, vars: [["β₁, β₂", "0.9 and 0.999"], ["m̂, v̂", "bias-corrected m and v"]] },
      { tex: String.raw`\text{Nadam: } \theta\leftarrow\theta-\frac{\eta}{\sqrt{\hat v}+\varepsilon}\Big(\beta_1\hat m+\frac{1-\beta_1}{1-\beta_1^t}\,g\Big)`, vars: [["", "Adam's update with a look-ahead on the gradient term"]] },
    ],
    experiment: (c) => <>You are using <b>{labelOf(OPTIMIZER_OPTIONS, c.config.optimizer)}</b> with learning rate <b>{c.config.learning_rate}</b>. Note: the lecture writes ε inside the square root for Adagrad and RMSprop; PyTorch (and this app) put it outside. It only matters when gradients are almost zero.</>,
    widget: (c) => <OptimizerRace current={c.config.optimizer} />,
  },
  {
    id: "lr", group: "Optimization", title: "Learning rate",
    plain: "The learning rate η sets the step size. Too small: slow progress. Too large: you overshoot the valley and may bounce around or blow up. Try η above 1 in the toy below, or use the Learning-rate preset and pin runs to compare.",
    formulas: [{ tex: String.raw`\theta_{t+1}=\theta_t-\eta\,g_t`, vars: [["η", "learning rate, a hyper-parameter you choose"]] }],
    experiment: (c) => <>Your learning rate is <b>{c.config.learning_rate}</b> with <b>{c.config.optimizer.toUpperCase()}</b>.</>,
    widget: () => <GradientDescentDemo initialLr={0.9} />,
  },
  {
    id: "fit", group: "Generalisation", title: "Overfitting, underfitting and learning curves",
    plain: "Underfitting: the model is too simple, so error stays high everywhere (training and validation curves both high and close). Overfitting: it memorises noise, so training error keeps falling while validation error turns upward. A good fit has both low and close. The number of neurons and parameters should match the complexity of the task.",
    experiment: (c) => { const l = last(c); if (!l || l.val_loss === null) return noRun; const d = diagnose(c.history, c.config.loss); return <>Train loss {l.train_loss.toFixed(3)} vs validation loss {l.val_loss.toFixed(3)} (gap {(l.val_loss - l.train_loss) >= 0 ? "+" : ""}{(l.val_loss - l.train_loss).toFixed(3)}). Curve reading: <b>{d.title}</b>. {d.reason}</>; },
  },
  {
    id: "reg", group: "Generalisation", title: "Regularization: L1, L2 and elastic net",
    plain: "Regularization adds a penalty on the weights to the loss, so the model prefers small weights and simpler functions. L2 (ridge / weight decay) shrinks all weights smoothly. L1 (lasso) pushes many weights to exactly zero, which also selects features. Elastic net mixes both. It only acts during training, and features should be normalised first. Choose λ by trying values such as 0.001, 0.01, 0.1.",
    formulas: [
      { tex: String.raw`L_{\text{total}}=L_{\text{data}}+\lambda_1\sum|w|+\lambda_2\sum w^2`, vars: [["λ₁", "L1 strength (lasso)"], ["λ₂", "L2 strength (ridge)"], ["Σ", "over weights only, not biases"]] },
      { tex: String.raw`\frac{\partial}{\partial w}=\frac{\partial L_{\text{data}}}{\partial w}+\lambda_1\operatorname{sign}(w)+2\lambda_2 w`, vars: [["sign(w)", "−1, 0 or +1: a constant pull towards zero"]] },
    ],
    experiment: (c) => <>L1 = <b>{c.config.l1}</b>, L2 = <b>{c.config.l2}</b>{last(c) && <>; the penalty term added to the loss is currently <b>{last(c).penalty.toFixed(4)}</b></>}. Try the “Fighting overfitting” preset.</>,
    widget: (c) => <WeightHistogram params={c.params} l1={c.config.l1} l2={c.config.l2} />,
  },
  {
    id: "dropout", group: "Generalisation", title: "Dropout",
    plain: "During training each hidden neuron is switched off with probability p, so no neuron can become too specialised or rely on one partner (like a committee where members are randomly absent). Kept neurons are scaled by 1/(1−p) so the total signal stays the same; at prediction time every neuron is used.",
    formulas: [{ tex: String.raw`\tilde a=\frac{m\odot a}{1-p},\qquad m_i\sim\text{Bernoulli}(1-p)`, vars: [["p", "dropout rate (probability a neuron is dropped)"], ["m", "random 0/1 mask"], ["1/(1−p)", "scale-up so the expected sum is unchanged"]] }],
    experiment: (c) => <>Dropout rate: <b>{c.config.dropout}</b>{c.config.dropout === 0 && <> (off)</>}. Training-set metrics are measured with dropout off, so they can look better than the noisy training steps.</>,
    widget: (c) => <DropoutDemo initialRate={c.config.dropout} />,
  },
  {
    id: "bn", group: "Generalisation", title: "Batch normalization",
    plain: "Batch normalization standardises each hidden unit's values over the mini-batch (mean 0, variance 1) and then rescales them with two learned numbers, γ and β. It stabilises and speeds up training. At prediction time the running averages collected during training are used instead of batch statistics. A side effect you can verify: the bias just before a batch-norm layer has zero gradient, because normalisation cancels any constant shift.",
    formulas: [{ tex: String.raw`\hat x_i=\frac{x_i-\mu_B}{\sqrt{\sigma_B^2+\epsilon}},\qquad y_i=\gamma\hat x_i+\beta`, vars: [["μ_B, σ²_B", "mean and variance of the mini-batch"], ["ε", "small constant (division by zero)"], ["γ, β", "learned scale and shift"]] }],
    experiment: (c) => c.config.batch_norm ? <>Batch norm is <b>on</b>: {c.session ? `${c.session.n_parameters} trainable parameters, plus ${c.session.n_non_trainable} non-trainable running statistics (mean and variance per hidden unit)` : "adds γ and β per hidden unit"}.</> : <>Batch norm is off. Switch it on under “4 · Regularization” and watch the parameter count grow by 2 per hidden unit.</>,
    widget: () => <BatchNormDemo />,
  },
  {
    id: "early", group: "Generalisation", title: "Early stopping",
    plain: "Watch the validation loss and stop when it stops improving. Keep the weights from the best epoch. You still need enough epochs for the model to learn anything: stopping after 2 or 3 epochs teaches nothing. Hinton called it a “beautiful free lunch”.",
    experiment: (c) => c.session ? (c.session.best_epoch ? <>Best validation loss so far at epoch <b>{c.session.best_epoch}</b>. {c.config.early_stopping ? (c.session.stopped_early ? <>Early stopping ended the run at epoch {c.session.epoch}{c.session.restored_best ? " and restored the best weights" : ""}.</> : <>Early stopping is on with patience {c.config.patience}.</>) : <>Early stopping is off; turn it on under “5 · Validation &amp; early stopping”.</>}</> : noRun) : noRun,
  },
  {
    id: "split", group: "Evaluation", title: "Training, validation and test data",
    plain: "The training set fits the weights. The validation set tunes hyper-parameters, selects the best model and estimates generalisation during training. The test set is used only once, at the end, to assess a completely specified model. Parameters (weights) are learned; hyper-parameters (layers, epochs, batch size, learning rate, architecture) are chosen by you.",
    experiment: (c) => c.session ? <>{c.session.n_train} samples train the model; {c.session.n_val} are held out ({Math.round(c.config.val_split * 100)}%). The split is seeded, so it is reproducible. This app has no separate test set: treat the validation score as optimistic once you have tuned against it.</> : noRun,
  },
  {
    id: "validation", group: "Evaluation", title: "Validation methods (hold-out, K-fold, …)",
    plain: "Hold-out: one split (cheap, good for large data). K-fold: K parts, each validates once (fair on small data, costly for deep learning). Stratified K-fold keeps the class ratio in every fold (imbalanced data). Shuffle split: repeated random splits. Time-series split: the training window grows and validation is always in the future (never shuffle ordered data: that leaks the future). Leave-one-out / leave-p-out: tiny data only, very slow. Run them on your model in the “Validation methods” panel.",
    experiment: (c) => <>Your current hold-out: {c.session?.n_train ?? "–"} train / {c.session?.n_val ?? "–"} validation. Open the panel below the charts to run K-fold, stratified, shuffle, time-series or leave-one-out with your settings and compare the spread of scores across folds.</>,
  },
  {
    id: "metrics", group: "Evaluation", title: "Accuracy, precision, recall, F1, ROC and AUC",
    plain: "A confusion matrix counts true/false positives and negatives. Accuracy is misleading when classes are imbalanced: a model that always says “healthy” is 99.9% accurate on 0.1% sick patients and useless. Precision asks “of those I flagged, how many were right?”, recall asks “of the real ones, how many did I find?”, F1 is their harmonic mean. Moving the decision threshold trades precision for recall; the ROC curve plots that trade-off and AUC summarises it (0.5 = guessing, 1 = perfect).",
    formulas: [
      { tex: String.raw`\text{Acc}=\frac{TP+TN}{TP+TN+FP+FN},\ \ P=\frac{TP}{TP+FP},\ \ R=\frac{TP}{TP+FN},\ \ F_1=\frac{2PR}{P+R}=\frac{TP}{TP+\frac{FN+FP}{2}}`, vars: [["TP, TN", "correct positives / negatives"], ["FP", "false alarms"], ["FN", "misses"]] },
      { tex: String.raw`\text{TPR}=\frac{TP}{TP+FN},\qquad \text{FPR}=\frac{FP}{FP+TN},\qquad \text{AUC}=\int_0^1\text{TPR}\,d(\text{FPR})`, vars: [["TPR", "recall / sensitivity"], ["FPR", "1 − specificity"]] },
    ],
    experiment: (c) => c.evaluation ? <>On the {c.evaluation.split === "val" ? "validation" : "training"} set ({c.evaluation.n} points, threshold {c.evaluation.threshold}): TP {c.evaluation.confusion.tp}, FP {c.evaluation.confusion.fp}, TN {c.evaluation.confusion.tn}, FN {c.evaluation.confusion.fn} → accuracy <b>{(c.evaluation.accuracy * 100).toFixed(1)}%</b>, precision <b>{(c.evaluation.precision * 100).toFixed(1)}%</b>, recall <b>{(c.evaluation.recall * 100).toFixed(1)}%</b>, F1 <b>{(c.evaluation.f1 * 100).toFixed(1)}%</b>{c.evaluation.auc !== null && <>, AUC <b>{c.evaluation.auc.toFixed(3)}</b></>}.</> : noRun,
  },
  {
    id: "boundary", group: "Evaluation", title: "Decision boundaries",
    plain: "The model outputs a probability everywhere on the plane. The decision boundary is where that probability is exactly 0.5, i.e. where the final logit is zero. Colour intensity shows confidence.",
    formulas: [{ tex: String.raw`\hat y=\begin{cases}1&p\ge0.5\\0&p<0.5\end{cases}\qquad \text{boundary: } z^{[L]}(x,y)=0`, vars: [["p", "σ(z), the predicted probability"]] }],
    experiment: (c) => <>With {c.config.hidden_layers.length === 0 ? "no hidden layer the boundary is always a straight line" : `${c.config.hidden_layers.length} hidden layer(s) it can curve`}. The plot evaluates the real model on a 56×56 grid of inputs.</>,
  },
  {
    id: "vanish", group: "Activations & loss", title: "Vanishing and exploding gradients",
    plain: "Backprop multiplies many derivative terms. If they are mostly below 1 (sigmoid's derivative is at most 0.25) the gradient shrinks layer by layer and early layers barely learn. If they are above 1 it can explode and training diverges. Good initialization, ReLU-like activations, normalisation and a suitable optimizer help.",
    formulas: [{ tex: String.raw`\left\|\frac{\partial L}{\partial W^{[1]}}\right\|\ \lesssim\ \prod_{l}\big\|W^{[l]}\big\|\,\big|f'(z^{[l]})\big|\ \xrightarrow{\ f'\le 0.25\ }\ 0.25^{\,\text{depth}}\ \text{(sigmoid)}`, vars: [["depth", "number of layers the gradient passes through"]] }],
    experiment: (c) => { const d = c.config.hidden_layers.length; return <>Activation <b>{c.config.activation}</b>, {d} hidden layer(s)
      {c.config.activation === "sigmoid" && d > 0 ? <>: the sigmoid factor alone can shrink gradients by up to 0.25<sup>{d}</sup> ≈ {(0.25 ** d).toExponential(1)}.</> : "."} Compare the per-layer gradient norms in the iteration trace.</>; },
  },
];
