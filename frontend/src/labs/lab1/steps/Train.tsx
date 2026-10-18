import { useEffect, useMemo, useRef, useState } from "react";
import { useIsDark } from "../../../hooks/useTheme";
import { Callout, canvasColor, col, Controls, Demo, f2, Legend, Out, Slider } from "../../ui";
import { GENDER_LABELS, HEIGHTS, WEIGHTS } from "../data";
import { minMax, SmallNet } from "../math";

const h = minMax(HEIGHTS);
const w = minMax(WEIGHTS);
const X: number[][] = [];
const Y: number[] = [];
GENDER_LABELS.forEach((g, i) => {
  if (g === null) return;
  X.push([h[i], w[i]]);
  Y.push(g);
});
const NAME5 = [h[4], w[4]];

function Trainer() {
  const dark = useIsDark();
  const [lrExp, setLrExp] = useState(-0.3);
  const [epExp, setEpExp] = useState(2.7);
  const [seed, setSeed] = useState(7);
  const [net, setNet] = useState(() => new SmallNet(7));
  const [trained, setTrained] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lr = 10 ** lrExp;
  const epochs = Math.round(10 ** epExp);

  const train = () => {
    const n = new SmallNet(seed);
    n.train(X, Y, lr, epochs);
    setNet(n);
    setTrained(true);
  };
  const restart = () => {
    const s = Math.floor(Math.random() * 1e6);
    setSeed(s);
    setNet(new SmallNet(s));
    setTrained(false);
  };

  useEffect(() => {
    const cv = canvas.current;
    const c = cv?.getContext("2d");
    if (!cv || !c) return;
    const W = cv.width;
    const H = cv.height;
    const img = c.createImageData(W, H);
    const female = [59, 130, 246];
    const male = [245, 158, 11];
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const o = net.forward([px / (W - 1), 1 - py / (H - 1)]).out;
        const k = (py * W + px) * 4;
        img.data[k] = female[0] * (1 - o) + male[0] * o;
        img.data[k + 1] = female[1] * (1 - o) + male[1] * o;
        img.data[k + 2] = female[2] * (1 - o) + male[2] * o;
        img.data[k + 3] = dark ? 150 : 120;
      }
    }
    c.fillStyle = dark ? "#181c30" : "#ffffff";
    c.fillRect(0, 0, W, H);
    c.putImageData(img, 0, 0);
    const P = (x: number[]) => [x[0] * (W - 1), (1 - x[1]) * (H - 1)];
    X.forEach((x, i) => {
      const [p, q] = P(x);
      c.beginPath();
      c.arc(p, q, 6, 0, 7);
      c.fillStyle = Y[i] ? "#b45309" : "#1d4ed8";
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = "#fff";
      c.stroke();
    });
    const [sx, sy] = P(NAME5);
    c.fillStyle = dark ? "#fff" : "#111";
    c.strokeStyle = dark ? "#111" : "#fff";
    c.lineWidth = 2;
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 6 : 14;
      const a = (Math.PI * k) / 5 - Math.PI / 2;
      c.lineTo(sx + r * Math.cos(a), sy + r * Math.sin(a));
    }
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = canvasColor("muted");
    c.font = "12px system-ui";
    c.fillText("weight →", 6, 14);
    c.fillText("height →", W - 62, H - 6);
  }, [net, dark]);

  const hist = net.lossHistory;
  const mx = Math.max(0.3, ...hist);
  const o5 = net.forward(NAME5).out;
  const acc = net.accuracy(X, Y);
  const path = hist.map((l, i) => `${i ? "L" : "M"}${40 + (i / Math.max(hist.length - 1, 1)) * 370},${290 - (l / mx) * 250}`).join("");

  return (
    <Demo title="Train the 2-2-1 network on the 15 labelled patients">
      <Controls>
        <Slider id="tr-lr" label="Learning rate" min={-2} max={0.35} step={0.05} value={lrExp} onChange={setLrExp} format={() => f2(lr, 3)} />
        <Slider id="tr-ep" label="Epochs" min={0} max={3.4} step={0.05} value={epExp} onChange={setEpExp} format={() => String(epochs)} />
        <button className="btn-primary" onClick={train}>Train</button>
        <button className="btn-ghost" onClick={restart}>New random start</button>
      </Controls>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <canvas ref={canvas} width={280} height={214} className="w-full rounded-xl border border-line" role="img" aria-label="Decision map of the small network" />
          <Legend items={[{ color: "#3b82f6", label: "network says female" }, { color: "#f59e0b", label: "says male" }, { color: col("muted"), label: "● known patients · ★ Name 5" }]} />
        </div>
        <svg viewBox="0 0 420 320" className="w-full" role="img" aria-label="Training loss curve">
          <text x="14" y="18" fontSize="12" style={{ fill: col("muted") }}>training loss (MSE)</text>
          <g style={{ stroke: col("line") }}><line x1="40" y1="30" x2="40" y2="290" /><line x1="40" y1="290" x2="410" y2="290" /></g>
          {hist.length ? (
            <>
              <path d={path} fill="none" strokeWidth="2.5" style={{ stroke: col("brand") }} />
              <text x="36" y="40" textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>{f2(mx, 2)}</text>
              <text x="36" y="290" textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>0</text>
              <text x="410" y="306" textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>epochs → {hist.length}</text>
            </>
          ) : (
            <text x="225" y="160" textAnchor="middle" fontSize="13" style={{ fill: col("muted") }}>press “Train”</text>
          )}
        </svg>
      </div>
      <Out>
        {trained ? "" : "Random start (untrained): "}Name 5 output = <b>{f2(o5, 4)}</b> → <b>{o5 > 0.5 ? "male (1)" : "female (0)"}</b> · training accuracy <b>{f2(acc * 100, 0)}%</b>
        {hist.length ? <> · final loss <b>{f2(hist[hist.length - 1], 5)}</b></> : null}
      </Out>
      <Callout title="What to look for">
        Learning rate 0.01 with 100 epochs: almost no learning (the lab's Run 1 was wrong too). Increase either one and the colour boundary snaps between the women's and men's clusters, the loss falls and Name 5 becomes female. Very large rates can overshoot, which you will see clearly in the optimizer step.
      </Callout>
    </Demo>
  );
}

