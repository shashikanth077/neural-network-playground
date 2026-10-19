import { useState } from "react";
import { Callout, col, Controls, Demo, f2, Formula, Grid, Out, Seg } from "../../ui";
import { HEIGHTS, WEIGHTS } from "../data";
import { featureStats, mean, minMax, scaleMinMax, scaleZ, standardize, std } from "../math";
import { useT, useRich } from "../rich";
import { Calc, NumInput, ScrollTable, td, th } from "../widgets";

function ScaleLab() {
  const t = useT();
  const r = useRich();
  const [hs, setHs] = useState<number[]>(HEIGHTS.slice());
  const [ws, setWs] = useState<number[]>(WEIGHTS.slice());
  const [method, setMethod] = useState<"mm" | "zs">("mm");
  const [sel, setSel] = useState(4);
  const [newH, setNewH] = useState(200);
  const [newW, setNewW] = useState(105);
  const valid = [...hs, ...ws].every((v) => Number.isFinite(v));
  const H = valid ? featureStats(hs) : null;
  const Wt = valid ? featureStats(ws) : null;
  const degenerate = !!H && !!Wt && (H.max === H.min || Wt.max === Wt.min || H.std === 0 || Wt.std === 0);
  const ok = valid && !degenerate && H && Wt;
  const edit = (arr: number[], set: (a: number[]) => void, i: number, v: number) => set(arr.map((x, k) => (k === i ? v : x)));
  const mm = (v: number, s: { min: number; max: number }) => scaleMinMax(v, s.min, s.max);
  const zs = (v: number, s: { mean: number; std: number }) => scaleZ(v, s.mean, s.std);
  const line = (name: string, v: number, s: NonNullable<typeof H>) =>
    method === "mm"
      ? `${name}′ = (x − min) / (max − min) = (${v} − ${s.min}) / (${s.max} − ${s.min}) = ${f2(mm(v, s), 4)}`
      : `${name}′ = (x − μ) / σ = (${v} − ${f2(s.mean, 2)}) / ${f2(s.std, 2)} = ${f2(zs(v, s), 4)}`;
  const nh = Number.isFinite(newH) && Number.isFinite(newW) && ok ? [mm(newH, H!), mm(newW, Wt!)] : null;

  return (
    <Demo title={t("lab1.sc.lab.title")}>
      <p className="text-sm text-muted">{r("lab1.sc.lab.intro")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <Seg label={t("lab1.sc.method")} value={method} onChange={setMethod} options={[{ value: "mm", label: t("lab1.sc.mm") }, { value: "zs", label: t("lab1.sc.zs") }]} />
        <div>
          <label htmlFor="sc-sel" className="label">{t("lab1.sc.lab.pick")}</label>
          <select id="sc-sel" className="field w-28" value={sel} onChange={(e) => setSel(Number(e.target.value))}>
            {hs.map((_, i) => <option key={i} value={i}>#{i + 1}</option>)}
          </select>
        </div>
        <button className="btn-ghost !text-xs" onClick={() => { setHs(HEIGHTS.slice()); setWs(WEIGHTS.slice()); }}>{t("lab1.sc.lab.reset")}</button>
      </div>

      {!valid && <p className="mt-3 text-sm text-bad" role="alert">{t("lab1.sc.lab.invalid")}</p>}
      {valid && degenerate && <p className="mt-3 text-sm text-bad" role="alert">{t("lab1.sc.lab.degenerate")}</p>}

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <ScrollTable label={t("lab1.sc.lab.tableLabel")} maxH="max-h-[24rem]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className={th}>#</th>
                <th scope="col" className={th}>{t("lab1.sc.hname")}</th>
                <th scope="col" className={th}>{t("lab1.sc.wname")}</th>
                <th scope="col" className={th}>{method === "mm" ? "h′ min-max" : "h′ z"}</th>
                <th scope="col" className={th}>{method === "mm" ? "w′ min-max" : "w′ z"}</th>
              </tr>
            </thead>
            <tbody>
              {hs.map((h, i) => (
                <tr key={i} className={i === sel ? "bg-brand/10" : ""}>
                  <td className={`${td} font-mono`}>{i + 1}</td>
                  <td className={td}><NumInput id={`sc-h-${i}`} label={t("lab1.sc.lab.hOf", undefined, { n: i + 1 })} hideLabel value={h} onChange={(v) => edit(hs, setHs, i, v)} className="w-20" /></td>
                  <td className={td}><NumInput id={`sc-w-${i}`} label={t("lab1.sc.lab.wOf", undefined, { n: i + 1 })} hideLabel value={ws[i]} onChange={(v) => edit(ws, setWs, i, v)} className="w-20" /></td>
                  <td className={`${td} font-mono`}>{ok ? f2(method === "mm" ? mm(h, H!) : zs(h, H!), 3) : "–"}</td>
                  <td className={`${td} font-mono`}>{ok ? f2(method === "mm" ? mm(ws[i], Wt!) : zs(ws[i], Wt!), 3) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        <div className="space-y-2">
          {H && Wt && (
            <table className="w-full text-sm">
              <thead><tr><th scope="col" className={th}> </th><th scope="col" className={th}>min</th><th scope="col" className={th}>max</th><th scope="col" className={th}>μ</th><th scope="col" className={th}>σ</th></tr></thead>
              <tbody>
                {[[t("lab1.sc.hname"), H], [t("lab1.sc.wname"), Wt]].map(([n, s]) => {
                  const q = s as NonNullable<typeof H>;
                  return <tr key={n as string}><td className={td}>{n as string}</td><td className={`${td} font-mono`}>{q.min}</td><td className={`${td} font-mono`}>{q.max}</td><td className={`${td} font-mono`}>{f2(q.mean)}</td><td className={`${td} font-mono`}>{f2(q.std)}</td></tr>;
                })}
              </tbody>
            </table>
          )}
          {ok && (
            <>
              <p className="text-xs font-semibold text-muted">{t("lab1.sc.lab.formulaFor", undefined, { n: sel + 1 })}</p>
              <Calc>{line("height", hs[sel], H!)}</Calc>
              <Calc>{line("weight", ws[sel], Wt!)}</Calc>
              <p className="text-xs text-muted">{t("lab1.sc.lab.sigmaNote")}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-raised/50 p-3">
        <h4 className="text-sm font-semibold">{t("lab1.sc.new.title")}</h4>
        <p className="mt-1 text-sm text-muted">{r("lab1.sc.new.intro")}</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <NumInput id="sc-nh" label={t("lab1.sc.new.h")} value={newH} onChange={setNewH} min={0} max={300} className="w-36" />
          <NumInput id="sc-nw" label={t("lab1.sc.new.w")} value={newW} onChange={setNewW} min={0} max={300} className="w-36" />
        </div>
        {nh && H && Wt && (
          <div className="mt-2 space-y-2">
            <Calc>{`height′ = (${newH} − ${H.min}) / (${H.max} − ${H.min}) = ${f2(nh[0], 4)}\nweight′ = (${newW} − ${Wt.min}) / (${Wt.max} − ${Wt.min}) = ${f2(nh[1], 4)}`}</Calc>
            <p className="text-sm" role="status">
              {nh.some((v) => v < 0 || v > 1) ? <b className="text-c-amber">{t("lab1.sc.new.outside")}</b> : <b className="text-ok">{t("lab1.sc.new.inside")}</b>}{" "}
              <span className="text-muted">{t("lab1.sc.new.wrong")}</span>
            </p>
          </div>
        )}
      </div>
    </Demo>
  );
}

export default function Scaling() {
  const t = useT();
  const r = useRich();
  const [method, setMethod] = useState<"mm" | "zs">("mm");
  const rows: [string, number[], number][] = [[t("lab1.sc.hname"), HEIGHTS, 60], [t("lab1.sc.wname"), WEIGHTS, 140]];
  const h5 = method === "mm" ? 0 : (158 - mean(HEIGHTS)) / std(HEIGHTS, 0);
  const w5 = method === "mm" ? (54 - 52) / (102 - 52) : (54 - mean(WEIGHTS)) / std(WEIGHTS, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{t("lab1.sc.intro")}</p>
      <Demo title={t("lab1.sc.demo.title")}>
        <Controls>
          <Seg label={t("lab1.sc.method")} value={method} onChange={setMethod} options={[{ value: "mm", label: t("lab1.sc.mm") }, { value: "zs", label: t("lab1.sc.zs") }]} />
        </Controls>
        <svg viewBox="0 0 720 210" className="w-full" role="img" aria-label={t("lab1.sc.svgAria")}>
          <text x="40" y="22" fontSize="12" style={{ fill: col("muted") }}>{t("lab1.sc.svgNote")}</text>
          {rows.map(([name, a, y]) => {
            const lo = Math.min(...a);
            const hi = Math.max(...a);
            const tr = method === "mm" ? minMax(a) : standardize(a);
            const tl = Math.min(...tr);
            const th2 = Math.max(...tr);
            return (
              <g key={name}>
                <text x="40" y={y - 10} fontSize="13" fontWeight="700" style={{ fill: col("ink") }}>{name}: {lo} … {hi}</text>
                <line x1="40" x2="680" y1={y + 8} y2={y + 8} strokeWidth="2" style={{ stroke: col("line") }} />
                {a.map((x, i) => <circle key={i} cx={40 + ((x - lo) / (hi - lo)) * 640} cy={y + 8} r="5" opacity=".6" style={{ fill: col("muted") }} />)}
                <line x1="40" x2="680" y1={y + 42} y2={y + 42} strokeWidth="2" style={{ stroke: col("line") }} />
                {tr.map((x, i) => <circle key={i} cx={40 + ((x - tl) / (th2 - tl)) * 640} cy={y + 42} r="5" style={{ fill: col("brand") }} />)}
                <text x="40" y={y + 66} fontSize="12" style={{ fill: col("muted") }}>{f2(tl)}</text>
                <text x="680" y={y + 66} textAnchor="end" fontSize="12" style={{ fill: col("muted") }}>{f2(th2)}</text>
              </g>
            );
          })}
        </svg>
        <Out>{r("lab1.sc.out", { h: f2(h5, 3), w: f2(w5, 3) })}</Out>
        <Grid>
          <div>
            <Formula>x′ = (x − min) / (max − min)</Formula>
            <p className="mt-1 text-sm text-muted">{t("lab1.sc.f1")}</p>
          </div>
          <div>
            <Formula>x′ = (x − μ) / σ</Formula>
            <p className="mt-1 text-sm text-muted">{t("lab1.sc.f2")}</p>
          </div>
        </Grid>
        <Callout tone="warn" title={t("lab1.sc.impTitle")}>{r("lab1.sc.imp")}</Callout>
      </Demo>
      <ScaleLab />
    </div>
  );
}
