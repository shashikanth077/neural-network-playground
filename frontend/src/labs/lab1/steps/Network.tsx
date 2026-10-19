import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Callout, col, Concept, Demo, f2, Grid, Out } from "../../ui";
import { GENDER_LABELS, HEIGHTS, WEIGHTS } from "../data";
import { gradients, minMax, netParamsOf, netTrace, SmallNet, type NetParams } from "../math";
import { useT, useRich } from "../rich";
import { Calc, NumInput } from "../widgets";

const hN = minMax(HEIGHTS);
const wN = minMax(WEIGHTS);
/** The 15 labelled patients: raw numbers, scaled inputs and the true class (0 female, 1 male). */
const SAMPLES = GENDER_LABELS.flatMap((g, i) => (g === null ? [] : [{ n: i + 1, height: HEIGHTS[i], weight: WEIGHTS[i], x: [hN[i], wN[i]], y: g }]));
const r2 = (v: number) => Math.round(v * 100) / 100;
/** A reproducible random start (the lab's seed 7), rounded to 2 decimals so the arithmetic is easy to follow. */
const START: NetParams = (() => {
  const p = netParamsOf(new SmallNet(7));
  return { w1: p.w1.map((row) => row.map(r2)), b1: p.b1.map(r2), w2: p.w2.map(r2), b2: r2(p.b2) };
})();

const family = (id: string) =>
  id.startsWith("u_w") ? "uw" : id.startsWith("u_b") ? "ub"
  : id.startsWith("gw1") ? "gw1" : id.startsWith("gb1") ? "gb1" : id.startsWith("gw2") ? "gw2" : id.startsWith("dH") ? "dH"
  : /^z\d$/.test(id) ? "z" : /^h\d$/.test(id) ? "h" : id;

