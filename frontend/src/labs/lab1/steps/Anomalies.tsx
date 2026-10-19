import { useState } from "react";
import { Callout, col, Controls, Demo, f2, Formula, Grid, Out, Seg, Slider } from "../../ui";
import { AGES, SUSPECT_INDEX } from "../data";
import { detectAnomalies, mean, pointReport, std, type AnomalyMethod } from "../math";
import { useT, useRich } from "../rich";
import { Calc, Flag, NumInput, ScrollTable, sci, td, th } from "../widgets";

const W = 720;
const H = 230;

function AgeLab() {
  const t = useT();
  const r = useRich();
  const [ages, setAges] = useState<number[]>(AGES.slice());
  const [limit, setLimit] = useState(3);
  const [sel, setSel] = useState(SUSPECT_INDEX);
  const valid = ages.every((a) => Number.isFinite(a));
  const set = (i: number, v: number) => setAges((cur) => cur.map((x, k) => (k === i ? v : x)));
  const preset = (fn: (a: number[]) => void) => setAges(() => { const a = AGES.slice(); fn(a); return a; });
  const reports = valid ? ages.map((_, i) => pointReport(ages, i, limit)) : [];
  const p = valid ? reports[sel] : null;
  const count = (k: "zFlag" | "chauvenetFlag" | "iqrFlag") => reports.filter((x) => x[k]).length;
  const verdict = (on: boolean) => (on ? t("lab1.ano.lab.flagged") : t("lab1.ano.lab.ok"));

  return (
    <Demo title={t("lab1.ano.lab.title")}>
      <p className="text-sm text-muted">{r("lab1.ano.lab.intro")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <button className="btn-ghost !text-xs" onClick={() => preset(() => undefined)}>{t("lab1.ano.lab.reset")}</button>
        <button className="btn-ghost !text-xs" onClick={() => preset((a) => { a[11] = 90; })}>{t("lab1.ano.lab.two")}</button>
        <button className="btn-ghost !text-xs" onClick={() => preset((a) => { a[SUSPECT_INDEX] = 21; })}>{t("lab1.ano.lab.mask")}</button>
        <Slider id="ano-lim" label={t("lab1.ano.lab.limit")} min={1.5} max={4} step={0.1} value={limit} onChange={setLimit} format={(v) => f2(v, 1)} />
      </div>

      {!valid && <p className="mt-3 text-sm text-bad" role="alert">{t("lab1.ano.lab.invalid")}</p>}

      {p && (
        <>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4" aria-label={t("lab1.ano.lab.sumLabel")}>
            <li className="rounded-xl border border-line bg-raised/60 p-2.5">μ = <b>{f2(p.mu)}</b> · σ = <b>{f2(p.sigma)}</b></li>
            <li className="rounded-xl border border-line bg-raised/60 p-2.5">Q1 = <b>{f2(p.q1, 3)}</b> · Q3 = <b>{f2(p.q3, 3)}</b></li>
            <li className="rounded-xl border border-line bg-raised/60 p-2.5">{t("lab1.ano.lab.fence")} <b>{f2(p.low, 3)} … {f2(p.high, 3)}</b></li>
            <li className="rounded-xl border border-line bg-raised/60 p-2.5">{t("lab1.ano.lab.counts", undefined, { z: count("zFlag"), c: count("chauvenetFlag"), q: count("iqrFlag") })}</li>
          </ul>

          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <ScrollTable label={t("lab1.ano.lab.tableLabel")} maxH="max-h-[24rem]">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={th}>#</th>
                    <th scope="col" className={th}>{t("lab1.ano.lab.age")}</th>
                    <th scope="col" className={th}>z</th>
                    <th scope="col" className={th}>n·P</th>
                    <th scope="col" className={th}>Z</th>
                    <th scope="col" className={th}>Chauv.</th>
                    <th scope="col" className={th}>IQR</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((x, i) => {
                    const any = x.zFlag || x.chauvenetFlag || x.iqrFlag;
                    return (
                      <tr key={i} className={`${i === sel ? "bg-brand/10" : any ? "bg-bad/5" : ""}`}>
                        <td className={`${td} font-mono`}>
                          <button className="underline decoration-dotted underline-offset-2" onClick={() => setSel(i)} aria-label={t("lab1.ano.lab.explainOf", undefined, { n: i + 1 })}>{i + 1}</button>
                        </td>
                        <td className={td}><NumInput id={`ano-age-${i}`} label={t("lab1.ano.lab.ageOf", undefined, { n: i + 1 })} hideLabel value={ages[i]} onChange={(v) => set(i, v)} min={0} max={150} step={1} className="w-20" /></td>
                        <td className={`${td} font-mono`}>{f2(x.z)}</td>
                        <td className={`${td} font-mono`}>{sci(x.nP, 3)}</td>
                        <td className={td}><Flag on={x.zFlag} label={`Z: ${verdict(x.zFlag)}`} /></td>
                        <td className={td}><Flag on={x.chauvenetFlag} label={`Chauvenet: ${verdict(x.chauvenetFlag)}`} /></td>
                        <td className={td}><Flag on={x.iqrFlag} label={`IQR: ${verdict(x.iqrFlag)}`} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollTable>

            <div className="space-y-2">
              <label htmlFor="ano-sel" className="label">{t("lab1.ano.lab.explain")}</label>
              <select id="ano-sel" className="field w-28" value={sel} onChange={(e) => setSel(Number(e.target.value))}>
                {ages.map((_, i) => <option key={i} value={i}>#{i + 1} · {ages[i]}</option>)}
              </select>
              <Calc>{`Z: z = (x − μ) / σ = (${p.x} − ${f2(p.mu)}) / ${f2(p.sigma)} = ${f2(p.z)}\n   |z| ${Math.abs(p.z) > limit ? ">" : "≤"} ${f2(limit, 1)} → ${verdict(p.zFlag)}`}</Calc>
              <Calc>{`Chauvenet: n·P = 30 · P(|Z| ≥ ${f2(Math.abs(p.z))}) = ${sci(p.nP, 4)}\n   ${p.nP < 0.5 ? "<" : "≥"} 0.5 → ${verdict(p.chauvenetFlag)}`}</Calc>
              <Calc>{`IQR: Q1 − 1.5·IQR … Q3 + 1.5·IQR = ${f2(p.low, 3)} … ${f2(p.high, 3)}\n   x = ${p.x} ${p.iqrFlag ? "∉" : "∈"} [${f2(p.low, 3)}, ${f2(p.high, 3)}] → ${verdict(p.iqrFlag)}`}</Calc>
            </div>
          </div>
        </>
      )}
      <Callout tone="warn" title={t("lab1.ano.lab.tryTitle")}>{r("lab1.ano.lab.try")}</Callout>
    </Demo>
  );
}

export default function Anomalies() {
  const t = useT();
  const r = useRich();
  const [method, setMethod] = useState<AnomalyMethod>("z");
  const [suspect, setSuspect] = useState(88);
  const [threshold, setThreshold] = useState(3);

  const ages = AGES.slice();
  ages[SUSPECT_INDEX] = suspect;
  const n = ages.length;
  const res = detectAnomalies(ages, method, threshold, SUSPECT_INDEX);
  const max = Math.max(20, ...ages) * 1.08; // scale to the data so small values stay readable
  const bw = (W - 40) / n;
  const y = (v: number) => 190 - (v / max) * 160;
  const flaggedValues = res.flagged.map((i) => ages[i]);

  const lines: { v: number; label?: string }[] = [];
  if (method === "iqr") [res.detail.low!, res.detail.high!].forEach((v) => v > 0 && v < max && lines.push({ v }));
  if (method === "z" && res.mu + threshold * res.sigma < max) lines.push({ v: res.mu + threshold * res.sigma, label: t("lab1.ano.meanPlus", undefined, { t: f2(threshold, 1) }) });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{r("lab1.ano.intro")}</p>
      <Grid cols={3}>
        <Demo title={t("lab1.ano.m0.title")}>
          <p className="text-sm text-muted">{t("lab1.ano.m0.q")}</p>
          <p className="my-2"><Formula>z = (x − μ) / σ</Formula></p>
          <p className="text-sm">{t("lab1.ano.m0.a")}</p>
        </Demo>
        <Demo title="Chauvenet">
          <p className="text-sm text-muted">{t("lab1.ano.m1.q")}</p>
          <p className="my-2"><Formula>n · P(|Z|≥z) &lt; 0.5</Formula></p>
          <p className="text-sm">{t("lab1.ano.m1.a")}</p>
        </Demo>
        <Demo title={t("lab1.ano.m2.title")}>
          <p className="text-sm text-muted">{t("lab1.ano.m2.q")}</p>
          <p className="my-2"><Formula>Q1−1.5·IQR … Q3+1.5·IQR</Formula></p>
          <p className="text-sm">{t("lab1.ano.m2.a")}</p>
        </Demo>
      </Grid>

      <Demo title={t("lab1.ano.live.title")}>
        <Controls>
          <Slider id="an-v" label={t("lab1.ano.live.value")} min={8} max={100} step={1} value={suspect} onChange={setSuspect} />
          <Seg label={t("lab1.ano.live.method")} value={method} onChange={setMethod} options={[{ value: "z", label: "Z-score" }, { value: "chauvenet", label: "Chauvenet" }, { value: "iqr", label: t("lab1.ano.quartile") }]} />
          {method === "z" && <Slider id="an-t" label={t("lab1.ano.live.zlimit")} min={1.5} max={4} step={0.1} value={threshold} onChange={setThreshold} format={(v) => f2(v, 1)} />}
        </Controls>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t("lab1.ano.live.svgAria")}>
          <line x1="20" x2={W - 20} y1="190" y2="190" style={{ stroke: col("line") }} />
          {ages.map((x, i) => {
            const fl = res.flagged.includes(i);
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
          <text x="20" y="215" fontSize="12" style={{ fill: col("muted") }}>{t("lab1.ano.live.barNote")}</text>
        </svg>
        <Out>
          {method === "z" && r("lab1.ano.out.z", { mu: f2(res.mu), sigma: f2(res.sigma), z: f2(res.detail.zOfSuspect!), thr: f2(threshold, 1) })}
          {method === "chauvenet" && r("lab1.ano.out.ch", { n, np: res.detail.nP!.toExponential(2), zc: f2(res.detail.zCritical!) })}
          {method === "iqr" && r("lab1.ano.out.iqr", { q1: f2(res.detail.q1!), q3: f2(res.detail.q3!), iqr: f2(res.detail.iqr!), lo: f2(res.detail.low!, 3), hi: f2(res.detail.high!, 3) })}
          <br />
          {r("lab1.ano.flagged", { list: flaggedValues.length ? flaggedValues.join(", ") : t("lab1.ano.none") })}
          {flaggedValues.length === 0 && ` ${t("lab1.ano.hiding")}`}
        </Out>
        <Callout tone="warn" title={t("lab1.ano.mask.title")}>
          {r("lab1.ano.mask.body")}
          <span className="mt-1 block text-xs">{t("lab1.ano.mask.note")}</span>
        </Callout>
      </Demo>

      <AgeLab />

      <Demo title={t("lab1.ano.what.title")}>
        <p className="text-sm leading-relaxed">
          {r("lab1.ano.what.body", { m: f2(mean(AGES)), s: f2(std(AGES)), s2: f2(std(AGES.filter((_, i) => i !== SUSPECT_INDEX)), 1) })}
        </p>
      </Demo>
    </div>
  );
}
