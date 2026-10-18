import { useState } from "react";
import { Callout, col, f2, Controls, Demo, Formula, Grid, Out, Seg } from "../../ui";
import { HEIGHTS, WEIGHTS } from "../data";
import { mean, minMax, standardize, std } from "../math";

export default function Scaling() {
  const [method, setMethod] = useState<"mm" | "zs">("mm");
  const rows: [string, number[], number][] = [["height (cm)", HEIGHTS, 60], ["weight (kg)", WEIGHTS, 140]];
  const h5 = method === "mm" ? 0 : (158 - mean(HEIGHTS)) / std(HEIGHTS, 0);
  const w5 = method === "mm" ? (54 - 52) / (102 - 52) : (54 - mean(WEIGHTS)) / std(WEIGHTS, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        Height is ~150-200 (cm), weight ~50-100 (kg). Networks start with small random weights and learn by small steps; features with big numbers dominate and gradients become unstable. So we rescale.
      </p>
      <Demo title="Before and after scaling">
        <Controls>
          <Seg label="Scaling method" value={method} onChange={setMethod} options={[{ value: "mm", label: "Min-max → [0,1]" }, { value: "zs", label: "Standardize (mean 0, std 1)" }]} />
        </Controls>
        <svg viewBox="0 0 720 210" className="w-full" role="img" aria-label="Dot plots of the original and scaled features">
          <text x="40" y="22" fontSize="12" style={{ fill: col("muted") }}>top: original values (shown 0-100% of own range) · bottom: after scaling</text>
          {rows.map(([name, a, y]) => {
            const lo = Math.min(...a);
            const hi = Math.max(...a);
            const t = method === "mm" ? minMax(a) : standardize(a);
            const tl = Math.min(...t);
            const th = Math.max(...t);
            return (
              <g key={name}>
                <text x="40" y={y - 10} fontSize="13" fontWeight="700" style={{ fill: col("ink") }}>{name}: {lo} … {hi}</text>
                <line x1="40" x2="680" y1={y + 8} y2={y + 8} strokeWidth="2" style={{ stroke: col("line") }} />
                {a.map((x, i) => <circle key={i} cx={40 + ((x - lo) / (hi - lo)) * 640} cy={y + 8} r="5" opacity=".6" style={{ fill: col("muted") }} />)}
                <line x1="40" x2="680" y1={y + 42} y2={y + 42} strokeWidth="2" style={{ stroke: col("line") }} />
                {t.map((x, i) => <circle key={i} cx={40 + ((x - tl) / (th - tl)) * 640} cy={y + 42} r="5" style={{ fill: col("brand") }} />)}
                <text x="40" y={y + 66} fontSize="12" style={{ fill: col("muted") }}>{f2(tl)}</text>
                <text x="680" y={y + 66} textAnchor="end" fontSize="12" style={{ fill: col("muted") }}>{f2(th)}</text>
              </g>
            );
          })}
        </svg>
        <Out>
          Name 5 (158 cm, 54 kg) becomes <b>({f2(h5, 3)}, {f2(w5, 3)})</b>. The shape of the data is unchanged, only the units are gone: both features now live on a comparable scale.
        </Out>
        <Grid>
          <div>
            <Formula>x′ = (x − min) / (max − min)</Formula>
            <p className="mt-1 text-sm text-muted">Used in Task 5. Smallest becomes 0, biggest 1. Sensitive to outliers (that is why Tasks 2-4 come first!).</p>
          </div>
          <div>
            <Formula>x′ = (x − μ) / σ</Formula>
            <p className="mt-1 text-sm text-muted">Centers at 0. Values are not bounded. The other method named in the objective.</p>
          </div>
        </Grid>
        <Callout tone="warn" title="Important detail">
          Compute min/max (or mean/std) on <i>training data</i> and reuse the same numbers for new data. Never recompute them on the test set.
        </Callout>
      </Demo>
    </div>
  );
}
