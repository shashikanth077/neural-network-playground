import { useState } from "react";
import { Callout, col, Controls, Demo, f2, Grid, Out, Seg, Slider } from "../../ui";
import { ACTIVATIONS, type ActivationName } from "../math";

export default function Activations() {
  const [name, setName] = useState<ActivationName>("sigmoid");
  const [x0, setX0] = useState(1);
  const { f, d } = ACTIVATIONS[name];
  const X = (x: number) => 40 + ((x + 6) / 12) * 640;
  const Y = (y: number) => 130 - y * 38;
  const path = (fn: (x: number) => number) => Array.from({ length: 241 }, (_, i) => { const x = -6 + i * 0.05; return `${i ? "L" : "M"}${X(x)},${Y(fn(x))}`; }).join("");

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        Without an activation every layer is just multiplication and the whole network collapses into one linear formula. The activation adds the bend that lets a network draw curved decision boundaries.
      </p>
      <Demo title="Explore the three activation functions">
        <Controls>
          <Seg label="Activation" value={name} onChange={setName} options={[{ value: "sigmoid", label: "sigmoid" }, { value: "tanh", label: "tanh" }, { value: "relu", label: "relu" }]} />
          <Slider id="ac-x" label="Input x" min={-6} max={6} step={0.1} value={x0} onChange={setX0} format={(v) => f2(v, 1)} />
        </Controls>
        <svg viewBox="0 0 720 260" className="w-full" role="img" aria-label={`Plot of ${name} and its gradient`}>
          <line x1="40" x2="680" y1={Y(0)} y2={Y(0)} style={{ stroke: col("line") }} />
          <line x1={X(0)} x2={X(0)} y1="20" y2="240" style={{ stroke: col("line") }} />
          {[-1, 1, 2, 3].map((v) => <text key={v} x={X(0) - 6} y={Y(v) + 4} textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>{v}</text>)}
          <path d={path(d)} fill="none" strokeWidth="2" strokeDasharray="5 4" style={{ stroke: col("c-amber") }} />
          <path d={path(f)} fill="none" strokeWidth="3" style={{ stroke: col("brand") }} />
          <circle cx={X(x0)} cy={Y(f(x0))} r="7" style={{ fill: col("brand") }} />
          <circle cx={X(x0)} cy={Y(d(x0))} r="6" style={{ fill: col("c-amber") }} />
          <text x="690" y={Y(f(6)) - 6} textAnchor="end" fontSize="12" style={{ fill: col("brand") }}>f(x)</text>
          <text x="690" y={Y(d(6)) + 16} textAnchor="end" fontSize="12" style={{ fill: col("c-amber") }}>gradient f′(x)</text>
        </svg>
        <Out>
          f({f2(x0, 1)}) = <b>{f2(f(x0), 4)}</b> · gradient = <b>{f2(d(x0), 4)}</b>{" "}
          {d(x0) < 0.02 ? "→ almost zero: the weights below barely learn (saturated / dead)." : ""}
        </Out>
        <div className="mt-4">
          <Grid cols={3}>
            <div><b>sigmoid</b><p className="text-sm text-muted">Range 0…1. Gradient ≤ 0.25 and almost 0 at the ends: in deep networks gradients shrink layer by layer (<i>vanishing gradient</i>) so learning is slow.</p></div>
            <div><b>tanh</b><p className="text-sm text-muted">Range −1…1, centred at 0, gradient up to 1. Better than sigmoid, but it still saturates.</p></div>
            <div><b>relu</b><p className="text-sm text-muted">max(0, x). Gradient is exactly 1 for x&gt;0, very cheap. Standard choice for hidden layers. Neurons can “die” if stuck at x&lt;0.</p></div>
          </Grid>
        </div>
        <Callout tone="warn" title="Rule of thumb">Hidden layers: relu. Output for yes/no: sigmoid. Output for 10 classes: softmax.</Callout>
      </Demo>
    </div>
  );
}
