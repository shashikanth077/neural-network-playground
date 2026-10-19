import { useEffect, useMemo, useRef, useState } from "react";
import { useIsDark } from "../hooks/useTheme";
import { mulberry32 } from "../labs/lab1/math";
import { canvasColor, col, Controls, Legend, Out, Seg, Slider } from "../labs/ui";
import { fmt } from "../lib/format";
import { LOSS_FNS } from "../lib/losses";
import { batchNorm, dropoutMask, gaussian, meanOf } from "../lib/norm";
import { OPTIMIZER_OPTIONS } from "../lib/options";
import { race, VALLEY_RATES } from "../lib/optimizers";
import type { ModelParameters, Optimizer } from "../types";

/* ----------------------------------------------------------- loss functions */
export function LossComparison() {
  const [z, setZ] = useState(-3);
  const [y, setY] = useState<0 | 1>(1);
  const X = (v: number) => 40 + ((v + 6) / 12) * 640;
  const Y = (v: number) => 200 - Math.min(v, 5) * 36;
  const names = ["bce", "mse", "hinge"] as const;
  const colors = { bce: "brand", mse: "c-amber", hinge: "c-teal" } as const;
  const label = { bce: "Cross-entropy", mse: "Squared error", hinge: "Hinge" } as const;
  const path = (k: (typeof names)[number]) =>
    Array.from({ length: 121 }, (_, i) => { const v = -6 + i * 0.1; return `${i ? "L" : "M"}${X(v)},${Y(LOSS_FNS[k].f(v, y))}`; }).join("");
  return (
    <div className="rounded-xl border border-line p-3">
      <Controls>
        <Seg label="True class" value={String(y) as "0" | "1"} onChange={(v) => setY(Number(v) as 0 | 1)} options={[{ value: "1", label: "True class 1" }, { value: "0", label: "True class 0" }]} />
        <Slider id="loss-z" label="Model's raw score (logit z)" min={-6} max={6} step={0.1} value={z} onChange={setZ} format={(v) => v.toFixed(1)} />
      </Controls>
      <svg viewBox="0 0 720 230" className="w-full" role="img" aria-label="Loss versus logit for three loss functions">
        <line x1="40" x2="680" y1="200" y2="200" style={{ stroke: col("line") }} />
        <line x1={X(0)} x2={X(0)} y1="10" y2="200" style={{ stroke: col("line") }} />
        {names.map((k) => <path key={k} d={path(k)} fill="none" strokeWidth="2.5" style={{ stroke: col(colors[k]) }} />)}
        {names.map((k) => <circle key={k} cx={X(z)} cy={Y(LOSS_FNS[k].f(z, y))} r="5" style={{ fill: col(colors[k]) }} />)}
        <text x="44" y="224" fontSize="11" style={{ fill: col("muted") }}>z = −6 (confident “0”)</text>
        <text x="676" y="224" textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>z = +6 (confident “1”)</text>
      </svg>
      <Legend items={names.map((k) => ({ color: col(colors[k]), label: label[k] }))} />
      <Out>
        <table className="w-full text-left text-xs">
          <thead><tr><th scope="col">Loss</th><th scope="col">value</th><th scope="col">gradient ∂L/∂z (the learning signal)</th></tr></thead>
          <tbody>
            {names.map((k) => (
              <tr key={k}><td style={{ color: col(colors[k]) }}><b>{label[k]}</b></td><td className="font-mono">{fmt(LOSS_FNS[k].f(z, y), 4)}</td><td className="font-mono">{fmt(LOSS_FNS[k].g(z, y), 4)}</td></tr>
            ))}
          </tbody>
        </table>
        {(y === 1 ? z < -3 : z > 3) && <p className="mt-1 text-xs text-muted">Confidently wrong: cross-entropy keeps a strong gradient, squared error's gradient has almost vanished, so it learns from this mistake very slowly.</p>}
      </Out>
    </div>
  );
}

/* --------------------------------------------------------------- optimizers */
const NAMES: Optimizer[] = ["sgd", "momentum", "nesterov", "adagrad", "rmsprop", "adadelta", "adam", "nadam"];
const RACE_COLORS: Record<Optimizer, string> = { sgd: "bad", momentum: "c-amber", nesterov: "c-purple", adagrad: "c-teal", rmsprop: "ok", adadelta: "muted", adam: "pos", nadam: "brand" };

export function OptimizerRace({ current }: { current: Optimizer }) {
  const dark = useIsDark();
  const [steps, setSteps] = useState(120);
  const [shared, setShared] = useState(false);
  const [lrExp, setLrExp] = useState(-1);
  const [shown, setShown] = useState<Optimizer[]>(["sgd", "momentum", "rmsprop", "adam"]);
  const cv = useRef<HTMLCanvasElement>(null);
  const lr = 10 ** lrExp;
  const runs = useMemo(() => race(NAMES, (n) => (shared ? lr : VALLEY_RATES[n]), steps), [steps, shared, lr]);

  useEffect(() => {
    const c = cv.current?.getContext("2d");
    if (!cv.current || !c) return;
    const W = cv.current.width, H = cv.current.height;
    c.clearRect(0, 0, W, H);
    const X = (x: number) => ((x + 5) / 10) * W;
    const Y = (y: number) => H / 2 - (y / 2) * (H / 2) * 0.98;
    c.strokeStyle = canvasColor("line"); c.lineWidth = 1.5;
    [0.5, 2, 5, 10, 16].forEach((L) => { c.beginPath(); c.ellipse(X(0), Y(0), Math.sqrt(2 * L) * (W / 10), Math.sqrt((2 * L) / 10) * (H / 4) * 0.98, 0, 0, 7); c.stroke(); });
    for (const n of shown) {
      const color = canvasColor(RACE_COLORS[n]);
      c.strokeStyle = color; c.fillStyle = color; c.lineWidth = n === current ? 3.5 : 2; c.beginPath();
      let started = false;
      runs[n].path.forEach((p) => {
        if (Math.abs(p[0]) > 5 || Math.abs(p[1]) > 2.2) return;
        if (!started) { c.moveTo(X(p[0]), Y(p[1])); started = true; } else c.lineTo(X(p[0]), Y(p[1]));
      });
      c.stroke();
      const e = runs[n].path[runs[n].path.length - 1];
      if (Math.abs(e[0]) <= 5 && Math.abs(e[1]) <= 2.2) { c.beginPath(); c.arc(X(e[0]), Y(e[1]), 5, 0, 7); c.fill(); }
    }
    c.fillStyle = canvasColor("ink"); c.beginPath(); c.arc(X(-4.2), Y(1.5), 6, 0, 7); c.fill();
    c.strokeStyle = canvasColor("ink"); c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(0) - 7, Y(0)); c.lineTo(X(0) + 7, Y(0)); c.moveTo(X(0), Y(0) - 7); c.lineTo(X(0), Y(0) + 7); c.stroke();
  }, [runs, shown, current, dark]);

  const toggle = (n: Optimizer) => setShown((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-muted">A toy loss valley (steep in y, flat in x). All start at the black dot; the cross is the minimum. This is an illustration with its own learning rates, not your network.</p>
      <div className="mt-2"><Controls>
        <Slider id="race-steps" label="Steps" min={1} max={400} step={1} value={steps} onChange={setSteps} />
        <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand" checked={shared} onChange={(e) => setShared(e.target.checked)} />Same learning rate for all</label>
        {shared && <Slider id="race-lr" label="Shared learning rate" min={-2.5} max={0.5} step={0.05} value={lrExp} onChange={setLrExp} format={() => lr.toFixed(3)} />}
      </Controls></div>
      <canvas ref={cv} width={900} height={320} className="w-full rounded-xl border border-line" role="img" aria-label="Optimizer paths on a loss valley" />
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Optimizers to show">
        {NAMES.map((n) => (
          <button key={n} aria-pressed={shown.includes(n)} onClick={() => toggle(n)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium ${shown.includes(n) ? "border-brand bg-brand/10" : "border-line text-muted"}`}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: col(RACE_COLORS[n]) }} />{OPTIMIZER_OPTIONS.find((o) => o.value === n)!.label.split(" (")[0]}
          </button>
        ))}
      </div>
      <Out>
        {shown.map((n, i) => (
          <span key={n}>{i > 0 && " · "}<b style={{ color: col(RACE_COLORS[n]) }}>{n}</b>: {runs[n].ok ? `loss ${runs[n].loss < 1e-4 ? runs[n].loss.toExponential(1) : runs[n].loss.toFixed(3)}` : "diverged"}{!shared && ` (η ${VALLEY_RATES[n]})`}</span>
        ))}
        {!shared && <span className="mt-1 block text-xs text-muted">Each optimizer uses a rate measured to work on this valley. Adadelta needs the most steps because its running average of past updates starts at zero.</span>}
      </Out>
    </div>
  );
}

/* ------------------------------------------------------ real weight histogram */
export function WeightHistogram({ params, l1, l2 }: { params: ModelParameters | null; l1: number; l2: number }) {
  if (!params) return <p className="text-sm text-muted">Create a model to see its weights.</p>;
  const w = params.layers.flatMap((L) => L.weights.flat());
  const max = Math.max(0.5, ...w.map(Math.abs));
  const bins = 21;
  const counts = new Array<number>(bins).fill(0);
  w.forEach((v) => { counts[Math.min(bins - 1, Math.floor(((v + max) / (2 * max)) * bins))]++; });
  const top = Math.max(...counts, 1);
  const l1n = w.reduce((s, v) => s + Math.abs(v), 0);
  const l2n = w.reduce((s, v) => s + v * v, 0);
  const small = w.filter((v) => Math.abs(v) < 0.05).length / w.length;
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-muted">Histogram of every weight in your network right now (epoch {params.epoch}). L2 squeezes the spread; L1 piles weights up at zero.</p>
      <svg viewBox="0 0 420 130" className="mt-2 w-full max-w-lg" role="img" aria-label="Histogram of the network's weights">
        {counts.map((c, i) => <rect key={i} x={10 + i * 19} y={105 - (c / top) * 95} width="16" height={(c / top) * 95} rx="2" style={{ fill: i === Math.floor(bins / 2) ? col("c-teal") : col("brand") }} opacity=".8" />)}
        <line x1="10" x2="410" y1="105" y2="105" style={{ stroke: col("line") }} />
        <text x="10" y="122" fontSize="10" style={{ fill: col("muted") }}>−{max.toFixed(2)}</text>
        <text x="210" y="122" textAnchor="middle" fontSize="10" style={{ fill: col("muted") }}>0</text>
        <text x="410" y="122" textAnchor="end" fontSize="10" style={{ fill: col("muted") }}>+{max.toFixed(2)}</text>
      </svg>
      <Out>
        {w.length} weights · Σ|w| = <b>{l1n.toFixed(3)}</b> · Σw² = <b>{l2n.toFixed(3)}</b> · {(small * 100).toFixed(0)}% have |w| &lt; 0.05
        <br />Penalty with your settings: {l1}·Σ|w| + {l2}·Σw² = <b>{(l1 * l1n + l2 * l2n).toFixed(4)}</b>
      </Out>
    </div>
  );
}

/* ------------------------------------------------------------------ dropout */
export function DropoutDemo({ initialRate }: { initialRate: number }) {
  const [rate, setRate] = useState(initialRate > 0 ? initialRate : 0.4);
  const [seed, setSeed] = useState(1);
  const acts = useMemo(() => gaussian(12, 0.5, 0.25, 4).map((v) => Math.min(1, Math.max(0.05, v))), []);
  const mask = useMemo(() => dropoutMask(12, rate, mulberry32(seed)), [rate, seed]);
  const S = acts.reduce((a, b) => a + b, 0);
  const Sq = acts.reduce((s, a, i) => s + (mask[i] > 0 ? a : 0), 0);
  const scaled = acts.reduce((s, a, i) => s + a * mask[i], 0);
  const avg = useMemo(() => {
    const r = mulberry32(99);
    let t = 0;
    for (let k = 0; k < 3000; k++) t += dropoutMask(12, rate, r).reduce((s, m, i) => s + m * acts[i], 0);
    return t / 3000;
  }, [rate, acts]);
  return (
    <div className="rounded-xl border border-line p-3">
      <Controls>
        <Slider id="do-rate" label="Dropout rate p" min={0} max={0.9} step={0.05} value={rate} onChange={setRate} format={(v) => v.toFixed(2)} />
        <button className="btn-ghost" onClick={() => setSeed((s) => s + 1)}>Sample a new mask</button>
      </Controls>
      <div className="flex flex-wrap gap-1.5" role="img" aria-label="Twelve neurons, dropped ones crossed out">
        {acts.map((a, i) => (
          <div key={i} className={`grid h-14 w-12 place-items-center rounded-lg border text-center text-xs ${mask[i] > 0 ? "border-line bg-raised" : "border-bad/50 bg-bad/10 line-through opacity-60"}`}>
            <span className="font-mono">{a.toFixed(2)}</span>
            <span className="text-[10px] text-muted">{mask[i] > 0 ? `×${mask[i].toFixed(2)}` : "off"}</span>
          </div>
        ))}
      </div>
      <Out>
        Full sum S = <b>{S.toFixed(3)}</b> · kept neurons only S<sub>q</sub> = <b>{Sq.toFixed(3)}</b> · after scaling by 1/(1−p) = {(1 / (1 - rate)).toFixed(2)}: <b>{scaled.toFixed(3)}</b>
        <br />Average of the scaled sum over 3000 random masks: <b>{avg.toFixed(3)}</b> ≈ S. Scaling keeps the expected signal unchanged, so nothing needs rescaling at prediction time.
      </Out>
    </div>
  );
}

/* --------------------------------------------------------------- batch norm */
export function BatchNormDemo() {
  const [gamma, setGamma] = useState(1);
  const [beta, setBeta] = useState(0);
  const x = useMemo(() => gaussian(8, 3, 2, 3), []);
  const r = batchNorm(x, gamma, beta);
  const row = (a: number[]) => a.map((v) => v.toFixed(2)).join("  ");
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-muted">One feature over a mini-batch of 8 samples (values from a seeded random generator).</p>
      <Controls>
        <Slider id="bn-g" label="γ (scale, learned)" min={0.2} max={3} step={0.1} value={gamma} onChange={setGamma} format={(v) => v.toFixed(1)} />
        <Slider id="bn-b" label="β (shift, learned)" min={-3} max={3} step={0.1} value={beta} onChange={setBeta} format={(v) => v.toFixed(1)} />
      </Controls>
      <pre className="overflow-x-auto rounded-xl border border-line bg-raised p-3 font-mono text-xs leading-relaxed">{`x      = ${row(x)}
x̂      = ${row(r.xhat)}
y=γx̂+β = ${row(r.y)}`}</pre>
      <Out>
        Batch mean μ = <b>{r.mu.toFixed(3)}</b>, variance σ² = <b>{r.variance.toFixed(3)}</b> → normalised x̂ has mean <b>{meanOf(r.xhat).toFixed(3)}</b> and variance <b>1.000</b>; the output y has mean <b>{meanOf(r.y).toFixed(2)}</b> (= β) because γ and β let the network undo the normalisation if that helps.
      </Out>
    </div>
  );
}
