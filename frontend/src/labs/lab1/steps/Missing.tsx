import { useState } from "react";
import { Callout, col, Concept, Controls, Demo, f2, Grid, Legend, Out, Seg } from "../../ui";
import { PATIENTS } from "../data";
import { groupStats, impute, type Patient } from "../math";
import { useT, useRich } from "../rich";
import { Calc, NumInput, ScrollTable, td, th } from "../widgets";

const WOMEN_MEAN = 165.83;

function GuessReveal() {
  const t = useT();
  const [guess, setGuess] = useState(NaN);
  const [shown, setShown] = useState(false);
  const women = groupStats(PATIENTS, 0);
  const men = groupStats(PATIENTS, 1);
  const all = groupStats(PATIENTS, "all");
  const ok = Number.isFinite(guess);
  const errGuess = Math.abs(guess - women.mean);
  const errAll = Math.abs(all.mean - women.mean);
  return (
    <Demo title={t("lab1.mis.guess.title")}>
      <p className="text-sm text-muted">{t("lab1.mis.guess.intro")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <NumInput id="mis-guess" label={t("lab1.mis.guess.label")} value={guess} onChange={(v) => { setGuess(v); setShown(false); }} min={100} max={230} step={1} className="w-44" />
        <button className="btn-primary" disabled={!ok} onClick={() => setShown(true)}>{t("lab1.mis.guess.reveal")}</button>
      </div>
      {shown && ok && (
        <div className="mt-3 space-y-2" role="status">
          <ul className="grid gap-2 text-sm sm:grid-cols-3">
            <li className="rounded-xl border border-line bg-raised/60 p-2.5">{t("lab1.mis.women")}: <b>{f2(women.mean)}</b> cm <span className="text-muted">(n = {women.n}, {t("lab1.mis.median")} {f2(women.median, 0)})</span></li>
            <li className="rounded-xl border border-line bg-raised/60 p-2.5">{t("lab1.mis.men")}: <b>{f2(men.mean)}</b> cm <span className="text-muted">(n = {men.n}, {t("lab1.mis.median")} {f2(men.median, 0)})</span></li>
            <li className="rounded-xl border border-line bg-raised/60 p-2.5">{t("lab1.mis.everyone")}: <b>{f2(all.mean)}</b> cm <span className="text-muted">(n = {all.n})</span></li>
          </ul>
          <p className="text-sm leading-relaxed">
            {t("lab1.mis.guess.result", undefined, { g: f2(guess, 1), e: f2(errGuess, 1), a: f2(errAll, 1) })}{" "}
            <b>{errGuess < errAll ? t("lab1.mis.guess.better") : t("lab1.mis.guess.worse")}</b>
          </p>
        </div>
      )}
    </Demo>
  );
}

function DataEditor() {
  const t = useT();
  const r = useRich();
  const [rows, setRows] = useState<Patient[]>(PATIENTS.map(([g, h]) => [g, h] as Patient));
  const [method, setMethod] = useState<"mean" | "median">("mean");
  const [scope, setScope] = useState<"group" | "all">("group");
  const { pool, value } = impute(rows, method, scope, 0);
  const sorted = [...pool].sort((a, b) => a - b);
  const n = pool.length;
  const sum = pool.reduce((a, b) => a + b, 0);
  const setH = (i: number, h: number | null) => setRows((cur) => cur.map((row, k) => (k === i ? ([row[0], h] as Patient) : row)));
  const women = groupStats(rows, 0);
  const men = groupStats(rows, 1);
  const all = groupStats(rows, "all");
  const mid = n % 2 ? `${sorted[(n - 1) / 2]}` : `(${sorted[n / 2 - 1]} + ${sorted[n / 2]}) / 2`;

  return (
    <Demo title={t("lab1.mis.edit.title")}>
      <p className="text-sm text-muted">{r("lab1.mis.edit.intro")}</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <ScrollTable label={t("lab1.mis.edit.tableLabel")} maxH="max-h-[22rem]">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className={th}>#</th>
                <th scope="col" className={th}>{t("lab1.mis.edit.gender")}</th>
                <th scope="col" className={th}>{t("lab1.mis.edit.height")}</th>
                <th scope="col" className={th}><span className="sr-only">{t("lab1.mis.edit.action")}</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([g, h], i) => (
                <tr key={i} className={i === 10 ? "bg-bad/5" : ""}>
                  <td className={`${td} font-mono`}>{i + 1}</td>
                  <td className={td}>{g === 0 ? t("lab1.mis.edit.f") : t("lab1.mis.edit.m")}</td>
                  <td className={td}>
                    <NumInput id={`mis-h-${i}`} label={t("lab1.mis.edit.heightOf", undefined, { n: i + 1 })} hideLabel value={h ?? NaN} onChange={(v) => setH(i, Number.isFinite(v) ? v : null)} className="w-24" step={1} />
                  </td>
                  <td className={td}>
                    {h !== null
                      ? <button className="btn-ghost !px-2 !py-0.5 !text-xs" onClick={() => setH(i, null)} aria-label={t("lab1.mis.edit.dropOf", undefined, { n: i + 1 })}>{t("lab1.mis.edit.drop")}</button>
                      : <span className="text-xs text-bad">{t("lab1.mis.edit.missing")}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        <div className="space-y-3">
          <Controls>
            <Seg label={t("lab1.mis.stat")} value={method} onChange={setMethod} options={[{ value: "mean", label: t("lab1.mis.mean") }, { value: "median", label: t("lab1.mis.median") }]} />
            <Seg label={t("lab1.mis.which")} value={scope} onChange={setScope} options={[{ value: "group", label: t("lab1.mis.group") }, { value: "all", label: t("lab1.mis.all") }]} />
          </Controls>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost !text-xs" onClick={() => setRows(PATIENTS.map(([g, h]) => [g, h] as Patient))}>{t("lab1.mis.edit.reset")}</button>
            <button className="btn-ghost !text-xs" onClick={() => setH(0, 1650)}>{t("lab1.mis.edit.typo")}</button>
          </div>
          {n === 0 ? (
            <p className="text-sm text-bad">{t("lab1.mis.edit.empty")}</p>
          ) : (
            <>
              <Calc>
                {method === "mean"
                  ? `mean = sum / n = ${sum} / ${n} = ${f2(value)}`
                  : `${t("lab1.mis.sorted")}: ${sorted.join(", ")}\n${t("lab1.mis.median")} = ${mid} = ${f2(value, 1)}`}
              </Calc>
              <p className="text-sm">{r("lab1.mis.edit.result", { v: f2(value), err: f2(Math.abs(value - WOMEN_MEAN)) })}</p>
            </>
          )}
          <table className="w-full text-sm">
            <thead><tr><th scope="col" className={th}>{t("lab1.mis.edit.group")}</th><th scope="col" className={th}>n</th><th scope="col" className={th}>{t("lab1.mis.mean")}</th><th scope="col" className={th}>{t("lab1.mis.median")}</th></tr></thead>
            <tbody>
              {[[t("lab1.mis.women"), women], [t("lab1.mis.men"), men], [t("lab1.mis.everyone"), all]].map(([label, s]) => {
                const g = s as ReturnType<typeof groupStats>;
                return <tr key={label as string}><td className={td}>{label as string}</td><td className={`${td} font-mono`}>{g.n}</td><td className={`${td} font-mono`}>{g.n ? f2(g.mean) : "–"}</td><td className={`${td} font-mono`}>{g.n ? f2(g.median, 1) : "–"}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Callout tone="warn" title={t("lab1.mis.edit.tryTitle")}>{r("lab1.mis.edit.try")}</Callout>
    </Demo>
  );
}

export default function Missing() {
  const t = useT();
  const r = useRich();
  const [method, setMethod] = useState<"mean" | "median">("mean");
  const [scope, setScope] = useState<"group" | "all">("group");
  const { pool, value } = impute(PATIENTS, method, scope, 0);
  const X = (v: number) => 40 + ((v - 155) / 45) * 650;

  return (
    <div className="space-y-4">
      <Concept term={t("lab1.mis.concept.term")}>{r("lab1.mis.concept.body")}</Concept>
      <Demo title={t("lab1.mis.demo.title")}>
        <Controls>
          <Seg label={t("lab1.mis.stat")} value={method} onChange={setMethod} options={[{ value: "mean", label: t("lab1.mis.meanCap") }, { value: "median", label: t("lab1.mis.medianCap") }]} />
          <Seg label={t("lab1.mis.which")} value={scope} onChange={setScope} options={[{ value: "group", label: t("lab1.mis.group") }, { value: "all", label: t("lab1.mis.all") }]} />
        </Controls>
        <svg viewBox="0 0 720 190" className="w-full" role="img" aria-label={t("lab1.mis.svgAria")}>
          {[155, 160, 165, 170, 175, 180, 185, 190, 195, 200].map((v) => (
            <g key={v}>
              <line x1={X(v)} x2={X(v)} y1="30" y2="150" style={{ stroke: col("line") }} />
              <text x={X(v)} y="170" textAnchor="middle" fontSize="12" style={{ fill: col("muted") }}>{v}</text>
            </g>
          ))}
          <text x="40" y="20" fontSize="12" style={{ fill: col("muted") }}>{t("lab1.mis.axis")}</text>
          {PATIENTS.map(([g, h], i) => {
            if (h === null) return null;
            const inPool = scope === "all" || g === 0;
            return <circle key={i} cx={X(h)} cy={g === 0 ? 60 : 115} r="9" style={{ fill: g === 0 ? col("pos") : col("c-amber") }} opacity={inPool ? 1 : 0.25} />;
          })}
          <text x="12" y="64" fontSize="12" style={{ fill: col("muted") }}>{t("lab1.mis.edit.f")}</text>
          <text x="12" y="119" fontSize="12" style={{ fill: col("muted") }}>{t("lab1.mis.edit.m")}</text>
          <line x1={X(value)} x2={X(value)} y1="30" y2="150" strokeWidth="3" strokeDasharray="6 4" style={{ stroke: col("bad") }} />
          <circle cx={X(value)} cy="60" r="11" fill="none" strokeWidth="3" style={{ stroke: col("bad") }} />
          <text x={X(value)} y="186" textAnchor="middle" fontSize="13" fontWeight="700" style={{ fill: col("bad") }}>{f2(value)}</text>
        </svg>
        <Legend items={[{ color: col("pos"), label: t("lab1.mis.leg.f") }, { color: col("c-amber"), label: t("lab1.mis.leg.m") }, { color: col("bad"), label: t("lab1.mis.leg.imp") }]} />
        <Out>
          {r("lab1.mis.out", {
            n: pool.length,
            who: scope === "all" ? t("lab1.mis.allPatients") : t("lab1.mis.womenOnly"),
            method: method === "mean" ? t("lab1.mis.mean") : t("lab1.mis.median"),
            v: f2(value),
            wm: WOMEN_MEAN,
            err: f2(Math.abs(value - WOMEN_MEAN)),
          })}
        </Out>
        <Callout title={t("lab1.mis.tryTitle")}>{t("lab1.mis.try")}</Callout>
      </Demo>
      <Grid>
        <GuessReveal />
        <Demo title={t("lab1.mis.why.title")}>
          <p className="text-sm leading-relaxed">{r("lab1.mis.why.body")}</p>
        </Demo>
      </Grid>
      <DataEditor />
    </div>
  );
}
