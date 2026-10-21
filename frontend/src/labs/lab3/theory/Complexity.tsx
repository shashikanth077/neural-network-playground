import { useMemo, useState } from "react";
import { Callout, Demo, Slider } from "../../ui";
import { useR, useTx } from "../rich";
import { attentionOps, recurrentOps, sequentialSteps } from "../transformerMath";
import { DemoHead, fmtInt, human, lin, P, StepLink, useStepTitle } from "./shared";

const MAXLEN = 64;
const NMAX = 4096;

function Chart({ d, n }: { d: number; n: number }) {
  const tx = useTx();
  const W = 460;
  const H = 260;
  const L = 44;
  const B = 28;
  const pts = useMemo(() => Array.from({ length: 61 }, (_, i) => Math.pow(NMAX, i / 60)), []);
  const att = (v: number) => attentionOps(v, d);
  const rec = (v: number) => recurrentOps(v, d);
  const lo = Math.floor(Math.log10(Math.min(att(1), rec(1))));
  const hi = Math.ceil(Math.log10(Math.max(att(NMAX), rec(NMAX))));
  const x = (v: number) => lin(Math.log10(v), 0, Math.log10(NMAX), L, W - 10);
  const y = (v: number) => lin(Math.log10(v), lo, hi, H - B, 10);
  const path = (f: (v: number) => number) => pts.map((v, i) => `${i ? "L" : "M"}${x(v).toFixed(1)},${y(f(v)).toFixed(1)}`).join("");
  const ticksY = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((k) => (hi - lo <= 8 ? true : k % 2 === 0));
  const ticksX = [1, 10, 100, 1000];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={tx("lab3.t.cx.chart.title")}>
      {ticksY.map((k) => (
        <g key={k}>
          <line x1={L} x2={W - 10} y1={y(10 ** k)} y2={y(10 ** k)} style={{ stroke: "rgb(var(--line))" }} />
          <text x={L - 4} y={y(10 ** k) + 3} fontSize="9" textAnchor="end" style={{ fill: "rgb(var(--muted))" }}>{human(10 ** k)}</text>
        </g>
      ))}
      {ticksX.map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1="10" y2={H - B} style={{ stroke: "rgb(var(--line))" }} />
          <text x={x(v)} y={H - B + 12} fontSize="9" textAnchor="middle" style={{ fill: "rgb(var(--muted))" }}>{v}</text>
        </g>
      ))}
      <path d={path(att)} fill="none" strokeWidth="2.5" style={{ stroke: "rgb(var(--brand))" }} />
      <path d={path(rec)} fill="none" strokeWidth="2.5" style={{ stroke: "rgb(var(--neg))" }} />
      <line x1={x(d)} x2={x(d)} y1="10" y2={H - B} strokeDasharray="4 3" strokeWidth="1.5" style={{ stroke: "rgb(var(--ok))" }} />
      <text x={Math.min(x(d) + 3, W - 70)} y="20" fontSize="10" style={{ fill: "rgb(var(--ok))" }}>n = d = {d}</text>
      <line x1={x(MAXLEN)} x2={x(MAXLEN)} y1="10" y2={H - B} strokeDasharray="2 3" strokeWidth="1.5" style={{ stroke: "rgb(var(--c-amber))" }} />
      <text x={Math.max(x(MAXLEN) - 3, L + 2)} y={H - B - 4} fontSize="10" textAnchor="end" style={{ fill: "rgb(var(--c-amber))" }}>n = {MAXLEN}</text>
      <circle cx={x(n)} cy={y(att(n))} r="4" style={{ fill: "rgb(var(--brand))" }} />
      <circle cx={x(n)} cy={y(rec(n))} r="4" style={{ fill: "rgb(var(--neg))" }} />
      <text x={(L + W) / 2} y={H - 2} fontSize="10" textAnchor="middle" style={{ fill: "rgb(var(--muted))" }}>{tx("lab3.t.cx.axisN")}</text>
    </svg>
  );
}

