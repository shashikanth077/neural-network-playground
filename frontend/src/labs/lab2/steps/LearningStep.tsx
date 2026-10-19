import { useState } from "react";
import { Callout, Controls, Demo, f2, Out, Slider, Grid } from "../../ui";
import { gradientPath, lrBand } from "../math";
import { useR, useTx } from "../rich";

const W = 640;
const H = 240;
/** Map w ∈ [−6, 6] and loss ∈ [0, 36] onto the picture (same scale as the lab page). */
const X = (w: number) => W / 2 + (w * (W / 2 - 20)) / 6;
const Y = (v: number) => H - 20 - (v * (H - 40)) / 36;
const clampW = (w: number) => Math.max(-6, Math.min(6, w));

export default function LearningStep() {
  const r = useR();
  const tx = useTx();
  const [lr, setLr] = useState(0.3);
  const [epochs, setEpochs] = useState(10);
  const pts = gradientPath(lr, epochs);
  const last = pts[pts.length - 1];
  const band = lrBand(lr);
  const curve: string[] = [];
  for (let w = -6; w <= 6.001; w += 0.1) curve.push(`${curve.length ? "L" : "M"}${X(w).toFixed(1)},${Y(Math.min(w * w, 36)).toFixed(1)}`);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${X(clampW(p.w)).toFixed(1)},${Y(Math.min(p.loss, 36)).toFixed(1)}`).join("");

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab2.lr.lead")}</p>
      <Demo title={tx("lab2.lr.title")}>
        <Controls>
          <Slider id="lr-rate" label={tx("lab2.lr.rate")} min={0.01} max={1.2} step={0.01} value={lr} onChange={setLr} format={(v) => f2(v, 2)} />
          <Slider id="lr-epochs" label={tx("lab2.lr.epochs")} min={1} max={30} step={1} value={epochs} onChange={setEpochs} />
        </Controls>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={tx("lab2.lr.plotLabel")}>
          <path d={curve.join("")} fill="none" strokeWidth="1" style={{ stroke: "rgb(var(--muted))" }} />
          <path d={path} fill="none" strokeWidth="2" style={{ stroke: "rgb(var(--accent2))" }} />
          {pts.map((p, i) => (
            <circle key={i} cx={X(clampW(p.w))} cy={Y(Math.min(p.loss, 36))} r="3.5" style={{ fill: "rgb(var(--accent))" }} />
          ))}
          <text x="10" y="16" fontSize="13" style={{ fill: "rgb(var(--ink))" }}>
            {tx("lab2.lr.summary", {
              n: epochs,
              w: Math.abs(last.w) > 1e6 ? tx("lab2.lr.huge") : f2(last.w, 4),
              loss: last.loss > 1e6 ? tx("lab2.lr.huge") : f2(last.loss, 4),
            })}
          </text>
        </svg>
        <Out>{r(`lab2.lr.band.${band}`)}</Out>
      </Demo>
      <Grid>
        <Callout tone="info" title={tx("lab2.lr.rule.title")}>{r("lab2.lr.rule.body")}</Callout>
        <Callout tone="warn" title={tx("lab2.lr.task1.title")}>{r("lab2.lr.task1.body")}</Callout>
      </Grid>
    </div>
  );
}
