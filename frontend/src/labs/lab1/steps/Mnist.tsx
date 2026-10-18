import { useEffect, useRef, useState } from "react";
import { Callout, col, Controls, Demo, f2, Grid, Out } from "../../ui";
import { DIGIT } from "../digit";
import { softmax } from "../math";

const BASE_LOGITS = [-1, -1, 0, -1, -2, -1, -2, 4, 0, 1];

function PixelViewer() {
  const cv = useRef<HTMLCanvasElement>(null);
  const strip = useRef<HTMLCanvasElement>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cell, setCell] = useState<{ r: number; q: number } | null>(null);

  useEffect(() => {
    const c = cv.current?.getContext("2d");
    const k = 12;
    if (c) for (let r = 0; r < 28; r++) for (let q = 0; q < 28; q++) {
      const v = DIGIT[r * 28 + q];
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(q * k, r * k, k, k);
    }
    const s = strip.current?.getContext("2d");
    if (s) {
      for (let i = 0; i < 784; i++) { const v = DIGIT[i]; s.fillStyle = `rgb(${v},${v},${v})`; s.fillRect(i, 0, 1, 30); }
      s.fillStyle = "rgba(255,80,80,.5)";
      for (let r = 1; r < 28; r++) s.fillRect(r * 28, 0, 1, 30);
    }
  }, []);

  useEffect(() => {
    const c = cv.current?.getContext("2d");
    if (!c || !cell) return;
    c.save();
    c.strokeStyle = "#ef4444";
    c.lineWidth = 2;
    c.strokeRect(cell.q * 12 + 1, cell.r * 12 + 1, 10, 10);
    c.restore();
    return () => {
      const v = DIGIT[cell.r * 28 + cell.q];
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(cell.q * 12, cell.r * 12, 12, 12);
    };
  }, [cell]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const q = Math.floor(((e.clientX - b.left) / b.width) * 28);
    const r = Math.floor(((e.clientY - b.top) / b.height) * 28);
    if (q < 0 || q > 27 || r < 0 || r > 27) return;
    const v = DIGIT[r * 28 + q];
    setCell({ r, q });
    setInfo(`row ${r}, column ${q} → pixel value ${v} → scaled ${f2(v / 255, 3)} · position in the flat list: ${r * 28 + q}`);
  };

  return (
    <Demo title="Step 1 · A picture is just numbers">
      <Grid>
        <div>
          <canvas ref={cv} width={336} height={336} onMouseMove={onMove} onMouseLeave={() => { setCell(null); setInfo(null); }}
            className="w-full max-w-[336px] cursor-crosshair rounded-lg border border-line [image-rendering:pixelated]" role="img" aria-label="A handwritten 7 as 28 by 28 pixels" />
          <Out>{info ?? "Move the mouse over the digit to read pixel values (0 = black, 255 = white). This is the real digit used in the lab (a 7)."}</Out>
        </div>
        <div>
          <h4 className="font-semibold">Step 2 · Flatten</h4>
          <p className="mt-1 text-sm">A Dense layer wants a list, not a grid: 28 rows are placed one after another → <b>784 numbers</b>. Divide by 255 so they lie in 0-1.</p>
          <canvas ref={strip} width={784} height={30} className="mt-2 w-full rounded border border-line" role="img" aria-label="The 784 pixel values as one strip" />
          <p className="mb-4 mt-1 text-xs text-muted">The 784 inputs as a strip (28 rows glued end to end).</p>
          <h4 className="font-semibold">Step 3 · Labels become one-hot</h4>
          <p className="mt-1 text-sm">The digit 7 is encoded as <code className="rounded bg-raised px-1.5 font-mono">[0,0,0,0,0,0,0,1,0,0]</code>. The network outputs 10 numbers, one per digit.</p>
        </div>
      </Grid>
    </Demo>
  );
}

const LAYERS: [number, string][] = [[784, "input"], [512, "relu"], [256, "relu"], [128, "relu"], [64, "relu"], [10, "softmax"]];