export default function Complexity() {
  const r = useR();
  const tx = useTx();
  const title = useStepTitle();
  const [d, setD] = useState(768);
  const [n, setN] = useState(64);
  const [t, setT] = useState(3);
  const a = attentionOps(n, d);
  const rc = recurrentOps(n, d);
  const shown = Math.min(n, 24);
  const tt = Math.min(t, shown);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <P k="lab3.t.cx.lead" />
        <div className="rounded-lg border border-line bg-raised/60 p-2 text-center font-mono text-xs leading-relaxed sm:text-sm">
          {tx("lab3.t.cx.formula")}
        </div>
      </div>

      <Demo>
        <DemoHead title={tx("lab3.t.cx.chart.title")} tags={["recomputed"]} />
        <P k="lab3.t.cx.chart.hint" />
        <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
          <Slider id="cx-d" label={tx("lab3.t.cx.d")} min={32} max={1024} step={32} value={d} onChange={setD} />
          <Slider id="cx-n" label={tx("lab3.t.cx.n")} min={1} max={512} step={1} value={n} onChange={setN} />
        </div>
        <div className="mt-2 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div>
            <Chart d={d} n={n} />
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <li><span className="mr-1 inline-block h-2 w-4 rounded-full bg-brand align-middle" />{tx("lab3.t.cx.legend.att")}</li>
              <li><span className="mr-1 inline-block h-2 w-4 rounded-full bg-neg align-middle" />{tx("lab3.t.cx.legend.rec")}</li>
              <li><span className="mr-1 inline-block h-2 w-4 rounded-full bg-ok align-middle" />{tx("lab3.t.cx.legend.cross")}</li>
              <li><span className="mr-1 inline-block h-2 w-4 rounded-full bg-c-amber align-middle" />{tx("lab3.t.cx.legend.max", { m: MAXLEN })}</li>
            </ul>
          </div>
          <div className="space-y-2 rounded-xl border border-line bg-raised/70 p-3 text-sm" role="status" aria-live="polite" data-testid="cx-read">
            <p className="font-mono text-xs text-muted">n = {n}, d = {d}</p>
            <p>{tx("lab3.t.cx.legend.att")}: <b className="font-mono">{fmtInt(a)}</b></p>
            <p>{tx("lab3.t.cx.legend.rec")}: <b className="font-mono">{fmtInt(rc)}</b></p>
            <p className="leading-relaxed">{n === d ? r("lab3.t.cx.read.eq") : n < d ? r("lab3.t.cx.read.att", { x: (rc / a).toFixed(1) }) : r("lab3.t.cx.read.rec", { x: (a / rc).toFixed(1) })}</p>
          </div>
        </div>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.cx.seq.title")} tags={["recomputed"]} />
        <P k="lab3.t.cx.seq.hint" />
        <div className="mt-3">
          <Slider id="cx-t" label={tx("lab3.t.cx.seq.t")} min={0} max={shown} step={1} value={tt} onChange={setT} />
        </div>
        <div className="mt-3 space-y-3 text-sm" data-testid="cx-seq">
          {(["attention", "recurrent"] as const).map((kind) => {
            const steps = sequentialSteps(n, kind);
            return (
              <div key={kind}>
                <p className="mb-1 text-xs font-semibold text-muted">{tx(`lab3.t.cx.seq.${kind}`, { s: steps })}</p>
                <div className="flex flex-wrap gap-1" aria-label={tx(`lab3.t.cx.seq.${kind}`, { s: steps })} role="img">
                  {Array.from({ length: shown }, (_, i) => {
                    const done = kind === "attention" ? tt >= 1 : i < tt;
                    return <span key={i} className={`h-6 w-6 rounded-md border text-center font-mono text-[10px] leading-6 ${done ? "border-brand bg-brand text-white" : "border-line bg-raised text-muted"}`}>{i + 1}</span>;
                  })}
                  {n > shown && <span className="self-center text-xs text-muted">… {n}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">{r("lab3.t.cx.seq.note")}</p>
      </Demo>

      <Demo>
        <DemoHead title={tx("lab3.t.cx.facts.title")} tags={["paper", "recomputed"]} />
        <p className="text-sm leading-relaxed">{r("lab3.t.cx.facts.body", { m: MAXLEN, x: (768 / MAXLEN).toFixed(0) })}</p>
        <Callout tone="warn" title={tx("lab3.t.cx.caveat.title")}>
          {r("lab3.t.cx.caveat.body")} <StepLink to="cost">{title("cost")}</StepLink>
        </Callout>
      </Demo>
    </div>
  );
}