function NetTrace() {
  const t = useT();
  const r = useRich();
  const [p, setP] = useState<NetParams>(START);
  const [pick, setPick] = useState(0);
  const [lr, setLr] = useState(0.5);
  const [k, setK] = useState(0);
  const s = SAMPLES[pick];
  const valid = Number.isFinite(lr) && p.w1.flat().every(Number.isFinite) && p.b1.every(Number.isFinite) && p.w2.every(Number.isFinite) && Number.isFinite(p.b2);
  const trace = useMemo(() => (valid ? netTrace(p, s.x, s.y, lr) : []), [p, s, lr, valid]);
  const shown = trace.slice(0, k);
  const cur = shown[shown.length - 1];
  const done = valid && k >= trace.length;
  const before = valid ? gradients(p, s.x, s.y) : null;
  const afterP = done ? { w1: p.w1.map((row, a) => row.map((_, b) => trace.find((q) => q.id === `u_w1_${a}${b}`)!.value)), b1: [0, 1].map((j) => trace.find((q) => q.id === `u_b1_${j + 1}`)!.value), w2: [0, 1].map((j) => trace.find((q) => q.id === `u_w2_${j + 1}`)!.value), b2: trace.find((q) => q.id === "u_b2")!.value } : null;
  const after = afterP ? gradients(afterP, s.x, s.y) : null;

  const setW1 = (a: number, b: number, v: number) => setP((c) => ({ ...c, w1: c.w1.map((row, i) => (i === a ? row.map((x, j) => (j === b ? v : x)) : row)) }));
  const setB1 = (b: number, v: number) => setP((c) => ({ ...c, b1: c.b1.map((x, j) => (j === b ? v : x)) }));
  const setW2 = (b: number, v: number) => setP((c) => ({ ...c, w2: c.w2.map((x, j) => (j === b ? v : x)) }));
  const phases = ["forward", "backward", "update"] as const;

  return (
    <Demo title={t("lab1.net.tr.title")}>
      <p className="text-sm text-muted">{r("lab1.net.tr.intro")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {[0, 1].map((j) => (
          <fieldset key={j} className="rounded-xl border border-line p-2.5">
            <legend className="px-1 text-xs font-semibold text-muted">{t("lab1.net.tr.neuron", undefined, { n: j + 1 })}</legend>
            <div className="grid grid-cols-3 gap-2">
              <NumInput id={`nt-w1-0${j}`} label={t("lab1.net.tr.wh")} value={p.w1[0][j]} onChange={(v) => setW1(0, j, v)} step={0.05} />
              <NumInput id={`nt-w1-1${j}`} label={t("lab1.net.tr.ww")} value={p.w1[1][j]} onChange={(v) => setW1(1, j, v)} step={0.05} />
              <NumInput id={`nt-b1-${j}`} label={t("lab1.net.tr.b")} value={p.b1[j]} onChange={(v) => setB1(j, v)} step={0.05} />
            </div>
          </fieldset>
        ))}
        <fieldset className="rounded-xl border border-line p-2.5">
          <legend className="px-1 text-xs font-semibold text-muted">{t("lab1.net.tr.outn")}</legend>
          <div className="grid grid-cols-3 gap-2">
            <NumInput id="nt-w2-0" label="w·h1" value={p.w2[0]} onChange={(v) => setW2(0, v)} step={0.05} />
            <NumInput id="nt-w2-1" label="w·h2" value={p.w2[1]} onChange={(v) => setW2(1, v)} step={0.05} />
            <NumInput id="nt-b2" label={t("lab1.net.tr.b")} value={p.b2} onChange={(v) => setP((c) => ({ ...c, b2: v }))} step={0.05} />
          </div>
        </fieldset>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="nt-pick" className="label">{t("lab1.net.tr.patient")}</label>
          <select id="nt-pick" className="field !py-1" value={pick} onChange={(e) => { setPick(Number(e.target.value)); setK(0); }}>
            {SAMPLES.map((q, i) => <option key={q.n} value={i}>#{q.n} · {q.height} cm, {q.weight} kg · {q.y ? t("lab1.net.tr.male") : t("lab1.net.tr.female")}</option>)}
          </select>
        </div>
        <NumInput id="nt-lr" label={t("lab1.net.tr.lr")} value={lr} onChange={setLr} min={0} step={0.1} className="w-24" />
        <button className="btn-ghost !text-xs" onClick={() => { setP(START); setK(0); }}>{t("lab1.net.tr.reset")}</button>
      </div>
      <p className="mt-2 text-xs text-muted">{t("lab1.net.tr.input", undefined, { h: f2(s.x[0], 4), w: f2(s.x[1], 4), y: s.y })}</p>

      {!valid && <p className="mt-3 text-sm text-bad" role="alert">{t("lab1.net.tr.invalid")}</p>}

      {valid && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="btn-primary" disabled={k >= trace.length} onClick={() => setK((x) => Math.min(trace.length, x + 1))}>{t("lab1.net.tr.next")}</button>
            <button className="btn-ghost" disabled={k === 0} onClick={() => setK((x) => Math.max(0, x - 1))}>{t("lab1.net.tr.back")}</button>
            <button className="btn-ghost" onClick={() => setK(trace.length)}>{t("lab1.net.tr.all")}</button>
            <button className="btn-ghost" disabled={k === 0} onClick={() => setK(0)}>{t("lab1.net.tr.restart")}</button>
            <span className="font-mono text-xs text-muted" aria-live="polite">{t("lab1.net.tr.progress", undefined, { a: k, b: trace.length })}</span>
          </div>
          <div className="mt-3 space-y-3">
            {phases.map((ph) => {
              const items = shown.filter((q) => q.phase === ph);
              if (!items.length) return null;
              return (
                <section key={ph} aria-label={t(`lab1.net.tr.ph.${ph}`)}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-brand">{t(`lab1.net.tr.ph.${ph}`)}</h4>
                  <ol className="mt-1 space-y-1.5">
                    {items.map((q) => (
                      <li key={q.id} className={q === cur ? "rounded-xl ring-1 ring-brand" : ""}>
                        <p className="px-1 text-xs text-muted">{t(`lab1.net.s.${family(q.id)}`)}</p>
                        <Calc>{q.expr}</Calc>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
          {cur && <Out><b>{t(`lab1.net.s.${family(cur.id)}`)}:</b> {t(`lab1.net.e.${family(cur.id)}`)}</Out>}
          {done && before && after && (
            <div className="mt-3 space-y-2">
              <p className="text-sm" role="status">{r("lab1.net.tr.after", { a: f2(before.loss, 5), b: f2(after.loss, 5), oa: f2(before.out, 4), ob: f2(after.out, 4) })}</p>
              <button className="btn-primary" onClick={() => { setP(afterP!); setK(0); }}>{t("lab1.net.tr.apply")}</button>
            </div>
          )}
        </>
      )}
    </Demo>
  );
}

export default function Network() {
  const t = useT();
  const r = useRich();
  const mut = { fill: col("muted") };
  const stroke = (c: string) => ({ stroke: col(c), fill: col("raised") });
  return (
    <div className="space-y-4">
      <Concept term={t("lab1.net.concept.term")}>{r("lab1.net.concept.body")}</Concept>
      <Demo title={t("lab1.net.demo.title")}>
        <svg viewBox="0 0 760 300" className="w-full" role="img" aria-label={t("lab1.net.svgAria")}>
          <g strokeWidth="1.6" fill="none" style={{ stroke: col("muted") }}>
            <line x1="150" y1="90" x2="380" y2="90" /><line x1="150" y1="90" x2="380" y2="210" />
            <line x1="150" y1="210" x2="380" y2="90" /><line x1="150" y1="210" x2="380" y2="210" />
            <line x1="380" y1="90" x2="600" y2="150" /><line x1="380" y1="210" x2="600" y2="150" />
            <line x1="150" y1="270" x2="380" y2="90" strokeDasharray="4 4" /><line x1="150" y1="270" x2="380" y2="210" strokeDasharray="4 4" />
            <line x1="380" y1="270" x2="600" y2="150" strokeDasharray="4 4" />
          </g>
          <g strokeWidth="2">
            <circle cx="150" cy="90" r="30" style={stroke("c-teal")} /><circle cx="150" cy="210" r="30" style={stroke("c-teal")} />
            <circle cx="150" cy="270" r="18" style={stroke("c-amber")} /><circle cx="380" cy="270" r="18" style={stroke("c-amber")} />
            <circle cx="380" cy="90" r="34" style={stroke("brand")} /><circle cx="380" cy="210" r="34" style={stroke("brand")} />
            <circle cx="600" cy="150" r="38" style={{ fill: col("brand"), stroke: col("brand") }} />
          </g>
          <g textAnchor="middle" fontSize="14" style={{ fill: col("ink") }}>
            <text x="150" y="86" fontWeight="700">{t("lab1.net.svg.height")}</text><text x="150" y="104" fontSize="12" style={mut}>{t("lab1.net.svg.scaled")}</text>
            <text x="150" y="206" fontWeight="700">{t("lab1.net.svg.weight")}</text><text x="150" y="224" fontSize="12" style={mut}>{t("lab1.net.svg.scaled")}</text>
            <text x="150" y="275" fontSize="13">1</text><text x="380" y="275" fontSize="13">1</text>
            <text x="380" y="88" fontWeight="700">h1</text><text x="380" y="106" fontSize="12" style={mut}>sigmoid</text>
            <text x="380" y="208" fontWeight="700">h2</text><text x="380" y="226" fontSize="12" style={mut}>sigmoid</text>
            <text x="600" y="146" fontWeight="700" fill="#fff">out</text><text x="600" y="164" fontSize="12" fill="#fff">sigmoid</text>
            <text x="150" y="30" style={mut}>{t("lab1.net.svg.inputs")}</text><text x="380" y="30" style={mut}>{t("lab1.net.svg.hidden")}</text><text x="600" y="30" style={mut}>{t("lab1.net.svg.output")}</text>
            <text x="265" y="140" fontSize="12" style={mut}>{t("lab1.net.svg.w")}</text><text x="500" y="244" fontSize="12" style={mut}>{t("lab1.net.svg.bias")}</text>
          </g>
          <text x="660" y="104" fontSize="13" style={mut}>{t("lab1.net.svg.near0")}</text>
          <text x="660" y="204" fontSize="13" style={mut}>{t("lab1.net.svg.near1")}</text>
        </svg>
        <p className="text-sm text-muted">{r("lab1.net.params")}</p>
      </Demo>
      <Grid>
        <Demo title={t("lab1.net.fwd.title")}>
          <pre className="overflow-x-auto rounded-xl border border-line bg-raised p-3 font-mono text-[13px] leading-relaxed">{`h1 = sigmoid(w1·height + w2·weight + b1·1)
h2 = sigmoid(w3·height + w4·weight + b2·1)
out = sigmoid(w5·h1 + w6·h2 + b3·1)`}</pre>
          <p className="mt-2 text-sm text-muted">{t("lab1.net.fwd.text")}</p>
        </Demo>
        <Demo title={t("lab1.net.bwd.title")}>
          <pre className="overflow-x-auto rounded-xl border border-line bg-raised p-3 font-mono text-[13px] leading-relaxed">{`error  = out − truth
d_out  = error · out·(1−out)
d_hid  = d_out · w_out · h·(1−h)
weight −= lr · d · (its input)`}</pre>
          <p className="mt-2 text-sm text-muted">{t("lab1.net.bwd.text")}</p>
        </Demo>
      </Grid>
      <NetTrace />
      <Callout title={t("lab1.net.go.title")}>
        {t("lab1.net.go.a")}{" "}
        <Link className="font-semibold text-brand underline" to="/playground">{t("lab1.net.go.link")}</Link>
        {t("lab1.net.go.b")}
      </Callout>
    </div>
  );
}