function Architecture() {
  const xs = LAYERS.map((_, i) => 80 + i * 148);
  const show = (n: number) => Math.min(n === 784 ? 9 : n > 100 ? 7 : n > 20 ? 6 : n, 10);
  const pos = LAYERS.map(([n], i) => Array.from({ length: show(n) }, (_, j) => [xs[i], 150 + (j - (show(n) - 1) / 2) * 24] as const));
  const colors = ["c-teal", "brand", "brand", "brand", "brand", "c-purple"];
  const params = [401920, 131328, 32896, 8256, 650];
  return (
    <Demo title="Step 4 · The network (best model from the 6.1 experiments)">
      <div className="overflow-x-auto">
        <svg viewBox="0 0 900 300" className="min-w-[640px] w-full" role="img" aria-label="Architecture 784-512-256-128-64-10">
          {pos.slice(0, -1).map((layer, i) => layer.map((a, ai) => pos[i + 1].map((b, bi) => (
            <line key={`${i}-${ai}-${bi}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} style={{ stroke: col("line") }} />
          ))))}
          {pos.map((layer, i) => layer.map(([x, y], j) => <circle key={`${i}-${j}`} cx={x} cy={y} r="8" style={{ fill: col(colors[i]) }} />))}
          {LAYERS.map(([n, a], i) => (
            <g key={i} textAnchor="middle">
              <text x={xs[i]} y="26" fontSize="15" fontWeight="700" style={{ fill: col("ink") }}>{n}</text>
              <text x={xs[i]} y="46" fontSize="12" style={{ fill: col("muted") }}>{a}</text>
              <text x={xs[i]} y="285" fontSize="12" style={{ fill: col("muted") }}>{i === 0 ? "pixels" : i === 5 ? "digits 0-9" : `hidden ${i}`}</text>
              {i > 0 && i < 5 && <text x={xs[i]} y="66" fontSize="11" style={{ fill: col("muted") }}>…</text>}
            </g>
          ))}
        </svg>
      </div>
      <p className="text-sm text-muted">
        784 → 512 → 256 → 128 → 64 → 10. Hidden layers use <b className="text-ink">ReLU</b>; the output uses <b className="text-ink">softmax</b>. Parameters per layer = inputs × neurons + neurons (biases): {params.map((p) => p.toLocaleString("en")).join(" + ")} = <b className="text-ink">{params.reduce((a, b) => a + b, 0).toLocaleString("en")}</b>.
      </p>
    </Demo>
  );
}

function SoftmaxCalc() {
  const [logits, setLogits] = useState(BASE_LOGITS);
  const [truth, setTruth] = useState(7);
  const p = softmax(logits);
  const top = p.indexOf(Math.max(...p));
  return (
    <Demo title="Step 5 · Softmax and the loss (live calculator)">
      <p className="text-sm text-muted">
        The last layer gives raw scores (logits). Softmax turns them into probabilities that sum to 1. Categorical cross-entropy then punishes a low probability on the <i>true</i> digit: loss = −ln(p<sub>true</sub>).
      </p>
      <div className="mt-3"><Controls>
        <div>
          <label htmlFor="sm-true" className="label">True digit</label>
          <select id="sm-true" className="field w-24" value={truth} onChange={(e) => setTruth(Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <button className="btn-ghost" onClick={() => setLogits(BASE_LOGITS)}>Reset</button>
      </Controls></div>
      <Grid>
        <div className="space-y-1">
          {logits.map((v, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <label htmlFor={`sm-${i}`} className="w-14 shrink-0 text-muted">logit {i}</label>
              <input id={`sm-${i}`} type="range" min={-5} max={8} step={0.1} value={v} className="min-w-0 flex-1 accent-brand"
                onChange={(e) => setLogits((l) => l.map((x, j) => (j === i ? Number(e.target.value) : x)))} />
              <output className="w-9 text-right font-mono">{f2(v, 1)}</output>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 360 250" className="w-full" role="img" aria-label="Softmax probabilities per digit">
          {p.map((v, i) => (
            <g key={i}>
              <text x="14" y={22 + i * 23} fontSize="12" style={{ fill: col("muted") }}>{i}</text>
              <rect x="30" y={10 + i * 23} width={Math.max(1, v * 290)} height="15" rx="4" opacity={i === truth ? 1 : 0.6} style={{ fill: i === truth ? col("ok") : col("brand") }} />
              <text x={34 + v * 290} y={22 + i * 23} fontSize="11" style={{ fill: col("ink") }}>{f2(v * 100, 1)}%</text>
            </g>
          ))}
        </svg>
      </Grid>
      <Out>
        Probabilities sum to <b>{f2(p.reduce((a, b) => a + b, 0), 3)}</b>. Prediction: <b>{top}</b> {top === truth ? "✔ correct" : "✘ wrong"} · loss = −ln({f2(p[truth], 4)}) = <b>{f2(-Math.log(p[truth]), 4)}</b>
      </Out>
      <Callout title="Accuracy vs loss">
        Accuracy only asks “was the top answer right?”. Loss also asks “how sure were you?”. A model can keep accuracy and still get a worse loss by being over-confident when wrong. This explains result 6.2 (relu: higher accuracy, higher loss).
      </Callout>
    </Demo>
  );
}

function Split() {
  return (
    <Demo title="Step 6 · Splitting the data and watching the learning curves">
      <svg viewBox="0 0 900 120" className="w-full" role="img" aria-label="Data split: 80% train (48,000) of which 20% validation, test 10,000">
        <rect x="10" y="20" width="620" height="40" rx="6" opacity=".9" style={{ fill: col("pos") }} />
        <rect x="10" y="20" width="496" height="40" rx="6" opacity=".95" style={{ fill: col("c-teal") }} />
        <rect x="640" y="20" width="250" height="40" rx="6" style={{ fill: col("c-amber") }} />
        <g fontSize="13" fontWeight="700" textAnchor="middle" fill="#fff">
          <text x="258" y="45">train 80% (48 000)</text><text x="568" y="45">validation 20%</text><text x="765" y="45">test (10 000)</text>
        </g>
        <g fontSize="13" style={{ fill: col("muted") }}>
          <text x="10" y="90">fit weights</text>
          <text x="568" y="90" textAnchor="middle">tune settings,</text><text x="568" y="108" textAnchor="middle">watch overfitting</text>
          <text x="765" y="90" textAnchor="middle">final honest score,</text><text x="765" y="108" textAnchor="middle">used once</text>
        </g>
      </svg>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <svg viewBox="0 0 420 260" className="w-full" role="img" aria-label="Concept sketch of overfitting">
            <g style={{ stroke: col("line") }}><line x1="40" y1="220" x2="400" y2="220" /><line x1="40" y1="20" x2="40" y2="220" /></g>
            <path d="M40,40 C80,150 140,190 400,210" fill="none" strokeWidth="3" style={{ stroke: col("c-teal") }} />
            <path d="M40,60 C80,130 120,150 160,150 C220,150 300,160 400,190" fill="none" strokeWidth="3" style={{ stroke: col("bad") }} />
            <line x1="160" y1="20" x2="160" y2="220" strokeDasharray="5 4" style={{ stroke: col("c-amber") }} />
            <text x="166" y="36" fontSize="12" style={{ fill: col("muted") }}>best stop</text>
            <text x="250" y="184" fontSize="13" style={{ fill: col("c-teal") }}>training loss ↓</text>
            <text x="230" y="136" fontSize="13" style={{ fill: col("bad") }}>validation loss flat/up</text>
            <text x="220" y="245" textAnchor="middle" fontSize="12" style={{ fill: col("muted") }}>epochs →</text>
          </svg>
          <p className="text-sm text-muted"><b className="text-ink">Overfitting</b>: the model memorises the training set. Training loss keeps falling but validation loss stops improving.</p>
        </div>
        <div>
          <img src="/labs/lab1/learning-curves.png" alt="Loss and accuracy per epoch for the best model: training keeps improving while validation flattens" className="w-full rounded-xl border border-line bg-white" loading="lazy" />
          <p className="mt-1 text-sm text-muted">Real curves of the best model from the notebook: validation loss stops improving around epoch 4 while training loss keeps dropping.</p>
        </div>
      </div>
    </Demo>
  );
}

export default function Mnist() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        MNIST = 60 000 training + 10 000 test pictures of handwritten digits, 28×28 pixels, grey values 0-255. “Fully connected” (Dense) means every neuron looks at every neuron of the previous layer.
      </p>
      <PixelViewer />
      <Architecture />
      <SoftmaxCalc />
      <Split />
    </div>
  );
}
