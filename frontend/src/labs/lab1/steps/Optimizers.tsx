import { useEffect, useRef, useState } from "react";
import { useIsDark } from "../../../hooks/useTheme";
import { Callout, canvasColor, col, Controls, Demo, f2, Grid, Legend, Out, Slider } from "../../ui";
import { optimizerPaths, type OptName } from "../math";

const NAMES: Record<OptName, string> = { sgd: "SGD", rms: "RMSprop", adam: "Adam" };
const COLOR: Record<OptName, string> = { sgd: "bad", rms: "ok", adam: "pos" };

export default function Optimizers() {
  const dark = useIsDark();
  const [lrExp, setLrExp] = useState(-1.3);
  const [steps, setSteps] = useState(40);
  const [playing, setPlaying] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lr = 10 ** lrExp;
  const runs = optimizerPaths(lr, steps);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setSteps((s) => {
      if (s >= 80) { setPlaying(false); return s; }
      return s + 1;
    }), 70);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const cv = canvas.current;
    const c = cv?.getContext("2d");
    if (!cv || !c) return;
    const W = cv.width;
    const H = cv.height;
    c.clearRect(0, 0, W, H);
    const X = (x: number) => ((x + 5) / 10) * W;
    const Y = (y: number) => H / 2 - (y / 2) * (H / 2) * 0.98;
    c.strokeStyle = canvasColor("line");
    c.lineWidth = 1.5;
    [0.5, 2, 5, 10, 16].forEach((L) => {
      c.beginPath();
      c.ellipse(X(0), Y(0), Math.sqrt(2 * L) * (W / 10), Math.sqrt((2 * L) / 10) * (H / 4) * 0.98, 0, 0, 7);
      c.stroke();
    });
    (Object.keys(runs) as OptName[]).forEach((k) => {
      const color = canvasColor(COLOR[k]);
      c.strokeStyle = color;
      c.fillStyle = color;
      c.lineWidth = 2.5;
      c.beginPath();
      let started = false;
      runs[k].path.forEach((p) => {
        if (Math.abs(p[0]) > 5 || Math.abs(p[1]) > 2.2) return;
        if (!started) { c.moveTo(X(p[0]), Y(p[1])); started = true; } else c.lineTo(X(p[0]), Y(p[1]));
      });
      c.stroke();
      const e = runs[k].path[runs[k].path.length - 1];
      if (Math.abs(e[0]) <= 5 && Math.abs(e[1]) <= 2.2) { c.beginPath(); c.arc(X(e[0]), Y(e[1]), 6, 0, 7); c.fill(); }
    });
    c.fillStyle = canvasColor("ink");
    c.beginPath(); c.arc(X(-4.2), Y(1.5), 7, 0, 7); c.fill();
    c.strokeStyle = canvasColor("ink");
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(X(0) - 8, Y(0)); c.lineTo(X(0) + 8, Y(0)); c.moveTo(X(0), Y(0) - 8); c.lineTo(X(0), Y(0) + 8); c.stroke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lrExp, steps, dark]);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        The optimizer decides how to use the gradient to move the weights. The toy valley below is steep in one direction and flat in the other (like real loss surfaces). All three start at the same point.
      </p>
      <Demo title="SGD vs RMSprop vs Adam on the same valley">
        <Controls>
          <Slider id="op-lr" label="Learning rate" min={-2.3} max={-0.2} step={0.05} value={lrExp} onChange={setLrExp} format={() => f2(lr, 3)} />
          <Slider id="op-n" label="Steps" min={1} max={80} step={1} value={steps} onChange={(v) => { setPlaying(false); setSteps(v); }} />
          <button className="btn-primary" onClick={() => { setSteps(1); setPlaying(true); }}>▶ Animate</button>
        </Controls>
        <canvas ref={canvas} width={900} height={360} className="w-full rounded-xl border border-line" role="img" aria-label="Optimizer paths on a loss valley" />
        <Legend items={[{ color: col("bad"), label: "SGD" }, { color: col("ok"), label: "RMSprop" }, { color: col("pos"), label: "Adam" }, { color: col("ink"), label: "● start · rings = loss levels · goal = centre" }]} />
        <Out>
          {(Object.keys(runs) as OptName[]).map((k, i) => (
            <span key={k}>
              {i > 0 && " · "}
              <b style={{ color: col(COLOR[k]) }}>{NAMES[k]}</b>:{" "}
              {runs[k].ok ? `loss = ${runs[k].loss < 1e-4 ? runs[k].loss.toExponential(1) : f2(runs[k].loss, 4)}` : <b>diverged (exploded)</b>}
            </span>
          ))}
        </Out>
        <div className="mt-4">
          <Grid cols={3}>
            <div><b>SGD</b><p className="text-sm text-muted">step = lr × gradient. Simple, but the step size must be tuned carefully. Too large → it zig-zags and explodes, too small → crawls.</p></div>
            <div><b>RMSprop</b><p className="text-sm text-muted">Divides the step by a running average of recent gradient size, so steep directions get smaller steps.</p></div>
            <div><b>Adam</b><p className="text-sm text-muted">Momentum (average direction) + RMSprop scaling. Usually the safest default, lr 0.001 in Keras.</p></div>
          </Grid>
        </div>
        <Callout title="Compare with the notebook MNIST results">
          SGD needed a large rate (0.1-0.5) while RMSprop/Adam liked small ones (0.0001-0.001) and collapsed to chance level at 0.1, the same behaviour you can reproduce above by pushing the slider right.
        </Callout>
      </Demo>
    </div>
  );
}
