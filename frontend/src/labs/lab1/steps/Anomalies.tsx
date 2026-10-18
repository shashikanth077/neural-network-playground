import { useState } from "react";
import { Callout, col, Controls, Demo, f2, Formula, Grid, Out, Seg, Slider } from "../../ui";
import { AGES, SUSPECT_INDEX } from "../data";
import { detectAnomalies, mean, std, type AnomalyMethod } from "../math";

const W = 720;
const H = 230;

export default function Anomalies() {
  const [method, setMethod] = useState<AnomalyMethod>("z");
  const [suspect, setSuspect] = useState(88);
  const [threshold, setThreshold] = useState(3);

  const ages = AGES.slice();
  ages[SUSPECT_INDEX] = suspect;
  const n = ages.length;
  const r = detectAnomalies(ages, method, threshold, SUSPECT_INDEX);
  const max = Math.max(20, ...ages) * 1.08; // scale to the data so small values stay readable
  const bw = (W - 40) / n;
  const y = (v: number) => 190 - (v / max) * 160;
  const flaggedValues = r.flagged.map((i) => ages[i]);

  const lines: { v: number; label?: string }[] = [];
  if (method === "iqr") [r.detail.low!, r.detail.high!].forEach((v) => v > 0 && v < max && lines.push({ v }));
  if (method === "z" && r.mu + threshold * r.sigma < max) lines.push({ v: r.mu + threshold * r.sigma, label: `mean + ${f2(threshold, 1)}σ` });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        <b className="text-ink">Concept: outlier / anomaly</b> = a value that does not fit the rest. The three methods in the assignment all measure “how far is too far?”, in different ways.
      </p>
      <Grid cols={3}>
        <Demo title="Z-score">
          <p className="text-sm text-muted">“How many standard deviations from the mean?”</p>
          <p className="my-2"><Formula>z = (x − μ) / σ</Formula></p>
          <p className="text-sm">Flag if |z| &gt; 3. Needs a bell-shaped (normal) distribution.</p>
        </Demo>
        <Demo title="Chauvenet">
          <p className="text-sm text-muted">“In n samples, how many would be this extreme by chance?”</p>
          <p className="my-2"><Formula>n · P(|Z|≥z) &lt; 0.5</Formula></p>
          <p className="text-sm">If you'd expect less than half a sample that far out, reject it. Depends on n.</p>
        </Demo>
        <Demo title="Quartile (IQR)">
          <p className="text-sm text-muted">“Is it outside the fences of the middle 50%?”</p>
          <p className="my-2"><Formula>Q1−1.5·IQR … Q3+1.5·IQR</Formula></p>
          <p className="text-sm">Uses medians/percentiles only, so the outlier cannot hide itself.</p>
        </Demo>
      </Grid>

      <Demo title="Live lab: the 30 children's ages">
        <Controls>
          <Slider id="an-v" label="Value of the suspicious entry (bar 11)" min={8} max={100} step={1} value={suspect} onChange={setSuspect} />
          <Seg label="Method" value={method} onChange={setMethod} options={[{ value: "z", label: "Z-score" }, { value: "chauvenet", label: "Chauvenet" }, { value: "iqr", label: "Quartile" }]} />
          {method === "z" && <Slider id="an-t" label="Z threshold" min={1.5} max={4} step={0.1} value={threshold} onChange={setThreshold} format={(v) => f2(v, 1)} />}
        </Controls>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bar chart of 30 ages with flagged outliers highlighted">
          <line x1="20" x2={W - 20} y1="190" y2="190" style={{ stroke: col("line") }} />
          {ages.map((x, i) => {
            const fl = r.flagged.includes(i);
            const h = (x / max) * 160;
            return (
              <g key={i}>
                <rect x={20 + i * bw + 2} y={190 - h} width={bw - 4} height={h} rx="3" style={{ fill: fl ? col("bad") : col("brand") }} opacity={fl ? 1 : 0.75} />
                {(fl || i === SUSPECT_INDEX) && (
                  <text x={20 + i * bw + bw / 2} y={186 - h} textAnchor="middle" fontSize="12" fontWeight="700" style={{ fill: fl ? col("bad") : col("muted") }}>{x}</text>
                )}
              </g>
            );
          })}
          {lines.map((l) => (
            <g key={l.v}>
              <line x1="20" x2={W - 20} y1={y(l.v)} y2={y(l.v)} strokeDasharray="5 4" style={{ stroke: col("c-amber") }} />
              {l.label && <text x={W - 22} y={y(l.v) - 4} textAnchor="end" fontSize="11" style={{ fill: col("muted") }}>{l.label}</text>}
            </g>
          ))}
          <text x="20" y="215" fontSize="12" style={{ fill: col("muted") }}>each bar = one child's age (index 0 … 29)</text>
        </svg>
        <Out>
          {method === "z" && <>μ = <b>{f2(r.mu)}</b>, σ = <b>{f2(r.sigma)}</b>. z of the suspicious value = <b>{f2(r.detail.zOfSuspect!)}</b> (limit ±{f2(threshold, 1)}).</>}
          {method === "chauvenet" && <>n = {n}. For the suspicious value n·P = <b>{r.detail.nP!.toExponential(2)}</b> (reject if &lt; 0.5). With n = 30 this means |z| &gt; <b>{f2(r.detail.zCritical!)}</b>.</>}
          {method === "iqr" && <>Q1 = <b>{f2(r.detail.q1!)}</b>, Q3 = <b>{f2(r.detail.q3!)}</b>, IQR = <b>{f2(r.detail.iqr!)}</b> → allowed range <b>{f2(r.detail.low!, 3)} … {f2(r.detail.high!, 3)}</b>.</>}
          <br />
          Flagged values: <b>{flaggedValues.length ? flaggedValues.join(", ") : "none"}</b>
          {flaggedValues.length === 0 && " (the outlier is hiding!)"}
        </Out>
        <Callout tone="warn" title="Experiment: masking">
          Drag the value down below about <b>21</b>. The outlier inflates the standard deviation, so the Z-score rule (threshold 3) stops catching it (z falls below 3), while Chauvenet and the quartile rule still flag it. This is why one method is never enough and why the lab asks for all three.
          <span className="mt-1 block text-xs">
            Note: with only n = 30 values, |z| can never exceed (n−1)/√n ≈ 5.3, so a big outlier can never look more extreme than that to a z-score.
          </span>
        </Callout>
      </Demo>

      <Demo title="What happened in the lab">
        <p className="text-sm leading-relaxed">
          With 88: mean = {f2(mean(AGES))}, std = {f2(std(AGES))}, z(88) = <b>5.22</b>; Chauvenet n·P = <b>5.4×10⁻⁶</b> (far below 0.5); quartile limits 4.625…19.625. All three flag <b>only 88</b>. Without 88 the real spread of the ages is only about {f2(std(AGES.filter((_, i) => i !== SUSPECT_INDEX)), 1)}: the outlier made the std almost six times larger.
        </p>
      </Demo>
    </div>
  );
}
