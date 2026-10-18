import { useState } from "react";
import { Callout, col, Concept, Controls, Demo, f2, Legend, Out, Seg } from "../../ui";
import { PATIENTS } from "../data";
import { impute } from "../math";

const WOMEN_MEAN = 165.83;

export default function Missing() {
  const [method, setMethod] = useState<"mean" | "median">("mean");
  const [scope, setScope] = useState<"group" | "all">("group");
  const { pool, value } = impute(PATIENTS, method, scope, 0);
  const X = (v: number) => 40 + ((v - 155) / 45) * 650;

  return (
    <div className="space-y-4">
      <Concept term="imputation">
        = replacing a missing value by a good guess. <b>Mean</b> = the average. <b>Median</b> = the middle value when sorted (it ignores extreme values).
      </Concept>
      <Demo title="Estimate the missing height of Name 11 (a woman)">
        <Controls>
          <Seg label="Statistic" value={method} onChange={setMethod} options={[{ value: "mean", label: "Mean" }, { value: "median", label: "Median" }]} />
          <Seg label="Which patients" value={scope} onChange={setScope} options={[{ value: "group", label: "Same gender only" }, { value: "all", label: "Everyone" }]} />
        </Controls>
        <svg viewBox="0 0 720 190" className="w-full" role="img" aria-label="Heights of women and men with the imputed value">
          {[155, 160, 165, 170, 175, 180, 185, 190, 195, 200].map((v) => (
            <g key={v}>
              <line x1={X(v)} x2={X(v)} y1="30" y2="150" style={{ stroke: col("line") }} />
              <text x={X(v)} y="170" textAnchor="middle" fontSize="12" style={{ fill: col("muted") }}>{v}</text>
            </g>
          ))}
          <text x="40" y="20" fontSize="12" style={{ fill: col("muted") }}>height (cm)</text>
          {PATIENTS.map(([g, h], i) => {
            if (h === null) return null;
            const inPool = scope === "all" || g === 0;
            return <circle key={i} cx={X(h)} cy={g === 0 ? 60 : 115} r="9" style={{ fill: g === 0 ? col("pos") : col("c-amber") }} opacity={inPool ? 1 : 0.25} />;
          })}
          <text x="12" y="64" fontSize="12" style={{ fill: col("muted") }}>F</text>
          <text x="12" y="119" fontSize="12" style={{ fill: col("muted") }}>M</text>
          <line x1={X(value)} x2={X(value)} y1="30" y2="150" strokeWidth="3" strokeDasharray="6 4" style={{ stroke: col("bad") }} />
          <circle cx={X(value)} cy="60" r="11" fill="none" strokeWidth="3" style={{ stroke: col("bad") }} />
          <text x={X(value)} y="186" textAnchor="middle" fontSize="13" fontWeight="700" style={{ fill: col("bad") }}>{f2(value)}</text>
        </svg>
        <Legend items={[{ color: col("pos"), label: "women (gender 0)" }, { color: col("c-amber"), label: "men (gender 1)" }, { color: col("bad"), label: "imputed value for Name 11" }]} />
        <Out>
          Pool: <b>{pool.length}</b> heights ({scope === "all" ? "all patients" : "women only"}) → {method} = <b>{f2(value)} cm</b>. Women's real mean ≈ {WOMEN_MEAN}, so the error is <b>{f2(Math.abs(value - WOMEN_MEAN))} cm</b>.
        </Out>
        <Callout title="Try it">
          Switch to “Everyone” and look at how far the red line moves from the women's cluster. That is the error you introduce by ignoring gender.
        </Callout>
      </Demo>
    </div>
  );
}
