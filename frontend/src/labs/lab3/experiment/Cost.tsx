import { useState } from "react";
import { Callout, Demo, Grid, Seg } from "../../ui";
import { MODELS, type ModelRec } from "../data/expModels";
import { byTag, fmtDuration, memoryMB, perSecond, secondsFor } from "../expMath";
import { useR, useTx } from "../rich";
import { FAM_COLOR, FamilyDot, FamilyLegend, Field, fmtInt, fmtMs, fmtParams, INPUT, ModelSelect, pct, SortTable, type Col } from "./shared";

const W = 720, H = 400, L = 56, R = 16, T = 16, B = 46;
const X0 = Math.log10(0.03), X1 = Math.log10(250);
const Y0 = 74, Y1 = 93;
const xs = (ms: number) => L + ((Math.log10(ms) - X0) / (X1 - X0)) * (W - L - R);
const ys = (acc: number) => T + (1 - (acc * 100 - Y0) / (Y1 - Y0)) * (H - T - B);
const RMAX = 34;
const rad = (params: number) => Math.max(4.5, RMAX * Math.sqrt(params / 124647939));
/** Vertical nudge of labels that would overlap (SVG user units). */
const DY: Record<string, number> = { tfidf_logreg: 14, tfidf_nb: 0, tfidf_svm: -14, bilstm: 6 };
const CLASSICAL = ["tfidf_nb", "tfidf_logreg", "tfidf_svm"];
const XTICKS = [0.05, 0.1, 0.5, 1, 5, 10, 50, 100];
const YTICKS = [76, 80, 84, 88, 92];