function Hill() {
  const [lr, setLr] = useState(0.2);
  const pts = useMemo(() => {
    let wv = 4;
    const p = [wv];
    for (let i = 0; i < 10; i++) {
      wv -= lr * 2 * wv;
      p.push(wv);
    }
    return p;
  }, [lr]);
  const X = (v: number) => 360 + v * 60;
  const Y = (l: number) => 210 - Math.min(l, 16) * 12;
  const curve = Array.from({ length: 101 }, (_, i) => {
    const v = -5 + i * 0.1;
    return `${i ? "L" : "M"}${X(v)},${Y(v * v)}`;
  }).join("");
  const last = pts[pts.length - 1];
  return (
    <Demo title="Learning rate on a 1-D hill">
      <p className="text-sm text-muted">Training = walking downhill on the loss surface. The learning rate is the step size. Start at w = 4 on the hill loss = w².</p>
      <div className="mt-3"><Controls><Slider id="hl-lr" label="Learning rate" min={0.02} max={1.1} step={0.01} value={lr} onChange={setLr} format={(v) => f2(v, 2)} /></Controls></div>
      <svg viewBox="0 0 720 230" className="w-full" role="img" aria-label="Gradient descent steps on a parabola">
        <path d={curve} fill="none" strokeWidth="2" style={{ stroke: col("muted") }} />
        <line x1="30" x2="690" y1="212" y2="212" style={{ stroke: col("line") }} />
        {pts.map((p, i) => {
          if (Math.abs(p) > 5.3) return null;
          const prev = pts[i - 1];
          return (
            <g key={i}>
              {i > 0 && Math.abs(prev) <= 5.3 && <line x1={X(prev)} y1={Y(prev * prev)} x2={X(p)} y2={Y(p * p)} opacity=".6" style={{ stroke: col("bad") }} />}
              <circle cx={X(p)} cy={Y(p * p)} r={i === 0 ? 8 : 5} style={{ fill: i === 0 ? col("ok") : col("bad") }} />
            </g>
          );
        })}
      </svg>
      <Out>
        {Math.abs(last) > 4.5 ? <>After 10 steps w = <b>{f2(last, 1)}</b>: the steps are so big that it <b>overshoots and diverges</b> (the loss gets worse each step).</>
          : Math.abs(last) < 0.05 ? <>After 10 steps w = <b>{f2(last, 4)}</b>: converged to the minimum at 0.</>
          : <>After 10 steps w = <b>{f2(last, 2)}</b>: moving in the right direction, but still far; too small a rate = slow training.</>}
      </Out>
    </Demo>
  );
}

export default function Train() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        This is the same algorithm as the Python notebook, running in your browser on the 15 labelled patients. Name 5 (158 cm, 54 kg) is the unknown ★. The background colour shows what the network thinks at every height/weight.
      </p>
      <Trainer />
      <Hill />
    </div>
  );
}
