import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api/client";
import { useT, type TFn } from "../i18n";
import { ACT, ACTIVATION_NAMES } from "../lib/activations";
import { fmt } from "../lib/format";
import { diagnose } from "../lib/diagnose";
import { ACTIVATION_OPTIONS, LOSS_OPTIONS, OPTIMIZER_OPTIONS } from "../lib/options";
import { useOptionText } from "../lib/optionText";
import type { Activation, EpochMetrics, Evaluation, IterationTrace, ModelConfig, ModelParameters, SessionStatus } from "../types";
import { diagnosisText } from "./LearningDiagnosis";
import { BatchNormDemo, DropoutDemo, LossComparison, OptimizerRace, WeightHistogram } from "./learningWidgets";
import { Rich } from "./SectionHelp";
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
  const t = useT();
  const [name, setName] = useState<Activation>(initial);
  const [x, setX] = useState(0.8);
  useEffect(() => setName(initial), [initial]);
  const a = ACT[name];
  const yMap = (v: number) => 60 - v * 28;
  const line = (fn: (v: number) => number) => Array.from({ length: 121 }, (_, i) => { const v = -6 + i * 0.1; return `${i * 2},${yMap(fn(v))}`; }).join(" ");
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t("pg.lw.act.group")}>
        {ACTIVATION_NAMES.map((k) => (
          <button key={k} role="radio" aria-checked={name === k} onClick={() => setName(k)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${name === k ? "border-brand bg-brand/10 text-brand" : "border-line text-muted"}`}>
            {k}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 240 120" className="mt-3 w-full max-w-md" role="img" aria-label={t("pg.lw.act.plot", undefined, { name })}>
        <line x1="0" y1={yMap(0)} x2="240" y2={yMap(0)} style={{ stroke: "rgb(var(--line))" }} />
        <line x1="120" y1="0" x2="120" y2="120" style={{ stroke: "rgb(var(--line))" }} />
        <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={line(a.f)} />
        <polyline fill="none" stroke="#d97706" strokeWidth="1.6" strokeDasharray="4 3" points={line(a.d)} />
        <circle cx={(x + 6) * 20} cy={yMap(a.f(x))} r="3.5" fill="#4f46e5" />
        <circle cx={(x + 6) * 20} cy={yMap(a.d(x))} r="3.5" fill="#d97706" />
      </svg>
      <div className="flex gap-4 text-xs"><span><span className="text-[#4f46e5]">━</span> f(x)</span><span><span className="text-[#d97706]">╍</span> f′(x)</span></div>
      <label className="mt-2 block text-xs text-muted" htmlFor="act-x">{t("pg.lw.act.input")} <span className="font-mono text-ink">{x.toFixed(2)}</span></label>
      <input id="act-x" type="range" min={-6} max={6} step={0.05} value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full max-w-md accent-brand" />
      <p className="mt-1 font-mono text-xs">f(x) = {a.f(x).toFixed(4)} · f′(x) = {a.d(x).toFixed(4)}</p>
      <div className="mt-2 text-sm"><Tex>{a.tex}</Tex>{"  ·  "}<Tex>{a.dtex}</Tex></div>
    </div>
  );
}

/** Pure 1-D toy: minimise L(w) = (w - 3)^2. Illustrates the update rule, not the user's network. */
export function GradientDescentDemo({ initialLr }: { initialLr: number }) {
  const t = useT();
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
  const verdict = Math.abs(last - 3) > 20 ? "diverged" : lr > 1 ? "overshooting" : lr < 0.05 ? "crawling" : "converging";
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-muted">{t("pg.lw.gd.intro.a")} <Tex>{String.raw`L(w)=(w-3)^2`}</Tex> {t("pg.lw.gd.intro.b")}</p>
      <svg viewBox="0 0 240 120" className="mt-2 w-full max-w-md" role="img" aria-label={t("pg.lw.gd.aria")}>
        <polyline fill="none" style={{ stroke: "rgb(var(--muted))" }} strokeWidth="1.5" points={curve} />
        {path.map((w, i) => <circle key={i} cx={X(w)} cy={Y(w)} r={i === path.length - 1 ? 4 : 2.5} fill={i === 0 ? "#059669" : "#4f46e5"} opacity={0.4 + 0.6 * (i / Math.max(1, path.length - 1))} />)}
      </svg>
      <div className="grid max-w-md grid-cols-2 gap-3 text-xs">
        <div><label htmlFor="gd-lr" className="text-muted">{t("pg.lw.gd.lr")} <span className="font-mono text-ink">{lr}</span></label>
          <input id="gd-lr" type="range" min={0.01} max={1.1} step={0.01} value={lr} onChange={(e) => setLr(Number(e.target.value))} className="w-full accent-brand" /></div>
        <div><label htmlFor="gd-steps" className="text-muted">{t("pg.lw.gd.steps")} <span className="font-mono text-ink">{steps}</span></label>
          <input id="gd-steps" type="range" min={1} max={30} step={1} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full accent-brand" /></div>
      </div>
      <p className="mt-1 font-mono text-xs">{t("pg.lw.gd.result", undefined, { steps, w: fmt(last, 4), verdict: t(`pg.lw.gd.${verdict}`) })}</p>
    </div>
  );
}

export function IterationWalkthrough({ sessionId, epoch, nTrain }: { sessionId: string | null; epoch: number; nTrain: number }) {
  const t = useT();
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
      <p className="text-xs text-muted">{t("pg.lw.it.intro", undefined, { epoch })}</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="trace-sample" className="label">{t("pg.lw.it.sample", undefined, { max: Math.max(0, nTrain - 1) })}</label>
          <input id="trace-sample" type="number" min={0} max={Math.max(0, nTrain - 1)} className="field w-28" value={sample} onChange={(e) => setSample(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
        </div>
        <button className="btn-primary" disabled={!sessionId} onClick={run}>{t("pg.lw.it.run")}</button>
      </div>
      {!sessionId && <p className="mt-2 text-xs text-muted">{t("pg.lw.it.needModel")}</p>}
      {err && <p role="alert" className="mt-2 text-xs text-bad">{err}</p>}
      {trace && (
        <ol className="mt-3 space-y-3 text-sm">
          <li><Rich text={t("pg.lw.it.s1", undefined, { i: trace.sample_index, x: short(trace.input), y: trace.target })} /></li>
          <li><b>{t("pg.lw.it.s2")}</b>
            <ul className="mt-1 space-y-0.5 pl-4 font-mono text-xs text-muted">
              {trace.layers.map((l) => <li key={l.layer}>{t("pg.lw.it.layer", undefined, { l: l.layer })}: z = {short(l.pre_activation)} → a = {short(l.activation)}</li>)}
            </ul></li>
          <li><b>{t("pg.lw.it.s3")}</b> {t("pg.lw.it.s3b", undefined, { p: trace.probability.toFixed(4) })} <Tex>{String.raw`L=-\big[y\ln p+(1-y)\ln(1-p)\big]=`}</Tex> <b>{trace.loss.toFixed(4)}</b></li>
          <li><b>{t("pg.lw.it.s4")}</b> {t("pg.lw.it.s4b")} <Tex>{String.raw`\delta=p-y=`}</Tex>{(trace.probability - trace.target).toFixed(4)}; {t("pg.lw.it.s4c")}
            <ul className="mt-1 space-y-0.5 pl-4 font-mono text-xs text-muted">
              {trace.layers.map((l) => <li key={l.layer}>{t("pg.lw.it.layer", undefined, { l: l.layer })}: ‖∂L/∂W‖ = {l.weight_grad_norm.toExponential(2)}, ‖∂L/∂b‖ = {l.bias_grad_norm.toExponential(2)}</li>)}
            </ul></li>
          <li><b>{t("pg.lw.it.s5")}</b> {t("pg.lw.it.s5b", undefined, { name: trace.example_weight.name })} <Tex>{String.raw`w\leftarrow w-\eta\,\frac{\partial L}{\partial w}`}</Tex> = {trace.example_weight.value.toFixed(4)} − {trace.learning_rate} × {trace.example_weight.gradient.toExponential(2)} = <b>{trace.example_weight.sgd_update.toFixed(4)}</b>
            <span className="text-muted"> ({trace.optimizer === "adam" ? t("pg.lw.it.adam") : t("pg.lw.it.sgd")})</span></li>
          <li><b>{t("pg.lw.it.s6")}</b> {t("pg.lw.it.s6b")}</li>
        </ol>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- topics */
/**
 * A Learning Center topic. All prose lives in the catalogue under `pg.lc.<id>.*`:
 * `title`, `plain`, `f<i>.v<j>` (meaning of the j-th symbol of the i-th formula) and the live-numbers sentences.
 */
export interface Topic {
  id: string;
  /** English group name; the catalogue key is `pg.lc.group.<group>`. */
  group: string;
  formulas?: { tex: string; vars: string[] }[];
  experiment: (c: LearnCtx, t: TFn, n: TopicNames) => ReactNode;
  widget?: (c: LearnCtx) => ReactNode;
}

const nTrain = (c: LearnCtx) => c.session?.n_train ?? 0;
const last = (c: LearnCtx) => c.history[c.history.length - 1];
const noRun = (t: TFn) => <span className="text-muted">{t("pg.lc.noRun")}</span>;
const R = (t: TFn, key: string, vars?: Record<string, string | number>) => <Rich text={t(key, undefined, vars)} />;
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) => String(n).split("").map((d) => SUP[Number(d)]).join("");

export type TopicNames = ReturnType<typeof useTopicNames>;

/** Localised option names for the experiment sentences (hooks cannot be used inside the topic table). */
export function useTopicNames() {
  const ot = useOptionText();
  return {
    activation: (v: string) => ot.labelOf("act", ACTIVATION_OPTIONS, v),
    loss: (v: string) => ot.labelOf("loss", LOSS_OPTIONS, v),
    optimizer: (v: string) => ot.labelOf("optim", OPTIMIZER_OPTIONS, v),
  };
}

export const TOPICS: Topic[] = [
  {
    id: "iteration", group: "Basics",
    experiment: (c, t) => R(t, "pg.lc.iteration.exp", { n: c.session?.n_parameters ?? "–", b: c.config.batch_size }),
    widget: (c) => <IterationWalkthrough sessionId={c.session?.session_id ?? null} epoch={c.session?.epoch ?? 0} nTrain={nTrain(c)} />,
  },
  {
    id: "neurons", group: "Basics",
    formulas: [{ tex: String.raw`z=\sum_i w_i x_i + b,\qquad a=f(z)`, vars: ["x_i", "w_i", "b", "f", "a"] }],
    experiment: (c, t) => {
      const L = c.params?.layers[0];
      if (!L) return noRun(t);
      const w = L.weights.map((r) => r[0]);
      return R(t, "pg.lc.neurons.exp", { w: w.map((v) => v.toFixed(3)).join(", "), b: L.biases[0].toFixed(3), e: c.params?.epoch ?? 0 });
    },
  },
  {
    id: "forward", group: "Basics",
    formulas: [{ tex: String.raw`a^{[l]}=f\!\big(W^{[l]}a^{[l-1]}+b^{[l]}\big),\qquad p=\sigma\!\big(z^{[L]}\big)`, vars: ["a^{[0]}", "W^{[l]}", "p"] }],
    experiment: (c, t) => R(t, "pg.lc.forward.exp", { sizes: c.session?.layer_sizes.join(" → ") ?? [2, ...c.config.hidden_layers, 1].join(" → "), act: c.config.activation }),
  },
  {
    id: "activation", group: "Activations & loss",
    experiment: (c, t, n) => R(t, "pg.lc.activation.exp", { name: n.activation(c.config.activation) }),
    widget: (c) => <ActivationExplorer initial={c.config.activation} />,
  },
  {
    id: "loss", group: "Activations & loss",
    formulas: [
      { tex: String.raw`L_{\text{BCE}}=-\frac1m\sum_{k}\Big[y_k\ln p_k+(1-y_k)\ln(1-p_k)\Big]`, vars: ["m", "y_k", "p_k"] },
      { tex: String.raw`L_{\text{BCE}}=\frac1m\sum_k\Big[\max(z_k,0)-z_ky_k+\ln\big(1+e^{-|z_k|}\big)\Big]`, vars: ["z_k"] },
      { tex: String.raw`L_{\text{MSE}}=\frac1m\sum_k(p_k-y_k)^2,\qquad L_{\text{hinge}}=\frac1m\sum_k\max\!\big(0,\,1-s_kz_k\big),\ s_k=2y_k-1`, vars: ["s_k"] },
      { tex: String.raw`\text{MAE}=\frac1n\sum|y-\hat y|,\quad \text{MSE}=\frac1n\sum(y-\hat y)^2,\quad \text{RMSE}=\sqrt{\text{MSE}},\quad \text{MAPE}=\frac{100}{n}\sum\frac{|y-\hat y|}{|y|}`, vars: ["ŷ"] },
    ],
    experiment: (c, t, n) => {
      const l = last(c);
      if (!l) return noRun(t);
      return R(t, l.val_loss !== null ? "pg.lc.loss.expVal" : "pg.lc.loss.exp", { loss: n.loss(c.config.loss), tl: l.train_loss.toFixed(4), vl: l.val_loss?.toFixed(4) ?? "" });
    },
    widget: () => <LossComparison />,
  },
  {
    id: "backprop", group: "Activations & loss",
    formulas: [{ tex: String.raw`\delta^{[L]}=\frac{p-y}{m},\quad \delta^{[l]}=\big(\delta^{[l+1]}W^{[l+1]\top}\big)\odot f'\!\big(z^{[l]}\big),\quad \frac{\partial L}{\partial W^{[l]}}=a^{[l-1]\top}\delta^{[l]}`, vars: ["δ^{[l]}", "⊙", "f′"] }],
    experiment: (c, t) => R(t, "pg.lc.backprop.exp", { n: c.config.hidden_layers.length + 1 }),
  },
  {
    id: "gd", group: "Optimization",
    formulas: [
      { tex: String.raw`\theta\leftarrow\theta-\eta\,\nabla_\theta L`, vars: ["θ", "η", "∇L"] },
      { tex: String.raw`\text{updates per epoch}=\Big\lceil \frac{N_{\text{train}}}{B}\Big\rceil`, vars: ["N_train", "B"] },
    ],
    experiment: (c, t) => {
      const n = nTrain(c);
      if (!n) return noRun(t);
      const B = Math.min(c.config.batch_size, n);
      const u = Math.ceil(n / B);
      const mode = t(B === 1 ? "pg.lc.gd.mode.sgd" : B >= n ? "pg.lc.gd.mode.batch" : "pg.lc.gd.mode.mini");
      return <>{R(t, "pg.lc.gd.exp", { n, b: B, u, total: u * c.config.epochs, epochs: c.config.epochs, mode })}{last(c) && <> {R(t, "pg.lc.gd.expGrad", { g: last(c).grad_norm.toExponential(2) })}</>}</>;
    },
    widget: () => <GradientDescentDemo initialLr={0.1} />,
  },
  {
    id: "optim", group: "Optimization",
    formulas: [
      { tex: String.raw`\text{Momentum: } v\leftarrow\gamma v+\eta g,\ \ \theta\leftarrow\theta-v\qquad\text{Nesterov: } \theta\leftarrow\theta-(\gamma v+\eta g)`, vars: ["γ", "v"] },
      { tex: String.raw`\text{Adagrad: } G\leftarrow G+g^2,\ \ \theta\leftarrow\theta-\frac{\eta\,g}{\sqrt G+\varepsilon}\qquad\text{RMSprop: } v\leftarrow\rho v+(1-\rho)g^2,\ \ \theta\leftarrow\theta-\frac{\eta\,g}{\sqrt v+\varepsilon}`, vars: ["G", "ρ", "ε"] },
      { tex: String.raw`\text{Adadelta: } \Delta\theta=-\frac{\sqrt{E[\Delta\theta^2]+\varepsilon}}{\sqrt{E[g^2]+\varepsilon}}\,g,\ \ \theta\leftarrow\theta+\eta\,\Delta\theta`, vars: ["E[·]"] },
      { tex: String.raw`\text{Adam: } m\leftarrow\beta_1m+(1-\beta_1)g,\ v\leftarrow\beta_2v+(1-\beta_2)g^2,\ \theta\leftarrow\theta-\frac{\eta\,\hat m}{\sqrt{\hat v}+\varepsilon},\ \hat m=\tfrac{m}{1-\beta_1^t},\ \hat v=\tfrac{v}{1-\beta_2^t}`, vars: ["β₁, β₂", "m̂, v̂"] },
      { tex: String.raw`\text{Nadam: } \theta\leftarrow\theta-\frac{\eta}{\sqrt{\hat v}+\varepsilon}\Big(\beta_1\hat m+\frac{1-\beta_1}{1-\beta_1^t}\,g\Big)`, vars: [""] },
    ],
    experiment: (c, t, n) => R(t, "pg.lc.optim.exp", { opt: n.optimizer(c.config.optimizer), lr: c.config.learning_rate }),
    widget: (c) => <OptimizerRace current={c.config.optimizer} />,
  },
  {
    id: "lr", group: "Optimization",
    formulas: [{ tex: String.raw`\theta_{t+1}=\theta_t-\eta\,g_t`, vars: ["η"] }],
    experiment: (c, t) => R(t, "pg.lc.lr.exp", { lr: c.config.learning_rate, opt: c.config.optimizer.toUpperCase() }),
    widget: () => <GradientDescentDemo initialLr={0.9} />,
  },
  {
    id: "fit", group: "Generalisation",
    experiment: (c, t) => {
      const l = last(c);
      if (!l || l.val_loss === null) return noRun(t);
      const d = diagnosisText(t, diagnose(c.history, c.config.loss));
      const gap = l.val_loss - l.train_loss;
      return R(t, "pg.lc.fit.exp", { tl: l.train_loss.toFixed(3), vl: l.val_loss.toFixed(3), gap: `${gap >= 0 ? "+" : ""}${gap.toFixed(3)}`, title: d.title, reason: d.reason });
    },
  },
  {
    id: "reg", group: "Generalisation",
    formulas: [
      { tex: String.raw`L_{\text{total}}=L_{\text{data}}+\lambda_1\sum|w|+\lambda_2\sum w^2`, vars: ["λ₁", "λ₂", "Σ"] },
      { tex: String.raw`\frac{\partial}{\partial w}=\frac{\partial L_{\text{data}}}{\partial w}+\lambda_1\operatorname{sign}(w)+2\lambda_2 w`, vars: ["sign(w)"] },
    ],
    experiment: (c, t) => R(t, last(c) ? "pg.lc.reg.expPen" : "pg.lc.reg.exp", { l1: c.config.l1, l2: c.config.l2, p: last(c)?.penalty.toFixed(4) ?? "", preset: t("pg.preset.regularisation.title") }),
    widget: (c) => <WeightHistogram params={c.params} l1={c.config.l1} l2={c.config.l2} />,
  },
  {
    id: "dropout", group: "Generalisation",
    formulas: [{ tex: String.raw`\tilde a=\frac{m\odot a}{1-p},\qquad m_i\sim\text{Bernoulli}(1-p)`, vars: ["p", "m", "1/(1−p)"] }],
    experiment: (c, t) => R(t, c.config.dropout === 0 ? "pg.lc.dropout.expOff" : "pg.lc.dropout.exp", { r: c.config.dropout }),
    widget: (c) => <DropoutDemo initialRate={c.config.dropout} />,
  },
  {
    id: "bn", group: "Generalisation",
    formulas: [{ tex: String.raw`\hat x_i=\frac{x_i-\mu_B}{\sqrt{\sigma_B^2+\epsilon}},\qquad y_i=\gamma\hat x_i+\beta`, vars: ["μ_B, σ²_B", "ε", "γ, β"] }],
    experiment: (c, t) => {
      if (!c.config.batch_norm) return R(t, "pg.lc.bn.off", { sec: t("pg.ed.sec4") });
      const detail = c.session ? t("pg.lc.bn.detail", undefined, { p: c.session.n_parameters, nt: c.session.n_non_trainable }) : t("pg.lc.bn.detailNone");
      return R(t, "pg.lc.bn.on", { detail });
    },
    widget: () => <BatchNormDemo />,
  },
  {
    id: "early", group: "Generalisation",
    experiment: (c, t) => {
      if (!c.session || !c.session.best_epoch) return noRun(t);
      const s = c.session;
      const tail = c.config.early_stopping
        ? (s.stopped_early ? t(s.restored_best ? "pg.lc.early.stoppedRestored" : "pg.lc.early.stopped", undefined, { e: s.epoch }) : t("pg.lc.early.on", undefined, { p: c.config.patience }))
        : t("pg.lc.early.off", undefined, { sec: t("pg.ed.sec5") });
      return <>{R(t, "pg.lc.early.best", { e: s.best_epoch ?? 0 })} {tail}</>;
    },
  },
  {
    id: "split", group: "Evaluation",
    experiment: (c, t) => c.session ? R(t, "pg.lc.split.exp", { a: c.session.n_train, b: c.session.n_val, pct: Math.round(c.config.val_split * 100) }) : noRun(t),
  },
  {
    id: "validation", group: "Evaluation",
    experiment: (c, t) => R(t, "pg.lc.validation.exp", { a: c.session?.n_train ?? "–", b: c.session?.n_val ?? "–" }),
  },
  {
    id: "metrics", group: "Evaluation",
    formulas: [
      { tex: String.raw`\text{Acc}=\frac{TP+TN}{TP+TN+FP+FN},\ \ P=\frac{TP}{TP+FP},\ \ R=\frac{TP}{TP+FN},\ \ F_1=\frac{2PR}{P+R}=\frac{TP}{TP+\frac{FN+FP}{2}}`, vars: ["TP, TN", "FP", "FN"] },
      { tex: String.raw`\text{TPR}=\frac{TP}{TP+FN},\qquad \text{FPR}=\frac{FP}{FP+TN},\qquad \text{AUC}=\int_0^1\text{TPR}\,d(\text{FPR})`, vars: ["TPR", "FPR"] },
    ],
    experiment: (c, t) => {
      const e = c.evaluation;
      if (!e) return noRun(t);
      return <>{R(t, "pg.lc.metrics.exp", { split: t(e.split === "val" ? "pg.ev.splitVal" : "pg.ev.splitTrain"), n: e.n, thr: e.threshold, tp: e.confusion.tp, fp: e.confusion.fp, tn: e.confusion.tn, fn: e.confusion.fn, acc: (e.accuracy * 100).toFixed(1), p: (e.precision * 100).toFixed(1), r: (e.recall * 100).toFixed(1), f1: (e.f1 * 100).toFixed(1) })}{e.auc !== null && R(t, "pg.lc.metrics.expAuc", { auc: e.auc.toFixed(3) })}.</>;
    },
  },
  {
    id: "boundary", group: "Evaluation",
    formulas: [{ tex: String.raw`\hat y=\begin{cases}1&p\ge0.5\\0&p<0.5\end{cases}\qquad \text{boundary: } z^{[L]}(x,y)=0`, vars: ["p"] }],
    experiment: (c, t) => R(t, c.config.hidden_layers.length === 0 ? "pg.lc.boundary.expLinear" : "pg.lc.boundary.expCurve", { n: c.config.hidden_layers.length }),
  },
  {
    id: "vanish", group: "Activations & loss",
    formulas: [{ tex: String.raw`\left\|\frac{\partial L}{\partial W^{[1]}}\right\|\ \lesssim\ \prod_{l}\big\|W^{[l]}\big\|\,\big|f'(z^{[l]})\big|\ \xrightarrow{\ f'\le 0.25\ }\ 0.25^{\,\text{depth}}\ \text{(sigmoid)}`, vars: ["depth"] }],
    experiment: (c, t) => {
      const d = c.config.hidden_layers.length;
      const sig = c.config.activation === "sigmoid" && d > 0 ? t("pg.lc.vanish.sigmoid", undefined, { sup: sup(d), v: (0.25 ** d).toExponential(1) }) : ".";
      return <>{R(t, "pg.lc.vanish.exp", { act: c.config.activation, d })}{sig} {t("pg.lc.vanish.end")}</>;
    },
  },
];