function Bubble() {
  const tx = useTx();
  const [sel, setSel] = useState<string | null>(null);
  const cur = sel ? byTag(sel) : null;
  return (
    <Demo title={tx("lab3.e.cs.bubble.title")}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={tx("lab3.e.cs.bubble.alt")} className="w-full" data-testid="cs-bubble">
        {YTICKS.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={ys(v / 100)} y2={ys(v / 100)} stroke="rgb(var(--line))" strokeWidth="1" />
            <text x={L - 8} y={ys(v / 100) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">{v}</text>
          </g>
        ))}
        {XTICKS.map((v) => (
          <g key={v}>
            <line x1={xs(v)} x2={xs(v)} y1={T} y2={H - B} stroke="rgb(var(--line))" strokeWidth="1" />
            <text x={xs(v)} y={H - B + 16} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">{v}</text>
          </g>
        ))}
        <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="rgb(var(--muted))">{tx("lab3.e.cs.bubble.x")}</text>
        <text transform={`translate(14 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="rgb(var(--muted))">{tx("lab3.e.cs.bubble.y")}</text>
        {MODELS.slice().sort((a, b) => b.params - a.params).map((m) => {
          const cx = xs(m.latencyMs), cy = ys(m.accuracy), r = rad(m.params);
          const left = m.latencyMs > 20;
          const on = sel === m.tag;
          return (
            <g key={m.tag} data-model={m.tag} tabIndex={0} role="button" aria-label={`${m.name}: ${pct(m.accuracy)} %, ${fmtMs(m.latencyMs)} ms, ${fmtParams(m.params)}`} aria-pressed={on}
              onClick={() => setSel(on ? null : m.tag)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(on ? null : m.tag); } }} className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-[3]">
              <title>{`${m.name}: ${pct(m.accuracy)} %, ${fmtMs(m.latencyMs)} ms, ${fmtParams(m.params)}`}</title>
              <circle cx={cx} cy={cy} r={r} fill={FAM_COLOR[m.family]} fillOpacity={on ? 0.95 : 0.7} stroke="rgb(var(--surface))" strokeWidth={on ? 3 : 2} />
              <text x={left ? cx - r - 5 : cx + r + 5} y={cy + 4 + (DY[m.tag] ?? 0)} textAnchor={left ? "end" : "start"} fontSize="11" fontWeight={on ? 700 : 400} fill="rgb(var(--ink))">{m.short}</text>
            </g>
          );
        })}
      </svg>
      <FamilyLegend />
      <p className="mt-2 text-xs text-muted">{tx("lab3.e.cs.bubble.note")}</p>
      {cur && (
        <p role="status" className="mt-2 rounded-xl border border-line bg-raised/70 px-3 py-2 text-sm" data-testid="cs-bubble-out">
          <b>{cur.name}</b>: {pct(cur.accuracy, 2)} % · {fmtMs(cur.latencyMs)} ms · {fmtInt(cur.params)} {tx("lab3.e.cs.paramsWord")}
        </p>
      )}
    </Demo>
  );
}

function CostTable() {
  const tx = useTx();
  const svm = byTag("tfidf_svm");
  const cols: Col<ModelRec>[] = [
    { id: "name", label: tx("lab3.e.rs.col.model"), value: (m) => m.name, render: (m) => <span className="font-medium"><FamilyDot family={m.family} />{m.name}</span> },
    { id: "n", label: tx("lab3.e.rs.col.n"), value: (m) => m.trainSize, align: "right", render: (m) => fmtInt(m.trainSize) },
    { id: "train", label: tx("lab3.e.cs.col.train"), value: (m) => m.trainSeconds, align: "right", render: (m) => (m.trainSeconds ? `${fmtDuration(m.trainSeconds)} (${Math.round(m.trainSeconds)} s)` : tx("lab3.e.cs.noTrain")) },
    { id: "lat", label: tx("lab3.e.rs.col.lat"), value: (m) => m.latencyMs, align: "right", render: (m) => fmtMs(m.latencyMs) },
    { id: "ps", label: tx("lab3.e.cs.col.ps"), value: (m) => perSecond(m.latencyMs), align: "right", render: (m) => fmtInt(perSecond(m.latencyMs)) },
    { id: "x", label: tx("lab3.e.cs.col.x"), value: (m) => m.latencyMs / svm.latencyMs, align: "right", render: (m) => `${fmtInt(m.latencyMs / svm.latencyMs)}×` },
    { id: "params", label: tx("lab3.e.rs.col.params"), value: (m) => m.params, align: "right", render: (m) => fmtInt(m.params) },
    { id: "mb", label: tx("lab3.e.cs.col.mb"), value: (m) => memoryMB(m.params), align: "right", render: (m) => memoryMB(m.params).toFixed(m.params < 5e6 ? 1 : 0) },
  ];
  return <SortTable rows={MODELS} cols={cols} rowKey={(m) => m.tag} initial={{ id: "lat", dir: 1 }} label={tx("lab3.e.cs.table")} />;
}

type Bytes = "4" | "2" | "1";

function Calculator() {
  const r = useR();
  const tx = useTx();
  const [tag, setTag] = useState("ft_distilbert_8000");
  const m = byTag(tag);
  const [ms, setMs] = useState(String(Number(m.latencyMs.toFixed(3))));
  const [n, setN] = useState("100000");
  const [bytes, setBytes] = useState<Bytes>("4");
  const msN = Math.max(0, Number(ms) || 0), nN = Math.max(0, Number(n) || 0);
  const pick = (t: string) => { setTag(t); setMs(String(Number(byTag(t).latencyMs.toFixed(3)))); };
  return (
    <Demo title={tx("lab3.e.cs.calc.title")}>
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.cs.calc.lead")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <ModelSelect id="cs-model" label={tx("lab3.e.cs.calc.model")} value={tag} onChange={pick} />
        <Field id="cs-ms" label={tx("lab3.e.cs.calc.ms")}>
          <input id="cs-ms" data-testid="cs-ms" type="number" min={0} step="any" inputMode="decimal" value={ms} onChange={(e) => setMs(e.target.value)} className={INPUT} />
        </Field>
        <Field id="cs-n" label={tx("lab3.e.cs.calc.n")}>
          <input id="cs-n" data-testid="cs-n" type="number" min={0} step={1000} inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} className={INPUT} />
        </Field>
      </div>
      <div className="mt-3">
        <Seg<Bytes>
          label={tx("lab3.e.cs.calc.bytes")}
          value={bytes}
          onChange={setBytes}
          options={[{ value: "4", label: tx("lab3.e.cs.calc.b32") }, { value: "2", label: tx("lab3.e.cs.calc.b16") }, { value: "1", label: tx("lab3.e.cs.calc.b8") }]}
        />
      </div>
      <div role="status" aria-live="polite" className="mt-3 grid gap-2 rounded-xl border border-line bg-raised/70 p-3 text-sm sm:grid-cols-3" data-testid="cs-out">
        <p><span className="block text-xs text-muted">{tx("lab3.e.cs.calc.outTime", { n: fmtInt(nN) })}</span><b className="font-mono text-base" data-testid="cs-time">{msN > 0 ? fmtDuration(secondsFor(nN, msN)) : "–"}</b></p>
        <p><span className="block text-xs text-muted">{tx("lab3.e.cs.calc.outRate")}</span><b className="font-mono text-base" data-testid="cs-rate">{msN > 0 ? fmtInt(perSecond(msN)) : "–"}</b></p>
        <p><span className="block text-xs text-muted">{tx("lab3.e.cs.calc.outMem", { p: fmtInt(m.params) })}</span><b className="font-mono text-base" data-testid="cs-mem">{memoryMB(m.params, Number(bytes)).toFixed(1)} MB</b></p>
      </div>
      <p className="mt-2 text-xs text-muted">{r("lab3.e.cs.calc.note", { x: fmtInt(msN / byTag("tfidf_svm").latencyMs) })}</p>
    </Demo>
  );
}

export default function Cost() {
  const r = useR();
  const tx = useTx();
  const tr = byTag("ft_distilbert_8000");
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">{r("lab3.e.cs.lead")}</p>
      <Bubble />
      <Demo title={tx("lab3.e.cs.table")}>
        <p className="mb-2 text-xs text-muted">{tx("lab3.e.rs.sortHint")}</p>
        <CostTable />
        <p className="mt-2 text-xs text-muted">{tx("lab3.e.cs.table.note")}</p>
      </Demo>
      <Calculator />
      <Grid>
        <Demo title={tx("lab3.e.cs.find.title")}>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            <li>{r("lab3.e.cs.find.0", { lat: fmtMs(byTag("tfidf_svm").latencyMs), lo: Math.min(...CLASSICAL.map((t) => byTag(t).trainSeconds)).toFixed(1), hi: Math.max(...CLASSICAL.map((t) => byTag(t).trainSeconds)).toFixed(1) })}</li>
            <li>{r("lab3.e.cs.find.1", { lat: fmtMs(byTag("bilstm").latencyMs), min: (byTag("bilstm").trainSeconds / 60).toFixed(1) })}</li>
            <li>{r("lab3.e.cs.find.2", { a: fmtMs(byTag("ft_bert-tiny_8000").latencyMs), b: fmtMs(byTag("ft_bert-small_8000").latencyMs), c: fmtMs(tr.latencyMs) })}</li>
            <li>{r("lab3.e.cs.find.3", { tiny: (byTag("ft_bert-tiny_8000").trainSeconds / 60).toFixed(0), small: (byTag("ft_bert-small_8000").trainSeconds / 60).toFixed(0), h: (tr.trainSeconds / 3600).toFixed(1), ps: Math.round(perSecond(tr.latencyMs)) })}</li>
          </ul>
        </Demo>
        <Callout tone="warn" title={tx("lab3.e.cs.caveat.title")}>{r("lab3.e.cs.caveat.body")}</Callout>
      </Grid>
    </div>
  );
}
